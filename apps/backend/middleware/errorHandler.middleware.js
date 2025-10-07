// middleware/errorHandler.middleware.js
import { Prisma } from '@prisma/client';
import logger from '../config/logger.js';
import { AppError, DatabaseError, TokenError, ValidationError } from '../utils/errors.js';

/**
 * Handle Prisma errors and convert to AppError
 */
const handlePrismaError = (error) => {
  // Unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return new DatabaseError(`Duplicate entry: ${field} already exists`, error);
  }

  // Foreign key constraint failed
  if (error.code === 'P2003') {
    return new DatabaseError('Referenced record does not exist', error);
  }

  // Record not found
  if (error.code === 'P2025') {
    return new DatabaseError('Record not found', error);
  }

  // Record to delete does not exist
  if (error.code === 'P2016') {
    return new DatabaseError('Record to delete does not exist', error);
  }

  // Invalid value
  if (error.code === 'P2006') {
    return new DatabaseError('Invalid data provided', error);
  }

  // Connection error
  if (error.code === 'P1001') {
    return new DatabaseError('Cannot connect to database', error);
  }

  // Timeout
  if (error.code === 'P1008') {
    return new DatabaseError('Database operation timeout', error);
  }

  // Generic Prisma error
  return new DatabaseError('Database operation failed', error);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new TokenError('Invalid token');
  }
  if (error.name === 'TokenExpiredError') {
    return new TokenError('Token expired');
  }
  return new TokenError('Token error');
};

/**
 * Handle validation errors (from Zod, Joi, etc.)
 */
const handleValidationError = (error) => {
  // Zod validation error
  if (error.name === 'ZodError') {
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return new ValidationError('Validation failed', errors);
  }

  // Joi validation error
  if (error.name === 'ValidationError' && error.details) {
    const errors = error.details.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return new ValidationError('Validation failed', errors);
  }

  return error;
};

/**
 * Format error response for client
 */
const formatErrorResponse = (err, includeStack = false) => {
  const response = {
    status: err.status || 'error',
    message: err.message || 'Something went wrong',
  };

  // Add status code
  if (err.statusCode) {
    response.statusCode = err.statusCode;
  }

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    response.errors = err.errors;
  }

  // Add stack trace in development
  if (includeStack && err.stack) {
    response.stack = err.stack;
  }

  // Add error name in development
  if (includeStack && err.name) {
    response.name = err.name;
  }

  return response;
};

/**
 * Log error with context
 */
const logError = (err, req) => {
  const errorContext = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
    },
  };

  // Log operational errors as warnings
  if (err.isOperational) {
    logger.warn({
      message: err.message,
      statusCode: err.statusCode,
      ...errorContext,
    });
  } else {
    // Log programming errors as errors with full stack
    logger.error({
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500,
      ...errorContext,
    });
  }
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Handle specific error types
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new DatabaseError('Invalid query parameters', err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  } else if (err.name === 'ZodError' || (err.name === 'ValidationError' && err.details)) {
    error = handleValidationError(err);
  } else if (!(err instanceof AppError)) {
    // Convert unknown errors to AppError
    error = new AppError(err.message || 'Internal server error', err.statusCode || 500, false);
  }

  // Set default status code
  const statusCode = error.statusCode || 500;

  // Log the error
  logError(error, req);

  // Determine if we should include stack trace
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Send error response
  res.status(statusCode).json(formatErrorResponse(error, isDevelopment));
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({
      message: 'Unhandled Promise Rejection',
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    
    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      logger.error('Shutting down due to unhandled promise rejection');
      process.exit(1);
    }
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error({
      message: 'Uncaught Exception',
      error: error.message,
      stack: error.stack,
    });
    
    // Always exit on uncaught exception
    logger.error('Shutting down due to uncaught exception');
    process.exit(1);
  });
};