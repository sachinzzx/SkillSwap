const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: Number, required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [Number],
      required: true,
      index: true,
    },
    messages: [messageSchema],
  },
  { timestamps: false },
);

module.exports =
  mongoose.models.Chat || mongoose.model("Chat", chatSchema);
