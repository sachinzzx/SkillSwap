const express = require("express");

const {
  addSkill,
  removeSkill,
  getMySkills,
  getMyProfile,
  getUserPublicProfile,
} = require("../controllers/userSkill.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/users/skills", authenticate, addSkill);
router.delete("/users/skills/:id", authenticate, removeSkill);
router.get("/users/me/skills", authenticate, getMySkills);
router.get("/users/me", authenticate, getMyProfile);
router.get("/users/:id/profile", getUserPublicProfile);

module.exports = router;
