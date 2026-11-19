const prisma = require("../config/prisma");
const {
  ConflictError,
  NotFoundError,
  BadRequestError,
} = require("../errors");

class SkillService {
  /**
   * Create a category.
   * @param {string} name - Category name.
   * @returns {Promise<object>} Created category.
   */
  async createCategory(name) {
    if (!name) throw new BadRequestError("Category name is required");

    const existing = await prisma.category.findUnique({
      where: { name },
    });
    if (existing) throw new ConflictError("Category already exists");

    return prisma.category.create({ data: { name } });
  }

  /**
   * Get all categories with their skills.
   * @returns {Promise<object[]>} Categories and skills.
   */
  async getAllCategories() {
    return prisma.category.findMany({
      include: { skills: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Create a skill in an existing category.
   * @param {string} name - Skill name.
   * @param {string} level - Skill level.
   * @param {number} categoryId - Category identifier.
   * @returns {Promise<object>} Created skill.
   */
  async createSkill(name, level, categoryId) {
    if (!name || !level || !categoryId) {
      throw new BadRequestError("Name, level, and categoryId are required");
    }

    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });
    if (!category) throw new NotFoundError("Category not found");

    const existing = await prisma.skill.findUnique({
      where: { name },
    });
    if (existing) throw new ConflictError("Skill already exists");

    return prisma.skill.create({
      data: {
        name,
        level,
        categoryId: Number(categoryId),
      },
      include: { category: true },
    });
  }

  /**
   * Get skills matching optional filters.
   * @param {object} filters - Query filters.
   * @param {string} filters.categoryId - Optional category identifier.
   * @param {string} filters.level - Optional skill level.
   * @param {string} filters.search - Optional name search.
   * @returns {Promise<object[]>} Matching skills.
   */
  async getAllSkills(filters = {}) {
    const where = {};

    if (filters.categoryId) {
      where.categoryId = Number(filters.categoryId);
    }
    if (filters.level) {
      where.level = filters.level;
    }
    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    return prisma.skill.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get a skill by identifier.
   * @param {number|string} id - Skill identifier.
   * @returns {Promise<object>} Matching skill.
   */
  async getSkillById(id) {
    const skill = await prisma.skill.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });
    if (!skill) throw new NotFoundError("Skill not found");
    return skill;
  }

  /**
   * Delete a skill if no sessions reference it.
   * @param {number|string} id - Skill identifier.
   * @returns {Promise<object>} Deleted skill.
   */
  async deleteSkill(id) {
    const skillId = Number(id);
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });
    if (!skill) throw new NotFoundError("Skill not found");

    const sessionCount = await prisma.session.count({
      where: { skillId },
    });
    if (sessionCount > 0) {
      throw new ConflictError("Skill cannot be deleted because sessions reference it");
    }

    const userSkillCount = await prisma.userSkill.count({
      where: { skillId },
    });
    if (userSkillCount > 0) {
      throw new ConflictError("Skill cannot be deleted because users reference it");
    }

    return prisma.skill.delete({
      where: { id: skillId },
      include: { category: true },
    });
  }
}

module.exports = SkillService;
