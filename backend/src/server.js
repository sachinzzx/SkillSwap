require("dotenv").config();

const app = require("./app");
const connectMongo = require("./config/mongo");
const prisma = require("./config/prisma");
const mongoose = require("mongoose");

const port = process.env.PORT || 5000;
let httpServer;

async function startServer() {
  await connectMongo();

  httpServer = app.listen(port, () => {
    console.log(`SkillSwap server running at http://localhost:${port}`);
  });
}

async function gracefulShutdown(signal, error) {
  if (error) {
    console.error(error);
  }
  console.log(`${signal} received. Starting graceful shutdown.`);

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  await Promise.allSettled([
    prisma.$disconnect(),
    mongoose.disconnect(),
  ]);

  process.exit(error ? 1 : 0);
}

process.on("unhandledRejection", (reason) => {
  void gracefulShutdown("unhandledRejection", reason);
});

process.on("uncaughtException", (error) => {
  void gracefulShutdown("uncaughtException", error);
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

startServer().catch((error) => {
  void gracefulShutdown("startupFailure", error);
});
