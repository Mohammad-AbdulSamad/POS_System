// src/hooks/useCategories.js - OPTIMIZED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
import * as categoryService from '../services/categoryService';
import { useToast } from '../components/common/Toast';

/**
 * useCategories Hook - OPTIMIZED VERSION
 * 
 * Manages category data fetching and operations
 * 
 * OPTIMIZATION CHANGES:
 * - Fixed infinite loop by using toastRef instead of toast dependency
 * - Added pagination support
 * - Memoized fetchCategories properly
 * - Uses paramsRef to track latest params
 */

export const useCategories = (initialParams = {}) => {
  const [categories, setCategories] = useState([]);
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
  const paramsRef = useRef({ page: 1, limit: 50, ...initialParams });
  
  // Store toast in ref to prevent fetchCategories recreation
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  /**
   * Fetch all categories
   * ✅ OPTIMIZED: Uses toastRef to prevent recreation
   */
  const fetchCategories = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    // Merge params and persist to ref
    const mergedParams = { ...paramsRef.current, ...params };
    paramsRef.current = mergedParams;

    try {
      const response = await categoryService.getAllCategories(mergedParams);

      // Support multiple response shapes
      const categoriesList = Array.isArray(response)
        ? response
        : response?.categories ?? response?.data ?? [];

      const paginationData = response?.pagination ?? {
        page: mergedParams.page || 1,
        limit: mergedParams.limit || 50,
        total: categoriesList.length,
        pages: Math.ceil(categoriesList.length / (mergedParams.limit || 50)),
      };

      setCategories(categoriesList);
      setPagination((prev) => ({ ...prev, ...paginationData }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch categories';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Empty deps - stable function

  /**
   * Fetch single category by ID
   */
  const fetchCategoryById = useCallback(async (id, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const category = await categoryService.getCategoryById(id, options);
      return category;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch category';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new category
   */
  const createCategory = useCallback(async (categoryData) => {
    setLoading(true);
    setError(null);

    try {
      const newCategory = await categoryService.createCategory(categoryData);
      toastRef.current?.success('Category created successfully');
      
      // Refresh list to get updated pagination
      await fetchCategories();
      
      return newCategory;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create category';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCategories]);

  /**
   * Update category
   */
  const updateCategory = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedCategory = await categoryService.updateCategory(id, updates);
      toastRef.current?.success('Category updated successfully');
      
      // Update local state
      setCategories(prev =>
        prev.map(c => (c.id === id ? updatedCategory : c))
      );
      
      return updatedCategory;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update category';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete category
   */
  const deleteCategory = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await categoryService.deleteCategory(id);
      toastRef.current?.success('Category deleted successfully');
      
      // Remove from local state
      setCategories(prev => prev.filter(c => c.id !== id));
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
        pages: Math.ceil((prev.total - 1) / prev.limit)
      }));
    } catch (err) {
      console.log('Helolo');
      console.log(err);
      const errorMessage = err.response?.data?.message || 'Failed to delete category';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get category statistics
   */
  const getCategoryStats = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const stats = await categoryService.getCategoryAnalytics(id);
      return stats;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch category statistics';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial fetch on mount
   * ✅ FIXED: Removed fetchCategories from dependencies
   */
  useEffect(() => {
    if (!mountedRef.current) {
      fetchCategories();
      mountedRef.current = true;
    }
   
  }, []); // ✅ Only run on mount

  return {
    // State
    categories,
    loading,
    error,
    pagination,

    // Methods
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats,

    // Utilities
    refetch: fetchCategories,
  };
};

export default useCategories;