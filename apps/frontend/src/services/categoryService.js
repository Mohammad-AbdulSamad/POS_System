// src/services/categoryService.js
import { get, post, put, del } from '../utils/apiClient';

/**
 * Get all categories with pagination and filters
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Categories data with pagination
 */
export const getAllCategories = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.search) queryParams.append('search', params.search);
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch categories';
     const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get category by ID
 * @param {string} id Category ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Category data
 */
export const getCategoryById = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/categories/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch category';
     const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Create new category
 * @param {Object} categoryData Category data
 * @returns {Promise<Object>} Created category
 */
export const createCategory = async (categoryData) => {
  try {
    const data = await post('/categories', categoryData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create category';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Update category
 * @param {string} id Category ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated category
 */
export const updateCategory = async (id, updateData) => {
  try {
    const data = await put(`/categories/${id}`, updateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update category';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Delete category
 * @param {string} id Category ID
 * @returns {Promise<Object>} Response message
 */
export const deleteCategory = async (id) => {
  try {
    const data = await del(`/categories/${id}`);
    return data;
  } catch (error) {
    // ✅ FIXED: Properly extract backend error message
    const message = error.response?.data?.message || error.message || 'Failed to delete category';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get categories by branch
 * @param {string} branchId Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Array>} Categories list
 */
export const getCategoriesByBranch = async (branchId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.include_products !== undefined) queryParams.append('include_products', params.include_products);
    if (params.active_only !== undefined) queryParams.append('active_only', params.active_only);

    const url = `/categories/branch/${branchId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ||error.message || 'Failed to fetch branch categories';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get category products
 * @param {string} id Category ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Products data with pagination
 */
export const getCategoryProducts = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.lowStock !== undefined) queryParams.append('lowStock', params.lowStock);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/categories/${id}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message ||error.message || 'Failed to fetch category products';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get category analytics
 * @param {string} id Category ID
 * @returns {Promise<Object>} Category analytics data
 */
export const getCategoryAnalytics = async (id) => {
  try {
    const data = await get(`/categories/${id}/analytics`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message ||'Failed to fetch category analytics';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Move products to different category
 * @param {string} id Source category ID
 * @param {Object} moveData Move data containing productIds and targetCategoryId
 * @returns {Promise<Object>} Response message with moved count
 */
export const moveProductsToCategory = async (id, moveData) => {
  try {
    const data = await post(`/categories/${id}/move-products`, moveData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to move products';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Duplicate category
 * @param {string} id Category ID to duplicate
 * @param {Object} duplicateData Duplicate data containing newName and includeProducts
 * @returns {Promise<Object>} Duplicated category data
 */
export const duplicateCategory = async (id, duplicateData) => {
  try {
    const data = await post(`/categories/${id}/duplicate`, duplicateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to duplicate category';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

// Export all functions as a service object
export const categoryService = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByBranch,
  getCategoryProducts,
  getCategoryAnalytics,
  moveProductsToCategory,
  duplicateCategory
};

export default categoryService;