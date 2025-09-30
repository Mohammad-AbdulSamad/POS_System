// utils/jwt.utils.js
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.config.js';

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    type: 'access'
  };

  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.accessTokenExpiry
  });
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, authConfig.jwtRefreshSecret, {
    expiresIn: authConfig.refreshTokenExpiry
  });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, authConfig.jwtRefreshSecret);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Generate both tokens at once
 */
export const generateTokenPair = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};