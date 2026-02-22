const router = require("express").Router();
const { create, getAll, getSingle, remove, changeStatus, getAllApproved, getAllBySeller, update, searchTrailers, debugLocations, deleteTestTrailers } = require("../services/trailer.service");
const { multipleupload } = require("../config/multer.config");

router.post("/create", multipleupload.array('images', 10), create);
router.get("/all", getAll);
router.get("/all/approved", getAllApproved);
router.get("/search", searchTrailers);
router.get("/debug/locations", debugLocations);
router.get("/single/:id", getSingle);
router.get("/seller/:id", getAllBySeller);
router.delete("/delete/:id", remove);
router.delete("/delete-testing", deleteTestTrailers);
router.put("/status/:id", changeStatus);
router.put("/update/:id", multipleupload.array('images', 10), update);

module.exports = router;
