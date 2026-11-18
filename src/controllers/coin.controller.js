const CoinService = require("../services/coin.service");
const asyncHandler = require("../utils/asyncHandler");

const coinService = new CoinService();

const getBalance = asyncHandler(async (req, res) => {
  const balance = await coinService.getBalance(req.user.userId);
  res.status(200).json({
    success: true,
    message: "Coin balance retrieved successfully",
    data: balance,
  });
});

const getHistory = asyncHandler(async (req, res) => {
  const history = await coinService.getHistory(req.user.userId);
  res.status(200).json({
    success: true,
    message: "Coin history retrieved successfully",
    data: history,
  });
});

module.exports = { getBalance, getHistory };
