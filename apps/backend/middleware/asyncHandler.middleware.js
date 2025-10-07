// middleware/asyncHandler.js

/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 * 
 * Usage:
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Alternative: Async handler with custom error handling
 */
export const asyncHandlerWithError = (fn, errorMessage) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      error.message = errorMessage || error.message;
      next(error);
    }
  };
};

export default asyncHandler;