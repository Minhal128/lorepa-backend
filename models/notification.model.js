const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const NotificationModel = mongoose.model("Notification", notificationSchema, "Notification");

module.exports = { NotificationModel };
