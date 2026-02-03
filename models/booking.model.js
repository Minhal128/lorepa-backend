const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    trailerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trailer", required: true },
    startDate: { type: String, required: true },
    notes: { type: String, default:"" },
    endDate: { type: String, required: true },
    price: { type: Number, required: true },
    total_paid: { type: Number, default: 0 },
    status: { type: String, default: "paid" },
    createdAt: { type: Date, default: Date.now }
});

const BookingModel = mongoose.model("Booking", bookingSchema, "Booking");

module.exports = { BookingModel };
