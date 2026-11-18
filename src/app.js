const express = require("express");
const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const skillRoutes = require("./routes/skill.routes");
const userRoutes = require("./routes/user.routes");
const matchRoutes = require("./routes/match.routes");
const sessionRoutes = require("./routes/session.routes");
const coinRoutes = require("./routes/coin.routes");
const reviewRoutes = require("./routes/review.routes");

const app = express();

app.use(express.json());

/**
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} _res - Express response.
 * @param {import("express").NextFunction} next - Express next function.
 */
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url} ${new Date().toISOString()}`);
  next();
});

/**
 * @param {import("express").Request} _req - Express request.
 * @param {import("express").Response} res - Express response.
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillSwap API running",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", skillRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1/match", matchRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/coins", coinRoutes);
app.use("/api/v1/reviews", reviewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
