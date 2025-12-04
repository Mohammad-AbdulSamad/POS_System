// src/hooks/useSuppliers.js - OPTIMIZED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import * as supplierService from '../services/supplierService';
import { useToast } from '../components/common/Toast';

/**
 * useSuppliers Hook - OPTIMIZED VERSION
 * 
 * Manages supplier data fetching and operations
 * 
 * OPTIMIZATION CHANGES:
 * - Fixed infinite loop by using toastRef instead of toast dependency
 * - Added pagination support
 * - Memoized fetchSuppliers properly
 * - Uses paramsRef to track latest params
 */

export const useSuppliers = (initialParams = {}) => {
  const { autoFetch = true, ...otherParams } = initialParams;
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const toast = useToast();
  const mountedRef = useRef(false);
  const autoFetchRef = useRef(autoFetch);
  const paramsRef = useRef({ page: 1, limit: 50, ...otherParams });
  
  // Store toast in ref to prevent fetchSuppliers recreation
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  /**
   * Fetch all suppliers
   * ✅ OPTIMIZED: Uses toastRef to prevent recreation
   */
  const fetchSuppliers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    // Merge params and persist to ref
    const mergedParams = { ...paramsRef.current, ...params };
    paramsRef.current = mergedParams;

    try {
      const response = await supplierService.getAllSuppliers(mergedParams);

      // Support multiple response shapes
      const suppliersList = Array.isArray(response)
        ? response
        : response?.suppliers ?? response?.data ?? [];

      const paginationData = response?.pagination ?? {
        page: mergedParams.page || 1,
        limit: mergedParams.limit || 50,
        total: suppliersList.length,
        pages: Math.ceil(suppliersList.length / (mergedParams.limit || 50)),
      };

      setSuppliers(suppliersList);
      setPagination((prev) => ({ ...prev, ...paginationData }));
      
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch suppliers';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      setSuppliers([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Empty deps - stable function

  /**
   * Search suppliers
   */
  const searchSuppliers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await supplierService.searchSuppliers(params);
      const list = Array.isArray(response) ? response : response?.suppliers ?? response?.data ?? [];
      setSuppliers(list);
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to search suppliers';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch single supplier by ID
   */
  const fetchSupplierById = useCallback(async (id, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const supplier = await supplierService.getSupplierById(id, options);
      return supplier;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch supplier';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new supplier
   */
  const createSupplier = useCallback(async (supplierData) => {
    setLoading(true);
    setError(null);

    try {
      const newSupplier = await supplierService.createSupplier(supplierData);
      toastRef.current?.success('Supplier created successfully');
      
      // Refresh list to get updated pagination
      await fetchSuppliers();
      
      return newSupplier;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create supplier';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSuppliers]);

  /**
   * Update supplier
   */
  const updateSupplier = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedSupplier = await supplierService.updateSupplier(id, updates);
      toastRef.current?.success('Supplier updated successfully');
      
      // Update local state
      setSuppliers(prev => prev.map(s => (s.id === id ? updatedSupplier : s)));
      
      return updatedSupplier;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update supplier';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete supplier
   */
  const deleteSupplier = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await supplierService.deleteSupplier(id);
      toastRef.current?.success('Supplier deleted successfully');
      
      // Remove from local state
      setSuppliers(prev => prev.filter(s => s.id !== id));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
        pages: Math.ceil((prev.total - 1) / prev.limit)
      }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete supplier';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get supplier statistics
   */
  const getSupplierStats = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const stats = await supplierService.getSupplierAnalytics(id);
      return stats;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch supplier statistics';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch products for a supplier
   */
  const fetchSupplierProducts = useCallback(async (id, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const products = await supplierService.getSupplierProducts(id, params);
      return products;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch supplier products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch reorder products for a supplier
   */
  const fetchSupplierReorderProducts = useCallback(async (id, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const products = await supplierService.getSupplierReorderProducts(id, params);
      return products;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch reorder products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Assign products to supplier
   */
  const assignProductsToSupplier = useCallback(async (id, assignData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await supplierService.assignProductsToSupplier(id, assignData);
      toastRef.current?.success('Products assigned to supplier successfully');
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to assign products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial fetch on mount
   * ✅ FIXED: Removed fetchSuppliers from dependencies
   * ✅ UPDATED: Only fetches if autoFetch is true
   */
  useEffect(() => {
    if (!mountedRef.current && autoFetchRef.current) {
      fetchSuppliers();
      mountedRef.current = true;
    }
    
  }, []); // ✅ Only run on mount

  return {
    // State
    suppliers,
    loading,
    error,
    pagination,

    // Methods
    fetchSuppliers,
    fetchSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierStats,
    searchSuppliers,
    fetchSupplierProducts,
    fetchSupplierReorderProducts,
    assignProductsToSupplier,

    // Utilities
    refetch: fetchSuppliers,
  };
};

export default useSuppliers;