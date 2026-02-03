const router = require("express").Router();
const { create, getByUser, getSingle, sendMessage,getAll } = require("../services/ticket.service");
const { multipleupload } = require("../config/multer.config");

router.post("/create", multipleupload.single("attachment"), create);
router.get("/user/:id", getByUser);
router.get("/single/:id", getSingle);
router.post("/message", multipleupload.single("attachment"), sendMessage);
router.get("/all",getAll);

module.exports = router;
