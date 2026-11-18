// fs/promises is used for all receipt file operations because it keeps disk I/O
// asynchronous, preventing slow filesystem work from blocking the Node.js event loop.
const fs = require("fs/promises");
const path = require("path");

const prisma = require("../config/prisma");
const { NotFoundError } = require("../errors");

class CertificateService {
  /**
   * Generate a plain-text receipt for a completed or booked session.
   * @param {number|string} sessionId - Session identifier.
   * @returns {Promise<string>} Absolute receipt file path.
   */
  async generateReceipt(sessionId) {
    const parsedSessionId = Number(sessionId);
    const session = await prisma.session.findUnique({
      where: { id: parsedSessionId },
      include: {
        teacher: { select: { id: true, name: true } },
        learner: { select: { id: true, name: true } },
        skill: { select: { id: true, name: true } },
      },
    });
    if (!session) throw new NotFoundError("Session not found");

    const border = "=".repeat(48);
    const timestamp = new Date().toISOString();
    const receiptId = `SS-${session.id}-${timestamp.replace(/[^0-9]/g, "").slice(0, 14)}`;
    const receipt = [
      border,
      "                    SkillSwap",
      border,
      `Receipt ID: ${receiptId}`,
      `Timestamp: ${timestamp}`,
      "",
      `Session ID: ${session.id}`,
      `Status: ${session.status}`,
      `Scheduled At: ${new Date(session.scheduledAt).toISOString()}`,
      `Duration: ${session.duration} minutes`,
      `Skill: ${session.skill.name}`,
      `Teacher: ${session.teacher.name} (ID ${session.teacher.id})`,
      `Learner: ${session.learner.name} (ID ${session.learner.id})`,
      `Coins Transferred: ${session.coinsCost}`,
      border,
    ].join("\n");

    const receiptsDir = path.resolve(process.cwd(), "receipts");
    await fs.mkdir(receiptsDir, { recursive: true });

    const filePath = path.join(receiptsDir, `receipt-${parsedSessionId}.txt`);
    await fs.writeFile(filePath, receipt, "utf8");
    return filePath;
  }

  /**
   * Return an existing receipt path or throw if missing.
   * @param {number|string} sessionId - Session identifier.
   * @returns {Promise<string>} Absolute receipt file path.
   */
  async getReceiptPath(sessionId) {
    const parsedSessionId = Number(sessionId);
    const filePath = path.resolve(
      process.cwd(),
      "receipts",
      `receipt-${parsedSessionId}.txt`,
    );

    try {
      await fs.access(filePath);
      return filePath;
    } catch (_error) {
      throw new NotFoundError("Receipt not found");
    }
  }
}

module.exports = CertificateService;
