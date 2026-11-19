const express = require("express");

const {
  sendMessage,
  getConversation,
  markAsRead,
  getUnreadCount,
} = require("../controllers/chat.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/:userId/message", authenticate, sendMessage);
router.get("/unread/count", authenticate, getUnreadCount);
router.get("/:userId", authenticate, getConversation);
router.patch("/:userId/read", authenticate, markAsRead);

module.exports = router;
