/**
 * Wraps async route handlers to eliminate try/catch boilerplate.
 * Any thrown error is forwarded to Express's error handling middleware.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }))
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler that catches errors
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
