const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["paid", "pending"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const TransactionHistoryModel = mongoose.model(
  "TransactionHistory",
  transactionSchema,
  "TransactionHistory"
);

module.exports = { TransactionHistoryModel };
