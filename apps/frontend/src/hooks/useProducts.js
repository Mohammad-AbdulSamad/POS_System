// src/hooks/useProducts.js
import { useState, useEffect, useCallback, useRef } from 'react';
import * as productService from '../services/productService';
import { useToast } from '../components/common/Toast';

/**
 * useProducts Hook - OPTIMIZED VERSION
 * 
 * Manages product data fetching and operations
 * Handles loading states, errors, and caching
 * 
 * OPTIMIZATION CHANGES:
 * - Fixed infinite loop in useEffect by removing fetchProducts dependency
 * - Memoized fetchProducts properly to prevent recreation
 * - Uses paramsRef to track latest params without causing re-renders
 */

export const useProducts = (initialParams = {}) => {
  const [products, setProducts] = useState([]);
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
  
  // Store toast in ref to prevent fetchProducts recreation
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  /**
   * Fetch products with parameters
   * ✅ OPTIMIZED: Uses toastRef to prevent recreation on every render
   */
  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    // Merge params and persist to ref (avoid stale closures)
    const mergedParams = { ...paramsRef.current, ...params };
    paramsRef.current = mergedParams;

    try {
      const response = await productService.getAllProducts(mergedParams);

      // Support multiple response shapes
      const productsList = Array.isArray(response)
        ? response
        : response?.products ?? response?.data ?? response?.items ?? [];

      const paginationData = response?.pagination ?? response?.meta ?? {
        page: mergedParams.page,
        limit: mergedParams.limit,
        total: productsList.length,
        pages: Math.ceil((productsList.length || 0) / mergedParams.limit),
      };

      setProducts(productsList);
      setPagination((prev) => ({ ...prev, ...paginationData }));
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Empty deps - stable function

  /**
   * Fetch single product by ID
   */
  const fetchProductById = useCallback(async (id, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const product = await productService.getProductById(id, options);
      return product;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch product';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search products
   */
  const searchProducts = useCallback(async (query, filters = {}) => {
    if (!query || query.trim() === '') {
      return fetchProducts(filters);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await productService.searchProductsByName({
        q: query,
        ...filters,
      });

      const productsList = Array.isArray(response)
        ? response
        : response?.products ?? response?.data ?? [];

      setProducts(productsList);
      setPagination((prev) => prev);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Search failed';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  /**
   * Get product by barcode
   */
  const getProductByBarcode = useCallback(async (barcode) => {
    setLoading(true);
    setError(null);

    try {
      const product = await productService.getProductByBarcode(barcode);
      return product;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Product not found';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new product
   */
  const createProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);

    try {
      const newProduct = await productService.createProduct(productData);
      toastRef.current?.success('Product created successfully');
      
      // Refresh product list
      await fetchProducts();
      
      return newProduct;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create product';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  /**
   * Update product
   */
  const updateProduct = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedProduct = await productService.updateProduct(id, updates);
      toastRef.current?.success('Product updated successfully');
      
      // Update local state
      setProducts(prev =>
        prev.map(p => (p.id === id ? updatedProduct : p))
      );
      
      return updatedProduct;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update product';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete product
   */
  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      await productService.deleteProduct(id);
      toastRef.current?.success('Product deleted successfully');
      
      // Remove from local state
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete product';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adjust stock
   */
  const adjustStock = useCallback(async (id, adjustment) => {
    setLoading(true);
    setError(null);

    try {
      const updatedProduct = await productService.updateStock(id, adjustment);
      toastRef.current?.success('Stock adjusted successfully');
      
      // Update local state
      setProducts(prev =>
        prev.map(p => (p.id === id ? updatedProduct : p))
      );
      
      return updatedProduct;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to adjust stock';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get low stock products
   */
  const fetchLowStockProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await productService.getLowStockProducts(params);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch low stock products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload product image
   */
  const uploadImage = useCallback(async (id, file, onProgress) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.uploadProductImage(id, file, onProgress);
      toastRef.current?.success('Image uploaded successfully');
      
      // Update local state
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, imageUrl: result.imageUrl } : p))
      );
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to upload image';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Import products from file
   */
  const importProducts = useCallback(async (file, onProgress) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await productService.importProducts(formData, onProgress);
      toastRef.current?.success(`Successfully imported ${result.imported} products`);
      
      // Refresh product list
      await fetchProducts();
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to import products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  /**
   * Export products
   */
  const exportProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const blob = await productService.exportProducts(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-export-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toastRef.current?.success('Products exported successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to export products';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial fetch on mount
   * ✅ FIXED: Removed fetchProducts from dependencies to prevent infinite loop
   */
  useEffect(() => {
    if (!mountedRef.current) {
      fetchProducts();
      mountedRef.current = true;
    }
   
  }, []); // ✅ Only run on mount - fetchProducts is stable now

  return {
    // State
    products,
    loading,
    error,
    pagination,

    // Methods
    fetchProducts,
    fetchProductById,
    searchProducts,
    getProductByBarcode,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    fetchLowStockProducts,
    uploadImage,
    importProducts,
    exportProducts,

    // Utilities
    refetch: fetchProducts,
  };
};

export default useProducts;