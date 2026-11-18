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
const analyticsRoutes = require("./routes/analytics.routes");
const chatRoutes = require("./routes/chat.routes");
const noteRoutes = require("./routes/note.routes");
const accessLogger = require("./middlewares/logger.middleware");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(accessLogger);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillSwap API running",
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillSwap API",
    data: {
      health: "/api/health",
      auth: "/api/v1/auth",
      skills: "/api/v1/skills",
      categories: "/api/v1/categories",
      users: "/api/v1/users",
      matching: "/api/v1/match",
      sessions: "/api/v1/sessions",
      coins: "/api/v1/coins",
      reviews: "/api/v1/reviews",
      analytics: "/api/v1/analytics",
      chat: "/api/v1/chat",
      notes: "/api/v1/notes",
    },
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", skillRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1/match", matchRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/coins", coinRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/notes", noteRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
