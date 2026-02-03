const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderId: {  type:mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    message: { type: String, required: true },
    attachment: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    userType: { type: String, enum: ["Guest", "Host"], required: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    attachment: { type: String },
    description: { type: String, required: true },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
    messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);
