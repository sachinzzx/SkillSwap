const UserSkillService = require("../services/userSkill.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");

const userSkillService = new UserSkillService();

const addSkill = asyncHandler(async (req, res) => {
  const { skillId, type, hourlyCoinRate } = req.body;
  if (!skillId || !type) {
    throw new BadRequestError("skillId and type are required");
  }

  const userSkill = await userSkillService.addSkill(
    req.user.userId,
    skillId,
    type,
    hourlyCoinRate,
  );

  res.status(201).json({
    success: true,
    message: "Skill added successfully",
    data: userSkill,
  });
});

const removeSkill = asyncHandler(async (req, res) => {
  const userSkill = await userSkillService.removeSkill(
    req.user.userId,
    req.params.id,
  );

  res.status(200).json({
    success: true,
    message: "Skill removed successfully",
    data: userSkill,
  });
});

const getMySkills = asyncHandler(async (req, res) => {
  const skills = await userSkillService.getMySkills(req.user.userId);
  res.status(200).json({
    success: true,
    message: "User skills retrieved successfully",
    data: skills,
  });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await userSkillService.getMyProfile(req.user.userId);
  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: profile,
  });
});

const getUserPublicProfile = asyncHandler(async (req, res) => {
  const profile = await userSkillService.getUserPublicProfile(req.params.id);
  res.status(200).json({
    success: true,
    message: "Public profile retrieved successfully",
    data: profile,
  });
});

module.exports = {
  addSkill,
  removeSkill,
  getMySkills,
  getMyProfile,
  getUserPublicProfile,
};
