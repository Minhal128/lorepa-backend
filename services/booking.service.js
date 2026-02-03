const { BookingModel } = require("../models/booking.model");
const { TrailerModel } = require("../models/trailer.model");
const { createNotification } = require("./notification.service");
const { createTransaction } = require("./transaction.service");

const create = async (req, res) => {
  try {
    const {
      user_id,
      trailerId,
      startDate,
      endDate,
      price
    } = req.body;


    const trailer = await TrailerModel.findById(trailerId);
    if (!trailer) return res.status(404).json({ msg: "Trailer not found" })

    const booking = await BookingModel.create({
      user_id,
      trailerId,
      startDate,
      endDate,
      price,
      total_paid:price,
      owner_id: trailer?.userId
    });

    if (booking) {
      await createNotification({
        userId: user_id,
        title: "Booking Created",
        description: `Your booking for "${trailer.title}" has been successfully created.`
      });

      await createNotification({
        userId: booking.owner_id,
        title: "New Booking Received",
        description: `Your trailer "${trailer.title}" has a new booking request.`
      });

      res.status(200).json({ msg: "Booking created successfully", data: booking });

    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Internal server error", error: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const bookings = await BookingModel.find().populate("trailerId").populate("owner_id").populate("user_id").sort({ createdAt: -1 });
    res.status(200).json({ data: bookings });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching bookings", error: err.message });
  }
};

const getAllForBuyer = async (req, res) => {
  try {
    let { id } = req.params
    const bookings = await BookingModel.find({ user_id: id }).populate("trailerId").populate("owner_id").sort({ createdAt: -1 });
    res.status(200).json({ data: bookings });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching bookings", error: err.message });
  }
};
const getAllForSeller = async (req, res) => {
  try {
    let { id } = req.params
    const bookings = await BookingModel.find({ owner_id: id }).populate("trailerId").populate("user_id").sort({ createdAt: -1 });
    res.status(200).json({ data: bookings });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching bookings", error: err.message });
  }
};

const getSingle = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await BookingModel.findById(id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    res.status(200).json({ data: booking });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching booking", error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await BookingModel.findByIdAndDelete(id);
    res.status(200).json({ msg: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting booking", error: err.message });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await BookingModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("trailerId")

    if (updated) {
      await createNotification({
        userId: updated.user_id,
        title: `Booking ${status}`,
        description: `Your booking for "${updated?.trailerId.title}" has been ${status}.`
      });

      await createNotification({
        userId: updated.owner_id,
        title: `Booking ${status}`,
        description: `Booking for your trailer "${updated?.trailerId.title}" has been ${status}.`
      });

      if (status === "accepted") {
        // Pending transaction for buyer and owner
        await createTransaction({
          userId: updated.user_id,
          description: `Booking accepted for "${updated.trailerId.title}"`,
          amount: updated.price,
          status: "pending"
        });
        await createTransaction({
          userId: updated.owner_id,
          description: `Booking accepted for "${updated.trailerId.title}"`,
          amount: updated.price,
          status: "pending"
        });
      } else if (status === "completed") {
        // Paid transaction for buyer and owner
        await createTransaction({
          userId: updated.user_id,
          description: `Booking completed for "${updated.trailerId.title}"`,
          amount: updated.price,
          status: "paid"
        });
        await createTransaction({
          userId: updated.owner_id,
          description: `Booking completed for "${updated.trailerId.title}"`,
          amount: updated.price,
          status: "paid"
        });
      }

      res.status(200).json({ msg: "Status updated", data: updated });
    }

  } catch (err) {
    res.status(500).json({ msg: "Error updating status", error: err.message });
  }
};

const requestChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, notes } = req.body;

    const booking = await BookingModel.findById(id).populate("trailerId");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    // Update booking
    booking.startDate = startDate;
    booking.endDate = endDate;
    booking.notes = notes || "";
    booking.status = "pending"; // reset to pending
    await booking.save();

    // Notifications for both parties
    await createNotification({
      userId: booking.user_id,
      title: "Booking Change Requested",
      description: `Your request to modify booking dates for "${booking.trailerId.title}" has been submitted.`
    });

    await createNotification({
      userId: booking.owner_id,
      title: "Booking Change Request",
      description: `The renter has requested new booking dates for your trailer "${booking.trailerId.title}".`
    });

    res.status(200).json({
      msg: "Change request submitted",
      data: booking
    });

  } catch (err) {
    res.status(500).json({ msg: "Error requesting change", error: err.message });
  }
};


module.exports = {
  create,
  getAll,
  getSingle,
  remove,
  changeStatus,
  getAllForBuyer,
  getAllForSeller,
  requestChange
};
