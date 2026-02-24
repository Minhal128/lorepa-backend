const Document = require("../models/document.model");
const { uploadFile } = require("../utils/function");

exports.create = async (req, res) => {
    try {
        const { userId, uploadType, documentType, trailerId, bookingId, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: "File is required" });
        }

        // Validation: Guest (renter/user) can only upload post-rental (Check-out) photos
        if (uploadType === "Guest" && documentType === "Check-in Photo") {
            return res.status(403).json({ msg: "Renters can only upload post-rental (check-out) photos. Pre-rental photos are uploaded by the owner." });
        }
        // Validation: Host (owner/seller) can only upload pre-rental (Check-in) photos
        if (uploadType === "Host" && documentType === "Check-out Photo") {
            return res.status(403).json({ msg: "Owners can only upload pre-rental (check-in) photos. Post-rental photos are uploaded by the renter." });
        }

        const fileUrl = await uploadFile(req.file);

        const doc = await Document.create({
            userId,
            uploadType,
            documentType,
            trailerId,
            bookingId,
            description,
            fileUrl
        });

        return res.status(200).json({ msg: "Document uploaded", data: doc });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Error uploading document", error: err.message });
    }
};

exports.createMultiple = async (req, res) => {
    try {
        const { userId, uploadType, documentType, trailerId, bookingId, description } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: "Files are required" });
        }

        if (req.files.length > 15) {
            return res.status(400).json({ msg: "Maximum 15 files allowed" });
        }

        // Validation: Guest (renter/user) can only upload post-rental (Check-out) photos
        if (uploadType === "Guest" && documentType === "Check-in Photo") {
            return res.status(403).json({ msg: "Renters can only upload post-rental (check-out) photos. Pre-rental photos are uploaded by the owner." });
        }
        // Validation: Host (owner/seller) can only upload pre-rental (Check-in) photos
        if (uploadType === "Host" && documentType === "Check-out Photo") {
            return res.status(403).json({ msg: "Owners can only upload pre-rental (check-in) photos. Post-rental photos are uploaded by the renter." });
        }

        const documents = await Promise.all(req.files.map(async (file) => {
            const fileUrl = await uploadFile(file);
            return Document.create({
                userId,
                uploadType,
                documentType,
                trailerId,
                bookingId,
                description,
                fileUrl
            });
        }));

        return res.status(200).json({ msg: "Documents uploaded", data: documents });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Error uploading documents", error: err.message });
    }
};

exports.getByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const documents = await Document.find({ bookingId }).sort({ createdAt: -1 });
        return res.status(200).json({ data: documents });
    } catch (err) {
        return res.status(500).json({ msg: "Error fetching booking documents" });
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

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findByIdAndDelete(id);
        if (!doc) {
            return res.status(404).json({ msg: "Document not found" });
        }
        return res.status(200).json({ msg: "Document deleted", data: doc });
    } catch (err) {
        return res.status(500).json({ msg: "Error deleting document", error: err.message });
    }
};
