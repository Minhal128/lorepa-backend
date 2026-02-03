const { NotificationModel } = require("../models/notification.model");

// Create notification
const createNotification = async ({ userId, title, description }) => {
  return await NotificationModel.create({ userId, title, description });
};

// Get notifications by userId
const getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: notifications });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching notifications", error: err.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
    res.status(200).json({ msg: "Notification marked as read", data: updated });
  } catch (err) {
    res.status(500).json({ msg: "Error updating notification", error: err.message });
  }
};

module.exports = { createNotification, getNotificationsByUser, markAsRead };
