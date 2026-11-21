const express = require("express");
const path = require("path");
const cors = require("cors");
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
app.use(cors({
  origin: "https://skillswap-frontend-4fo7.onrender.com",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));
app.use(accessLogger);
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_URL || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

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
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/notes", noteRoutes);

const reactDist = path.join(__dirname, "../../frontend-react/dist");

app.use(express.static(reactDist));

app.get("/", (_req, res) => {
  res.sendFile(path.join(reactDist, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
