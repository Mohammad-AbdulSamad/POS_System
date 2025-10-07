// middleware/requestLogger.middleware.js
import morgan from 'morgan';
import logger from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate correlation ID for request tracking
 */
export const correlationId = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

/**
 * Morgan format for production
 */
const productionFormat = ':method :url :status :res[content-length] - :response-time ms';

/**
 * Morgan format for development
 */
const developmentFormat = ':method :url :status :response-time ms - :res[content-length]';

/**
 * Custom token for user ID
 */
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

/**
 * Custom token for correlation ID
 */
morgan.token('correlation-id', (req) => {
  return req.correlationId || '-';
});

/**
 * Skip logging for health check endpoints
 */
const skip = (req, res) => {
  // Skip health check and other monitoring endpoints
  const skipPaths = ['/health', '/ping', '/metrics'];
  return skipPaths.some(path => req.originalUrl.includes(path));
};

/**
 * Morgan middleware configuration
 */
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    stream: logger.stream,
    skip,
  }
);

/**
 * Detailed request logger (logs request body for debugging)
 */
export const detailedRequestLogger = (req, res, next) => {
  // Skip for certain routes to avoid logging sensitive data
  const skipPaths = ['/auth/login', '/auth/refresh', '/users'];
  const shouldSkip = skipPaths.some(path => req.originalUrl.includes(path));

  if (!shouldSkip && process.env.NODE_ENV === 'development') {
    logger.debug({
      message: 'Incoming Request',
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      params: req.params,
      correlationId: req.correlationId,
      userId: req.user?.id,
    });
  }

  next();
};

/**
 * Response time logger
 */
export const responseTimeLogger = (req, res, next) => {
  const startTime = Date.now();

  // Override res.json to log response time
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests (> 1000ms)
    if (responseTime > 1000) {
      logger.warn({
        message: 'Slow Request Detected',
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        correlationId: req.correlationId,
        userId: req.user?.id,
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Security event logger
 */
export const securityLogger = (event) => {
  return (req, res, next) => {
    logger.logSecurity(event, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      correlationId: req.correlationId,
    });
    next();
  };
};

/**
 * Authentication event logger
 */
export const authLogger = (action) => {
  return (req, res, next) => {
    logger.logAuth(action, req.user?.id, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      correlationId: req.correlationId,
    });
    next();
  };
};