const router = require("express").Router();
const {
  getAllTrustedBy,
  createTrustedBy,
  deleteTrustedBy,
  getAllLocations,
  createLocation,
  deleteLocation,
  getAllTrailers,
  createTrailer,
  deleteTrailer,
  getAllFaqs,
  createFaq,
  deleteFaq,
  getAllSecurityDeposits,
  createSecurityDeposit,
  updateSecurityDeposit,
  deleteSecurityDeposit,
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getAllTrailerStatuses,
  createTrailerStatus,
  updateTrailerStatus,
  deleteTrailerStatus,
  getAllHitchTypes,
  createHitchType,
  updateHitchType,
  deleteHitchType,
  getAllBallSizes,
  createBallSize,
  updateBallSize,
  deleteBallSize,
} = require("../services/content.service");

const { multipleupload } = require("../config/multer.config");

// Trusted By
router.get("/trusted", getAllTrustedBy);
router.post("/trusted", multipleupload.single("image"), createTrustedBy);
router.delete("/trusted/:id", deleteTrustedBy);

// Locations
router.get("/locations", getAllLocations);
router.post("/locations", multipleupload.single("image"), createLocation);
router.delete("/locations/:id", deleteLocation);

// Trailers
router.get("/trailers", getAllTrailers);
router.post("/trailers", multipleupload.single("image"), createTrailer);
router.delete("/trailers/:id", deleteTrailer);

// FAQ (no image)
router.get("/faq", getAllFaqs);
router.post("/faq", createFaq);
router.delete("/faq/:id", deleteFaq);

router.get("/security-deposits", getAllSecurityDeposits);
router.post("/security-deposits", createSecurityDeposit);
router.put("/security-deposits/:id", updateSecurityDeposit);
router.delete("/security-deposits/:id", deleteSecurityDeposit);

// Categories
router.get("/categories", getAllCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Trailer Status
router.get("/trailer-statuses", getAllTrailerStatuses);
router.post("/trailer-statuses", createTrailerStatus);
router.put("/trailer-statuses/:id", updateTrailerStatus);
router.delete("/trailer-statuses/:id", deleteTrailerStatus);

// Hitch Type
router.get("/hitch-types", getAllHitchTypes);
router.post("/hitch-types", createHitchType);
router.put("/hitch-types/:id", updateHitchType);
router.delete("/hitch-types/:id", deleteHitchType);

// Ball Size
router.get("/ball-sizes", getAllBallSizes);
router.post("/ball-sizes", createBallSize);
router.put("/ball-sizes/:id", updateBallSize);
router.delete("/ball-sizes/:id", deleteBallSize);

module.exports = router;
