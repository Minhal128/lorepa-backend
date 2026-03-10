const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    trailerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trailer", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    reviewerType: { type: String, enum: ["owner", "renter"], required: true },
    createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate reviews for the same booking
ratingSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });

const RatingModel = mongoose.model("Rating", ratingSchema, "Rating");

module.exports = { RatingModel };
