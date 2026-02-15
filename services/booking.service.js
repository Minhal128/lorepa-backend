const { BookingModel } = require("../models/booking.model");
const { TrailerModel } = require("../models/trailer.model");
const { createNotification } = require("./notification.service");
const { createTransaction } = require("./transaction.service");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");

const create = async (req, res) => {
  try {
    const {
      user_id,
      trailerId,
      startDate,
      endDate,
      price,
      message
    } = req.body;

    const trailer = await TrailerModel.findById(trailerId);
    if (!trailer) return res.status(404).json({ msg: "Trailer not found" });

    // Create booking with "pending" status (no payment yet)
    const booking = await BookingModel.create({
      user_id,
      trailerId,
      startDate,
      endDate,
      price,
      total_paid: 0,
      message: message || "",
      owner_id: trailer?.userId
    });

    if (booking) {
      // Create or find existing chat between user and owner
      const participants = [user_id, trailer.userId.toString()];
      let chat = await Chat.findOne({ participants: { $all: participants, $size: 2 } });
      if (!chat) {
        chat = await Chat.create({ participants });
      }

      // Send the booking message in the chat
      if (message) {
        const chatMessage = `📅 Booking Request for "${trailer.title}"\nDates: ${startDate} to ${endDate}\nPrice: $${price}\n\n${message}`;
        await Message.create({
          chatId: chat._id,
          sender: user_id,
          content: chatMessage
        });
        chat.lastMessage = chatMessage;
        await chat.save();
      }

      await createNotification({
        userId: user_id,
        title: "Booking Request Sent",
        description: `Your booking request for "${trailer.title}" has been sent. Waiting for owner approval.`
      });

      await createNotification({
        userId: booking.owner_id,
        title: "New Booking Request",
        description: `You have a new booking request for your trailer "${trailer.title}". Please review and approve or reject.`
      });

      res.status(200).json({ msg: "Booking request sent successfully", data: booking });
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
      if (status === "accepted") {
        // Owner accepted - notify user to sign contract
        await createNotification({
          userId: updated.user_id,
          title: "Booking Approved!",
          description: `Your booking for "${updated?.trailerId.title}" has been approved! Please sign the contract to proceed.`
        });
        await createNotification({
          userId: updated.owner_id,
          title: "Booking Approved",
          description: `You approved the booking for "${updated?.trailerId.title}". Waiting for renter to sign the contract.`
        });
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
      } else if (status === "rejected") {
        await createNotification({
          userId: updated.user_id,
          title: "Booking Rejected",
          description: `Your booking request for "${updated?.trailerId.title}" has been rejected by the owner.`
        });
        await createNotification({
          userId: updated.owner_id,
          title: "Booking Rejected",
          description: `You rejected the booking for "${updated?.trailerId.title}".`
        });
      } else if (status === "cancelled") {
        await createNotification({
          userId: updated.user_id,
          title: "Booking Cancelled",
          description: `Your booking for "${updated?.trailerId.title}" has been cancelled.`
        });
        await createNotification({
          userId: updated.owner_id,
          title: "Booking Cancelled",
          description: `The booking for "${updated?.trailerId.title}" has been cancelled.`
        });
      } else if (status === "paid") {
        // Payment completed
        await createNotification({
          userId: updated.user_id,
          title: "Payment Successful",
          description: `Your payment for "${updated?.trailerId.title}" has been received. Your booking is confirmed!`
        });
        await createNotification({
          userId: updated.owner_id,
          title: "Payment Received",
          description: `Payment received for your trailer "${updated?.trailerId.title}". The renter can now pick up the trailer.`
        });
        await createTransaction({
          userId: updated.user_id,
          description: `Payment for "${updated.trailerId.title}"`,
          amount: updated.price,
          status: "paid"
        });
        await createTransaction({
          userId: updated.owner_id,
          description: `Payment received for "${updated.trailerId.title}"`,
          amount: updated.price,
          status: "paid"
        });
      } else if (status === "completed") {
        // Completed transaction
        await createNotification({
          userId: updated.user_id,
          title: "Booking Completed",
          description: `Your booking for "${updated?.trailerId.title}" has been completed.`
        });
        await createNotification({
          userId: updated.owner_id,
          title: "Booking Completed",
          description: `Booking for your trailer "${updated?.trailerId.title}" has been completed.`
        });
      } else {
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


const signContract = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await BookingModel.findById(id).populate("trailerId");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    if (booking.status !== "accepted") {
      return res.status(400).json({ msg: "Booking must be accepted before signing the contract" });
    }

    booking.contractSigned = true;
    await booking.save();

    await createNotification({
      userId: booking.user_id,
      title: "Contract Signed",
      description: `You have signed the contract for "${booking.trailerId.title}". You can now proceed to payment.`
    });

    await createNotification({
      userId: booking.owner_id,
      title: "Contract Signed",
      description: `The renter has signed the contract for "${booking.trailerId.title}".`
    });

    res.status(200).json({ msg: "Contract signed successfully", data: booking });
  } catch (err) {
    res.status(500).json({ msg: "Error signing contract", error: err.message });
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
  requestChange,
  signContract
};
