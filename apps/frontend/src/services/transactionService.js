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
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.include_relations !== undefined) {
      queryParams.append('include_relations', params.include_relations);
    }

    const url = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await get(url);
    console.log('✅ Fetched transactions:', data);
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
    const params = { include_relations: includeRelations ? 'true' : 'false' };
    const response = await get(`/transactions/${id}`, { params });
    return response;
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
 * ✅ FIXED: Properly matches backend schema expectations
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

  // ✅ FIX: Transform cart items to match backend expectations
  const lines = items.map(item => {
    const itemSubtotal = item.price * item.quantity;
    
    // Distribute discount proportionally across items
    const itemDiscount = discountAmount > 0 
      ? (itemSubtotal / totalItemsValue) * discountAmount 
      : 0;
    
    const itemAfterDiscount = itemSubtotal - itemDiscount;
    
    // ✅ FIX: Tax is calculated on discounted amount
    const itemTaxAmount = itemAfterDiscount * (tax.rate / 100);
    
    // ✅ FIX: lineTotal = subtotal - discount (tax is added separately by backend)
    const itemLineTotal = itemAfterDiscount;

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
      unitPrice: parseFloat(item.price.toFixed(2)),
      discount: parseFloat(itemDiscount.toFixed(2)),
      taxAmount: parseFloat(itemTaxAmount.toFixed(2)),
      lineTotal: parseFloat(itemLineTotal.toFixed(2))
    };
  });

  // ✅ FIX: Transform payment data to match backend enum
  const payments = payment ? [{
    method: payment.method.toUpperCase(), // CASH, CARD, MOBILE
    amount: parseFloat(payment.amount.toFixed(2))
  }] : [];

  // Calculate loyalty points
  const loyaltyPointsEarned = customer ? Math.floor(total / 100) : 0;
  const loyaltyPointsUsed = discount?.type === 'loyalty' ? (discount.pointsUsed || 0) : 0;

  // ✅ FIX: Build payload matching backend expectations
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
 * Get transaction receipt by RECEIPT NUMBER (not transaction ID)
 * Use this when customer brings physical receipt
 * @param {string} receiptNumber - Receipt number (e.g., "STMA-20251106-0001")
 * @returns {Promise<Object>} - Formatted transaction data
 */
export const getTransactionByReceiptNumber = async (receiptNumber) => {
  try {
    console.log('🔍 Fetching transaction by receipt number:', receiptNumber);
    
    const response = await get(`/transactions/receipt/${receiptNumber}`);
    
    console.log('✅ Receipt found:', response);
    
    // Transform backend data to frontend format
    return transformTransactionForFrontend(response);
  } catch (error) {
    console.error(`❌ Error fetching receipt ${receiptNumber}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error(`Receipt not found: ${receiptNumber}`);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to fetch receipt');
  }
};

/**
 * Transform backend transaction to frontend format
 * ✅ FIXED: Properly reconstructs data from backend response
 */
export const transformTransactionForFrontend = (backendTransaction) => {
  if (!backendTransaction) return null;

  // ✅ FIX: Calculate total discount from transaction lines
  const totalDiscountFromLines = backendTransaction.lines?.reduce(
    (sum, line) => sum + parseFloat(line.discount || 0), 
    0
  ) || 0;

  // ✅ FIX: Get discount info from metadata
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

  // ✅ FIX: Use _count if available, otherwise calculate from arrays
  const itemsCount = backendTransaction._count?.lines || backendTransaction.lines?.length || 0;
  const paymentsCount = backendTransaction._count?.payments || backendTransaction.payments?.length || 0;
  const returnsCount = backendTransaction._count?.returns || backendTransaction.returns?.length || 0;

  return {
    id: backendTransaction.id,
    receiptNumber: backendTransaction.receiptNumber,
    timestamp: backendTransaction.createdAt,
    
    // ✅ FIX: Use _count structure
    items_count: itemsCount,
    payments_count: paymentsCount,
    returns_count: returnsCount,
    
    // Items transformation
    items: backendTransaction.lines?.map(line => ({
      id: line.product?.id,
      name: line.product?.name,
      sku: line.product?.sku,
      price: parseFloat(line.unitPrice),
      quantity: line.qty,
      discount: parseFloat(line.discount || 0),
      taxAmount: parseFloat(line.taxAmount || 0),
      subtotal: parseFloat(line.unitPrice) * line.qty,
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
    
    // ✅ FIX: Financial data matches backend structure
    // totalNet = subtotal (before tax)
    // totalTax = tax amount
    // totalGross = total (including tax)
    subtotal: parseFloat(backendTransaction.totalNet),
    tax: {
      rate: backendTransaction.metadata?.taxRate || 17,
      amount: parseFloat(backendTransaction.totalTax)
    },
    total: parseFloat(backendTransaction.totalGross),
    totalGross: parseFloat(backendTransaction.totalGross),
    totalNet: parseFloat(backendTransaction.totalNet),
    totalTax: parseFloat(backendTransaction.totalTax),
    
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
    _metadata: backendTransaction.metadata,
    _count: {
      lines: itemsCount,
      payments: paymentsCount,
      returns: returnsCount
    }
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
  getTransactionByReceiptNumber,
  transformTransactionForFrontend,
  validateTransactionData,
  getCurrentBranchId,
  getCurrentCashierId
};