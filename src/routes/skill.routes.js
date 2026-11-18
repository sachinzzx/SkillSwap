const express = require("express");

const {
  getAllSkills,
  getSkillById,
  createSkill,
  deleteSkill,
  getAllCategories,
  createCategory,
} = require("../controllers/skill.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/skills", getAllSkills);
router.get("/skills/:id", getSkillById);
router.post("/skills", authenticate, authorize("ADMIN"), createSkill);
router.delete("/skills/:id", authenticate, authorize("ADMIN"), deleteSkill);

router.get("/categories", getAllCategories);
router.post("/categories", authenticate, authorize("ADMIN"), createCategory);

module.exports = router;
