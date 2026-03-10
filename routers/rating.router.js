const router = require("express").Router();
const { createRating, getUserRatings, getTrailerRatings, canRateBooking } = require("../services/rating.service");

router.post("/create", createRating);
router.get("/user/:userId", getUserRatings);
router.get("/trailer/:trailerId", getTrailerRatings);
router.get("/can-rate/:bookingId/:userId", canRateBooking);

module.exports = router;
