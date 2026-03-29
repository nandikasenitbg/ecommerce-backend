const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for a given user ID.
 * @param {string} id - MongoDB user _id
 * @returns {string} signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = generateToken;
