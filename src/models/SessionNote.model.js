const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const commentSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sessionNoteSchema = new mongoose.Schema(
  {
    sessionId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    teacherNotes: { type: String, default: "" },
    learnerNotes: { type: String, default: "" },
    // Embedding resources and comments keeps session-specific data in one document.
    resources: [resourceSchema],
    tags: {
      type: [String],
      index: true,
    },
    comments: [commentSchema],
  },
  { timestamps: false },
);

module.exports =
  mongoose.models.SessionNote ||
  mongoose.model("SessionNote", sessionNoteSchema);
