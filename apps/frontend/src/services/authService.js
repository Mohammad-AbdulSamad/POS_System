// // src/services/authService.js
// import axios from 'axios';
// import { authStorage } from '../utils/storge';
// import { post, get, put } from '../utils/apiClient';

// /**
//  * Authentication Service
//  * 
//  * Handles all authentication-related API calls using Axios.
//  */

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// /**
//  * Login user
//  * @param {string} email
//  * @param {string} password
//  * @param {boolean} rememberMe
//  * @returns {Promise<object>}
//  */
// export const login = async (email, password, rememberMe = false) => {
//   try {
//     // Direct axios call (not using apiClient to avoid interceptor issues)
//     const response = await axios.post(`${API_BASE_URL}/auth/login`, {
//       email: email.toLowerCase().trim(),
//       password,
//       rememberMe,
//     });

//     const data = response.data;

//     // Save tokens and user to localStorage
//     authStorage.setToken(data.accessToken);
    
//     if (rememberMe && data.refreshToken) {
//       authStorage.setRefreshToken(data.refreshToken);
//     }
    
//     authStorage.setUser(data.user);

//     return {
//       user: data.user,
//       token: data.accessToken,
//       refreshToken: data.refreshToken,
//       expiresIn: data.expiresIn,
//     };
//   } catch (error) {
//     const message = error.response?.data?.message || error.message || 'Login failed';
//     throw new Error(message);
//   }
// };

// /**
//  * Register new user
//  * @param {object} userData - { name, email, password, branchId }
//  * @returns {Promise<object>}
//  */
// export const register = async (userData) => {
//   try {
//     // Direct axios call (no auth token needed yet)
//     const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
//     const data = response.data;

//     // Save tokens and user to localStorage
//     authStorage.setToken(data.accessToken);
    
//     if (data.refreshToken) {
//       authStorage.setRefreshToken(data.refreshToken);
//     }
    
//     authStorage.setUser(data.user);

//     return {
//       user: data.user,
//       token: data.accessToken,
//       refreshToken: data.refreshToken,
//     };
//   } catch (error) {
//     const message = error.response?.data?.message || error.message || 'Registration failed';
//     throw new Error(message);
//   }
// };

// /**
//  * Logout user
//  * @returns {Promise<void>}
//  */
// export const logout = async () => {
//   try {
//     // Use apiClient (it will add token automatically)
//     await post('/auth/logout');
//   } catch (error) {
//     console.error('Logout API error:', error);
//     // Continue with local logout even if API fails
//   } finally {
//     // Always clear local auth data
//     authStorage.clearAuth();
//   }
// };

// /**
//  * Get current user from storage
//  * @returns {object|null}
//  */
// export const getCurrentUser = () => {
//   return authStorage.getUser();
// };

// /**
//  * Check if user is authenticated
//  * @returns {boolean}
//  */
// export const isAuthenticated = () => {
//   const token = authStorage.getToken();
//   return !!token;
// };

// /**
//  * Refresh auth token
//  * @returns {Promise<object>}
//  */
// export const refreshToken = async () => {
//   try {
//     const oldRefreshToken = authStorage.getRefreshToken();

//     if (!oldRefreshToken) {
//       throw new Error('No refresh token available');
//     }

//     // Direct axios call (avoid apiClient to prevent circular refresh)
//     const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
//       refreshToken: oldRefreshToken,
//     });

//     const data = response.data;

//     // Update tokens
//     authStorage.setToken(data.accessToken);
    
//     if (data.refreshToken) {
//       authStorage.setRefreshToken(data.refreshToken);
//     }

//     return {
//       token: data.accessToken,
//       refreshToken: data.refreshToken,
//     };
//   } catch (error) {
//     // If refresh fails, clear auth and force re-login
//     authStorage.clearAuth();
//     const message = error.response?.data?.message || 'Session expired';
//     throw new Error(message);
//   }
// };

// /**
//  * Request password reset
//  * @param {string} email
//  * @returns {Promise<object>}
//  */
// export const changePassword = async (email) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
//       email,
//     });
//     return response.data;
//   } catch (error) {
//     const message = error.response?.data?.message || 'Failed to send reset email';
//     throw new Error(message);
//   }
// };

