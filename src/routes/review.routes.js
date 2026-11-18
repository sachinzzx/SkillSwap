const express = require("express");

const {
  createReview,
  getReviewsForUser,
} = require("../controllers/review.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authenticate, createReview);
router.get("/user/:id", getReviewsForUser);

module.exports = router;
