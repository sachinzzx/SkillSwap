const prisma = require("../config/prisma");
const ActivityLog = require("../models/ActivityLog.model");
const CertificateService = require("./certificate.service");
const certificateService = new CertificateService();
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InsufficientCoinsError,
  NotFoundError,
} = require("../errors");

class SessionService {
  /**
   * Book a session with a teacher for a skill.
   * @param {number} learnerId - Learner identifier.
   * @param {number|string} teacherId - Teacher identifier.
   * @param {number|string} skillId - Skill identifier.
   * @param {string|Date} scheduledAt - Requested session start.
   * @param {number|string} duration - Duration in minutes.
   * @returns {Promise<object>} Created session.
   */
  async bookSession(learnerId, teacherId, skillId, scheduledAt, duration) {
    const parsedTeacherId = Number(teacherId);
    const parsedSkillId = Number(skillId);
    const parsedDuration = Number(duration);
    const start = new Date(scheduledAt);

    if (parsedTeacherId === learnerId) {
      throw new BadRequestError("Learner cannot book a session with themselves");
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      throw new BadRequestError("Duration must be a positive integer");
    }
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestError("scheduledAt must be a valid date");
    }

    const teachingSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId_type: {
          userId: parsedTeacherId,
          skillId: parsedSkillId,
          type: "TEACH",
        },
      },
    });
    if (!teachingSkill) {
      throw new NotFoundError("Teacher does not teach this skill");
    }

    const coinsCost = Math.ceil(
      (teachingSkill.hourlyCoinRate * parsedDuration) / 60,
    );
    const end = new Date(start.getTime() + parsedDuration * 60 * 1000);

    const bookedSessions = await prisma.session.findMany({
      where: {
        teacherId: parsedTeacherId,
        status: "BOOKED",
        scheduledAt: { lt: end },
      },
    });

    const overlaps = bookedSessions.some((session) => {
      const existingStart = new Date(session.scheduledAt);
      const existingEnd = new Date(
        existingStart.getTime() + session.duration * 60 * 1000,
      );
      return existingStart < end && existingEnd > start;
    });
    if (overlaps) {
      throw new ConflictError("The teacher has an overlapping booked session");
    }

    const learner = await prisma.user.findUnique({
      where: { id: learnerId },
    });
    if (!learner) throw new NotFoundError("Learner not found");
    if (learner.coins < coinsCost) {
      throw new InsufficientCoinsError();
    }

    const session = await prisma.session.create({
      data: {
        teacherId: parsedTeacherId,
        learnerId,
        skillId: parsedSkillId,
        status: "BOOKED",
        scheduledAt: start,
        duration: parsedDuration,
        coinsCost,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        learner: { select: { id: true, name: true } },
        skill: true,
      },
    });

    await ActivityLog.create({
      userId: learnerId,
      action: "SESSION_BOOKED",
      metadata: { sessionId: session.id, teacherId: parsedTeacherId, skillId: parsedSkillId },
    });

    return session;
  }

  /**
   * Complete a booked session and transfer SkillCoins atomically.
   * @param {number|string} sessionId - Session identifier.
   * @param {number} requesterId - Requesting user identifier.
   * @param {string} requesterRole - Requesting user's role.
   * @returns {Promise<object>} Completed session.
   */
  async completeSession(sessionId, requesterId, requesterRole) {
    const parsedSessionId = Number(sessionId);
    const session = await prisma.session.findUnique({
      where: { id: parsedSessionId },
    });
    if (!session) throw new NotFoundError("Session not found");
    if (requesterRole !== "ADMIN" && session.teacherId !== requesterId) {
      throw new ForbiddenError("Only the teacher or an admin can complete this session");
    }
    if (session.status !== "BOOKED") {
      throw new BadRequestError("Only booked sessions can be completed");
    }

    // The interactive transaction gives ACID guarantees:
    // coin checks, both balance updates, and the ledger/status update commit together.
    // A refetched learner balance plus a BOOKED status check prevents double-spending
    // and makes a second completion roll back instead of paying again.
    const completed = await prisma.$transaction(async (tx) => {
      const bookedSession = await tx.session.findUnique({
        where: { id: parsedSessionId },
      });
      if (!bookedSession || bookedSession.status !== "BOOKED") {
        throw new BadRequestError("Only booked sessions can be completed");
      }

      const learner = await tx.user.findUnique({
        where: { id: bookedSession.learnerId },
      });
      if (!learner || learner.coins < bookedSession.coinsCost) {
        throw new InsufficientCoinsError();
      }

      await tx.user.update({
        where: { id: bookedSession.learnerId },
        data: { coins: { decrement: bookedSession.coinsCost } },
      });
      await tx.user.update({
        where: { id: bookedSession.teacherId },
        data: { coins: { increment: bookedSession.coinsCost } },
      });
      await tx.coinTransaction.create({
        data: {
          senderId: bookedSession.learnerId,
          receiverId: bookedSession.teacherId,
          amount: bookedSession.coinsCost,
          reason: `Session #${bookedSession.id} completed`,
          sessionId: bookedSession.id,
        },
      });

      return tx.session.update({
        where: { id: parsedSessionId },
        data: { status: "COMPLETED" },
        include: {
          teacher: { select: { id: true, name: true } },
          learner: { select: { id: true, name: true } },
          skill: true,
        },
      });
    });

    await Promise.all([
      ActivityLog.create({
        userId: completed.learnerId,
        action: "SESSION_COMPLETED",
        metadata: { sessionId: completed.id },
      }),
      ActivityLog.create({
        userId: completed.teacherId,
        action: "SESSION_COMPLETED",
        metadata: { sessionId: completed.id },
      }),
    ]);

    // Generate the receipt without delaying the completion response.
    certificateService
      .generateReceipt(completed.id)
      .catch((error) => console.error("Failed to generate session receipt:", error));

    return completed;
  }

  /**
   * Cancel a booked session for its teacher or learner.
   * @param {number|string} sessionId - Session identifier.
   * @param {number} requesterId - Requesting user identifier.
   * @returns {Promise<object>} Cancelled session.
   */
  async cancelSession(sessionId, requesterId) {
    const parsedSessionId = Number(sessionId);
    const session = await prisma.session.findUnique({
      where: { id: parsedSessionId },
    });
    if (!session) throw new NotFoundError("Session not found");
    if (session.teacherId !== requesterId && session.learnerId !== requesterId) {
      throw new ForbiddenError("Only the teacher or learner can cancel this session");
    }
    if (session.status !== "BOOKED") {
      throw new BadRequestError("Only booked sessions can be cancelled");
    }

    return prisma.session.update({
      where: { id: parsedSessionId },
      data: { status: "CANCELLED" },
      include: {
        teacher: { select: { id: true, name: true } },
        learner: { select: { id: true, name: true } },
        skill: true,
      },
    });
  }

  /**
   * Get sessions for a user as either teacher or learner.
   * @param {number} userId - User identifier.
   * @returns {Promise<object[]>} User sessions.
   */
  async getMySessions(userId) {
    return prisma.session.findMany({
      where: {
        OR: [
          { teacherId: userId },
          { learnerId: userId },
        ],
      },
      include: {
        teacher: { select: { id: true, name: true } },
        learner: { select: { id: true, name: true } },
        skill: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });
  }
}

module.exports = SessionService;
