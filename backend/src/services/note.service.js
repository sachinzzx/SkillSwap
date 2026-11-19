const prisma = require("../config/prisma");
const SessionNote = require("../models/SessionNote.model");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} = require("../errors");

class NoteService {
  /**
   * Verify a Prisma session and that the current user participates.
   * @param {number} userId - Participant identifier.
   * @param {number|string} sessionId - Session identifier.
   * @returns {Promise<object>} Session record.
   */
  async assertParticipant(userId, sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
    });
    if (!session) throw new NotFoundError("Session not found");
    if (session.teacherId !== userId && session.learnerId !== userId) {
      throw new ForbiddenError("Only session participants can access this note");
    }
    return session;
  }

  /**
   * Create or update the note for a session.
   * @param {number} userId - Participant identifier.
   * @param {number|string} sessionId - Session identifier.
   * @param {object} data - Note fields.
   * @returns {Promise<object>} Upserted session note.
   */
  async createNote(userId, sessionId, data) {
    await this.assertParticipant(userId, sessionId);

    return SessionNote.findOneAndUpdate(
      { sessionId: Number(sessionId) },
      {
        $set: {
          ...(data.teacherNotes !== undefined && { teacherNotes: data.teacherNotes }),
          ...(data.learnerNotes !== undefined && { learnerNotes: data.learnerNotes }),
          ...(Array.isArray(data.tags) && { tags: data.tags }),
        },
      },
      { new: true, upsert: true, runValidators: true },
    );
  }

  /**
   * Add an embedded comment to a session note.
   * @param {number} userId - Participant identifier.
   * @param {number|string} sessionId - Session identifier.
   * @param {string} text - Comment text.
   * @returns {Promise<object>} Updated session note.
   */
  async addComment(userId, sessionId, text) {
    await this.assertParticipant(userId, sessionId);
    if (!text) throw new BadRequestError("Comment text is required");

    return SessionNote.findOneAndUpdate(
      { sessionId: Number(sessionId) },
      {
        $push: {
          comments: {
            userId,
            text,
            createdAt: new Date(),
          },
        },
        $setOnInsert: { sessionId: Number(sessionId) },
      },
      { new: true, upsert: true, runValidators: true },
    );
  }

  /**
   * Add an embedded resource to a session note.
   * @param {number} userId - Participant identifier.
   * @param {number|string} sessionId - Session identifier.
   * @param {object} resource - Resource title and URL.
   * @returns {Promise<object>} Updated session note.
   */
  async addResource(userId, sessionId, resource) {
    await this.assertParticipant(userId, sessionId);
    if (!resource.title || !resource.url) {
      throw new BadRequestError("Resource title and url are required");
    }

    return SessionNote.findOneAndUpdate(
      { sessionId: Number(sessionId) },
      {
        $push: {
          resources: {
            title: resource.title,
            url: resource.url,
          },
        },
        $setOnInsert: { sessionId: Number(sessionId) },
      },
      { new: true, upsert: true, runValidators: true },
    );
  }

  /**
   * Get a session note for an authorized participant.
   * @param {number|string} sessionId - Session identifier.
   * @param {number} userId - Participant identifier.
   * @returns {Promise<object>} Session note.
   */
  async getNote(sessionId, userId) {
    await this.assertParticipant(userId, sessionId);
    const note = await SessionNote.findOne({ sessionId: Number(sessionId) });
    if (!note) throw new NotFoundError("Session note not found");
    return note;
  }

  /**
   * Search notes containing any requested tag.
   * @param {string[]} tags - Tags to match.
   * @returns {Promise<object[]>} Matching session notes.
   */
  async searchNotesByTags(tags) {
    return SessionNote.find({
      tags: { $in: tags },
    }).sort({ sessionId: 1 });
  }
}

module.exports = NoteService;
