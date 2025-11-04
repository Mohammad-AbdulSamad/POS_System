// src/hooks/usePOS.js
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import {
  getAllTransactions,
  createTransaction,
  transformTransactionForFrontend,
  validateTransactionData,
} from '../services/transactionService';
import { getAllProducts } from '../services/productService';

/**
 * Main POS hook - Manages all POS operations and state
 * Orchestrates products, transactions, payments, and UI state
 */
export const usePOS = (config = {}) => {
  const {
    taxRate = 17,
    autoRefreshInterval = null, // Auto-refresh transactions (ms)
  } = config;

  const toast = useToast();
  const cart = useCart();

  // Data state
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]); // TODO: Add customer service
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  // UI state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Modal states
  const [modals, setModals] = useState({
    scanner: false,
    payment: false,
    discount: false,
    receipt: false,
    customer: false,
  });

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Auto-refresh transactions
  useEffect(() => {
    if (autoRefreshInterval) {
      const interval = setInterval(fetchTransactions, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval]);

  /**
   * Fetch products from backend
   */
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const response = await getAllProducts({
        active: true,
        include_relations: 'false',
      });

      const transformedProducts = response.products?.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode || p.sku,
        price: parseFloat(p.priceGross),
        cost: parseFloat(p.cost),
        stock: p.stock,
        image: p.imageUrl,
        categoryId: p.categoryId,
        unit: p.unit,
        active: p.active,
      })) || [];

      setProducts(transformedProducts);
      return transformedProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      return [];
    } finally {
      setIsLoadingProducts(false);
    }
  }, [toast]);

  /**
   * Fetch transactions from backend
   */
  const fetchTransactions = useCallback(async (params = {}) => {
    setIsLoadingTransactions(true);
    try {
      const response = await getAllTransactions({
        limit: 50,
        include_relations: 'false',
        ...params,
      });

      const transformedTransactions = response.transactions?.map(
        transformTransactionForFrontend
      ) || [];

      setTransactions(transformedTransactions);
      return transformedTransactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      return [];
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [toast]);

  /**
   * Handle product search
   */
  const searchProducts = useCallback((query) => {
    setSearchQuery(query);
    if (!query) return products;

    const lowerQuery = query.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery) ||
        p.barcode?.toLowerCase().includes(lowerQuery)
    );
  }, [products]);

  /**
   * Filter products by category
   */
  const filterByCategory = useCallback((categoryId) => {
    setCategoryFilter(categoryId);
    if (!categoryId) return products;
    return products.filter(p => p.categoryId === categoryId);
  }, [products]);

  /**
   * Find product by barcode
   */
  const findProductByBarcode = useCallback((barcode) => {
    return products.find(p => p.barcode === barcode || p.sku === barcode);
  }, [products]);

  /**
   * Handle barcode scan
   */
  const handleBarcodeScan = useCallback((barcode) => {
    const product = findProductByBarcode(barcode);
    
    if (product) {
      const success = cart.addItem(product);
      if (success) {
        closeModal('scanner');
      }
      return product;
    } else {
      toast.error('Product not found');
      throw new Error('Product not found');
    }
  }, [findProductByBarcode, cart, toast]);

  /**
   * Calculate totals with tax
   */
  const calculateTotals = useCallback(() => {
    return cart.calculateTotals(taxRate);
  }, [cart, taxRate]);

  /**
   * Validate cart before checkout
   */
  const validateCheckout = useCallback(() => {
    const errors = [];

    if (cart.isEmpty) {
      errors.push('Cart is empty');
    }

    cart.activeCart.items.forEach((item, index) => {
      if (item.quantity > item.stock) {
        errors.push(`${item.name}: Insufficient stock`);
      }
      if (item.price <= 0) {
        errors.push(`${item.name}: Invalid price`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [cart]);

  /**
   * Handle checkout - Open payment modal
   */
  const handleCheckout = useCallback(() => {
    const validation = validateCheckout();
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return false;
    }

    openModal('payment');
    return true;
  }, [validateCheckout, toast]);

  /**
   * Complete transaction and payment
   * ✅ FIXED: Properly handles discount data
   */
  const completeTransaction = useCallback(async (paymentData) => {
    const totals = calculateTotals();

    // ✅ FIX: Ensure discount object has all required fields
    const discountData = cart.activeCart.discount.amount > 0 ? {
      type: cart.activeCart.discount.type || 'percentage',
      value: cart.activeCart.discount.value || 0,
      amount: cart.activeCart.discount.amount,
      reason: cart.activeCart.discount.reason || null,
      pointsUsed: cart.activeCart.discount.pointsUsed || 0
    } : null;

    console.log('💳 Completing transaction with discount:', discountData);

    // Build transaction data
    const transactionData = {
      items: cart.activeCart.items,
      subtotal: totals.subtotal,
      discount: discountData,
      tax: {
        rate: taxRate,
        amount: totals.taxAmount,
      },
      total: totals.total,
      payment: paymentData,
      customer: cart.activeCart.customer,
      cashier: {
        id: localStorage.getItem('userId') || 'user-1',
        name: localStorage.getItem('userName') || 'Current User',
      },
      timestamp: new Date().toISOString(),
    };

    // Validate transaction
    const validationErrors = validateTransactionData(transactionData);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      throw new Error(validationErrors[0]);
    }

    try {
      // Create transaction via API
      const createdTransaction = await createTransaction(transactionData);
      console.log('✅ Created transaction:', createdTransaction);

      // Transform response
      const frontendTransaction = transformTransactionForFrontend(createdTransaction);

      // Update state
      setSelectedTransaction(frontendTransaction);

      console.log('📊 Transaction completed:', {
        original: transactionData,
        created: createdTransaction,
        transformed: frontendTransaction
      });
      
      setTransactions(prev => [frontendTransaction, ...prev]);

      // Clear cart
      cart.clearCart(true);

      // Close payment modal, open receipt
      closeModal('payment');
      setTimeout(() => {
        openModal('receipt');
      }, 300);

      toast.success('Transaction completed successfully!');
      return frontendTransaction;
    } catch (error) {
      console.error('❌ Transaction error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to complete transaction';
      toast.error(errorMessage);
      throw error;
    }
  }, [cart, calculateTotals, taxRate, toast]);

  /**
   * View transaction details
   */
  const viewTransaction = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    openModal('receipt');
  }, []);

  /**
   * Start new transaction
   */
  const newTransaction = useCallback(() => {
    setSelectedTransaction(null);
    closeModal('receipt');
    cart.clearCart(true);
    toast.info('Ready for new transaction');
  }, [cart, toast]);

  /**
   * Modal management
   */
  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  const toggleModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: !prev[modalName] }));
  }, []);

  return {
    // Data
    products,
    transactions,
    customers,
    selectedTransaction,

    // Loading states
    isLoadingProducts,
    isLoadingTransactions,
    isLoading: isLoadingProducts || isLoadingTransactions,

    // Cart (from context)
    cart,
    totals: calculateTotals(),

    // Search & filter
    searchQuery,
    categoryFilter,
    searchProducts,
    filterByCategory,

    // Product operations
    findProductByBarcode,
    handleBarcodeScan,

    // Transaction operations
    validateCheckout,
    handleCheckout,
    completeTransaction,
    viewTransaction,
    newTransaction,

    // Data refresh
    fetchProducts,
    fetchTransactions,
    refreshAll: useCallback(() => {
      fetchProducts();
      fetchTransactions();
    }, [fetchProducts, fetchTransactions]),

    // Modal states
    modals,
    openModal,
    closeModal,
    toggleModal,

    // Config
    taxRate,
  };
};