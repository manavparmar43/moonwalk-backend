function errorHandler(res, status, message) {
  return res.status(status).json({ error: message });
}

function globalErrorHandler(err, req, res, next) {
  console.error(err.message);
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler, globalErrorHandler };
