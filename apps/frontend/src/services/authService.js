// src/services/authService.js
import { authStorage } from '../utils/storge';

/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls.
 * Uses mock data for now - replace with real API calls later.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock user data
const MOCK_USERS = [
  {
    id: 1,
    name: 'John Doe',
    email: 'admin@pos.com',
    password: 'Admin123',
    role: 'admin',
    avatar: 'JD',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'manager@pos.com',
    password: 'Manager123',
    role: 'manager',
    avatar: 'JS',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'cashier@pos.com',
    password: 'Cashier123',
    role: 'cashier',
    avatar: 'MJ',
  },
];

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @param {boolean} rememberMe
 * @returns {Promise<object>}
 */
export const login = async (email, password, rememberMe = false) => {
  await delay(1000); // Simulate network delay

  // Mock authentication
  const user = MOCK_USERS.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Generate mock token
  const token = `mock_token_${user.id}_${Date.now()}`;
  const refreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;

  // Remove password from user object
  const { password: _, ...userWithoutPassword } = user;

  // Save to localStorage
  authStorage.setToken(token);
  if (rememberMe) {
    authStorage.setRefreshToken(refreshToken);
  }
  authStorage.setUser(userWithoutPassword);

  return {
    user: userWithoutPassword,
    token,
    refreshToken: rememberMe ? refreshToken : null,
  };

  /* Real API call would look like this:
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    authStorage.setToken(data.token);
    if (rememberMe && data.refreshToken) {
      authStorage.setRefreshToken(data.refreshToken);
    }
    authStorage.setUser(data.user);

    return data;
  } catch (error) {
    throw error;
  }
  */
};

/**
 * Register new user
 * @param {object} userData
 * @returns {Promise<object>}
 */
export const register = async (userData) => {
  await delay(1000);

  // Check if email already exists
  const existingUser = MOCK_USERS.find((u) => u.email === userData.email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Create new user
  const newUser = {
    id: MOCK_USERS.length + 1,
    name: userData.name,
    email: userData.email,
    role: 'cashier', // Default role
    avatar: userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
  };

  // Generate mock token
  const token = `mock_token_${newUser.id}_${Date.now()}`;

  // Save to localStorage
  authStorage.setToken(token);
  authStorage.setUser(newUser);

  return {
    user: newUser,
    token,
  };

  /* Real API call:
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);

    return data;
  } catch (error) {
    throw error;
  }
  */
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  await delay(500);

  // Clear auth data from storage
  authStorage.clearAuth();

  /* Real API call:
  try {
    const token = authStorage.getToken();
    
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    authStorage.clearAuth();
  } catch (error) {
    // Still clear local auth data even if API call fails
    authStorage.clearAuth();
    throw error;
  }
  */
};

/**
 * Get current user from storage
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  return authStorage.getUser();
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = authStorage.getToken();
  return !!token;
};

/**
 * Refresh auth token
 * @returns {Promise<object>}
 */
export const refreshToken = async () => {
  await delay(500);

  const oldRefreshToken = authStorage.getRefreshToken();

  if (!oldRefreshToken) {
    throw new Error('No refresh token available');
  }

  // Generate new mock tokens
  const user = authStorage.getUser();
  const newToken = `mock_token_${user.id}_${Date.now()}`;
  const newRefreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;

  authStorage.setToken(newToken);
  authStorage.setRefreshToken(newRefreshToken);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };

  /* Real API call:
  try {
    const refreshToken = authStorage.getRefreshToken();
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    authStorage.setToken(data.token);
    if (data.refreshToken) {
      authStorage.setRefreshToken(data.refreshToken);
    }

    return data;
  } catch (error) {
    authStorage.clearAuth();
    throw error;
  }
  */
};

/**
 * Request password reset
 * @param {string} email
 * @returns {Promise<void>}
 */
export const forgotPassword = async (email) => {
  await delay(1000);

  const user = MOCK_USERS.find((u) => u.email === email);

  if (!user) {
    // Don't reveal if email exists for security
    return { message: 'If the email exists, a reset link will be sent' };
  }

  return { message: 'Password reset email sent' };

  /* Real API call:
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Password reset failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
  */
};

/**
 * Reset password with token
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const resetPassword = async (token, newPassword) => {
  await delay(1000);

  // Mock: just return success
  return { message: 'Password reset successful' };

  /* Real API call:
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
  */
};

/**
 * Verify email with token
 * @param {string} token
 * @returns {Promise<void>}
 */
export const verifyEmail = async (token) => {
  await delay(1000);

  return { message: 'Email verified successfully' };

  /* Real API call:
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Email verification failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
  */
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
};