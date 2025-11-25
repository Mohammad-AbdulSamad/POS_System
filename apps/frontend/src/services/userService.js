// src/services/userService.js
import { get, post, put, del } from '../utils/apiClient';

/**
 * Get all users with pagination and filters
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Users data with pagination
 */
export const getAllUsers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.role) queryParams.append('role', params.role);
    if (params.search) queryParams.append('search', params.search);
    if (params.active !== undefined) queryParams.append('active', params.active);

    const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch users';
    throw new Error(message);
  }
};

/**
 * Get user by ID
 * @param {string} id User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (id) => {
  try {
    const data = await get(`/users/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch user';
    throw new Error(message);
  }
};

/**
 * Create new user
 * @param {Object} userData User data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    const data = await post('/users', userData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to create user';
    throw new Error(message);
  }
};

/**
 * Update user
 * @param {string} id User ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (id, updateData) => {
  try {
    const data = await put(`/users/${id}`, updateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update user';
    throw new Error(message);
  }
};

/**
 * Delete user
 * @param {string} id User ID
 * @returns {Promise<Object>} Response message
 */
export const deleteUser = async (id) => {
  try {
    const data = await del(`/users/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete user';
    throw new Error(message);
  }
};

/**
 * Get users by branch
 * @param {string} branchId Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Users data
 */
export const getUsersByBranch = async (branchId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.role) queryParams.append('role', params.role);

    const url = `/users/branch/${branchId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch users';
    throw new Error(message);
  }
};

/**
 * Get users by role
 * @param {string} role User role (ADMIN, MANAGER, CASHIER, STOCK_MANAGER)
 * @returns {Promise<Object>} Users data
 */
export const getUsersByRole = async (role) => {
  try {
    const data = await get(`/users/role/${role}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch users by role';
    throw new Error(message);
  }
};

/**
 * Get user statistics
 * @param {string} userId User ID
 * @returns {Promise<Object>} User statistics data
 */
export const getUserStats = async (userId) => {
  try {
    const data = await get(`/users/${userId}/stats`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch user statistics';
    throw new Error(message);
  }
};

/**
 * Change user password
 * @param {string} id User ID
 * @param {Object} passwordData Password change data (currentPassword, newPassword)
 * @returns {Promise<Object>} Response message
 */
export const changePassword = async (id, passwordData) => {
  try {
    const data = await post(`/users/${id}/change-password`, passwordData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to change password';
    throw new Error(message);
  }
};

/**
 * Reset user password (admin only)
 * @param {string} id User ID
 * @param {Object} resetData Password reset data (newPassword)
 * @returns {Promise<Object>} Response message
 */
export const resetPassword = async (id, resetData) => {
  try {
    const data = await post(`/users/${id}/reset-password`, resetData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to reset password';
    throw new Error(message);
  }
};

/**
 * Get users summary and analytics
 * @returns {Promise<Object>} Users summary data
 */
export const getUsersSummary = async () => {
  try {
    const data = await get('/users/analytics/summary');
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch users summary';
    throw new Error(message);
  }
};

/**
 * Validate email availability
 * @param {Object} emailData Email data ({ email })
 * @returns {Promise<Object>} Validation result
 */
export const validateEmail = async (emailData) => {
  try {
    const data = await post('/users/validate/email', emailData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to validate email';
    throw new Error(message);
  }
};

// Export all functions as a service object
export const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByBranch,
  getUsersByRole,
  getUserStats,
  changePassword,
  resetPassword,
  getUsersSummary,
  validateEmail
};

export default userService;