const fs = require("fs/promises");
const path = require("path");

/**
 * Asynchronously append an access-log line after each response completes.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 * @param {import("express").NextFunction} next - Express next function.
 * @returns {void}
 */
function accessLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    const elapsedMs = (Number(elapsedNs) / 1_000_000).toFixed(2);
    const line =
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ${elapsedMs}ms\n`;
    const logsDir = path.resolve(process.cwd(), "logs");

    fs.mkdir(logsDir, { recursive: true })
      .then(() => fs.appendFile(path.join(logsDir, "access.log"), line, "utf8"))
      .catch((error) => console.error("Failed to write access log:", error));
  });

  next();
}

module.exports = accessLogger;
