// // src/hooks/useTransactions.js - FIXED

// import { useState, useEffect, useCallback, useRef } from 'react';
// import * as transactionService from '../services/transactionService';
// import { useToast } from '../components/common/Toast';

// export const useTransactions = (options = {}) => {
//   const {
//     branchId = null,
//     customerId = null,
//     autoFetch = true,
//     initialLimit = 50,
//   } = options;

//   const toast = useToast();
//   const toastRef = useRef(toast);
  
//   useEffect(() => {
//     toastRef.current = toast;
//   }, [toast]);

//   // State
//   const [transactions, setTransactions] = useState([]);
//   const [selectedTransaction, setSelectedTransaction] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Pagination
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: initialLimit,
//     total: 0,
//     pages: 0,
//   });

//   // Filters
//   const [filters, setFilters] = useState({
//     status: null,
//     startDate: null,
//     endDate: null,
//     search: '', // ✅ Changed from searchQuery to search
//   });

//   /**
//    * ✅ FIXED: Fetch transactions with proper search parameter
//    */
//   const fetchTransactions = useCallback(async (params = {}) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       // ✅ Build query params - merge filters with params
//       // params take precedence over stored filters
//       const queryParams = {
//         page: params.page !== undefined ? params.page : pagination.page,
//         limit: params.limit !== undefined ? params.limit : pagination.limit,
//         include_relations: params.include_relations || 'false',
        
//         // Merge filters - params override stored filters
//         status: params.status !== undefined ? params.status : filters.status,
//         startDate: params.startDate !== undefined ? params.startDate : filters.startDate,
//         endDate: params.endDate !== undefined ? params.endDate : filters.endDate,
//         search: params.search !== undefined ? params.search : filters.search,
        
//         // Sorting
//         sortBy: params.sortBy || 'createdAt',
//         sortOrder: params.sortOrder || 'desc',
//       };

//       // Remove null/undefined/empty values
//       Object.keys(queryParams).forEach(key => {
//         if (queryParams[key] === null || 
//             queryParams[key] === undefined || 
//             queryParams[key] === '') {
//           delete queryParams[key];
//         }
//       });

//       console.log('📡 Fetching transactions with params:', queryParams);

//       let response;

//       // Fetch by branch, customer, or all
//       if (customerId) {
//         response = await transactionService.getTransactionsByCustomer(customerId, queryParams);
//       } else if (branchId) {
//         response = await transactionService.getTransactionsByBranch(branchId, queryParams);
//       } else {
//         response = await transactionService.getAllTransactions(queryParams);
//       }

//       // Handle response
//       const transactionsList = Array.isArray(response)
//         ? response
//         : response?.transactions ?? response?.data ?? [];

//       // Transform each transaction
//       const transformedTransactions = transactionsList.map(
//         transactionService.transformTransactionForFrontend
//       );

//       setTransactions(transformedTransactions);

//       // Update pagination from response
//       const paginationData = response?.pagination || {
//         page: queryParams.page || 1,
//         limit: queryParams.limit || pagination.limit,
//         total: transactionsList.length,
//         pages: Math.ceil(transactionsList.length / (queryParams.limit || pagination.limit)),
//       };

//       setPagination(paginationData);

//       console.log('✅ Fetched transactions:', {
//         count: transformedTransactions.length,
//         total: paginationData.total,
//         page: paginationData.page,
//         searchUsed: queryParams.search || 'none'
//       });

//       return transformedTransactions;
//     } catch (err) {
//       const errorMessage = err.message || 'Failed to fetch transactions';
//       console.error('❌ Error fetching transactions:', errorMessage);
//       setError(errorMessage);
//       toastRef.current?.error(errorMessage);
//       setTransactions([]);
//       return [];
//     } finally {
//       setIsLoading(false);
//     }
//   }, [branchId, customerId, pagination.page, pagination.limit, filters]);

//   /**
//    * Fetch single transaction by ID
//    */
//   const fetchTransactionById = useCallback(async (id, includeRelations = true) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const transaction = await transactionService.getTransactionById(id, includeRelations);
//       const transformed = transactionService.transformTransactionForFrontend(transaction);
//       setSelectedTransaction(transformed);
//       return transformed;
//     } catch (err) {
//       const errorMessage = err.message || 'Failed to fetch transaction';
//       setError(errorMessage);
//       toastRef.current?.error(errorMessage);
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   /**
//    * Fetch transaction by receipt number
//    */
//   const fetchByReceiptNumber = useCallback(async (receiptNumber) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const transaction = await transactionService.getTransactionByReceiptNumber(receiptNumber);
//       const transformed = transactionService.transformTransactionForFrontend(transaction);
//       setSelectedTransaction(transformed);
//       return transformed;
//     } catch (err) {
//       const errorMessage = err.message || 'Failed to fetch receipt';
//       setError(errorMessage);
//       toastRef.current?.error(errorMessage);
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   /**
//    * ✅ FIXED: Update filters with 'search' parameter
//    */
//   const updateFilters = useCallback((newFilters) => {
//     setFilters(prev => ({ ...prev, ...newFilters }));
//     setPagination(prev => ({ ...prev, page: 1 }));
//   }, []);

