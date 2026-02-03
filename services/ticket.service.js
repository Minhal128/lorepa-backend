const Ticket = require("../models/ticket.model");
const { uploadFile } = require("../utils/function");

exports.create = async (req, res) => {
    try {
        const { userId, userType, subject, category, description } = req.body;

        let fileUrl = null;
        if (req.file) fileUrl = await uploadFile(req.file);

        const ticket = await Ticket.create({
            userId,
            userType,
            subject,
            category,
            description,
            attachment: fileUrl
        });

        return res.status(200).json({ msg: "Ticket created", data: ticket });
    } catch (err) {
        return res.status(500).json({ msg: "Error creating ticket", error: err.message });
    }
};

exports.getByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const tickets = await Ticket.find({ userId: id }).sort({ createdAt: -1 });
        return res.status(200).json({ data: tickets });
    } catch (err) {
        return res.status(500).json({ msg: "Error fetching tickets" });
    }
};

exports.getSingle = async (req, res) => {
    try {
        const { id } = req.params;
        const t = await Ticket.findById(id);
        if (!t) return res.status(404).json({ msg: "Not found" });
        return res.status(200).json({ data: t });
    } catch (err) {
        return res.status(500).json({ msg: "Error fetching ticket" });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { ticketId, senderId, message } = req.body;

        let attachment = null;
        if (req.file) attachment = await uploadFile(req.file);

        const t = await Ticket.findById(ticketId);
        if (!t) return res.status(404).json({ msg: "Ticket not found" });

        t.messages.push({ senderId, message, attachment });
        await t.save();

        return res.status(200).json({ msg: "Message sent", data: t });
    } catch (err) {
        return res.status(500).json({ msg: "Error sending message" });
    }
};

exports.getAll = async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .sort({ createdAt: -1 })
            .populate("userId");

        return res.status(200).json({ data: tickets });
    } catch (err) {
        return res.status(500).json({ msg: "Error fetching all tickets", error: err.message });
    }
};
