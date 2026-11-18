const ReviewService = require("../services/review.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");

const reviewService = new ReviewService();

const createReview = asyncHandler(async (req, res) => {
  const { sessionId, rating, comment } = req.body;
  if (!sessionId || rating === undefined) {
    throw new BadRequestError("sessionId and rating are required");
  }

  const review = await reviewService.createReview(
    req.user.userId,
    sessionId,
    rating,
    comment,
  );

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

const getReviewsForUser = asyncHandler(async (req, res) => {
  const result = await reviewService.getReviewsForUser(req.params.id);
  res.status(200).json({
    success: true,
    message: "Reviews retrieved successfully",
    data: result,
  });
});

module.exports = {
  createReview,
  getReviewsForUser,
};
