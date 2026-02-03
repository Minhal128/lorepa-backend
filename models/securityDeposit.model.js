const mongoose = require("mongoose");

const SecurityDepositSchema = new mongoose.Schema({
  title: String,
  amount: Number,
});

module.exports = mongoose.model("SecurityDeposit", SecurityDepositSchema);
