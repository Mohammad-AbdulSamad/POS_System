// src/services/branchService.js
import { get, post, put, del } from '../utils/apiClient';

/**
 * Get all branches
 * @param {Object} params Query parameters
 * @returns {Promise<Array>} Branches list
 */
export const getAllBranches = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/branches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branches';
    throw new Error(message);
  }
};

/**
 * Get branch by ID
 * @param {string} id Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Branch data
 */
export const getBranchById = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/branches/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch';
    throw new Error(message);
  }
};

/**
 * Create new branch
 * @param {Object} branchData Branch data
 * @returns {Promise<Object>} Created branch
 */
export const createBranch = async (branchData) => {
  try {
    const data = await post('/branches', branchData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to create branch';
    throw new Error(message);
  }
};

/**
 * Update branch
 * @param {string} id Branch ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated branch
 */
export const updateBranch = async (id, updateData) => {
  try {
    const data = await put(`/branches/${id}`, updateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update branch';
    throw new Error(message);
  }
};

/**
 * Delete branch
 * @param {string} id Branch ID
 * @returns {Promise<Object>} Response message
 */
export const deleteBranch = async (id) => {
  try {
    const data = await del(`/branches/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete branch';
    throw new Error(message);
  }
};

/**
 * Get branch products
 * @param {string} id Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Products data with pagination
 */
export const getBranchProducts = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.lowStock !== undefined) queryParams.append('lowStock', params.lowStock);
    if (params.search) queryParams.append('search', params.search);

    const url = `/branches/${id}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch products';
    throw new Error(message);
  }
};

/**
 * Get branch categories
 * @param {string} id Branch ID
 * @returns {Promise<Array>} Categories list
 */
export const getBranchCategories = async (id) => {
  try {
    const data = await get(`/branches/${id}/categories`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch categories';
    throw new Error(message);
  }
};

/**
 * Get branch users
 * @param {string} id Branch ID
 * @returns {Promise<Array>} Users list
 */
export const getBranchUsers = async (id) => {
  try {
    const data = await get(`/branches/${id}/users`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch users';
    throw new Error(message);
  }
};

/**
 * Get branch transactions
 * @param {string} id Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Transactions data with pagination
 */
export const getBranchTransactions = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);

    const url = `/branches/${id}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch transactions';
    throw new Error(message);
  }
};

/**
 * Get branch stock movements
 * @param {string} id Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Stock movements data with pagination
 */
export const getBranchStockMovements = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.reason) queryParams.append('reason', params.reason);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.productId) queryParams.append('productId', params.productId);

    const url = `/branches/${id}/stock-movements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch stock movements';
    throw new Error(message);
  }
};

/**
 * Get branch analytics
 * @param {string} id Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Branch analytics data
 */
export const getBranchAnalytics = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.period) queryParams.append('period', params.period);

    const url = `/branches/${id}/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch analytics';
    throw new Error(message);
  }
};

/**
 * Get branch inventory status
 * @param {string} id Branch ID
 * @returns {Promise<Object>} Inventory status data
 */
export const getInventoryStatus = async (id) => {
  try {
    const data = await get(`/branches/${id}/inventory-status`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch inventory status';
    throw new Error(message);
  }
};

// Export all functions as a service object
export const branchService = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchProducts,
  getBranchCategories,
  getBranchUsers,
  getBranchTransactions,
  getBranchStockMovements,
  getBranchAnalytics,
  getInventoryStatus
};

export default branchService;