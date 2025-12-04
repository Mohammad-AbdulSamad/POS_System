// src/hooks/useTransactions.js
import { useState, useEffect, useCallback, useRef } from 'react';
import * as transactionService from '../services/transactionService';
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
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

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
   * ✅ FIXED: Fetch all transactions with proper response handling
   */
  const fetchTransactions = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        include_relations: 'false',
        ...filters,
        ...params,
      };

      let response;

      // Fetch by branch, customer, or all
      if (customerId) {
        response = await transactionService.getTransactionsByCustomer(customerId, queryParams);
      } else if (branchId) {
        response = await transactionService.getTransactionsByBranch(branchId, queryParams);
      } else {
        response = await transactionService.getAllTransactions(queryParams);
      }

      // ✅ FIXED: Proper response destructuring
      const transactionsList = Array.isArray(response)
        ? response
        : response?.transactions ?? response?.data ?? [];

      // ✅ FIXED: Transform each transaction
      const transformedTransactions = transactionsList.map(
        transactionService.transformTransactionForFrontend
      );

      setTransactions(transformedTransactions);

      // ✅ FIXED: Update pagination from response
      const paginationData = response?.pagination || {
        page: queryParams.page,
        limit: queryParams.limit,
        total: transactionsList.length,
        pages: Math.ceil(transactionsList.length / queryParams.limit),
      };

      setPagination(prev => ({
        ...prev,
        ...paginationData,
      }));

      return transformedTransactions;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch transactions';
      console.error('❌ Error fetching transactions:', errorMessage);
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      setTransactions([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [branchId, customerId, pagination.page, pagination.limit, filters]);

  /**
   * ✅ FIXED: Fetch single transaction by ID
   */
  const fetchTransactionById = useCallback(async (id, includeRelations = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const transaction = await transactionService.getTransactionById(id, includeRelations);
      const transformed = transactionService.transformTransactionForFrontend(transaction);
      setSelectedTransaction(transformed);
      return transformed;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch transaction';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ✅ NEW: Fetch transaction by receipt number
   */
  const fetchByReceiptNumber = useCallback(async (receiptNumber) => {
    setIsLoading(true);
    setError(null);

    try {
      const transaction = await transactionService.getTransactionByReceiptNumber(receiptNumber);
      const transformed = transactionService.transformTransactionForFrontend(transaction);
      setSelectedTransaction(transformed);
      return transformed;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch receipt';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update filters and reset to page 1
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  /**
   * Clear all filters
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
   * Search transactions locally (after fetched)
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
   * Pagination: Go to specific page
   */
  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  /**
   * Pagination: Next page
   */
  const nextPage = useCallback(() => {
    setPagination(prev => {
      if (prev.page < prev.pages) {
        return { ...prev, page: prev.page + 1 };
      }
      return prev;
    });
  }, []);

  /**
   * Pagination: Previous page
   */
  const prevPage = useCallback(() => {
    setPagination(prev => {
      if (prev.page > 1) {
        return { ...prev, page: prev.page - 1 };
      }
      return prev;
    });
  }, []);

  /**
   * Pagination: Change page size
   */
  const setPageSize = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  /**
   * Get transactions for today only
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
   * Calculate totals for all loaded transactions
   */
  const calculateTotals = useCallback(() => {
    return transactions.reduce(
      (acc, t) => ({
        totalSales: acc.totalSales + (parseFloat(t.total) || 0),
        totalTransactions: acc.totalTransactions + 1,
        totalItems: acc.totalItems + (t.items?.length || 0),
        totalTax: acc.totalTax + (parseFloat(t.tax?.amount) || 0),
      }),
      { totalSales: 0, totalTransactions: 0, totalItems: 0, totalTax: 0 }
    );
  }, [transactions]);

  /**
   * Get today's totals
   */
  const getTodayTotals = useCallback(() => {
    const todayTxns = getTodayTransactions();
    return todayTxns.reduce(
      (acc, t) => ({
        totalSales: acc.totalSales + (parseFloat(t.total) || 0),
        totalTransactions: acc.totalTransactions + 1,
        totalItems: acc.totalItems + (t.items?.length || 0),
        totalTax: acc.totalTax + (parseFloat(t.tax?.amount) || 0),
      }),
      { totalSales: 0, totalTransactions: 0, totalItems: 0, totalTax: 0 }
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
   * Auto-fetch on mount and when dependencies change
   */
  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [pagination.page, pagination.limit, autoFetch]);

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
    fetchByReceiptNumber, // ✅ NEW
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

export default useTransactions;