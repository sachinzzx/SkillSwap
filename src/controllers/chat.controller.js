const ChatService = require("../services/chat.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");

const chatService = new ChatService();

const sendMessage = asyncHandler(async (req, res) => {
  const receiverId = Number(req.params.userId);
  const { text } = req.body;

  if (!text) {
    throw new BadRequestError("Message text is required");
  }

  const message = await chatService.sendMessage(
    req.user.userId,
    receiverId,
    text,
  );

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });
});

const getConversation = asyncHandler(async (req, res) => {
  const messages = await chatService.getConversation(
    req.user.userId,
    Number(req.params.userId),
  );

  res.status(200).json({
    success: true,
    message: "Conversation retrieved successfully",
    data: messages,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const result = await chatService.markAsRead(
    req.user.userId,
    Number(req.params.userId),
  );

  res.status(200).json({
    success: true,
    message: "Messages marked as read",
    data: result,
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await chatService.getUnreadCount(req.user.userId);

  res.status(200).json({
    success: true,
    message: "Unread count retrieved successfully",
    data: { unreadCount },
  });
});

module.exports = {
  sendMessage,
  getConversation,
  markAsRead,
  getUnreadCount,
};
