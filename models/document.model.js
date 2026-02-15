const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    uploadType: { type: String, enum: ["Guest", "Host"], required: true },
    documentType: { type: String, required: true },
    trailerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trailer", required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    description: { type: String },
    fileUrl: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Document", documentSchema);
