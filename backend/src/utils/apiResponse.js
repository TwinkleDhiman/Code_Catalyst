/**
 * Standardized success response helper
 */
const sendSuccess = (res, data = {}, message = null, statusCode = 200, extraProps = {}) => {
  const response = {
    success: true,
    ...extraProps,
    data,
  };
  if (message) {
    response.message = message;
  }
  return res.status(statusCode).json(response);
};

/**
 * Standardized error response helper
 */
const sendError = (res, message = "An error occurred", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
