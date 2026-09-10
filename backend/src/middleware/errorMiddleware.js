const { sendError } = require("../utils/apiResponse");

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error("[Server Error]:", err.stack);
  return sendError(res, err.message || "Internal Server Error", statusCode);
};

module.exports = { notFound, errorHandler };
