// src/services/transactionService.js
import { get, post, put, del } from '../utils/apiClient';
import { authStorage } from '../utils/storage';

/**
 * ✅ UPDATED: Get all transactions with LIGHTWEIGHT fetching by default
 * Pass includeRelations=true only when you need full details
 */
export const getAllTransactions = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.branchId) queryParams.append('branchId', params.branchId);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    // ✅ FIX: Default to lightweight fetching for lists
    const includeRelations = params.includeRelations ?? params.include_relations ?? false;
    queryParams.append('include_relations', includeRelations ? 'true' : 'false');

    const url = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    console.log('✅ Fetched transactions (lightweight):', data);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Failed to fetch transactions';
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
  }
};

/**
 * ✅ UPDATED: Get transaction by ID with FULL DETAILS by default
 * This is used for viewing receipts and transaction details
 */
export const getTransactionById = async (id, includeRelations = true) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('include_relations', includeRelations ? 'true' : 'false');
    
    const url = `/transactions/${id}?${queryParams.toString()}`;
    const response = await get(url);
    console.log('✅ Fetched transaction details:', response);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || error.message || `Failed to fetch transaction ${id}`;
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
  }
};

/**
 * ✅ NEW: Lightweight fetch for lists (summary data only)
 */
export const getTransactionsSummary = async (params = {}) => {
  return getAllTransactions({
    ...params,
    includeRelations: false, // Force lightweight
  });
};

/**
 * ✅ NEW: Get full transaction details (for receipt view)
 */
export const getTransactionDetails = async (id) => {
  return getTransactionById(id, true); // Force full details
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
    const message = error.response?.data?.message || error.message || 'Failed to create transaction';
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
  }
};

/**
 * Transform frontend transaction data to backend format
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

  const currentUser = authStorage.getUserData();
  
  if (!currentUser) {
    throw new Error('User not authenticated. Please login again.');
  }

  const branchId = currentUser.branchId || currentUser.branch?.id;
  const cashierId = currentUser.id;

  if (!branchId) {
    throw new Error('Branch information not found. Please contact support.');
  }

  if (!cashierId) {
    throw new Error('User ID not found. Please login again.');
  }

  const totalItemsValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discount?.amount || 0;

  const lines = items.map(item => {
    const itemSubtotal = item.price * item.quantity;
    const itemDiscount = discountAmount > 0 
      ? (itemSubtotal / totalItemsValue) * discountAmount 
      : 0;
    const itemAfterDiscount = itemSubtotal - itemDiscount;
    const itemTaxAmount = itemAfterDiscount * (tax.rate / 100);
    const itemLineTotal = itemAfterDiscount;

    return {
      productId: item.id,
      qty: item.quantity,
      unitPrice: parseFloat(item.price.toFixed(2)),
      discount: parseFloat(itemDiscount.toFixed(2)),
      taxAmount: parseFloat(itemTaxAmount.toFixed(2)),
      lineTotal: parseFloat(itemLineTotal.toFixed(2))
    };
  });

  const payments = payment ? [{
    method: payment.method.toUpperCase(),
    amount: parseFloat(payment.amount.toFixed(2))
  }] : [];

  const loyaltyPointsEarned = customer ? Math.floor(total / 100) : 0;
  const loyaltyPointsUsed = discount?.type === 'loyalty' ? (discount.pointsUsed || 0) : 0;

  const payload = {
    branchId,
    cashierId,
    customerId: customer?.id || null,
    lines,
    payments,
    loyaltyPointsEarned: parseInt(loyaltyPointsEarned),
    loyaltyPointsUsed: parseInt(loyaltyPointsUsed),
    metadata: {
      discountApplied: discountAmount > 0,
      discountType: discount?.type || null,
      discountValue: discount?.value || 0,
      discountAmount: discountAmount,
      taxRate: tax?.rate || 17,
      taxAmount: tax?.amount || 0,
      finalTotal: total,
      subtotalBeforeDiscount: subtotal,
      subtotalAfterDiscount: subtotal - discountAmount,
      timestamp: timestamp || new Date().toISOString(),
      posVersion: '1.0.0'
    }
  };

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
    const message = error.response?.data?.message || error.message || `Failed to update transaction ${id}`;
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
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
    const message = error.response?.data?.message || error.message || `Failed to delete transaction ${id}`;
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
  }
};

/**
 * Get transactions by branch
 */
export const getTransactionsByBranch = async (branchId, params = {}) => {
  try {
    // ✅ FIX: Default to lightweight for lists
    const includeRelations = params.includeRelations ?? false;
    const queryParams = new URLSearchParams({
      ...params,
      include_relations: includeRelations ? 'true' : 'false'
    });
    
    const response = await get(`/transactions/branch/${branchId}?${queryParams.toString()}`);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || error.message || `Failed to fetch transactions for branch ${branchId}`;
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
  }
};

/**
 * Get transactions by customer
 */
export const getTransactionsByCustomer = async (customerId, params = {}) => {
  try {
    // ✅ FIX: Default to lightweight for lists
    const includeRelations = params.includeRelations ?? false;
    const queryParams = new URLSearchParams({
      ...params,
      include_relations: includeRelations ? 'true' : 'false'
    });
    
    const response = await get(`/transactions/customer/${customerId}?${queryParams.toString()}`);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || error.message || `Failed to fetch transactions for customer ${customerId}`;
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
  }
};

/**
 * Get transaction receipt by RECEIPT NUMBER (not ID)
 */
