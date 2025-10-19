// src/utils/storage.js

/**
 * LocalStorage Wrapper
 * 
 * Safely handles localStorage operations with error handling and JSON serialization.
 * Prevents crashes if localStorage is unavailable (Safari private mode, etc.)
 */

const STORAGE_PREFIX = 'pos_';

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get prefixed key
 * @param {string} key
 * @returns {string}
 */
const getPrefixedKey = (key) => {
  return `${STORAGE_PREFIX}${key}`;
};

/**
 * Set item in localStorage
 * @param {string} key
 * @param {any} value
 * @returns {boolean} - Success status
 */
export const setItem = (key, value) => {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(getPrefixedKey(key), serialized);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Get item from localStorage
 * @param {string} key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any}
 */
export const getItem = (key, defaultValue = null) => {
  if (!isStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(getPrefixedKey(key));
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key
 * @returns {boolean} - Success status
 */
export const removeItem = (key) => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(getPrefixedKey(key));
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Clear all items with app prefix
 * @returns {boolean} - Success status
 */
export const clear = () => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Get all items with app prefix
 * @returns {object}
 */
export const getAllItems = () => {
  if (!isStorageAvailable()) {
    return {};
  }

  const items = {};
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const unprefixedKey = key.replace(STORAGE_PREFIX, '');
        items[unprefixedKey] = getItem(unprefixedKey);
      }
    });
  } catch (error) {
    console.error('Error getting all items:', error);
  }

  return items;
};

// Specific auth storage helpers
export const authStorage = {
  /**
   * Save auth token
   * @param {string} token
   */
  setToken: (token) => setItem('auth_token', token),

  /**
   * Get auth token
   * @returns {string|null}
   */
  getToken: () => getItem('auth_token'),

  /**
   * Remove auth token
   */
  removeToken: () => removeItem('auth_token'),

  /**
   * Save refresh token
   * @param {string} token
   */
  setRefreshToken: (token) => setItem('refresh_token', token),

  /**
   * Get refresh token
   * @returns {string|null}
   */
  getRefreshToken: () => getItem('refresh_token'),

  /**
   * Remove refresh token
   */
  removeRefreshToken: () => removeItem('refresh_token'),

  /**
   * Save user data
   * @param {object} user
   */
  setUser: (user) => setItem('user', user),

  /**
   * Get user data
   * @returns {object|null}
   */
  getUser: () => getItem('user'),

  /**
   * Remove user data
   */
  removeUser: () => removeItem('user'),

  /**
   * Clear all auth data
   */
  clearAuth: () => {
    removeItem('auth_token');
    removeItem('refresh_token');
    removeItem('user');
  },
};

// App preferences storage
export const preferencesStorage = {
  /**
   * Save theme preference
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme: (theme) => setItem('theme', theme),

  /**
   * Get theme preference
   * @returns {string}
   */
  getTheme: () => getItem('theme', 'light'),

  /**
   * Save language preference
   * @param {string} language
   */
  setLanguage: (language) => setItem('language', language),

  /**
   * Get language preference
   * @returns {string}
   */
  getLanguage: () => getItem('language', 'en'),

  /**
   * Save sidebar state
   * @param {boolean} collapsed
   */
  setSidebarCollapsed: (collapsed) => setItem('sidebar_collapsed', collapsed),

  /**
   * Get sidebar state
   * @returns {boolean}
   */
  getSidebarCollapsed: () => getItem('sidebar_collapsed', false),
};

export default {
  setItem,
  getItem,
  removeItem,
  clear,
  getAllItems,
  authStorage,
  preferencesStorage,
};