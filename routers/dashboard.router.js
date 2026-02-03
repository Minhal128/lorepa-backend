const { fetchData } = require("../services/dashboard.service");
const router = require("express").Router();

router.get("/data", fetchData);

module.exports = router