export const getTransactionByReceiptNumber = async (receiptNumber) => {
  try {
    console.log('🔍 Fetching transaction by receipt number:', receiptNumber);
    const response = await get(`/transactions/receipt/${receiptNumber}`);
    console.log('✅ Receipt found:', response);
    return response;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Receipt not found: ${receiptNumber}`);
    }
    const message = error.response?.data?.message || 'Failed to fetch receipt';
    const backendError = new Error(message);
    backendError.response = error.response;
    throw backendError;
  }
};

/**
 * ✅ UPDATED: Transform backend transaction to frontend format
 * Handles both lightweight and full transaction objects
 */
export const transformTransactionForFrontend = (backendTransaction) => {
  if (!backendTransaction) return null;

  // Calculate total discount from transaction lines (if available)
  const totalDiscountFromLines = backendTransaction.lines?.reduce(
    (sum, line) => sum + parseFloat(line.discount || 0), 
    0
  ) || 0;

  // Get discount info from metadata
  const discountInfo = backendTransaction.metadata?.discountApplied ? {
    type: backendTransaction.metadata.discountType,
    value: backendTransaction.metadata.discountValue || 0,
    amount: backendTransaction.metadata.discountAmount || totalDiscountFromLines,
    reason: backendTransaction.metadata.discountReason || null,
    pointsUsed: backendTransaction.loyaltyPointsUsed || 0
  } : totalDiscountFromLines > 0 ? {
    type: 'unknown',
    value: 0,
    amount: totalDiscountFromLines,
    reason: null,
    pointsUsed: 0
  } : null;

  // Use _count if available, otherwise calculate from arrays
  const itemsCount = backendTransaction._count?.lines || backendTransaction.lines?.length || 0;
  const paymentsCount = backendTransaction._count?.payments || backendTransaction.payments?.length || 0;
  const returnsCount = backendTransaction._count?.returns || backendTransaction.returns?.length || 0;

  // ✅ Base transaction data (always present)
  const transformed = {
    id: backendTransaction.id,
    receiptNumber: backendTransaction.receiptNumber,
    timestamp: backendTransaction.createdAt,
    
    // Counts
    items_count: itemsCount,
    payments_count: paymentsCount,
    returns_count: returnsCount,
    
    // Financial data (always present)
    subtotal: parseFloat(backendTransaction.totalNet),
    tax: {
      rate: backendTransaction.metadata?.taxRate || 17,
      amount: parseFloat(backendTransaction.totalTax)
    },
    total: parseFloat(backendTransaction.totalGross),
    totalGross: parseFloat(backendTransaction.totalGross),
    totalNet: parseFloat(backendTransaction.totalNet),
    totalTax: parseFloat(backendTransaction.totalTax),
    
    discount: discountInfo,
    
    // Status and metadata
    status: backendTransaction.status,
    refundedAmount: parseFloat(backendTransaction.refundedAmount || 0),
    loyaltyPointsEarned: backendTransaction.loyaltyPointsEarned || 0,
    loyaltyPointsUsed: backendTransaction.loyaltyPointsUsed || 0,
  };

  // ✅ Add detailed data only if relations were included
  if (backendTransaction.lines && Array.isArray(backendTransaction.lines)) {
    transformed.items = backendTransaction.lines.map(line => ({
      id: line.product?.id,
      name: line.product?.name,
      sku: line.product?.sku,
      price: parseFloat(line.unitPrice),
      quantity: line.qty,
      discount: parseFloat(line.discount || 0),
      taxAmount: parseFloat(line.taxAmount || 0),
      subtotal: parseFloat(line.unitPrice) * line.qty,
      total: parseFloat(line.lineTotal)
    }));
  }

  if (backendTransaction.customer) {
    transformed.customer = {
      id: backendTransaction.customer.id,
      name: backendTransaction.customer.name,
      phone: backendTransaction.customer.phone,
      email: backendTransaction.customer.email,
      loyaltyNumber: backendTransaction.customer.loyaltyNumber,
      loyaltyPoints: backendTransaction.customer.loyaltyPoints
    };
  }

  if (backendTransaction.cashier) {
    transformed.cashier = {
      id: backendTransaction.cashier.id,
      name: backendTransaction.cashier.name,
      email: backendTransaction.cashier.email
    };
  }

  if (backendTransaction.branch) {
    transformed.branch = backendTransaction.branch;
  }

  if (backendTransaction.payments && Array.isArray(backendTransaction.payments)) {
    transformed.payment = backendTransaction.payments[0] ? {
      method: backendTransaction.payments[0].method,
      amount: parseFloat(backendTransaction.payments[0].amount),
      change: parseFloat(backendTransaction.payments[0].amount) - parseFloat(backendTransaction.totalGross)
    } : null;
    
    transformed.payments = backendTransaction.payments.map(p => ({
      method: p.method,
      amount: parseFloat(p.amount),
      createdAt: p.createdAt
    }));
  }

  if (backendTransaction.returns && Array.isArray(backendTransaction.returns)) {
    transformed.returns = backendTransaction.returns;
  }

  // Full metadata for debugging
  transformed._metadata = backendTransaction.metadata;
  transformed._count = {
    lines: itemsCount,
    payments: paymentsCount,
    returns: returnsCount
  };

  return transformed;
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
  getTransactionsSummary, // ✅ NEW
  getTransactionDetails, // ✅ NEW
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByBranch,
  getTransactionsByCustomer,
  getTransactionByReceiptNumber,
  transformTransactionForFrontend,
  validateTransactionData,
  getCurrentBranchId,
  getCurrentCashierId
};