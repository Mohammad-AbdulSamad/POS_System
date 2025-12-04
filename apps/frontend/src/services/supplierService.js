// src/services/supplierService.js
import { get, post, put, del } from '../utils/apiClient';

/**
 * Get all suppliers with pagination and filters
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Suppliers data with pagination
 */
export const getAllSuppliers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.hasProducts !== undefined) queryParams.append('hasProducts', params.hasProducts);
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/suppliers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch suppliers';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get supplier by ID
 * @param {string} id Supplier ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Supplier data
 */
export const getSupplierById = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/suppliers/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch supplier';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Create new supplier
 * @param {Object} supplierData Supplier data
 * @returns {Promise<Object>} Created supplier
 */
export const createSupplier = async (supplierData) => {
  try {
    const data = await post('/suppliers', supplierData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create supplier';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Update supplier
 * @param {string} id Supplier ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated supplier
 */
export const updateSupplier = async (id, updateData) => {
  try {
    const data = await put(`/suppliers/${id}`, updateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update supplier';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Delete supplier
 * @param {string} id Supplier ID
 * @returns {Promise<Object>} Response message
 */
export const deleteSupplier = async (id) => {
  try {
    const data = await del(`/suppliers/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to delete supplier';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Search suppliers by name, phone, or address
 * @param {Object} params Search parameters
 * @returns {Promise<Array>} Matching suppliers
 */
export const searchSuppliers = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.limit) queryParams.append('limit', params.limit);

    const data = await get(`/suppliers/search?${queryParams.toString()}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to search suppliers';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get supplier products
 * @param {string} id Supplier ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Products data with pagination
 */
export const getSupplierProducts = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.lowStock !== undefined) queryParams.append('lowStock', params.lowStock);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/suppliers/${id}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch supplier products';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get supplier analytics
 * @param {string} id Supplier ID
 * @returns {Promise<Object>} Supplier analytics data
 */
export const getSupplierAnalytics = async (id) => {
  try {
    const data = await get(`/suppliers/${id}/analytics`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch supplier analytics';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get products needing reorder from supplier
 * @param {string} id Supplier ID
 * @param {Object} params Query parameters
 * @returns {Promise<Array>} Products needing reorder
 */
export const getSupplierReorderProducts = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/suppliers/${id}/reorder-products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch reorder products';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Assign products to supplier
 * @param {string} id Supplier ID
 * @param {Object} assignData Assignment data containing productIds array
 * @returns {Promise<Object>} Response message with assigned count
 */
export const assignProductsToSupplier = async (id, assignData) => {
  try {
    const data = await post(`/suppliers/${id}/assign-products`, assignData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to assign products';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

// Export all functions as a service object
export const supplierService = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
  getSupplierProducts,
  getSupplierAnalytics,
  getSupplierReorderProducts,
  assignProductsToSupplier
};

export default supplierService;