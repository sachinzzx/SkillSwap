const AppError = require("./AppError");

class BadRequestError extends AppError {
  /**
   * @param {string} message - Error message.
   */
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  /**
   * @param {string} message - Error message.
   */
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  /**
   * @param {string} message - Error message.
   */
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  /**
   * @param {string} message - Error message.
   */
  constructor(message = "Not found") {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  /**
   * @param {string} message - Error message.
   */
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

class InsufficientCoinsError extends AppError {
  /**
   * @param {string} message - Error message.
   */
  constructor(message = "Insufficient SkillCoins") {
    super(message, 400);
  }
}

class SlotAlreadyBookedError extends AppError {
  /**
   * @param {string} message - Error message.
   */
  constructor(message = "This slot is already booked") {
    super(message, 409);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InsufficientCoinsError,
  SlotAlreadyBookedError,
};
