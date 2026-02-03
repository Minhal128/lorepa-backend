const { TransactionHistoryModel } = require("../models/transaction.model");

// Create a transaction
const createTransaction = async ({ userId, description, amount, status = "pending" }) => {
  return await TransactionHistoryModel.create({ userId, description, amount, status });
};

// Get transactions by userId
const getTransactionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await TransactionHistoryModel.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: transactions });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching transactions", error: err.message });
  }
};

module.exports = { createTransaction, getTransactionsByUser };