//   /**
//    * Clear all filters
//    */
//   const clearFilters = useCallback(() => {
//     setFilters({
//       status: null,
//       startDate: null,
//       endDate: null,
//       search: '', // ✅ Changed from searchQuery to search
//     });
//     setPagination(prev => ({ ...prev, page: 1 }));
//   }, []);

//   /**
//    * Search transactions locally (client-side filter)
//    */
//   const searchTransactions = useCallback((query) => {
//     if (!query) return transactions;

//     const lowerQuery = query.toLowerCase();
//     return transactions.filter(
//       t =>
//         t.receiptNumber?.toLowerCase().includes(lowerQuery) ||
//         t.customer?.name?.toLowerCase().includes(lowerQuery) ||
//         t.customer?.phone?.toLowerCase().includes(lowerQuery) ||
//         t.id.toLowerCase().includes(lowerQuery)
//     );
//   }, [transactions]);

//   /**
//    * Filter by date range
//    */
//   const filterByDateRange = useCallback((startDate, endDate) => {
//     updateFilters({ startDate, endDate });
//   }, [updateFilters]);

//   /**
//    * Filter by status
//    */
//   const filterByStatus = useCallback((status) => {
//     updateFilters({ status });
//   }, [updateFilters]);

//   /**
//    * Pagination helpers
//    */
//   const goToPage = useCallback((page) => {
//     setPagination(prev => ({ ...prev, page }));
//   }, []);

//   const nextPage = useCallback(() => {
//     setPagination(prev => {
//       if (prev.page < prev.pages) {
//         return { ...prev, page: prev.page + 1 };
//       }
//       return prev;
//     });
//   }, []);

//   const prevPage = useCallback(() => {
//     setPagination(prev => {
//       if (prev.page > 1) {
//         return { ...prev, page: prev.page - 1 };
//       }
//       return prev;
//     });
//   }, []);

//   const setPageSize = useCallback((limit) => {
//     setPagination(prev => ({ ...prev, limit, page: 1 }));
//   }, []);

//   /**
//    * Get transactions for today only
//    */
//   const getTodayTransactions = useCallback(() => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     return transactions.filter(t => {
//       const transactionDate = new Date(t.timestamp);
//       return transactionDate >= today && transactionDate < tomorrow;
//     });
//   }, [transactions]);

//   /**
//    * Calculate totals for all loaded transactions
//    */
//   const calculateTotals = useCallback(() => {
//     return transactions.reduce(
//       (acc, t) => ({
//         totalSales: acc.totalSales + (parseFloat(t.total) || 0),
//         totalTransactions: acc.totalTransactions + 1,
//         totalItems: acc.totalItems + (t.items?.length || 0),
//         totalTax: acc.totalTax + (parseFloat(t.tax?.amount) || 0),
//       }),
//       { totalSales: 0, totalTransactions: 0, totalItems: 0, totalTax: 0 }
//     );
//   }, [transactions]);

//   /**
//    * Get today's totals
//    */
//   const getTodayTotals = useCallback(() => {
//     const todayTxns = getTodayTransactions();
//     return todayTxns.reduce(
//       (acc, t) => ({
//         totalSales: acc.totalSales + (parseFloat(t.total) || 0),
//         totalTransactions: acc.totalTransactions + 1,
//         totalItems: acc.totalItems + (t.items?.length || 0),
//         totalTax: acc.totalTax + (parseFloat(t.tax?.amount) || 0),
//       }),
//       { totalSales: 0, totalTransactions: 0, totalItems: 0, totalTax: 0 }
//     );
//   }, [getTodayTransactions]);

//   /**
//    * Group transactions by date
//    */
//   const groupByDate = useCallback(() => {
//     const grouped = {};
//     transactions.forEach(t => {
//       const date = new Date(t.timestamp).toLocaleDateString();
//       if (!grouped[date]) {
//         grouped[date] = [];
//       }
//       grouped[date].push(t);
//     });
//     return grouped;
//   }, [transactions]);

