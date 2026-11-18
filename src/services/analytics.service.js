const prisma = require("../config/prisma");

class AnalyticsService {
  /**
   * CTE + GROUP BY + HAVING + CASE + COALESCE:
   * aggregate mentor performance, then classify eligible mentors.
   * @returns {Promise<object[]>} Top mentors.
   */
  async getTopMentors() {
    return prisma.$queryRaw`
      WITH mentor_stats AS (
        SELECT
          s."teacherId",
          COUNT(*)::int AS "completedSessions",
          COALESCE(SUM(s."coinsCost"), 0)::int AS "coinsEarned",
          COALESCE(AVG(r.rating), 0)::float AS "averageRating"
        FROM "Session" s
        LEFT JOIN "Review" r ON r."sessionId" = s.id
        WHERE s.status = 'COMPLETED'
        GROUP BY s."teacherId"
        HAVING COUNT(*) >= 1
      )
      SELECT
        u.id AS "userId",
        u.name,
        ms."completedSessions",
        ms."coinsEarned",
        ms."averageRating",
        CASE
          WHEN ms."averageRating" >= 4.5 AND ms."completedSessions" >= 10
            THEN 'Grandmaster Mentor'
          WHEN ms."averageRating" >= 4.0
            THEN 'Pro Mentor'
          ELSE 'Rising Mentor'
        END AS badge
      FROM mentor_stats ms
      JOIN "User" u ON u.id = ms."teacherId"
      ORDER BY ms."coinsEarned" DESC
      LIMIT 10
    `;
  }

  /**
   * CORRELATED SUBQUERY:
   * each teacher rate is compared with the average rate in their own skill row.
   * @returns {Promise<object[]>} Budget teaching offers.
   */
  async getBudgetTeachers() {
    return prisma.$queryRaw`
      SELECT
        u.id AS "userId",
        u.name,
        s.name AS "skill",
        us."hourlyCoinRate" AS "rate",
        (
          SELECT AVG(inner_us."hourlyCoinRate")
          FROM "UserSkill" inner_us
          WHERE inner_us."skillId" = us."skillId"
            AND inner_us.type = 'TEACH'
        )::float AS "skillAverage"
      FROM "UserSkill" us
      JOIN "User" u ON u.id = us."userId"
      JOIN "Skill" s ON s.id = us."skillId"
      WHERE us.type = 'TEACH'
        AND us."hourlyCoinRate" < (
          SELECT AVG(inner_us."hourlyCoinRate")
          FROM "UserSkill" inner_us
          WHERE inner_us."skillId" = us."skillId"
            AND inner_us.type = 'TEACH'
        )
      ORDER BY us."hourlyCoinRate" ASC
    `;
  }

  /**
   * GROUP BY + HAVING:
   * report categories that contain at least one skill.
   * @returns {Promise<object[]>} Popular category counts.
   */
  async getPopularCategories() {
    return prisma.$queryRaw`
      SELECT
        c.id AS "categoryId",
        c.name,
        COUNT(s.id)::int AS "skillCount"
      FROM "Category" c
      JOIN "Skill" s ON s."categoryId" = c.id
      GROUP BY c.id, c.name
      HAVING COUNT(s.id) >= 1
      ORDER BY "skillCount" DESC, c.name ASC
    `;
  }

  /**
   * COUNT/SUM/AVG:
   * summarize total circulating SkillCoins and completed-session economics.
   * @returns {Promise<object[]>} Coin economy totals.
   */
  async getCoinEconomyStats() {
    return prisma.$queryRaw`
      SELECT
        COALESCE(SUM(u.coins), 0)::int AS "totalCoinsInCirculation",
        COUNT(s.id) FILTER (WHERE s.status = 'COMPLETED')::int AS "completedSessions",
        COALESCE(AVG(s."coinsCost") FILTER (WHERE s.status = 'COMPLETED'), 0)::float
          AS "averageSessionCost"
      FROM "User" u
      CROSS JOIN "Session" s
    `;
  }

  /**
   * NON-CORRELATED SUBQUERY:
   * IN finds demanded skills; NOT IN finds skills absent from teaching offers.
   * @returns {Promise<object[]>} Demand-without-supply skills.
   */
  async getSkillDemandGap() {
    return prisma.$queryRaw`
      SELECT
        s.id AS "skillId",
        s.name
      FROM "Skill" s
      WHERE s.id IN (
        SELECT us."skillId"
        FROM "UserSkill" us
        WHERE us.type = 'LEARN'
      )
      AND s.id NOT IN (
        SELECT us."skillId"
        FROM "UserSkill" us
        WHERE us.type = 'TEACH'
      )
      ORDER BY s.name ASC
    `;
  }
}

module.exports = AnalyticsService;
