// src/services/dashboardService.js
import { get, post, put, del } from '../utils/apiClient';

/**
 * Get all products with pagination and filters
 * @param {Object} params Query parameters
 * @returns {Promise<Object>} Products data with pagination
 */
export const getAllProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch products';
    throw new Error(message);
  }
};

/**
 * Get product by ID
 * @param {string} id Product ID
 * @returns {Promise<Object>} Product data
 */
export const getProductById = async (id) => {
  try {
    const data = await get(`/products/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch product';
    throw new Error(message);
  }
};

/**
 * Create new product
 * @param {Object} productData Product data
 * @returns {Promise<Object>} Created product
 */
export const createProduct = async (productData) => {
  try {
    const data = await post('/products', productData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to create product';
    throw new Error(message);
  }
};

/**
 * Update product
 * @param {string} id Product ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated product
 */
export const updateProduct = async (id, updateData) => {
  try {
    const data = await put(`/products/${id}`, updateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update product';
    throw new Error(message);
  }
};

/**
 * Delete product (soft delete)
 * @param {string} id Product ID
 * @returns {Promise<Object>} Response message
 */
export const deleteProduct = async (id) => {
  try {
    const data = await del(`/products/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete product';
    throw new Error(message);
  }
};

/**
 * Get products by branch
 * @param {string} branchId Branch ID
 * @param {Object} params Query parameters
 * @returns {Promise<Array>} Products list
 */
export const getProductsByBranch = async (branchId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.active !== undefined) queryParams.append('active', params.active);
    
    const url = `/products/branch/${branchId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch branch products';
    throw new Error(message);
  }
};

/**
 * Get products by category
 * @param {string} categoryId Category ID
 * @returns {Promise<Array>} Products list
 */
export const getProductsByCategory = async (categoryId) => {
  try {
    const data = await get(`/products/category/${categoryId}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch category products';
    throw new Error(message);
  }
};

/**
 * Search product by barcode
 * @param {string} barcode Product barcode/SKU
 * @param {string} branchId Optional branch ID
 * @returns {Promise<Object>} Product data
 */
export const getProductByBarcode = async (barcode, branchId = null) => {
  try {
    const url = `/products/barcode/${barcode}${branchId ? `?branchId=${branchId}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch product by barcode';
    throw new Error(message);
  }
};

/**
 * Search products by name (autocomplete)
 * @param {Object} params Search parameters
 * @returns {Promise<Array>} Matching products
 */
export const searchProductsByName = async (params) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.limit) queryParams.append('limit', params.limit);

    const data = await get(`/products/search?${queryParams.toString()}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to search products';
    throw new Error(message);
  }
};

/**
 * Get low stock products
 * @param {string} branchId Branch ID
 * @param {number} threshold Stock threshold
 * @returns {Promise<Array>} Low stock products
 */
export const getLowStockProducts = async (branchId, threshold = 10) => {
  try {
    const data = await get(`/products/branch/${branchId}/low-stock?threshold=${threshold}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch low stock products';
    throw new Error(message);
  }
};

/** * Get out of stock products
 * @param {string} branchId Branch ID
 * @returns {Promise<Array>} Out of stock products
 */
export const getOutOfStockProducts = async (branchId) => {
  try {
    const data = await get(`/products/branch/${branchId}/out-of-stock`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch out of stock products';
    throw new Error(message);
  }
};

/**
 * Update product stock
 * @param {string} id Product ID
 * @param {Object} data Stock update data
 * @returns {Promise<Object>} Updated product
 */
export const updateStock = async (id, data) => {
  try {
    const response = await put(`/products/${id}/stock`, data);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update stock';
    throw new Error(message);
  }
};

/**
 * Get stock movement history
 * @param {string} id Product ID
 * @param {number} limit Number of records to return
 * @returns {Promise<Array>} Stock movements
 */
export const getStockHistory = async (id, limit = 50) => {
  try {
    const data = await get(`/products/${id}/stock-history?limit=${limit}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch stock history';
    throw new Error(message);
  }
};

/**
 * Update product price
 * @param {string} id Product ID
 * @param {Object} priceData Price update data
 * @returns {Promise<Object>} Updated product
 */
export const updatePrice = async (id, priceData) => {
  try {
    const data = await put(`/products/${id}/price`, priceData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update price';
    throw new Error(message);
  }
};

/**
 * Toggle product active status
 * @param {string} id Product ID
 * @returns {Promise<Object>} Updated product
 */
export const toggleProductActive = async (id) => {
  try {
    const data = await put(`/products/${id}/toggle-active`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to toggle product status';
    throw new Error(message);
  }
};

/**
 * get Inactive products
 * @param {string} branchId Branch ID
 * @returns {Promise<Array>} Inactive products
 */
export const getInactiveProducts = async (branchId) => {
  try {
    const data = await get(`/products/branch/${branchId}/inactive`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch inactive products';
    throw new Error(message);
  }
};

/**
 * Bulk update products
 * @param {Object} updateData Bulk update data
 * @returns {Promise<Object>} Update result
 */
export const bulkUpdateProducts = async (updateData) => {
  try {
    const data = await post('/products/bulk-update', updateData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to bulk update products';
    throw new Error(message);
  }
};

// Export all functions as a service object
export const productService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByBranch,
  getProductsByCategory,
  getProductByBarcode,
  searchProductsByName,
  getLowStockProducts,
  updateStock,
  getStockHistory,
  updatePrice,
  toggleProductActive,
  bulkUpdateProducts
};

export default productService;

