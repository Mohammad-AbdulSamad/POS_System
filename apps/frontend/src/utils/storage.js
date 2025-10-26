// src/utils/storage.js

/**
 * Authentication Storage Helper
 * Manages tokens and user data in localStorage
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
};

export const authStorage = {
  // ==========================================
  // Token Management
  // ==========================================
  
  /**
   * Save access token
   * @param {string} token - JWT access token
   */
  setAccessToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  /**
   * Get access token
   * @returns {string|null} Access token or null
   */
  getAccessToken: () => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Save refresh token
   * @param {string} token - JWT refresh token
   */
  setRefreshToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  /**
   * Get refresh token
   * @returns {string|null} Refresh token or null
   */
  getRefreshToken: () => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Save both tokens at once
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens: (accessToken, refreshToken) => {
    authStorage.setAccessToken(accessToken);
    authStorage.setRefreshToken(refreshToken);
  },

  /**
   * Check if user has valid access token
   * @returns {boolean} True if token exists
   */
  hasAccessToken: () => {
    return !!authStorage.getAccessToken();
  },

  // ==========================================
  // User Data Management
  // ==========================================

  /**
   * Save user data
   * @param {Object} userData - User information
   */
  setUserData: (userData) => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  /**
   * Get user data
   * @returns {Object|null} User data or null
   */
  getUserData: () => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Get specific user property
   * @param {string} key - Property key (e.g., 'email', 'name')
   * @returns {any} Property value or null
   */
  getUserProperty: (key) => {
    const userData = authStorage.getUserData();
    return userData ? userData[key] : null;
  },

  // ==========================================
  // Authentication State
  // ==========================================

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has tokens
   */
  isAuthenticated: () => {
    return authStorage.hasAccessToken() && !!authStorage.getRefreshToken();
  },

  /**
   * Save complete auth data (tokens + user)
   * @param {Object} authData - Complete auth response
   * @param {string} authData.accessToken - Access token
   * @param {string} authData.refreshToken - Refresh token
   * @param {Object} authData.user - User data
   */
  saveAuthData: (authData) => {
    if (authData.accessToken) {
      authStorage.setAccessToken(authData.accessToken);
    }
    if (authData.refreshToken) {
      authStorage.setRefreshToken(authData.refreshToken);
    }
    if (authData.user) {
      authStorage.setUserData(authData.user);
    }
  },

  // Alias for compatibility with apiClient
getCurrentUser: () => {
  return authStorage.getUserData();
},

// Alias for compatibility with apiClient  
clearAuthData: () => {
  authStorage.clearAuth();
},
  // ==========================================
  // Clear/Logout
  // ==========================================

  /**
   * Clear all authentication data (logout)
   */
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  /**
   * Clear everything from localStorage
   */
  clearAll: () => {
    localStorage.clear();
  },
};

// Export individual storage keys if needed
export const STORAGE = STORAGE_KEYS;

export default authStorage;