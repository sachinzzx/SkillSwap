const prisma = require("../config/prisma");
const { BadRequestError } = require("../errors");

class MatchService {
  /**
   * Find teaching-user matches for a skill.
   * @param {number|string} skillId - Skill identifier.
   * @param {number|string|undefined} maxRate - Optional maximum coin rate.
   * @returns {Promise<object[]>} Matching teacher listings.
   */
  async findTeachersForSkill(skillId, maxRate) {
    if (!skillId) throw new BadRequestError("skillId is required");

    const parsedSkillId = Number(skillId);
    if (!Number.isInteger(parsedSkillId) || parsedSkillId < 1) {
      throw new BadRequestError("skillId must be a positive integer");
    }

    const where = {
      skillId: parsedSkillId,
      type: "TEACH",
    };

    if (maxRate !== undefined && maxRate !== "") {
      const parsedMaxRate = Number(maxRate);
      if (!Number.isInteger(parsedMaxRate) || parsedMaxRate < 0) {
        throw new BadRequestError("maxRate must be a non-negative integer");
      }
      where.hourlyCoinRate = { lte: parsedMaxRate };
    }

    return prisma.userSkill.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        skill: true,
      },
      orderBy: { hourlyCoinRate: "asc" },
    });
  }

  /**
   * Find reciprocal teaching and learning matches for a user.
   * @param {number} userId - Requesting user identifier.
   * @returns {Promise<object[]>} Clean direct-swap matches.
   */
  async findDirectSwaps(userId) {
    const rows = await prisma.$queryRaw`
      SELECT
        u1.id AS "u1Id",
        u1.name AS "u1Name",
        u2.id AS "u2Id",
        u2.name AS "u2Name",
        s1.name AS "skill1",
        s2.name AS "skill2"
      FROM "UserSkill" us1teach
      JOIN "User" u1 ON u1.id = us1teach."userId"
      JOIN "Skill" s1 ON s1.id = us1teach."skillId"
      JOIN "UserSkill" us2learn
        ON us2learn."skillId" = us1teach."skillId"
       AND us2learn."type" = 'LEARN'
      JOIN "User" u2 ON u2.id = us2learn."userId"
      JOIN "UserSkill" us2teach
        ON us2teach."userId" = u2.id
       AND us2teach."type" = 'TEACH'
      JOIN "Skill" s2 ON s2.id = us2teach."skillId"
      JOIN "UserSkill" us1learn
        ON us1learn."userId" = u1.id
       AND us1learn."skillId" = s2.id
       AND us1learn."type" = 'LEARN'
      WHERE us1teach."type" = 'TEACH'
        AND u1.id <> u2.id
        AND (u1.id = ${userId} OR u2.id = ${userId})
        -- A self-join compares two rows of UserSkill as if they were separate users.
        -- u1.id < u2.id keeps only the canonical ordering, removing reverse duplicates.
        AND u1.id < u2.id
    `;

    return rows.map((row) => {
      if (Number(row.u1Id) === userId) {
        return {
          partnerId: Number(row.u2Id),
          partnerName: row.u2Name,
          iTeach: row.skill1,
          iLearn: row.skill2,
        };
      }

      return {
        partnerId: Number(row.u1Id),
        partnerName: row.u1Name,
        iTeach: row.skill2,
        iLearn: row.skill1,
      };
    });
  }
}

module.exports = MatchService;
