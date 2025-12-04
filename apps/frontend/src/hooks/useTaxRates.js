// src/hooks/useTaxRates.js - OPTIMIZED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import * as taxRateService from '../services/taxRateService';
import { useToast } from '../components/common/Toast';

/**
 * useTaxRates Hook - OPTIMIZED VERSION
 * 
 * Manages tax rate data fetching and operations
 * 
 * OPTIMIZATION CHANGES:
 * - Fixed infinite loop by using toastRef instead of toast dependency
 * - Added pagination support
 * - Memoized fetchTaxRates properly
 * - Uses paramsRef to track latest params
 */

export const useTaxRates = (initialParams = {}) => {
  const { autoFetch = true, ...otherParams } = initialParams;
  const [taxRates, setTaxRates] = useState([]);
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
  
  // Store toast in ref to prevent fetchTaxRates recreation
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  /**
   * Fetch all tax rates
   * ✅ OPTIMIZED: Uses toastRef to prevent recreation
   */
  const fetchTaxRates = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    // Merge params and persist to ref
    const mergedParams = { ...paramsRef.current, ...params };
    paramsRef.current = mergedParams;

    try {
      const response = await taxRateService.getAllTaxRates(mergedParams);

      // Support multiple response shapes
      const taxRatesList = Array.isArray(response)
        ? response
        : response?.taxRates ?? response?.data ?? [];

      const paginationData = response?.pagination ?? {
        page: mergedParams.page || 1,
        limit: mergedParams.limit || 50,
        total: taxRatesList.length,
        pages: Math.ceil(taxRatesList.length / (mergedParams.limit || 50)),
      };

      setTaxRates(taxRatesList);
      setPagination((prev) => ({ ...prev, ...paginationData }));
      
      return response;
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch tax rates';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      setTaxRates([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Empty deps - stable function

  /**
   * Fetch single tax rate by ID
   */
  const fetchTaxRateById = useCallback(async (id, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const taxRate = await taxRateService.getTaxRateById(id, options);
      return taxRate;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tax rate';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new tax rate
   */
  const createTaxRate = useCallback(async (taxRateData) => {
    setLoading(true);
    setError(null);

    try {
      const newTaxRate = await taxRateService.createTaxRate(taxRateData);
      toastRef.current?.success('Tax rate created successfully');
      
      // Refresh list to get updated pagination
      await fetchTaxRates();
      
      return newTaxRate;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create tax rate';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTaxRates]);

  /**
   * Update tax rate
   */
  const updateTaxRate = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedTaxRate = await taxRateService.updateTaxRate(id, updates);
      toastRef.current?.success('Tax rate updated successfully');
      
      // Update local state
      setTaxRates(prev =>
        prev.map(t => (t.id === id ? updatedTaxRate : t))
      );
      
      return updatedTaxRate;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update tax rate';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete tax rate
   */
  const deleteTaxRate = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await taxRateService.deleteTaxRate(id);
      toastRef.current?.success('Tax rate deleted successfully');
      
      // Remove from local state
      setTaxRates(prev => prev.filter(t => t.id !== id));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
        pages: Math.ceil((prev.total - 1) / prev.limit)
      }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete tax rate';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get tax rate products
   */
  const fetchTaxRateProducts = useCallback(async (id, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const products = await taxRateService.getTaxRateProducts(id, params);
      return products;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tax rate products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate tax
   */
  const calculateTax = useCallback(async (calculationData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await taxRateService.calculateTax(calculationData);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to calculate tax';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get tax rate analytics
   */
  const getTaxRateAnalytics = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const analytics = await taxRateService.getTaxRateAnalytics(id);
      return analytics;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tax rate analytics';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Assign products to tax rate
   */
  const assignProductsToTaxRate = useCallback(async (id, assignData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await taxRateService.assignProductsToTaxRate(id, assignData);
      toastRef.current?.success('Products assigned to tax rate successfully');
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
   * ✅ FIXED: Removed fetchTaxRates from dependencies
   * ✅ UPDATED: Only fetches if autoFetch is true
   */
  useEffect(() => {
    if (!mountedRef.current && autoFetchRef.current) {
      fetchTaxRates();
      mountedRef.current = true;
    }
  }, []); // ✅ Only run on mount

  return {
    // State
    taxRates,
    loading,
    error,
    pagination,

    // Methods
    fetchTaxRates,
    fetchTaxRateById,
    createTaxRate,
    updateTaxRate,
    deleteTaxRate,
    fetchTaxRateProducts,
    calculateTax,
    getTaxRateAnalytics,
    assignProductsToTaxRate,

    // Utilities
    refetch: fetchTaxRates,
  };
};

export default useTaxRates;