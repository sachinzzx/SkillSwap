const prisma = require("../config/prisma");

class CoinService {
  /**
   * Get the user's current coin balance.
   * @param {number} userId - User identifier.
   * @returns {Promise<object>} Balance object.
   */
  async getBalance(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });
    return { coins: user ? user.coins : 0 };
  }

  /**
   * Get transaction history relative to a user.
   * @param {number} userId - User identifier.
   * @returns {Promise<object[]>} Transactions with CREDIT/DEBIT direction.
   */
  async getHistory(userId) {
    const transactions = await prisma.coinTransaction.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        session: { select: { id: true, skillId: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return transactions.map((transaction) => ({
      ...transaction,
      direction: transaction.receiverId === userId ? "CREDIT" : "DEBIT",
    }));
  }
}

module.exports = CoinService;
