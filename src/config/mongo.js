const mongoose = require("mongoose");

/**
 * Connect Mongoose to MongoDB using the configured URI.
 * @returns {Promise<void>}
 */
async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

module.exports = connectMongo;
