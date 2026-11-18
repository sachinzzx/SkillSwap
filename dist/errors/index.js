"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotAlreadyBookedError = exports.InsufficientCoinsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
const AppError_1 = require("./AppError");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return AppError_1.AppError; } });
class BadRequestError extends AppError_1.AppError {
    constructor(message = "Bad request") {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError_1.AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError_1.AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError_1.AppError {
    constructor(message = "Not found") {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError_1.AppError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class InsufficientCoinsError extends AppError_1.AppError {
    constructor(message = "Insufficient SkillCoins") {
        super(message, 400);
    }
}
exports.InsufficientCoinsError = InsufficientCoinsError;
class SlotAlreadyBookedError extends AppError_1.AppError {
    constructor(message = "This slot is already booked") {
        super(message, 409);
    }
}
exports.SlotAlreadyBookedError = SlotAlreadyBookedError;
