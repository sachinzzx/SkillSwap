const AnalyticsService = require("../services/analytics.service");
const asyncHandler = require("../utils/asyncHandler");

const analyticsService = new AnalyticsService();

const getTopMentors = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getTopMentors();
  res.status(200).json({
    success: true,
    message: "Top mentors retrieved successfully",
    data,
  });
});

const getBudgetTeachers = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getBudgetTeachers();
  res.status(200).json({
    success: true,
    message: "Budget teachers retrieved successfully",
    data,
  });
});

const getPopularCategories = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getPopularCategories();
  res.status(200).json({
    success: true,
    message: "Popular categories retrieved successfully",
    data,
  });
});

const getCoinEconomyStats = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getCoinEconomyStats();
  res.status(200).json({
    success: true,
    message: "Coin economy stats retrieved successfully",
    data,
  });
});

const getSkillDemandGap = asyncHandler(async (_req, res) => {
  const data = await analyticsService.getSkillDemandGap();
  res.status(200).json({
    success: true,
    message: "Skill demand gap retrieved successfully",
    data,
  });
});

module.exports = {
  getTopMentors,
  getBudgetTeachers,
  getPopularCategories,
  getCoinEconomyStats,
  getSkillDemandGap,
};
