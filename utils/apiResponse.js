/**
 * Send a standardized success response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Response payload
 * @param {string} message - Optional success message
 */
const sendSuccess = (res, statusCode = 200, data = null, message = '') => {
  const response = { success: true };
  if (message) response.message = message;
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send a standardized error response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
const sendError = (res, statusCode = 500, message = 'Server Error') => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Build a paginated success response.
 * @param {object} res - Express response object
 * @param {Array} data - Array of results
 * @param {number} page - Current page
 * @param {number} pages - Total pages
 * @param {number} total - Total documents
 */
const sendPaginated = (res, data, page, pages, total) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: { page, pages, total },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
