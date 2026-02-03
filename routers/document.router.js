const router = require("express").Router();
const { create, getByUser } = require("../services/document.service");
const { multipleupload } = require("../config/multer.config");

router.post("/create", multipleupload.single("file"), create);
router.get("/user/:id", getByUser);

module.exports = router;
