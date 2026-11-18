require("dotenv").config();

const app = require("./app");
const connectMongo = require("./config/mongo");

const port = process.env.PORT || 5000;

/**
 * Connect to MongoDB before starting the Express server.
 * @returns {Promise<void>}
 */
async function startServer() {
  await connectMongo();

  app.listen(port, () => {
    console.log(`SkillSwap server running at http://localhost:${port}`);
  });
}

startServer();
