const bcrypt = require("bcrypt");

const prisma = require("../config/prisma");
const ActivityLog = require("../models/ActivityLog.model");
const {
  ConflictError,
  UnauthorizedError,
} = require("../errors");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

class AuthService {
  /**
   * Register a new user and create a welcome activity log.
   * @param {string} name - Display name.
   * @param {string} email - Unique email address.
   * @param {string} password - Plain-text password.
   * @returns {Promise<object>} Created user without password.
   */
  async register(name, email, password) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError("Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        coins: 50,
      },
    });

    await ActivityLog.create({
      userId: user.id,
      action: "USER_REGISTERED",
      metadata: { email: user.email },
    });

    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Authenticate a user and persist refresh-token state.
   * @param {string} email - Email address.
   * @param {string} password - Plain-text password.
   * @returns {Promise<object>} Tokens and user without password.
   */
  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    await ActivityLog.create({
      userId: user.id,
      action: "USER_LOGGED_IN",
      metadata: { email: user.email },
    });

    const { password: _password, refreshToken: _refreshToken, ...safeUser } = user;

    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }

  /**
   * Rotate an existing refresh token into a new access token.
   * @param {string} oldRefreshToken - Existing refresh token.
   * @returns {Promise<object>} New access token.
   */
  async refresh(oldRefreshToken) {
    let payload;

    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch (_error) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== oldRefreshToken) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    return {
      accessToken: generateAccessToken(user.id, user.role),
    };
  }

  /**
   * Clear the stored refresh token for a user.
   * @param {number} userId - User identifier.
   * @returns {Promise<object>} Updated user without password.
   */
  async logout(userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    const { password: _password, refreshToken: _refreshToken, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = AuthService;
