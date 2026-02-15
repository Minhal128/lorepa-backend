const router = require("express").Router();
const { create, getByUser, createMultiple, getByBooking } = require("../services/document.service");
const { multipleupload } = require("../config/multer.config");

router.post("/create", multipleupload.single("file"), create);
router.post("/create-multiple", multipleupload.array("files", 15), createMultiple);
router.get("/user/:id", getByUser);
router.get("/booking/:bookingId", getByBooking);

module.exports = router;
