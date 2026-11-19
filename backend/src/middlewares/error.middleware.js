const { AppError, NotFoundError } = require("../errors");

/**
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} _res - Express response.
 * @param {import("express").NextFunction} next - Express next function.
 */
const notFoundHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * @param {Error} error - Express error.
 * @param {import("express").Request} _req - Express request.
 * @param {import("express").Response} res - Express response.
 * @param {import("express").NextFunction} _next - Express next function.
 */
const errorHandler = (error, _req, res, _next) => {
  console.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
