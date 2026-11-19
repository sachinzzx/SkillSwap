const prisma = require("../config/prisma");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require("../errors");

class ReviewService {
  /**
   * Create a learner review for a completed session.
   * @param {number} reviewerId - Reviewing learner identifier.
   * @param {number|string} sessionId - Session identifier.
   * @param {number|string} rating - Rating from 1 to 5.
   * @param {string} comment - Optional review comment.
   * @returns {Promise<object>} Created review.
   */
  async createReview(reviewerId, sessionId, rating, comment) {
    const parsedSessionId = Number(sessionId);
    const parsedRating = Number(rating);

    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new BadRequestError("Rating must be between 1 and 5");
    }

    const session = await prisma.session.findUnique({
      where: { id: parsedSessionId },
    });
    if (!session) throw new NotFoundError("Session not found");
    if (session.status !== "COMPLETED") {
      throw new BadRequestError("Only completed sessions can be reviewed");
    }
    if (session.learnerId !== reviewerId) {
      throw new ForbiddenError("Only the learner can review this session");
    }

    const existing = await prisma.review.findUnique({
      where: { sessionId: parsedSessionId },
    });
    if (existing) throw new ConflictError("This session has already been reviewed");

    return prisma.review.create({
      data: {
        sessionId: parsedSessionId,
        reviewerId,
        reviewedId: session.teacherId,
        rating: parsedRating,
        comment: comment || null,
      },
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewed: { select: { id: true, name: true } },
        session: { select: { id: true, skillId: true } },
      },
    });
  }

  /**
   * Get reviews received by a user with rating aggregate.
   * @param {number|string} userId - Reviewed-user identifier.
   * @returns {Promise<object>} Reviews and aggregate rating.
   */
  async getReviewsForUser(userId) {
    const parsedUserId = Number(userId);
    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: { reviewedId: parsedUserId },
        include: {
          reviewer: { select: { id: true, name: true } },
          session: { select: { id: true, skillId: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.aggregate({
        where: { reviewedId: parsedUserId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    return {
      averageRating: aggregate._avg.rating,
      totalReviews: aggregate._count._all,
      reviews,
    };
  }
}

module.exports = ReviewService;
