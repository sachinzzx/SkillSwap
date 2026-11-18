/**
 * @param {Function} handler - Async Express request handler.
 * @returns {Function} Express request handler.
 */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
