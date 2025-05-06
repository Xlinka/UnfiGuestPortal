/**
 * Error handling middleware
 * Provides consistent error responses across the API
 */

const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error(err.stack);
  
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;
  
  // Handle different types of errors
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(val => val.message);
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate Field Value';
    errors = Object.keys(err.keyValue).map(key => `${key} must be unique`);
  }
  
  // Mongoose cast error (e.g., invalid ID format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Custom API errors (where we've explicitly set statusCode)
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Send the error response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
