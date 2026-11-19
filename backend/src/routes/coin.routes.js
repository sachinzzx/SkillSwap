const express = require("express");

const {
  getBalance,
  getHistory,
} = require("../controllers/coin.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/balance", authenticate, getBalance);
router.get("/history", authenticate, getHistory);

module.exports = router;
