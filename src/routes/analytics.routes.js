const express = require("express");

const {
  getTopMentors,
  getBudgetTeachers,
  getPopularCategories,
  getCoinEconomyStats,
  getSkillDemandGap,
  getTrendingTags,
} = require("../controllers/analytics.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/top-mentors", getTopMentors);
router.get("/budget-teachers", authenticate, authorize("ADMIN"), getBudgetTeachers);
router.get("/popular-categories", authenticate, authorize("ADMIN"), getPopularCategories);
router.get("/economy", authenticate, authorize("ADMIN"), getCoinEconomyStats);
router.get("/demand-gap", authenticate, authorize("ADMIN"), getSkillDemandGap);
router.get("/trending-tags", getTrendingTags);

module.exports = router;
