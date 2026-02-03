const router = require("express").Router();
const { createChat, sendMessage, getChatsByUser, getMessagesByChat } = require("../services/chat.service");

router.post("/create", createChat);
router.post("/send", sendMessage);
router.get("/user/:userId", getChatsByUser);
router.get("/messages/:chatId", getMessagesByChat);

module.exports = router;
