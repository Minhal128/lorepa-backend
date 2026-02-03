const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true }
    ],
    lastMessage: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
