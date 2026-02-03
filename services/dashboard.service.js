const { TrailerModel } = require("../models/trailer.model");
const { BookingModel } = require("../models/booking.model");

const fetchData = async (req, res) => {
  try {
    const bookings = await BookingModel.find().populate('trailerId');

    const totalRevenue = bookings.reduce((sum, booking) => {
      const price = booking?.price || 0;
      return sum + price;
    }, 0);

    const totalBookings = bookings.length;
    const pendingTrailers = await TrailerModel.countDocuments({ status: "Pending" });

    const recentTrailers = await TrailerModel.find().sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      message: "Dashboard data fetched",
      data: {
        totalRevenue,
        totalBookings,
        pendingTrailers,
        recentTrailers
      }
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = { fetchData };
