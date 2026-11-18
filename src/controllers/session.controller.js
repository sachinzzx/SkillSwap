const SessionService = require("../services/session.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");
const prisma = require("../config/prisma");
const CertificateService = require("../services/certificate.service");
const { ForbiddenError, NotFoundError } = require("../errors");

const sessionService = new SessionService();
const certificateService = new CertificateService();

const bookSession = asyncHandler(async (req, res) => {
  const { teacherId, skillId, scheduledAt, duration } = req.body;
  if (!teacherId || !skillId || !scheduledAt || !duration) {
    throw new BadRequestError(
      "teacherId, skillId, scheduledAt, and duration are required",
    );
  }

  const session = await sessionService.bookSession(
    req.user.userId,
    teacherId,
    skillId,
    scheduledAt,
    duration,
  );

  res.status(201).json({
    success: true,
    message: "Session booked successfully",
    data: session,
  });
});

const completeSession = asyncHandler(async (req, res) => {
  const session = await sessionService.completeSession(
    req.params.id,
    req.user.userId,
    req.user.role,
  );

  res.status(200).json({
    success: true,
    message: "Session completed successfully",
    data: session,
  });
});

const cancelSession = asyncHandler(async (req, res) => {
  const session = await sessionService.cancelSession(
    req.params.id,
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Session cancelled successfully",
    data: session,
  });
});

const getMySessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.getMySessions(req.user.userId);
  res.status(200).json({
    success: true,
    message: "Sessions retrieved successfully",
    data: sessions,
  });
});

const downloadReceipt = asyncHandler(async (req, res) => {
  const session = await prisma.session.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!session) throw new NotFoundError("Session not found");
  if (
    session.teacherId !== req.user.userId &&
    session.learnerId !== req.user.userId
  ) {
    throw new ForbiddenError("Only the session teacher or learner can download the receipt");
  }

  const filePath = await certificateService.getReceiptPath(session.id);
  res.download(filePath);
});

module.exports = {
  bookSession,
  completeSession,
  cancelSession,
  getMySessions,
  downloadReceipt,
};
