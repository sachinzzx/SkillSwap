const AuthService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError } = require("../errors");

const authService = new AuthService();

/**
 * Register a new user.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const missingFields = [];

  if (!name) missingFields.push("name");
  if (!email) missingFields.push("email");
  if (!password) missingFields.push("password");

  if (missingFields.length > 0) {
    throw new BadRequestError(
      `Missing required fields: ${missingFields.join(", ")}`,
    );
  }

  const user = await authService.register(name, email, password);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

/**
 * Log in a user.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const missingFields = [];

  if (!email) missingFields.push("email");
  if (!password) missingFields.push("password");

  if (missingFields.length > 0) {
    throw new BadRequestError(
      `Missing required fields: ${missingFields.join(", ")}`,
    );
  }

  const data = await authService.login(email, password);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data,
  });
});

/**
 * Refresh an access token.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError("Missing required fields: refreshToken");
  }

  const data = await authService.refresh(refreshToken);

  res.status(200).json({
    success: true,
    message: "Access token refreshed",
    data,
  });
});

/**
 * Log out the authenticated user.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 */
const logout = asyncHandler(async (req, res) => {
  const user = await authService.logout(req.user.userId);

  res.status(200).json({
    success: true,
    message: "Logout successful",
    data: user,
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
};
