const status = require('http-status');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err); // If headers are sent, delegate to the default error handler
  }

  // Set the status code from the error object or default to 500
  const statusCode = err.statusCode || 500;

  // Build detailed context for logging
  const context = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    headers: req.headers,
    query: req.query,
    body: req.body,
    user: req.user || null,
    statusCode,
  };

  // Console logging (always)
  console.error(`\n🚨 ERROR OCCURRED`);
  console.error(`📍 ${context.method} ${context.url}`);
  console.error(`🧑‍💻 IP: ${context.ip}`);
  console.error(`📦 Headers:`, context.headers);
  console.error(`🔎 Query:`, context.query);
  console.error(`📝 Body:`, context.body);
  console.error(`👤 User:`, context.user);
  console.error(`❌ Message: ${err.message}`);
  console.error(`📚 Stack:`, err.stack);
  console.error(`🚨 END ERROR\n`);

  // Winston logging
  logger.error(`ERROR ${context.method} ${context.url} -> ${statusCode}: ${err.message}`, {
    stack: err.stack,
    context,
  });

  // Initialize the error response (avoid leaking internals in response)
  const errorResponse = {
    title: status[statusCode],
    message: err.message,
  };

  return res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
