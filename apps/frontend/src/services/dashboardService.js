// src/services/dashboardService.js
import { get } from '../utils/apiClient';

/**
 * Get dashboard overview statistics
 * @returns {Promise<Object>} Dashboard stats with sales, orders, products, and low stock
 */
export const getDashboardStats = async () => {
  try {
    const data = await get('/dashboard/stats');
    return data;
  } catch (error) {
    // Re-throw authentication errors to trigger login redirect
    if (error.response?.status === 401) {
      throw error;
    }
    const message = error.response?.data?.message || 'Failed to fetch dashboard stats';
    throw new Error(message);
  }
};

/**
 * Get sales chart data for different time periods
 * @param {string} period - 'today', 'week', 'month', or 'year'
 * @returns {Promise<Array>} Sales data grouped by time period
 */
export const getSalesChartData = async (period = 'week') => {
  try {
    const data = await get(`/dashboard/sales?period=${period}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch sales data';
    throw new Error(message);
  }
};

/**
 * Get top selling products
 * @param {Object} params - Query parameters
 * @param {string} params.sortBy - 'sales' or 'revenue'
 * @param {number} params.limit - Number of products to return
 * @param {string} params.startDate - Start date for filtering (optional)
 * @param {string} params.endDate - End date for filtering (optional)
 * @returns {Promise<Array>} Top products data
 */
export const getTopProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/dashboard/top-products?${queryString}` : '/dashboard/top-products';
    
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch top products';
    throw new Error(message);
  }
};

/**
 * Get recent transactions
 * @param {number} limit - Number of transactions to return (default: 10)
 * @returns {Promise<Array>} Recent transactions data
 */
export const getRecentTransactions = async (limit = 10) => {
  try {
    const data = await get(`/dashboard/transactions?limit=${limit}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch recent transactions';
    throw new Error(message);
  }
};

/**
 * Get low stock items
 * @param {Object} params - Query parameters
 * @param {number} params.threshold - Stock threshold (default: 10)
 * @param {number} params.limit - Number of items to return (default: 20)
 * @returns {Promise<Array>} Low stock items
 */
export const getLowStockItems = async (params = {}) => {
  try {
    const { threshold = 10, limit = 20 } = params;
    const data = await get(`/dashboard/low-stock?threshold=${threshold}&limit=${limit}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch low stock items';
    throw new Error(message);
  }
};

/**
 * Get sales summary for a specific period
 * @param {string} period - 'today', 'week', 'month', or 'year'
 * @returns {Promise<Object>} Sales summary with totals and averages
 */
export const getSalesSummary = async (period = 'today') => {
  try {
    const data = await get(`/dashboard/summary?period=${period}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch sales summary';
    throw new Error(message);
  }
};

/**
 * Get all dashboard data in one call (for initial page load)
 * @returns {Promise<Object>} All dashboard data
 */
export const getAllDashboardData = async () => {
  try {
    const [stats, salesData, topProducts, transactions, lowStock] = await Promise.all([
      getDashboardStats(),
      getSalesChartData('week'),
      getTopProducts({ limit: 5 }),
      getRecentTransactions(5),
      getLowStockItems({ threshold: 10, limit: 10 })
    ]);

    return {
      stats,
      salesData,
      topProducts,
      transactions,
      lowStock
    };
  } catch (error) {
    const message = error.message || 'Failed to fetch dashboard data';
    throw new Error(message);
  }
};

// Export all functions
export const dashboardService = {
  getDashboardStats,
  getSalesChartData,
  getTopProducts,
  getRecentTransactions,
  getLowStockItems,
  getSalesSummary,
  getAllDashboardData
};

export default dashboardService;