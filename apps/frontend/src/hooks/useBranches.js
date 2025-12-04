// src/hooks/useBranches.js - OPTIMIZED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import * as branchService from '../services/branchService';
import { useToast } from '../components/common/Toast';

/**
 * useBranches Hook - OPTIMIZED VERSION
 * 
 * Manages branch data fetching and operations
 * 
 * FEATURES:
 * - Role-based fetching (only ADMIN/MANAGER get branches)
 * - Fixed infinite loop by using toastRef
 * - Optimized for sidebar usage
 * - Memoized fetchBranches properly
 * - Uses paramsRef to track latest params
 * 
 * OPTIONS:
 * @param {Object} initialParams - Initial query parameters
 * @param {boolean} initialParams.autoFetch - Whether to fetch on mount (default: true for admin/manager)
 * @param {boolean} initialParams.include_relations - Include related data
 */

export const useBranches = (initialParams = {}) => {
  const { autoFetch, ...otherParams } = initialParams;
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const mountedRef = useRef(false);
  const paramsRef = useRef({ ...otherParams });
  
  // Determine if user can access branches
  const isAdmin = user && ['ADMIN', 'MANAGER'].includes(user.role);
  const shouldAutoFetch = autoFetch !== undefined ? autoFetch : isAdmin;
  
  // Store toast in ref to prevent fetchBranches recreation
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  /**
   * Fetch all branches
   * ✅ OPTIMIZED: Uses toastRef to prevent recreation
   * ✅ ROLE-BASED: Only fetches if user is admin/manager
   */
  const fetchBranches = useCallback(async (params = {}) => {
    // Permission check
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      const errorMessage = 'Only administrators and managers can fetch branches';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      return;
    }

    setLoading(true);
    setError(null);

    // Merge params and persist to ref
    const mergedParams = { ...paramsRef.current, ...params };
    paramsRef.current = mergedParams;

    try {
      const response = await branchService.getAllBranches(mergedParams);

      // Support multiple response shapes
      const branchesList = Array.isArray(response)
        ? response
        : response?.branches ?? response?.data ?? [];

      setBranches(branchesList);
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch branches';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      setBranches([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]); // ✅ Only depends on user

  /**
   * Fetch single branch by ID
   */
  const fetchBranchById = useCallback(async (id, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const branch = await branchService.getBranchById(id, options);
      return branch;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch branch';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new branch (ADMIN only)
   */
  const createBranch = useCallback(async (branchData) => {
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Only administrators can create branches');
    }

    setLoading(true);
    setError(null);

    try {
      const newBranch = await branchService.createBranch(branchData);
      toastRef.current?.success('Branch created successfully');
      
      // Add to local state
      setBranches(prev => [newBranch, ...prev]);
      
      return newBranch;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create branch';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Update branch (ADMIN/MANAGER)
   */
  const updateBranch = useCallback(async (id, updates) => {
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      throw new Error('Only administrators and managers can update branches');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedBranch = await branchService.updateBranch(id, updates);
      toastRef.current?.success('Branch updated successfully');
      
      // Update local state
      setBranches(prev => prev.map(b => (b.id === id ? updatedBranch : b)));
      
      return updatedBranch;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update branch';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Delete branch (ADMIN only)
   */
  const deleteBranch = useCallback(async (id) => {
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Only administrators can delete branches');
    }

    setLoading(true);
    setError(null);

    try {
      await branchService.deleteBranch(id);
      toastRef.current?.success('Branch deleted successfully');
      
      // Remove from local state
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete branch';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Get branch products
   */
  const fetchBranchProducts = useCallback(async (id, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const products = await branchService.getBranchProducts(id, params);
      return products;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch branch products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get branch categories
   */
  const fetchBranchCategories = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const categories = await branchService.getBranchCategories(id);
      return categories;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch branch categories';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get branch users
   */
  const fetchBranchUsers = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const users = await branchService.getBranchUsers(id);
      return users;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch branch users';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get branch transactions
   */
  const fetchBranchTransactions = useCallback(async (id, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const transactions = await branchService.getBranchTransactions(id, params);
      return transactions;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch branch transactions';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get branch stock movements
   */
  const fetchBranchStockMovements = useCallback(async (id, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const stockMovements = await branchService.getBranchStockMovements(id, params);
      return stockMovements;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch stock movements';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get branch analytics
   */
  const fetchBranchAnalytics = useCallback(async (id, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const analytics = await branchService.getBranchAnalytics(id, params);
      return analytics;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch branch analytics';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get inventory status
   */
  const fetchInventoryStatus = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const status = await branchService.getInventoryStatus(id);
      return status;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch inventory status';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial fetch on mount
   * ✅ FIXED: Removed fetchBranches from dependencies
   * ✅ ROLE-BASED: Only fetches if user is admin/manager and autoFetch is true
   */
  useEffect(() => {
    if (!mountedRef.current && shouldAutoFetch && isAdmin) {
      fetchBranches();
      mountedRef.current = true;
    }
  }, [shouldAutoFetch, isAdmin, fetchBranches]); // ✅ Safe dependencies

  return {
    // State
    branches,
    loading,
    error,
    
    // Permission flags
    canFetchBranches: isAdmin,
    
    // Methods
    fetchBranches,
    fetchBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
    fetchBranchProducts,
    fetchBranchCategories,
    fetchBranchUsers,
    fetchBranchTransactions,
    fetchBranchStockMovements,
    fetchBranchAnalytics,
    fetchInventoryStatus,

    // Utilities
    refetch: fetchBranches,
  };
};

export default useBranches;