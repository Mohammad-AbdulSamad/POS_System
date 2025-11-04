// controllers/auth.controller.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  generateTokenPair,
  verifyRefreshToken,
  extractTokenFromHeader
} from '../utils/jwt.utils.js';
import { authConfig } from '../config/auth.config.js';

const prisma = new PrismaClient();

/**
 * Login - Authenticate user and return tokens
 */
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials from user'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid credentials from password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() +  7 * 24 * 60 * 60 * 1000) // 30 days if rememberMe, else 7 days
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      expiresIn: authConfig.accessTokenExpiry
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Logout - Revoke refresh token and blacklist access token
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.token; // From authenticate middleware

    // Blacklist access token
    if (accessToken) {
      await prisma.tokenBlacklist.create({
        data: {
          token: accessToken,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        }
      });
    }

    // Delete refresh token from database
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: req.user.id
        }
      });
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * Logout from all devices - Revoke all refresh tokens
 */
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    // Blacklist current access token
    if (req.token) {
      await prisma.tokenBlacklist.create({
        data: {
          token: req.token,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        }
      });
    }

    res.json({
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      message: 'Logout all failed',
      error: error.message
    });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId
      }
    });

    if (!storedToken) {
      return res.status(401).json({
        message: 'Refresh token not found or has been revoked'
      });
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });

      return res.status(401).json({
        message: 'Refresh token has expired'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
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
        message: 'User not found'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: authConfig.accessTokenExpiry
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      message: 'Token refresh failed',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 */
export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

/**
 * Verify token validity
 */
export const verifyToken = async (req, res) => {
  try {
    // If middleware passes, token is valid
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        branchId: req.user.branchId
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      message: 'Token verification failed',
      error: error.message
    });
  }
};

/**
 * Change current user's password
 */
export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters with uppercase, lowercase, and number'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    res.json({
      message: 'Password changed successfully. Please login again on all devices.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Password change failed',
      error: error.message
    });
  }
};

/**
 * Get active sessions for current user
 */
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.refreshToken.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isExpired: new Date() > s.expiresAt
      })),
      count: sessions.length
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      message: 'Error fetching sessions',
      error: error.message
    });
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await prisma.refreshToken.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({
        message: 'Session not found'
      });
    }

    await prisma.refreshToken.delete({
      where: { id: sessionId }
    });

    res.json({
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      message: 'Error revoking session',
      error: error.message
    });
  }
};