//   /**
//    * Auto-fetch on mount ONLY (not on every state change)
//    */
//   useEffect(() => {
//     if (autoFetch) {
//       console.log('🔄 Initial fetch on mount');
//       fetchTransactions();
//     }
    
//   }, []); // ✅ Empty deps - only run once on mount

//   return {
//     // Data
//     transactions,
//     selectedTransaction,
//     isLoading,
//     error,

//     // Pagination
//     pagination,
//     goToPage,
//     nextPage,
//     prevPage,
//     setPageSize,

//     // Filters
//     filters,
//     updateFilters,
//     clearFilters,
//     searchTransactions,
//     filterByDateRange,
//     filterByStatus,

//     // Fetch operations
//     fetchTransactions,
//     fetchTransactionById,
//     fetchByReceiptNumber,
//     refresh: fetchTransactions,

//     // Computed data
//     getTodayTransactions,
//     calculateTotals,
//     getTodayTotals,
//     groupByDate,

//     // Setters
//     setSelectedTransaction,
//   };
// };

// export default useTransactions;

// src/hooks/useTransactions.js - FIXED

import { useState, useEffect, useCallback, useRef } from 'react';
import * as transactionService from '../services/transactionService';
import { useToast } from '../components/common/Toast';

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
    search: '', // ✅ Changed from searchQuery to search
  });

  /**
   * ✅ FIXED: Fetch transactions with proper search parameter
   */
  const fetchTransactions = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      // ✅ Build query params - merge filters with params
      // params take precedence over stored filters
      const queryParams = {
        page: params.page !== undefined ? params.page : pagination.page,
        limit: params.limit !== undefined ? params.limit : pagination.limit,
        include_relations: params.include_relations || 'false',
        
        // Merge filters - params override stored filters
        status: params.status !== undefined ? params.status : filters.status,
        startDate: params.startDate !== undefined ? params.startDate : filters.startDate,
        endDate: params.endDate !== undefined ? params.endDate : filters.endDate,
        search: params.search !== undefined ? params.search : filters.search,
        searchField: params.searchField || undefined, // ✅ NEW: Search field
        
        // Sorting
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
      };

      // Remove null/undefined/empty values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === null || 
            queryParams[key] === undefined || 
            queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      console.log('📡 Fetching transactions with params:', queryParams);

      let response;

      // Fetch by branch, customer, or all
      if (customerId) {
        response = await transactionService.getTransactionsByCustomer(customerId, queryParams);
      } else if (branchId) {
        response = await transactionService.getTransactionsByBranch(branchId, queryParams);
      } else {
        response = await transactionService.getAllTransactions(queryParams);
      }

      // Handle response
      const transactionsList = Array.isArray(response)
        ? response
        : response?.transactions ?? response?.data ?? [];

      // Transform each transaction
      const transformedTransactions = transactionsList.map(
        transactionService.transformTransactionForFrontend
      );

      setTransactions(transformedTransactions);

      // Update pagination from response
      const paginationData = response?.pagination || {
        page: queryParams.page || 1,
        limit: queryParams.limit || pagination.limit,
        total: transactionsList.length,
        pages: Math.ceil(transactionsList.length / (queryParams.limit || pagination.limit)),
      };

      setPagination(paginationData);

      console.log('✅ Fetched transactions:', {
        count: transformedTransactions.length,
        total: paginationData.total,
        page: paginationData.page,
        searchUsed: queryParams.search || 'none'
      });

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
   * Fetch single transaction by ID
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
   * Fetch transaction by receipt number
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
   * ✅ FIXED: Update filters with 'search' parameter
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: null,
      startDate: null,
      endDate: null,
      search: '', // ✅ Changed from searchQuery to search
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Search transactions locally (client-side filter)
   */
  const searchTransactions = useCallback((query) => {
    if (!query) return transactions;

    const lowerQuery = query.toLowerCase();
    return transactions.filter(
      t =>
        t.receiptNumber?.toLowerCase().includes(lowerQuery) ||
        t.customer?.name?.toLowerCase().includes(lowerQuery) ||
        t.customer?.phone?.toLowerCase().includes(lowerQuery) ||
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
   * Pagination helpers
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
   * Auto-fetch on mount ONLY (not on every state change)
   */
  useEffect(() => {
    if (autoFetch) {
      console.log('🔄 Initial fetch on mount');
      fetchTransactions();
    }
    
  }, []); // ✅ Empty deps - only run once on mount

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
    fetchByReceiptNumber,
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