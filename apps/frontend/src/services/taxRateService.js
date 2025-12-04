// src/services/taxRateService.js
import { get, post, put, del } from '../utils/apiClient';

/**
 * Get all tax rates with pagination and filters
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Tax rates data with pagination
 */
export const getAllTaxRates = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.minRate) queryParams.append('minRate', params.minRate);
    if (params.maxRate) queryParams.append('maxRate', params.maxRate);
    if (params.hasProducts !== undefined) queryParams.append('hasProducts', params.hasProducts);
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/tax-rates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch tax rates';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get tax rate by ID
 * @param {string} id Tax rate ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Tax rate data
 */
export const getTaxRateById = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.include_relations !== undefined) queryParams.append('include_relations', params.include_relations);

    const url = `/tax-rates/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch tax rate';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Create new tax rate
 * @param {Object} taxRateData Tax rate data
 * @returns {Promise<Object>} Created tax rate
 */
export const createTaxRate = async (taxRateData) => {
  try {
    const data = await post('/tax-rates', taxRateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to create tax rate';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Update tax rate
 * @param {string} id Tax rate ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated tax rate
 */
export const updateTaxRate = async (id, updateData) => {
  try {
    const data = await put(`/tax-rates/${id}`, updateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to update tax rate';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Delete tax rate
 * @param {string} id Tax rate ID
 * @returns {Promise<Object>} Response message
 */
export const deleteTaxRate = async (id) => {
  try {
    const data = await del(`/tax-rates/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to delete tax rate';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get tax rate products
 * @param {string} id Tax rate ID
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Products data with pagination
 */
export const getTaxRateProducts = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/tax-rates/${id}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch tax rate products';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Calculate tax amount
 * @param {Object} calculationData Calculation data ({ amount, taxRateId })
 * @returns {Promise<Object>} Tax calculation result
 */
export const calculateTax = async (calculationData) => {
  try {
    const data = await post('/tax-rates/calculate', calculationData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to calculate tax';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Assign products to tax rate
 * @param {string} id Tax rate ID
 * @param {Object} assignData Assignment data containing productIds array
 * @returns {Promise<Object>} Response message with assigned count
 */
export const assignProductsToTaxRate = async (id, assignData) => {
  try {
    const data = await post(`/tax-rates/${id}/assign-products`, assignData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to assign products';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

/**
 * Get tax rate analytics
 * @param {string} id Tax rate ID
 * @returns {Promise<Object>} Tax rate analytics data
 */
export const getTaxRateAnalytics = async (id) => {
  try {
    const data = await get(`/tax-rates/${id}/analytics`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch tax rate analytics';
    const backendError = new Error(message);
    backendError.response = error.response; // Preserve response for hook
    throw backendError;
  }
};

// Export all functions as a service object
export const taxRateService = {
  getAllTaxRates,
  getTaxRateById,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getTaxRateProducts,
  calculateTax,
  assignProductsToTaxRate,
  getTaxRateAnalytics
};

export default taxRateService;