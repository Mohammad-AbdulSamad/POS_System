// src/hooks/useTransactions.js
import { useState, useEffect, useCallback } from 'react';
import {
  getAllTransactions,
  getTransactionById,
  getTransactionsByBranch,
  getTransactionsByCustomer,
  getTransactionByReceiptNumber,
  transformTransactionForFrontend,
} from '../services/transactionService';
import { useToast } from '../components/common/Toast';

/**
 * Hook for managing transactions
 * Handles fetching, filtering, and displaying transaction data
 */
export const useTransactions = (options = {}) => {
  const {
    branchId = null,
    customerId = null,
    autoFetch = true,
    initialLimit = 50,
  } = options;

  const toast = useToast();

  // State
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: null,
    startDate: null,
    endDate: null,
    searchQuery: '',
  });

  /**
   * Fetch all transactions with filters
   */
  const fetchTransactions = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        include_relations: 'false',
        ...filters,
        ...params,
      };

      // Fetch by branch, customer, or all
      if (customerId) {
        response = await getTransactionsByCustomer(customerId, queryParams);
      } else if (branchId) {
        response = await getTransactionsByBranch(branchId, queryParams);
      } else {
        response = await getAllTransactions(queryParams);
      }

      // Transform transactions
      const transformedTransactions = response.transactions?.map(
        transformTransactionForFrontend
      ) || [];

      setTransactions(transformedTransactions);

      // Update pagination
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          ...response.pagination,
        }));
      }

      return transformedTransactions;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
      toast?.error('Failed to load transactions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [branchId, customerId, pagination.page, pagination.limit, filters, toast]);

  /**
   * Fetch single transaction by ID
   */
  const fetchTransactionById = useCallback(async (id, includeRelations = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const transaction = await getTransactionById(id, includeRelations);
      const transformed = transformTransactionForFrontend(transaction);
      setSelectedTransaction(transformed);
      return transformed;
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError(err.message || 'Failed to fetch transaction');
      toast?.error('Failed to load transaction details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Fetch transaction receipt
   */
  const fetchReceipt = useCallback(async (receiptNumber) => {
    try {
      const receipt = await getTransactionByReceiptNumber(receiptNumber);
      return transformTransactionForFrontend(receipt);
    } catch (err) {
      console.error('Error fetching receipt:', err);
      toast?.error('Failed to load receipt');
      return null;
    }
  }, [toast]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: null,
      startDate: null,
      endDate: null,
      searchQuery: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Search transactions
   */
  const searchTransactions = useCallback((query) => {
    if (!query) return transactions;

    const lowerQuery = query.toLowerCase();
    return transactions.filter(
      t =>
        t.receiptNumber?.toLowerCase().includes(lowerQuery) ||
        t.customer?.name?.toLowerCase().includes(lowerQuery) ||
        t.id.toLowerCase().includes(lowerQuery)
    );
  }, [transactions]);

  /**
   * Filter by date range
   */
  const filterByDateRange = useCallback((startDate, endDate) => {
    updateFilters({ startDate, endDate });
  }, [updateFilters]);

  /**
   * Filter by status
   */
  const filterByStatus = useCallback((status) => {
    updateFilters({ status });
  }, [updateFilters]);

  /**
   * Pagination controls
   */
  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination(prev => {
      if (prev.page < prev.pages) {
        return { ...prev, page: prev.page + 1 };
      }
      return prev;
    });
  }, []);

  const prevPage = useCallback(() => {
    setPagination(prev => {
      if (prev.page > 1) {
        return { ...prev, page: prev.page - 1 };
      }
      return prev;
    });
  }, []);

  const setPageSize = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  /**
   * Get transactions for today
   */
  const getTodayTransactions = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= today && transactionDate < tomorrow;
    });
  }, [transactions]);

  /**
   * Calculate totals
   */
  const calculateTotals = useCallback(() => {
    return transactions.reduce(
      (acc, t) => ({
        totalSales: acc.totalSales + (t.total || 0),
        totalTransactions: acc.totalTransactions + 1,
        totalItems: acc.totalItems + (t.items?.length || 0),
      }),
      { totalSales: 0, totalTransactions: 0, totalItems: 0 }
    );
  }, [transactions]);

  /**
   * Get today's totals
   */
  const getTodayTotals = useCallback(() => {
    const todayTxns = getTodayTransactions();
    return todayTxns.reduce(
      (acc, t) => ({
        totalSales: acc.totalSales + (t.total || 0),
        totalTransactions: acc.totalTransactions + 1,
        totalItems: acc.totalItems + (t.items?.length || 0),
      }),
      { totalSales: 0, totalTransactions: 0, totalItems: 0 }
    );
  }, [getTodayTransactions]);

  /**
   * Group transactions by date
   */
  const groupByDate = useCallback(() => {
    const grouped = {};
    transactions.forEach(t => {
      const date = new Date(t.timestamp).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(t);
    });
    return grouped;
  }, [transactions]);

  /**
   * Auto-fetch on mount or when dependencies change
   */
  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [pagination.page, pagination.limit, filters.status, filters.startDate, filters.endDate]);

  return {
    // Data
    transactions,
    selectedTransaction,
    isLoading,
    error,

    // Pagination
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,

    // Filters
    filters,
    updateFilters,
    clearFilters,
    searchTransactions,
    filterByDateRange,
    filterByStatus,

    // Fetch operations
    fetchTransactions,
    fetchTransactionById,
    fetchReceipt,
    refresh: fetchTransactions,

    // Computed data
    getTodayTransactions,
    calculateTotals,
    getTodayTotals,
    groupByDate,

    // Setters
    setSelectedTransaction,
  };
};