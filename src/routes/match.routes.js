const express = require("express");

const {
  getTeachers,
  getDirectSwaps,
} = require("../controllers/match.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/teachers", authenticate, getTeachers);
router.get("/direct-swap", authenticate, getDirectSwaps);

module.exports = router;
