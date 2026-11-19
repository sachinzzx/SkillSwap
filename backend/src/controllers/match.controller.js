const MatchService = require("../services/match.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");

const matchService = new MatchService();

const getTeachers = asyncHandler(async (req, res) => {
  if (!req.query.skillId) {
    throw new BadRequestError("skillId is required");
  }

  const teachers = await matchService.findTeachersForSkill(
    req.query.skillId,
    req.query.maxRate,
  );

  res.status(200).json({
    success: true,
    message: "Teachers retrieved successfully",
    data: teachers,
  });
});

const getDirectSwaps = asyncHandler(async (req, res) => {
  const matches = await matchService.findDirectSwaps(req.user.userId);
  res.status(200).json({
    success: true,
    message: "Direct swaps retrieved successfully",
    data: matches,
  });
});

module.exports = {
  getTeachers,
  getDirectSwaps,
};
