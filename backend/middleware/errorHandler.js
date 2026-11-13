const response = require('../utils/response');

function notFound(req, res, next) {
  return response.error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

function globalErrorHandler(err, req, res, next) {
  console.error('💥 Error:', err);

  // SQL Server duplicate key
  if (err.number === 2627 || err.number === 2601) {
    return response.error(res, 'Duplicate value — record already exists', 409);
  }

  // SQL Server foreign key violation
  if (err.number === 547) {
    return response.error(res, 'Foreign key constraint violation', 400);
  }

  // SQL Server not-null violation
  if (err.number === 515) {
    return response.error(res, 'Required field is missing', 400);
  }

  // Generic error
  return response.error(
    res,
    err.message || 'Internal server error',
    err.statusCode || 500
  );
}

module.exports = { notFound, globalErrorHandler };