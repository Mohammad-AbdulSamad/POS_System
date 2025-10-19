// src/utils/apiClient.js
import axios from 'axios';
import { authStorage } from '../utils/storge';

/**
 * API Client using Axios
 * 
 * Configured with:
 * - Automatic token attachment
 * - Token refresh on 401 errors
 * - Request/Response interceptors
 * - Centralized error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Request Interceptor
 * Automatically adds auth token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh on 401 errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return just the data for successful responses
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or we don't have a refresh token, reject
    if (error.response?.status !== 401 || !authStorage.getRefreshToken()) {
      return Promise.reject(error);
    }

    // If we've already tried to refresh for this request, reject
    if (originalRequest._retry) {
      authStorage.clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // If we're currently refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Mark that we're refreshing
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt to refresh the token
      const refreshToken = authStorage.getRefreshToken();
      
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Save new tokens
      authStorage.setToken(accessToken);
      if (newRefreshToken) {
        authStorage.setRefreshToken(newRefreshToken);
      }

      // Update authorization header
      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Process queued requests
      processQueue(null, accessToken);

      // Retry original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear auth and redirect to login
      processQueue(refreshError, null);
      authStorage.clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * GET request
 * @param {string} url - Endpoint URL
 * @param {object} config - Axios config
 * @returns {Promise<any>}
 */
export const get = (url, config = {}) => {
  return apiClient.get(url, config);
};

/**
 * POST request
 * @param {string} url - Endpoint URL
 * @param {object} data - Request body
 * @param {object} config - Axios config
 * @returns {Promise<any>}
 */
export const post = (url, data = {}, config = {}) => {
  return apiClient.post(url, data, config);
};

/**
 * PUT request
 * @param {string} url - Endpoint URL
 * @param {object} data - Request body
 * @param {object} config - Axios config
 * @returns {Promise<any>}
 */
export const put = (url, data = {}, config = {}) => {
  return apiClient.put(url, data, config);
};

/**
 * PATCH request
 * @param {string} url - Endpoint URL
 * @param {object} data - Request body
 * @param {object} config - Axios config
 * @returns {Promise<any>}
 */
export const patch = (url, data = {}, config = {}) => {
  return apiClient.patch(url, data, config);
};

/**
 * DELETE request
 * @param {string} url - Endpoint URL
 * @param {object} config - Axios config
 * @returns {Promise<any>}
 */
export const del = (url, config = {}) => {
  return apiClient.delete(url, config);
};

/**
 * Upload file with progress
 * @param {string} url - Endpoint URL
 * @param {FormData} formData - Form data with file
 * @param {function} onProgress - Progress callback
 * @returns {Promise<any>}
 */
export const upload = (url, formData, onProgress) => {
  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

export default apiClient;

/**
 * Example Usage:
 * 
 * import { get, post, put, del } from '@/utils/apiClient';
 * 
 * // GET request
 * const products = await get('/products');
 * 
 * // GET with query params
 * const filtered = await get('/products', {
 *   params: { category: 'electronics', page: 1 }
 * });
 * 
 * // POST request
 * const newProduct = await post('/products', {
 *   name: 'Product A',
 *   price: 99.99
 * });
 * 
 * // PUT request
 * const updated = await put('/products/1', {
 *   name: 'Updated Product'
 * });
 * 
 * // DELETE request
 * await del('/products/1');
 * 
 * // File upload with progress
 * const formData = new FormData();
 * formData.append('file', file);
 * 
 * await upload('/upload', formData, (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 * 
 * // Error handling
 * try {
 *   const data = await get('/products');
 *   console.log(data);
 * } catch (error) {
 *   if (error.response) {
 *     // Server responded with error
 *     console.error('Error:', error.response.data.message);
 *     console.error('Status:', error.response.status);
 *   } else if (error.request) {
 *     // Request made but no response
 *     console.error('No response from server');
 *   } else {
 *     // Error setting up request
 *     console.error('Error:', error.message);
 *   }
 * }
 */