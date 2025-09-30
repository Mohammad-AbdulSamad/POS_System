// middleware/auth.middleware.js
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.utils.js';
import { authConfig } from '../config/auth.config.js';

const prisma = new PrismaClient();

/**
 * Authenticate user via JWT
 * Attaches user object to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'No token provided'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        message: 'Authentication failed',
        error: error.message
      });
    }

    // Check if token is blacklisted
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token }
    });

    if (blacklisted) {
      return res.status(401).json({
        message: 'Token has been revoked',
        error: 'Invalid token'
      });
    }

    // Fetch fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        error: 'Invalid token'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Require specific role(s)
 * Usage: requireRole(['ADMIN', 'MANAGER'])
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;

    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied',
        error: `Required role: ${allowedRoles.join(' or ')}`,
        userRole
      });
    }

    next();
  };
};

/**
 * Require specific permission
 * Usage: requirePermission('products:create')
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const userPermissions = authConfig.permissions[userRole] || [];

    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    // Check for exact permission
    if (userPermissions.includes(permission)) {
      return next();
    }

    // Check for wildcard permission (e.g., 'products:*' matches 'products:create')
    const [resource, action] = permission.split(':');
    const wildcardPermission = `${resource}:*`;

    if (userPermissions.includes(wildcardPermission)) {
      return next();
    }

    return res.status(403).json({
      message: 'Access denied',
      error: `Required permission: ${permission}`,
      userRole
    });
  };
};

/**
 * Require user to be in same branch or be admin/manager
 * Usage: requireSameBranch()
 */
export const requireSameBranch = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  const userRole = req.user.role;
  const userBranchId = req.user.branchId;

  // Admins and managers can access all branches
  if (['ADMIN', 'MANAGER'].includes(userRole)) {
    return next();
  }

  // Get branch ID from request (params, query, or body)
  const requestedBranchId = req.params.branchId || req.query.branchId || req.body.branchId;

  // If no branch specified in request, allow (will use user's branch)
  if (!requestedBranchId) {
    return next();
  }

  // Check if user's branch matches requested branch
  if (userBranchId !== requestedBranchId) {
    return res.status(403).json({
      message: 'Access denied',
      error: 'You can only access data from your assigned branch'
    });
  }

  next();
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work differently for authenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return next(); // Continue without user
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true
      }
    });

    if (user) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Ignore errors and continue without user
    next();
  }
};

/**
 * Require user to own the resource or be admin/manager
 * Usage: requireOwnership('userId')
 */
export const requireOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const currentUserId = req.user.id;

    // Admins and managers can access any resource
    if (['ADMIN', 'MANAGER'].includes(userRole)) {
      return next();
    }

    // Get resource owner ID from params or body
    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    if (currentUserId !== resourceUserId) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'You can only access your own resources'
      });
    }

    next();
  };
};