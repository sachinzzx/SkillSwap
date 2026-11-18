const SkillService = require("../services/skill.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");

const skillService = new SkillService();

const getAllSkills = asyncHandler(async (req, res) => {
  const skills = await skillService.getAllSkills(req.query);
  res.status(200).json({
    success: true,
    message: "Skills retrieved successfully",
    data: skills,
  });
});

const getSkillById = asyncHandler(async (req, res) => {
  const skill = await skillService.getSkillById(req.params.id);
  res.status(200).json({
    success: true,
    message: "Skill retrieved successfully",
    data: skill,
  });
});

const createSkill = asyncHandler(async (req, res) => {
  const { name, level, categoryId } = req.body;
  if (!name || !level || !categoryId) {
    throw new BadRequestError("Name, level, and categoryId are required");
  }

  const skill = await skillService.createSkill(name, level, categoryId);
  res.status(201).json({
    success: true,
    message: "Skill created successfully",
    data: skill,
  });
});

const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.deleteSkill(req.params.id);
  res.status(200).json({
    success: true,
    message: "Skill deleted successfully",
    data: skill,
  });
});

const getAllCategories = asyncHandler(async (_req, res) => {
  const categories = await skillService.getAllCategories();
  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    data: categories,
  });
});

const createCategory = asyncHandler(async (req, res) => {
  if (!req.body.name) {
    throw new BadRequestError("Category name is required");
  }

  const category = await skillService.createCategory(req.body.name);
  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

module.exports = {
  getAllSkills,
  getSkillById,
  createSkill,
  deleteSkill,
  getAllCategories,
  createCategory,
};
