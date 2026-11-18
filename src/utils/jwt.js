const jwt = require("jsonwebtoken");

/**
 * Generate a short-lived access token.
 * @param {number} userId - User identifier.
 * @param {string} role - User role.
 * @returns {string} Signed access token.
 */
function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

/**
 * Generate a refresh token.
 * @param {number} userId - User identifier.
 * @returns {string} Signed refresh token.
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
}

/**
 * Verify an access token.
 * @param {string} token - Access token.
 * @returns {object} Decoded access-token payload.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Verify a refresh token.
 * @param {string} token - Refresh token.
 * @returns {object} Decoded refresh-token payload.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
