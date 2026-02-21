const Chat = require("../models/chat.model")
const Message = require("../models/message.model")

exports.createChat = async (req, res) => {
  try {
    const { participants } = req.body
    if (!participants || participants.length !== 2)
      return res.status(400).json({ msg: "Exactly 2 participants required" })
    const existingChat = await Chat.findOne({ participants: { $all: participants, $size: 2 } }).populate("participants")
    if (existingChat) return res.status(200).json({ data: existingChat })
    const chat = await Chat.create({ participants })
    const populatedChat = await Chat.findById(chat._id).populate("participants",)
    res.status(200).json({ data: populatedChat })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, sender, content } = req.body
    if (!chatId || !sender || !content)
      return res.status(400).json({ msg: "chatId, sender, and content required" })

    const message = await Message.create({ chatId, sender, content })
    res.status(200).json({ data: message })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

exports.getChatsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email")
      .sort({ updatedAt: -1 })
      .lean(); // Fetch as plain JS objects so we can easily mutate

    // Attach unreadCount to each chat
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        });
        return { ...chat, unreadCount };
      })
    );

    res.status(200).json({ data: chatsWithUnreadCount });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getMessagesByChat = async (req, res) => {
  try {
    const { chatId } = req.params
    const messages = await Message.find({ chatId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 })
    res.status(200).json({ data: messages })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
