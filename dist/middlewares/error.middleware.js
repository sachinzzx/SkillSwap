"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
const errors_1 = require("../errors");
const notFoundHandler = (req, _res, next) => {
    next(new errors_1.NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (error, _req, res, _next) => {
    console.error(error);
    if (error instanceof errors_1.AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
exports.errorHandler = errorHandler;
