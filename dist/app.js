"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url} ${new Date().toISOString()}`);
    next();
});
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "SkillSwap API running",
    });
});
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
exports.default = app;
