const { verifyAccessToken } = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");
const {
  UnauthorizedError,
  ForbiddenError,
} = require("../errors");

/**
 * Authenticate a request using its Bearer access token.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 * @param {import("express").NextFunction} next - Express next function.
 * @returns {Promise<void>}
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new UnauthorizedError("Authorization header is required");
  }

  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    throw new UnauthorizedError("Malformed authorization header");
  }

  let payload;
  try {
    payload = verifyAccessToken(parts[1]);
  } catch (_error) {
    throw new UnauthorizedError("Invalid or expired access token");
  }

  req.user = {
    userId: payload.userId,
    role: payload.role,
  };

  next();
});

/**
 * Restrict a route to one or more allowed roles.
 * @param {...string} roles - Allowed roles.
 * @returns {import("express").RequestHandler} Authorization middleware.
 */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
