const express = require("express");

const {
  createNote,
  getNote,
  addComment,
  addResource,
  searchNotesByTags,
} = require("../controllers/note.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/search", authenticate, searchNotesByTags);
router.post("/:sessionId", authenticate, createNote);
router.get("/:sessionId", authenticate, getNote);
router.post("/:sessionId/comments", authenticate, addComment);
router.post("/:sessionId/resources", authenticate, addResource);

module.exports = router;
