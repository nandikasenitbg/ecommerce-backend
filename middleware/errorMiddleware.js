// ─── 404 Handler: Route not found ────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose: Invalid ObjectId ──────────────────────────────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found. Invalid ID: ${err.value}`;
  }

  // ── Mongoose: Duplicate Key Error ───────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // ── Mongoose: Validation Error ──────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join('. ');
  }

  // ── JWT Errors ──────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ── Log error stack in development ─────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR STACK:'.red, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
