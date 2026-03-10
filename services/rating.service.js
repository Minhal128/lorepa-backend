const { RatingModel } = require("../models/rating.model");
const { BookingModel } = require("../models/booking.model");
const { AccountModel } = require("../models/account.model");
const { createNotification } = require("./notification.service");

// Create a rating
const createRating = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const reviewerId = req.body.reviewerId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    // Get booking details
    const booking = await BookingModel.findById(bookingId).populate("trailerId");
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({ msg: "Can only rate completed bookings" });
    }

    // Determine reviewer type and reviewee
    let reviewerType, revieweeId;
    if (reviewerId.toString() === booking.owner_id.toString()) {
      reviewerType = "owner";
      revieweeId = booking.user_id;
      
      if (booking.ownerRated) {
        return res.status(400).json({ msg: "You have already rated this booking" });
      }
    } else if (reviewerId.toString() === booking.user_id.toString()) {
      reviewerType = "renter";
      revieweeId = booking.owner_id;
      
      if (booking.renterRated) {
        return res.status(400).json({ msg: "You have already rated this booking" });
      }
    } else {
      return res.status(403).json({ msg: "You are not authorized to rate this booking" });
    }

    // Create rating
    const newRating = await RatingModel.create({
      bookingId,
      reviewerId,
      revieweeId,
      trailerId: booking.trailerId._id,
      rating,
      comment: comment || "",
      reviewerType
    });

    // Update booking rating status
    if (reviewerType === "owner") {
      booking.ownerRated = true;
    } else {
      booking.renterRated = true;
    }
    await booking.save();

    // Update reviewee's rating statistics
    await updateUserRating(revieweeId, reviewerType);

    // Send notification
    const reviewer = await AccountModel.findById(reviewerId);
    await createNotification({
      userId: revieweeId,
      title: "New Rating Received",
      description: `${reviewer.name} rated you ${rating} stars for the booking of "${booking.trailerId.title}"`
    });

    res.status(201).json({ 
      msg: "Rating submitted successfully", 
      data: newRating 
    });

  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: "You have already rated this booking" });
    }
    res.status(500).json({ msg: "Error creating rating", error: err.message });
  }
};

// Update user's average rating
const updateUserRating = async (userId, ratedAs) => {
  try {
    const ratings = await RatingModel.find({ revieweeId: userId });
    
    if (ratings.length === 0) return;

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / ratings.length).toFixed(1);
    
    const ratingsAsOwner = ratings.filter(r => r.reviewerType === "renter").length;
    const ratingsAsRenter = ratings.filter(r => r.reviewerType === "owner").length;

    await AccountModel.findByIdAndUpdate(userId, {
      averageRating: parseFloat(averageRating),
      totalRatings: ratings.length,
      ratingsAsOwner,
      ratingsAsRenter
    });

  } catch (err) {
    console.error("Error updating user rating:", err);
  }
};

// Get ratings for a user
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // "received" or "given"

    let query = {};
    if (type === "received") {
      query.revieweeId = userId;
    } else if (type === "given") {
      query.reviewerId = userId;
    } else {
      return res.status(400).json({ msg: "Type must be 'received' or 'given'" });
    }

    const ratings = await RatingModel.find(query)
      .populate("reviewerId", "name profilePicture")
      .populate("revieweeId", "name profilePicture")
      .populate("trailerId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({ data: ratings });

  } catch (err) {
    res.status(500).json({ msg: "Error fetching ratings", error: err.message });
  }
};

// Get ratings for a specific trailer
const getTrailerRatings = async (req, res) => {
  try {
    const { trailerId } = req.params;

    const ratings = await RatingModel.find({ trailerId })
      .populate("reviewerId", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ data: ratings });

  } catch (err) {
    res.status(500).json({ msg: "Error fetching trailer ratings", error: err.message });
  }
};

// Check if user can rate a booking
const canRateBooking = async (req, res) => {
  try {
    const { bookingId, userId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(200).json({ canRate: false, reason: "Booking not completed" });
    }

    let canRate = false;
    let alreadyRated = false;

    if (userId === booking.owner_id.toString()) {
      canRate = true;
      alreadyRated = booking.ownerRated;
    } else if (userId === booking.user_id.toString()) {
      canRate = true;
      alreadyRated = booking.renterRated;
    }

    res.status(200).json({ 
      canRate: canRate && !alreadyRated, 
      alreadyRated,
      bookingCompleted: booking.status === "completed"
    });

  } catch (err) {
    res.status(500).json({ msg: "Error checking rating status", error: err.message });
  }
};

module.exports = {
  createRating,
  getUserRatings,
  getTrailerRatings,
  canRateBooking
};
