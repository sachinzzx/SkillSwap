const Chat = require("../models/Chat.model");

class ChatService {
  /**
   * Send a message and create the conversation if needed.
   * @param {number} senderId - Sending user identifier.
   * @param {number} receiverId - Receiving user identifier.
   * @param {string} text - Message text.
   * @returns {Promise<object>} Created message.
   */
  async sendMessage(senderId, receiverId, text) {
    const message = {
      senderId,
      text,
      read: false,
      createdAt: new Date(),
    };

    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        messages: [message],
      });
    } else {
      chat = await Chat.findOneAndUpdate(
        { _id: chat._id },
        { $push: { messages: message } },
        { new: true },
      );
    }

    const createdMessage = chat.messages[chat.messages.length - 1];
    return createdMessage.toObject ? createdMessage.toObject() : createdMessage;
  }

  /**
   * Get a conversation with messages ordered oldest to newest.
   * @param {number} userId - Current user identifier.
   * @param {number} otherUserId - Conversation partner identifier.
   * @returns {Promise<object[]>} Ordered messages.
   */
  async getConversation(userId, otherUserId) {
    const chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] },
    });
    if (!chat) return [];

    return chat.messages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((message) => (
        message.toObject ? message.toObject() : message
      ));
  }

  /**
   * Mark messages from a conversation partner as read.
   * @param {number} userId - Current user identifier.
   * @param {number} otherUserId - Message sender identifier.
   * @returns {Promise<object>} MongoDB update result.
   */
  async markAsRead(userId, otherUserId) {
    return Chat.updateMany(
      { participants: { $all: [userId, otherUserId] } },
      { $set: { "messages.$[message].read": true } },
      {
        arrayFilters: [
          {
            "message.senderId": otherUserId,
            "message.read": false,
          },
        ],
      },
    );
  }

  /**
   * Count unread messages received by a user.
   * @param {number} userId - Current user identifier.
   * @returns {Promise<number>} Unread message count.
   */
  async getUnreadCount(userId) {
    const result = await Chat.aggregate([
      { $match: { participants: userId } },
      { $unwind: "$messages" },
      {
        $match: {
          "messages.senderId": { $ne: userId },
          "messages.read": false,
        },
      },
      { $count: "unreadCount" },
    ]);

    return result[0]?.unreadCount || 0;
  }

  /**
   * Delete chats whose latest embedded message is older than a cutoff.
   * @param {number} daysOld - Minimum age in days.
   * @returns {Promise<object>} MongoDB delete result.
   */
  async deleteOldChats(daysOld) {
    const parsedDays = Number(daysOld);
    if (!Number.isInteger(parsedDays) || parsedDays < 0) {
      throw new Error("daysOld must be a non-negative integer");
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parsedDays);

    return Chat.deleteMany({
      $expr: {
        $lt: [
          { $max: "$messages.createdAt" },
          cutoff,
        ],
      },
    });
  }
}

module.exports = ChatService;
