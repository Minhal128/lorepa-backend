const router = require("express").Router();
const { getNotificationsByUser, markAsRead } = require("../services/notification.service");

router.get("/user/:userId", getNotificationsByUser);
router.put("/read/:id", markAsRead);

module.exports = router;
