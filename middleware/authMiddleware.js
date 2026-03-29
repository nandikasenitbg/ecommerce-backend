const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

// ─── Protect: Verify JWT and attach user to req ──────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Support both Authorization header and cookie-based tokens
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized. No token provided.');
  }

  try {
    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach fresh user data (without password) to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('User belonging to this token no longer exists.');
    }

    if (!req.user.isActive) {
      res.status(401);
      throw new Error('Your account has been deactivated. Contact support.');
    }

    next();
  } catch (error) {
    // Handle specific JWT errors with clear messages
    if (error.name === 'JsonWebTokenError') {
      res.status(401);
      throw new Error('Invalid token. Please log in again.');
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Token expired. Please log in again.');
    }
    throw error;
  }
});

// ─── Admin: Restrict access to admin users only ──────────────────────────────
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403);
  throw new Error('Access denied. Admin privileges required.');
};

// ─── Optional Auth: Attach user if token exists, but don't block ─────────────
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      req.user = null;
    }
  }

  next();
});

module.exports = { protect, admin, optionalAuth };
