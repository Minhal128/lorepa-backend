const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  type: { type: String, enum: ["host", "guest"], required: true },
});

const FaqModel = mongoose.model("Faq", FaqSchema);

module.exports = { FaqModel };
