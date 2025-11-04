// src/services/transactionService.js
import { get, post, put, del } from '../utils/apiClient';
import { authStorage } from '../utils/storage';

/**
 * Get all transactions with pagination and filters
 */
export const getAllTransactions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.active !== undefined) queryParams.append('active', params.active);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to fetch transactions';
    throw new Error(message);
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (id, includeRelations = true) => {
  try {
    const response = await get(`/transactions/${id}`, {
      params: { include_relations: includeRelations }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new transaction (POS Sale)
 */
export const createTransaction = async (transactionData) => {
  try {
    const payload = transformTransactionForBackend(transactionData);
    
    console.log('📦 Creating transaction with payload:', payload);
    
    const response = await post('/transactions', payload);
    console.log('✅ Transaction created:', response);
    return response;
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    throw error;
  }
};

/**
 * Transform frontend transaction data to backend format
 * FIXED: Properly applies discounts to transaction
 */
const transformTransactionForBackend = (frontendData) => {
  const {
    items = [],
    subtotal,
    discount,
    tax,
    total,
    payment,
    customer,
    cashier,
    timestamp,
    id: frontendId,
    ...rest
  } = frontendData;

  // Get authenticated user data
  const currentUser = authStorage.getUserData();
  
  if (!currentUser) {
    throw new Error('User not authenticated. Please login again.');
  }

  const branchId = currentUser.branchId || currentUser.branch?.id;
  const cashierId = currentUser.id;

  console.log('🔐 Using authenticated user:', {
    userId: cashierId,
    branchId: branchId,
    userName: currentUser.name,
    userRole: currentUser.role
  });

  // Validate required data
  if (!branchId) {
    throw new Error('Branch information not found. Please contact support.');
  }

  if (!cashierId) {
    throw new Error('User ID not found. Please login again.');
  }

  // ✅ FIX: Calculate discount distribution across items
  const totalItemsValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discount?.amount || 0;
  
  console.log('💰 Discount calculation:', {
    totalItemsValue,
    discountAmount,
    discountType: discount?.type,
    discountValue: discount?.value
  });

  // Transform cart items to transaction lines with proportional discount
  const lines = items.map(item => {
    const itemSubtotal = item.price * item.quantity;
    
    // ✅ FIX: Distribute discount proportionally across items
    const itemDiscount = discountAmount > 0 
      ? (itemSubtotal / totalItemsValue) * discountAmount 
      : 0;
    
    const itemAfterDiscount = itemSubtotal - itemDiscount;
    const itemTaxAmount = itemAfterDiscount * (tax.rate / 100);
    const itemLineTotal = itemAfterDiscount; // Backend adds tax separately

    console.log(`📝 Line item: ${item.name}`, {
      quantity: item.quantity,
      unitPrice: item.price,
      itemSubtotal,
      itemDiscount: itemDiscount.toFixed(2),
      itemAfterDiscount: itemAfterDiscount.toFixed(2),
      itemTaxAmount: itemTaxAmount.toFixed(2),
      lineTotal: itemLineTotal.toFixed(2)
    });

    return {
      productId: item.id,
      qty: item.quantity,
      unitPrice: item.price,
      discount: parseFloat(itemDiscount.toFixed(2)), // ✅ Store proportional discount per line
      taxAmount: parseFloat(itemTaxAmount.toFixed(2)),
      lineTotal: parseFloat(itemLineTotal.toFixed(2))
    };
  });

  // Transform payment data
  const payments = payment ? [{
    method: payment.method.toUpperCase(),
    amount: payment.amount
  }] : [];

  // Calculate loyalty points
  const loyaltyPointsEarned = customer ? Math.floor(total / 100) : 0;
  const loyaltyPointsUsed = discount?.type === 'loyalty' ? (discount.pointsUsed || 0) : 0;

  // ✅ FIX: Store complete discount information in metadata
  const payload = {
    branchId,
    cashierId,
    customerId: customer?.id || null,
    lines,
    payments,
    loyaltyPointsEarned,
    loyaltyPointsUsed,
    metadata: {
      // Discount details
      discountApplied: discountAmount > 0,
      discountType: discount?.type || null,
      discountValue: discount?.value || 0,
      discountAmount: discountAmount,
      discountReason: discount?.reason || null,
      
      // Original amounts (before discount)
      subtotalBeforeDiscount: subtotal,
      subtotalAfterDiscount: subtotal - discountAmount,
      
      // Tax details
      taxRate: tax.rate,
      taxAmount: tax.amount,
      
      // Totals
      finalTotal: total,
      
      // Additional info
      originalTransactionId: frontendId,
      posVersion: '1.0.0',
      cashierName: currentUser.name,
      cashierEmail: currentUser.email,
      timestamp: timestamp,
      ...rest
    }
  };

  console.log('📤 Final payload to backend:', JSON.stringify(payload, null, 2));

  return payload;
};

/**
 * Update transaction
 */
export const updateTransaction = async (id, updates) => {
  try {
    const response = await put(`/transactions/${id}`, updates);
    return response;
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (id) => {
  try {
    const response = await del(`/transactions/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Get transactions by branch
 */
export const getTransactionsByBranch = async (branchId, params = {}) => {
  try {
    const response = await get(`/transactions/branch/${branchId}`, { params });
    return response;
  } catch (error) {
    console.error(`Error fetching transactions for branch ${branchId}:`, error);
    throw error;
  }
};

/**
 * Get transactions by customer
 */
export const getTransactionsByCustomer = async (customerId, params = {}) => {
  try {
    const response = await get(`/transactions/customer/${customerId}`, { params });
    return response;
  } catch (error) {
    console.error(`Error fetching transactions for customer ${customerId}:`, error);
    throw error;
  }
};

/**
 * Get transaction receipt
 */
export const getTransactionReceipt = async (id) => {
  try {
    const response = await get(`/transactions/${id}/receipt`);
    return response;
  } catch (error) {
    console.error(`Error fetching receipt for transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Transform backend transaction to frontend format
 * ✅ FIX: Properly reconstructs discount from metadata and lines
 */
export const transformTransactionForFrontend = (backendTransaction) => {
  if (!backendTransaction) return null;

  // ✅ FIX: Calculate total discount from transaction lines
  const totalDiscountFromLines = backendTransaction.lines?.reduce(
    (sum, line) => sum + parseFloat(line.discount || 0), 
    0
  ) || 0;

  // ✅ FIX: Get discount info from metadata or calculate from lines
  const discountInfo = backendTransaction.metadata?.discountApplied ? {
    type: backendTransaction.metadata.discountType,
    value: backendTransaction.metadata.discountValue,
    amount: backendTransaction.metadata.discountAmount || totalDiscountFromLines,
    reason: backendTransaction.metadata.discountReason
  } : totalDiscountFromLines > 0 ? {
    type: 'unknown',
    value: 0,
    amount: totalDiscountFromLines,
    reason: null
  } : null;

  return {
    id: backendTransaction.id,
    receiptNumber: backendTransaction.receiptNumber,
    timestamp: backendTransaction.createdAt,
    
    // Items transformation
    items: backendTransaction.lines?.map(line => ({
      id: line.product?.id,
      name: line.product?.name,
      sku: line.product?.sku,
      price: parseFloat(line.unitPrice),
      quantity: line.qty,
      discount: parseFloat(line.discount || 0),
      taxAmount: parseFloat(line.taxAmount || 0),
      total: parseFloat(line.lineTotal)
    })) || [],
    
    // Customer data
    customer: backendTransaction.customer ? {
      id: backendTransaction.customer.id,
      name: backendTransaction.customer.name,
      phone: backendTransaction.customer.phone,
      email: backendTransaction.customer.email,
      loyaltyNumber: backendTransaction.customer.loyaltyNumber,
      loyaltyPoints: backendTransaction.customer.loyaltyPoints
    } : null,
    
    // Cashier data
    cashier: backendTransaction.cashier ? {
      id: backendTransaction.cashier.id,
      name: backendTransaction.cashier.name,
      email: backendTransaction.cashier.email
    } : null,
    
    // Financial data
    subtotal: parseFloat(backendTransaction.totalNet),
    tax: {
      rate: backendTransaction.metadata?.taxRate || 17,
      amount: parseFloat(backendTransaction.totalTax)
    },
    total: parseFloat(backendTransaction.totalGross),
    totalGross: parseFloat(backendTransaction.totalGross),
    
    // ✅ FIX: Discount data properly reconstructed
    discount: discountInfo,
    
    // Payment data
    payment: backendTransaction.payments?.[0] ? {
      method: backendTransaction.payments[0].method,
      amount: parseFloat(backendTransaction.payments[0].amount),
      change: parseFloat(backendTransaction.payments[0].amount) - parseFloat(backendTransaction.totalGross)
    } : null,
    payments: backendTransaction.payments?.map(p => ({
      method: p.method,
      amount: parseFloat(p.amount),
      createdAt: p.createdAt
    })) || [],
    
    // Status and metadata
    status: backendTransaction.status,
    branch: backendTransaction.branch,
    loyaltyPointsEarned: backendTransaction.loyaltyPointsEarned || 0,
    loyaltyPointsUsed: backendTransaction.loyaltyPointsUsed || 0,
    
    // Returns if any
    returns: backendTransaction.returns || [],
    refundedAmount: parseFloat(backendTransaction.refundedAmount || 0),
    
    // Full metadata for debugging
    _metadata: backendTransaction.metadata
  };
};

/**
 * Helper: Get current branch ID
 */
export const getCurrentBranchId = () => {
  const currentUser = authStorage.getUserData();
  return currentUser?.branchId || currentUser?.branch?.id || null;
};

/**
 * Helper: Get current cashier ID
 */
export const getCurrentCashierId = () => {
  const currentUser = authStorage.getUserData();
  return currentUser?.id || null;
};

/**
 * Helper: Validate transaction data before sending
 */
export const validateTransactionData = (transactionData) => {
  const errors = [];

  // Check authentication
  const currentUser = authStorage.getUserData();
  if (!currentUser) {
    errors.push('User not authenticated. Please login.');
    return errors;
  }

  if (!currentUser.branchId && !currentUser.branch?.id) {
    errors.push('User branch information not found.');
  }

  if (!transactionData.items || transactionData.items.length === 0) {
    errors.push('Transaction must have at least one item');
  }

  if (!transactionData.payment || !transactionData.payment.method) {
    errors.push('Payment method is required');
  }

  if (transactionData.payment && transactionData.payment.amount < transactionData.total) {
    errors.push('Payment amount must be greater than or equal to total');
  }

  transactionData.items?.forEach((item, index) => {
    if (!item.id) errors.push(`Item ${index + 1}: Product ID is required`);
    if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Invalid quantity`);
    if (!item.price || item.price <= 0) errors.push(`Item ${index + 1}: Invalid price`);
  });

  return errors;
};

export default {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByBranch,
  getTransactionsByCustomer,
  getTransactionReceipt,
  transformTransactionForFrontend,
  validateTransactionData,
  getCurrentBranchId,
  getCurrentCashierId
};