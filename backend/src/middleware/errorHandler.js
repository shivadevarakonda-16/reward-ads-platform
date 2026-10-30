export const errorHandler = (err, req, res, next) => {
  console.error('[Centralized Error Handler]', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      success: false,
      error: `Duplicate entry detected for: ${fields.join(', ')}.`
    });
  }

  // CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Resource not found with specified ID: ${err.value}`
    });
  }

  // Custom status or default to 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  });
};
