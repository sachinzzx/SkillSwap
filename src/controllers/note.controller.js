const NoteService = require("../services/note.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");

const noteService = new NoteService();

const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(
    req.user.userId,
    req.params.sessionId,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: "Session note saved successfully",
    data: note,
  });
});

const getNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNote(
    req.params.sessionId,
    req.user.userId,
  );
  res.status(200).json({
    success: true,
    message: "Session note retrieved successfully",
    data: note,
  });
});

const addComment = asyncHandler(async (req, res) => {
  if (!req.body.text) throw new BadRequestError("Comment text is required");
  const note = await noteService.addComment(
    req.user.userId,
    req.params.sessionId,
    req.body.text,
  );
  res.status(200).json({
    success: true,
    message: "Comment added successfully",
    data: note,
  });
});

const addResource = asyncHandler(async (req, res) => {
  const note = await noteService.addResource(
    req.user.userId,
    req.params.sessionId,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: "Resource added successfully",
    data: note,
  });
});

const searchNotesByTags = asyncHandler(async (req, res) => {
  if (!req.query.tags) {
    throw new BadRequestError("tags query parameter is required");
  }
  const tags = req.query.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (tags.length === 0) {
    throw new BadRequestError("At least one tag is required");
  }

  const notes = await noteService.searchNotesByTags(tags);
  res.status(200).json({
    success: true,
    message: "Session notes retrieved successfully",
    data: notes,
  });
});

module.exports = {
  createNote,
  getNote,
  addComment,
  addResource,
  searchNotesByTags,
};
