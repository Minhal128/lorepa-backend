const router = require("express").Router();
const { getTransactionsByUser } = require("../services/transaction.service");

router.get("/user/:userId", getTransactionsByUser);

module.exports = router;
