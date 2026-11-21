const prisma = require("../config/prisma");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require("../errors");

class UserSkillService {
  /**
   * Add a teaching or learning skill for a user.
   * @param {number} userId - User identifier.
   * @param {number|string} skillId - Skill identifier.
   * @param {string} type - TEACH or LEARN.
   * @param {number|string} hourlyCoinRate - Coin rate for teaching.
   * @returns {Promise<object>} Created user skill.
   */
  async addSkill(userId, skillId, type, hourlyCoinRate, customName, description, categoryId) {
    if (!["TEACH", "LEARN"].includes(type)) {
      throw new BadRequestError("Type must be TEACH or LEARN");
    }

    let skill;
    if (customName) {
      const name = String(customName).trim();
      if (name.length < 2) throw new BadRequestError("Skill name must be at least 2 characters");
      if (name.length > 80) throw new BadRequestError("Skill name must be 80 characters or fewer");

      const cleanDescription = description == null ? null : String(description).trim();
      if (cleanDescription && cleanDescription.length > 500) {
        throw new BadRequestError("Description must be 500 characters or fewer");
      }

      let category;
      if (categoryId) {
        category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
        if (!category) throw new NotFoundError("Category not found");
      } else {
        category = await prisma.category.upsert({
          where: { name: "General" },
          update: {},
          create: { name: "General" },
        });
      }
      skill = await prisma.skill.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
        },
      });
      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name,
            description: cleanDescription || null,
            level: "BEGINNER",
            categoryId: category.id,
          },
        });
      } else if (cleanDescription && !skill.description) {
        skill = await prisma.skill.update({
          where: { id: skill.id },
          data: { description: cleanDescription },
          include: { category: true },
        });
      }
    } else {
      const parsedSkillId = Number(skillId);
      skill = await prisma.skill.findUnique({
        where: { id: parsedSkillId },
      });
      if (!skill) throw new NotFoundError("Skill not found");
    }

    const parsedSkillId = skill.id;

    let rate = 0;
    if (type === "TEACH") {
      rate = Number(hourlyCoinRate);
      if (!Number.isInteger(rate) || rate < 1) {
        throw new BadRequestError("hourlyCoinRate must be at least 1");
      }
    }

    const existing = await prisma.userSkill.findUnique({
      where: {
        userId_skillId_type: {
          userId,
          skillId: parsedSkillId,
          type,
        },
      },
      include: {
        skill: { include: { category: true } },
      },
    });
    if (existing) {
      if (customName) return existing;
      throw new ConflictError("This skill is already added");
    }

    return prisma.userSkill.create({
      data: {
        userId,
        skillId: parsedSkillId,
        type,
        hourlyCoinRate: rate,
      },
      include: {
        skill: { include: { category: true } },
      },
    });
  }

  /**
   * Remove a user skill owned by the requesting user.
   * @param {number} userId - User identifier.
   * @param {number|string} userSkillId - UserSkill identifier.
   * @returns {Promise<object>} Removed user skill.
   */
  async removeSkill(userId, userSkillId) {
    const userSkill = await prisma.userSkill.findUnique({
      where: { id: Number(userSkillId) },
    });
    if (!userSkill) throw new NotFoundError("User skill not found");
    if (userSkill.userId !== userId) {
      throw new ForbiddenError("You can only remove your own skills");
    }

    return prisma.userSkill.delete({
      where: { id: Number(userSkillId) },
      include: { skill: { include: { category: true } } },
    });
  }

  /**
   * Get teaching and learning skills for a user.
   * @param {number} userId - User identifier.
   * @returns {Promise<object>} Grouped skill lists.
   */
  async getMySkills(userId) {
    const userSkills = await prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: { include: { category: true } },
      },
      orderBy: { id: "asc" },
    });

    return {
      teaching: userSkills.filter((item) => item.type === "TEACH"),
      learning: userSkills.filter((item) => item.type === "LEARN"),
    };
  }

  /**
   * Get a public profile for a user.
   * @param {number|string} userId - User identifier.
   * @returns {Promise<object>} Public profile.
   */
  async getUserPublicProfile(userId) {
    const parsedUserId = Number(userId);
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
      include: {
        userSkills: {
          where: { type: "TEACH" },
          include: {
            skill: { include: { category: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundError("User not found");

    const rating = await prisma.review.aggregate({
      where: { reviewedId: parsedUserId },
      _avg: { rating: true },
    });

    const teaching = user.userSkills.map((item) => ({
      id: item.id,
      hourlyCoinRate: item.hourlyCoinRate,
      skill: item.skill,
    }));

    return {
      id: user.id,
      name: user.name,
      averageRating: rating._avg.rating,
      teaching,
    };
  }

  /**
   * Get the authenticated user's private profile.
   * @param {number} userId - User identifier.
   * @returns {Promise<object>} Private profile.
   */
  async getMyProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundError("User not found");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      coins: user.coins,
      createdAt: user.createdAt,
    };
  }
}

module.exports = UserSkillService;
