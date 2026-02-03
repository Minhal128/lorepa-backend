const Document = require("../models/document.model");
const { uploadFile } = require("../utils/function");

exports.create = async (req, res) => {
    try {
        const { userId, uploadType, documentType, trailerId, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: "File is required" });
        }

        const fileUrl = await uploadFile(req.file);

        const doc = await Document.create({
            userId,
            uploadType,
            documentType,
            trailerId,
            description,
            fileUrl
        });

        return res.status(200).json({ msg: "Document uploaded", data: doc });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Error uploading document", error: err.message });
    }
};

exports.getByUser = async (req, res) => {
    try {
        const { id } = req.params;

        const documents = await Document.find({ userId: id }).populate("trailerId").sort({ createdAt: -1 });

        return res.status(200).json({ data: documents });

    } catch (err) {
        return res.status(500).json({ msg: "Error fetching documents" });
    }
};