// /**
//  * Reset password with token
//  * @param {string} token
//  * @param {string} newPassword
//  * @returns {Promise<object>}
//  */
// export const resetPassword = async (token, newPassword) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
//       token,
//       newPassword,
//     });
//     return response.data;
//   } catch (error) {
//     const message = error.response?.data?.message || 'Password reset failed';
//     throw new Error(message);
//   }
// };

// /**
//  * Verify email with token
//  * @param {string} token
//  * @returns {Promise<object>}
//  */
// export const verifyEmail = async (token) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
//       token,
//     });
//     return response.data;
//   } catch (error) {
//     const message = error.response?.data?.message || 'Email verification failed';
//     throw new Error(message);
//   }
// };

// /**
//  * Get user profile (requires authentication)
//  * @returns {Promise<object>}
//  */
// export const getProfile = async () => {
//   try {
//     // Use apiClient - it will add token automatically
//     const data = await get('/auth/profile');

//     // Update user in storage
//     authStorage.setUser(data.user);

//     return data.user;
//   } catch (error) {
//     const message = error.response?.data?.message || 'Failed to fetch profile';
//     throw new Error(message);
//   }
// };

// /**
//  * Update user profile (requires authentication)
//  * @param {object} updates
//  * @returns {Promise<object>}
//  */
// export const updateProfile = async (updates) => {
//   try {
//     // Use apiClient - it will add token automatically
//     const data = await put('/auth/profile', updates);

//     // Update user in storage
//     authStorage.setUser(data.user);

//     return data.user;
//   } catch (error) {
//     const message = error.response?.data?.message || 'Failed to update profile';
//     throw new Error(message);
//   }
// };

// export default {
//   login,
//   register,
//   logout,
//   getCurrentUser,
//   isAuthenticated,
//   refreshToken,
//   changePassword,
//   resetPassword,
//   verifyEmail,
//   getProfile,
//   updateProfile,
// };
// src/services/authService.js
import { post } from '../utils/apiClient';
import { authStorage } from '../utils/storage';

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} User data and tokens
 */
export const login = async (credentials) => {
  try {
    const response = await post('/auth/login', credentials);
    
    // ✅ CRITICAL: Save tokens immediately after login
    if (response.accessToken && response.refreshToken) {
      console.log('Saving auth data after login');
      console.log('Access Token:', response.accessToken);
      console.log('Refresh Token:', response.refreshToken);
      authStorage.saveAuthData(response);
    }
    
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    throw new Error(message);
  }
};

/**
 * Register new user
 * @param {Object} userData - Registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.name - User name
 * @returns {Promise<Object>} User data and tokens
 */
export const register = async (userData) => {
  try {
    const response = await post('/auth/register', userData);
    
    // ✅ Save tokens if registration auto-logs in
    if (response.accessToken && response.refreshToken) {
      authStorage.saveAuthData(response);
    }
    
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed';
    throw new Error(message);
  }
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    const refreshToken = authStorage.getRefreshToken();
    
    if (refreshToken) {
      // Call backend logout endpoint
      await post('/auth/logout', { refreshToken });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    authStorage.clearAuth();
  }
};

/**
 * Refresh access token
 * @returns {Promise<Object>} New tokens
 */
export const refreshToken = async () => {
  try {
    const refreshToken = authStorage.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await post('/auth/refresh', { refreshToken });
    
    // ✅ Save new tokens
    if (response.accessToken) {
      authStorage.setAccessToken(response.accessToken);
    }
    if (response.refreshToken) {
      authStorage.setRefreshToken(response.refreshToken);
    }
    
    return response;
  } catch (error) {
    // If refresh fails, clear auth and redirect to login
    authStorage.clearAuth();
    throw error;
  }
};

/**
 * Get current user data
 * @returns {Object|null} User data or null
 */
export const getCurrentUser = () => {
  return authStorage.getUserData();
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return authStorage.isAuthenticated();
};

/**
 * Verify current token is valid
 * @returns {Promise<Object>} User data if valid
 */
export const verifyToken = async () => {
  try {
    const response = await post('/auth/verify');
    return response;
  } catch (error) {
    authStorage.clearAuth();
    throw error;
  }
};

// Export all functions
export const authService = {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  isAuthenticated,
  verifyToken,
};

export default authService;