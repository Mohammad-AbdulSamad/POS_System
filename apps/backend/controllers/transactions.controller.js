// controllers/transactions.controller.js - PRODUCTION READY
import { PrismaClient, Prisma } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";
import {store} from "../config/constants.config.js"; 
const prisma = new PrismaClient();

// ========================================
// 🔥 HELPER FUNCTIONS
// ========================================



import dayjs from "dayjs";

async function generateReceiptId(storeCode = store) {
  const dateStr = dayjs().format("YYYYMMDD");



  // Count today's transactions for this store
  const count = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: new Date(dayjs().startOf("day")),
        lte: new Date(dayjs().endOf("day")),
      },
    },
  });

  const number = String(count + 1).padStart(4, "0");
  return `${storeCode}-${dateStr}-${number}`;
}


/**
 * 🔥 PRODUCTION OPTIMIZATION: Batch product validation to prevent N+1 queries
 */
const validateAndFetchProducts = async (lines) => {
  const productIds = [...new Set(lines.map(l => l.productId))];
  
  if (productIds.length === 0) {
    throw new BadRequestError('Transaction must have at least one product');
  }
  
  const products = await prisma.product.findMany({
    where: { 
      id: { in: productIds },
      active: true 
    },
    select: { 
      id: true, 
      name: true, 
      sku: true,
      stock: true, 
      priceGross: true,
      cost: true
    }
  });

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  
  // Validate all products exist and are active
  const missingProducts = productIds.filter(id => !productMap[id]);
  if (missingProducts.length > 0) {
    throw new NotFoundError(`Products not found or inactive: ${missingProducts.join(', ')}`);
  }

  console.log('✅ Validated products:', Object.keys(productMap).length);
  return productMap;
};

/**
 * 🔥 PRODUCTION OPTIMIZATION: Calculate totals in memory (no DB calls)
 * ✅ FIXED: Properly handles discounts and validates stock
 */
const calculateTransactionTotals = (lines, productMap) => {
  let totalNet = 0;
  let totalTax = 0;
  const validatedLines = [];
  const stockUpdates = {};

  for (const line of lines) {
    const { productId, qty, unitPrice, discount = 0, taxAmount = 0 } = line;
    
    // Validate line data
    if (!productId || !qty || !unitPrice) {
      throw new BadRequestError('Invalid transaction line: missing productId, qty, or unitPrice');
    }

    if (qty <= 0) {
      throw new BadRequestError(`Invalid quantity for product ${productId}: ${qty}`);
    }

    if (unitPrice < 0) {
      throw new BadRequestError(`Invalid unit price for product ${productId}: ${unitPrice}`);
    }

    const product = productMap[productId];

    // Accumulate stock changes (handle multiple lines with same product)
    stockUpdates[productId] = (stockUpdates[productId] || 0) + parseInt(qty);

    // ✅ FIX: Check stock availability (accumulated across all lines)
    if (product.stock < stockUpdates[productId]) {
      throw new BadRequestError(
        `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${stockUpdates[productId]}`
      );
    }

    // ✅ FIX: Calculate line totals properly
    // lineTotal = (unitPrice * qty) - discount
    // taxAmount is calculated on the discounted amount
    const lineSubtotal = parseFloat(unitPrice) * parseInt(qty);
    const lineDiscount = parseFloat(discount);
    const lineTotal = lineSubtotal - lineDiscount;
    const lineTax = parseFloat(taxAmount);

    // Validate calculations
    if (lineTotal < 0) {
      throw new BadRequestError(
        `Invalid line total for ${product.name}: discount (${lineDiscount}) exceeds subtotal (${lineSubtotal})`
      );
    }

    totalNet += lineTotal;
    totalTax += lineTax;

    validatedLines.push({
      productId,
      unitPrice: parseFloat(unitPrice),
      qty: parseInt(qty),
      discount: lineDiscount,
      taxAmount: lineTax,
      lineTotal: parseFloat(lineTotal.toFixed(2))
    });

    console.log(`📝 Line validated: ${product.name} | Qty: ${qty} | Price: ${unitPrice} | Discount: ${lineDiscount} | Tax: ${lineTax} | Total: ${lineTotal.toFixed(2)}`);
  }

  const totalGross = totalNet + totalTax;

  console.log('💰 Transaction totals calculated:', {
    totalNet: totalNet.toFixed(2),
    totalTax: totalTax.toFixed(2),
    totalGross: totalGross.toFixed(2),
    lineCount: validatedLines.length
  });

  return {
    totalNet: parseFloat(totalNet.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalGross: parseFloat(totalGross.toFixed(2)),
    validatedLines,
    stockUpdates
  };
};

/**
 * ✅ NEW: Validate payment amounts
 */
const validatePayments = (payments, totalGross) => {
  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    throw new BadRequestError('At least one payment method is required');
  }

  const totalPayment = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  if (totalPayment < totalGross) {
    throw new BadRequestError(
      `Insufficient payment: Total payment (${totalPayment.toFixed(2)}) is less than total amount (${totalGross.toFixed(2)})`
    );
  }

  // Validate payment methods
  const validMethods = ['CASH', 'CARD', 'MOBILE'];
  for (const payment of payments) {
    if (!validMethods.includes(payment.method)) {
      throw new BadRequestError(`Invalid payment method: ${payment.method}. Must be one of: ${validMethods.join(', ')}`);
    }
    if (payment.amount <= 0) {
      throw new BadRequestError(`Invalid payment amount: ${payment.amount}`);
    }
  }

  return totalPayment;
};

// // ========================================
// // 🔥 TRANSACTION ENDPOINTS
// // ========================================

// /**
//  * ✅ Get all transactions with pagination and filters
//  * ✅ FIXED: Consistent _count structure
//  */
// export const getAllTransactions = asyncHandler(async (req, res) => {
//   const { 
//     include_relations = 'false',
//     branchId,
//     status,
//     startDate,
//     endDate,
//     page = 1,
//     limit = 50 
//   } = req.query;
  
//   const skip = (parseInt(page) - 1) * parseInt(limit);
  
//   const where = {
//     ...(branchId && { branchId }),
//     ...(status && { status }),
//     ...(startDate && endDate && {
//       createdAt: {
//         gte: new Date(startDate),
//         lte: new Date(endDate)
//       }
//     })
//   };

//   const [transactions, total] = await Promise.all([
//     prisma.transaction.findMany({
//       where,
//       include: include_relations === 'true' ? {
//         branch: { select: { id: true, name: true, address: true, phone: true } },
//         cashier: { select: { id: true, name: true, email: true } },
//         customer: { 
//           select: { 
//             id: true, 
//             name: true, 
//             phone: true, 
//             email: true,
//             loyaltyNumber: true,
//             loyaltyPoints: true 
//           } 
//         },
//         lines: {
//           include: {
//             product: {
//               select: { id: true, name: true, sku: true, unit: true }
//             }
//           }
//         },
//         payments: true,
//         returns: {
//           select: {
//             id: true,
//             returnAmount: true,
//             reason: true,
//             createdAt: true
//           }
//         },
//         _count: {
//           select: {
//             lines: true,
//             payments: true,
//             returns: true
//           }
//         }
//       } : {
//         branch: { select: { id: true, name: true } },
//         cashier: { select: { id: true, name: true } },
//         customer: { select: { id: true, name: true } },
//         payments: { select: { id: true, method: true, amount: true } },
//         _count: {
//           select: {
//             lines: true,
//             payments: true,
//             returns: true
//           }
//         }
//       },
//       skip: parseInt(skip),
//       take: parseInt(limit),
//       orderBy: { createdAt: 'desc' }
//     }),
//     prisma.transaction.count({ where })
//   ]);

//   logger.logDatabase('READ', {
//     model: 'Transaction',
//     count: transactions.length,
//     userId: req.user?.id,
//     filters: { branchId, status, startDate, endDate }
//   });
  
//   res.json({
//     transactions,
//     pagination: {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       total,
//       pages: Math.ceil(total / parseInt(limit))
//     }
//   });
// });

// Add this BEFORE getAllTransactions function

/**
 * ✅ Build search conditions based on selected field
 * More efficient than searching all fields
 */
const buildSearchConditions = (searchValue, searchField) => {
  const search = searchValue.trim();
  
  // If no specific field, search all fields (fallback)
  if (!searchField) {
    return [
      { receiptNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search, mode: 'insensitive' } } },
      { customer: { email: { contains: search, mode: 'insensitive' } } },
      { cashier: { name: { contains: search, mode: 'insensitive' } } },
      { id: search }
    ];
  }

  // Field-specific search (more efficient)
  switch (searchField) {
    case 'receiptNumber':
      return [
        { receiptNumber: { equals: search, mode: 'insensitive' } }, // Exact match first
        { receiptNumber: { contains: search, mode: 'insensitive' } } // Partial match
      ];
    
    case 'customerName':
      return [
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    
    case 'customerPhone':
      // Remove spaces and dashes for better matching
      const cleanPhone = search.replace(/[\s\-]/g, '');
      return [
        { customer: { phone: { contains: cleanPhone, mode: 'insensitive' } } }
      ];
    
    case 'customerEmail':
      return [
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ];
    
    case 'cashierName':
      return [
        { cashier: { name: { contains: search, mode: 'insensitive' } } }
      ];
    
    case 'transactionId':
      return [
        { id: search }
      ];
    
    default:
      // Fallback to receipt number if unknown field
      return [
        { receiptNumber: { contains: search, mode: 'insensitive' } }
      ];
  }
};

/**
 * ✅ Get all transactions with pagination, filters, and SEARCH
 * ✅ ADDED: Comprehensive search functionality
 */
export const getAllTransactions = asyncHandler(async (req, res) => {
  const { 
    include_relations = 'false',
    branchId,
    status,
    startDate,
    endDate,
    search, // ✅ Search value
    searchField, // ✅ NEW: Which field to search
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // ✅ Build where clause with search
  const where = {
    ...(branchId && { branchId }),
    ...(status && { status }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }),
    // ✅ IMPROVED: Field-specific search
    ...(search && {
      OR: buildSearchConditions(search, req.query.searchField)
    })
  };

  // ✅ NEW: Dynamic sorting
  const orderBy = {};
  
  // Handle different sort fields
  switch (sortBy) {
    case 'receiptNumber':
      orderBy.receiptNumber = sortOrder;
      break;
    case 'customer':
      orderBy.customer = { name: sortOrder };
      break;
    case 'cashier':
      orderBy.cashier = { name: sortOrder };
      break;
    case 'total':
    case 'totalGross':
      orderBy.totalGross = sortOrder;
      break;
    case 'timestamp':
    case 'createdAt':
    default:
      orderBy.createdAt = sortOrder;
      break;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: include_relations === 'true' ? {
        branch: { select: { id: true, name: true, address: true, phone: true } },
        cashier: { select: { id: true, name: true, email: true } },
        customer: { 
          select: { 
            id: true, 
            name: true, 
            phone: true, 
            email: true,
            loyaltyNumber: true,
            loyaltyPoints: true 
          } 
        },
        lines: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true }
            }
          }
        },
        payments: true,
        returns: {
          select: {
            id: true,
            returnAmount: true,
            reason: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            lines: true,
            payments: true,
            returns: true
          }
        }
      } : {
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        payments: { select: { id: true, method: true, amount: true } },
        _count: {
          select: {
            lines: true,
            payments: true,
            returns: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy
    }),
    prisma.transaction.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'Transaction',
    count: transactions.length,
    userId: req.user?.id,
    filters: { branchId, status, startDate, endDate, search }
  });
  
  res.json({
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

  


/**
 * ✅ NEW: Search transactions with advanced filters
 * Optimized for fast searching across multiple fields
 * Route: GET /api/transactions/search?q=STMA-20251106-0001
 */
export const searchTransactions = asyncHandler(async (req, res) => {
  const { 
    q, // Search query
    branchId,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 50 
  } = req.query;

  if (!q || q.trim() === '') {
    throw new BadRequestError('Search query is required');
  }

  const searchTerm = q.trim();
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build comprehensive search conditions
  const where = {
    ...(branchId && { branchId }),
    ...(status && { status }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }),
    OR: [
      // 1. Receipt Number (highest priority - exact match first)
      {
        receiptNumber: {
          equals: searchTerm,
          mode: 'insensitive'
        }
      },
      // 2. Receipt Number (partial match)
      {
        receiptNumber: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      // 3. Customer Name
      {
        customer: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      // 4. Customer Phone (remove spaces/dashes for better matching)
      {
        customer: {
          phone: {
            contains: searchTerm.replace(/[\s\-]/g, ''),
            mode: 'insensitive'
          }
        }
      },
      // 5. Customer Email
      {
        customer: {
          email: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      // 6. Customer Loyalty Number
      {
        customer: {
          loyaltyNumber: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      // 7. Cashier Name
      {
        cashier: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      // 8. Transaction ID (if pasting UUID)
      {
        id: searchTerm
      }
    ]
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        branch: { 
          select: { id: true, name: true } 
        },
        cashier: { 
          select: { id: true, name: true, email: true } 
        },
        customer: { 
          select: { 
            id: true, 
            name: true, 
            phone: true, 
            email: true,
            loyaltyNumber: true 
          } 
        },
        payments: { 
          select: { 
            id: true, 
            method: true, 
            amount: true 
          } 
        },
        _count: {
          select: {
            lines: true,
            payments: true,
            returns: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: [
        // Prioritize exact receipt number matches
        { 
          receiptNumber: searchTerm.toUpperCase().startsWith('STMA-') || 
                        searchTerm.toUpperCase().startsWith('REC-') 
            ? 'desc' 
            : 'asc' 
        },
        { createdAt: 'desc' }
      ]
    }),
    prisma.transaction.count({ where })
  ]);

  logger.info({
    message: 'Transaction search performed',
    searchQuery: searchTerm,
    resultsCount: transactions.length,
    userId: req.user?.id
  });

  res.json({
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    searchQuery: searchTerm
  });
});

/**
 * ✅ Get transaction by ID
 * ✅ FIXED: Removed conflicting select/include, added _count
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const { include_relations = 'true' } = req.query;
  
  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: include_relations === 'true' ? {
      branch: { 
        select: { 
          id: true, 
          name: true, 
          address: true, 
          phone: true 
        } 
      },
      cashier: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true 
        } 
      },
      customer: {
        select: { 
          id: true, 
          name: true, 
          phone: true, 
          email: true,
          loyaltyNumber: true,
          loyaltyPoints: true,
          loyaltyTier: true
        }
      },
      lines: {
        include: {
          product: {
            select: { 
              id: true, 
              name: true, 
              sku: true, 
              unit: true,
              categoryId: true,
              imageUrl: true
            }
          }
        },
        orderBy: { id: 'asc' }
      },
      payments: {
        orderBy: { createdAt: 'asc' }
      },
      returns: {
        select: {
          id: true,
          returnAmount: true,
          reason: true,
          processedBy: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          lines: true,
          payments: true,
          returns: true
        }
      }
    } : {
      branch: { select: { id: true, name: true } },
      cashier: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      _count: {
        select: {
          lines: true,
          payments: true,
          returns: true
        }
      }
    }
  });
  
  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  logger.logDatabase('READ', {
    model: 'Transaction',
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(transaction);
});

/**
 * 🔥 ✅ Create transaction - PRODUCTION OPTIMIZED & FIXED
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const {
    branchId,
    cashierId,
    customerId,
    lines,
    payments,
    loyaltyPointsEarned = 0,
    loyaltyPointsUsed = 0,
    metadata
  } = req.body;
  
  // ✅ Validate required fields
  if (!branchId) throw new BadRequestError('Branch ID is required');
  if (!lines || lines.length === 0) throw new BadRequestError('Transaction must have at least one item');
  if (!payments || payments.length === 0) throw new BadRequestError('Payment information is required');
  
  console.log('🚀 Starting transaction creation:', {
    branchId,
    cashierId,
    customerId,
    lineCount: lines.length,
    paymentCount: payments.length
  });
  
  // 🔥 OPTIMIZATION 1: Batch validate branch, cashier, customer in parallel
  const [branch, cashier, customer] = await Promise.all([
    prisma.branch.findUnique({ where: { id: branchId } }),
    cashierId ? prisma.user.findUnique({ where: { id: cashierId } }) : null,
    customerId ? prisma.customer.findUnique({ 
      where: { id: customerId },
      select: { id: true, name: true, loyaltyPoints: true }
    }) : null
  ]);
  
  if (!branch) throw new NotFoundError('Branch not found');
  if (cashierId && !cashier) throw new NotFoundError('Cashier not found');
  if (customerId && !customer) throw new NotFoundError('Customer not found');
  
  // ✅ Validate loyalty points if being used
  if (loyaltyPointsUsed > 0 && (!customer || customer.loyaltyPoints < loyaltyPointsUsed)) {
    throw new BadRequestError(
      `Insufficient loyalty points. Available: ${customer?.loyaltyPoints || 0}, Required: ${loyaltyPointsUsed}`
    );
  }
  
  console.log('✅ Step 1: Validated branch, cashier, customer');
  
  // 🔥 OPTIMIZATION 2: Batch fetch and validate all products at once (prevents N+1)
  const productMap = await validateAndFetchProducts(lines);
  console.log('✅ Step 2: Products validated');
  
  // 🔥 OPTIMIZATION 3: Calculate totals in memory (no DB calls)
  const { totalNet, totalTax, totalGross, validatedLines, stockUpdates } = 
    calculateTransactionTotals(lines, productMap);
  console.log('✅ Step 3: Totals calculated');
  
  // ✅ NEW: Validate payment amounts
  const totalPayment = validatePayments(payments, totalGross);
  console.log('✅ Step 4: Payments validated');
  
  // Generate unique receipt number
  const receiptNumber = await generateReceiptId();
  console.log('📄 Receipt number generated:', receiptNumber);
  
  // 🔥 OPTIMIZATION 4: Use Prisma transaction with row-level locking
  const result = await prisma.$transaction(async (tx) => {
    // 🔥 CRITICAL: Lock product rows to prevent race conditions
    const productIds = Object.keys(stockUpdates);
    
   if (productIds.length > 0) {
  try {
    console.log('🔒 Locking products:', productIds);

    // Use Prisma.join with proper UUID casting
    await tx.$queryRaw(
      Prisma.sql`
        SELECT id 
        FROM "Product" 
        WHERE id IN (${Prisma.join(productIds)})
        FOR UPDATE
      `
    );

    console.log('✅ Products locked successfully');
  } catch (lockError) {
    console.error('❌ Lock error:', {
      message: lockError.message,
      code: lockError.code,
      productIds
    });
    throw new ConflictError('Unable to lock products. Please try again.');
  }
}
    // Create the transaction
    const newTransaction = await tx.transaction.create({
      data: {
        branchId,
        cashierId: cashierId || null,
        customerId: customerId || null,
        receiptNumber,
        totalGross,
        totalTax,
        totalNet,
        loyaltyPointsEarned: parseInt(loyaltyPointsEarned),
        loyaltyPointsUsed: parseInt(loyaltyPointsUsed),
        metadata: metadata || {},
        status: 'COMPLETED'
      }
    });
    
    console.log('✅ Transaction record created:', newTransaction.id);
    
    // 🔥 OPTIMIZATION 5: Batch create transaction lines
    await tx.transactionLine.createMany({
      data: validatedLines.map(line => ({
        transactionId: newTransaction.id,
        ...line
      }))
    });
    
    console.log('✅ Transaction lines created:', validatedLines.length);
    
    // 🔥 OPTIMIZATION 6: Batch update product stock
    const stockUpdatePromises = Object.entries(stockUpdates).map(([productId, qty]) =>
      tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: qty } }
      })
    );
    
    // 🔥 OPTIMIZATION 7: Batch create stock movements
    const stockMovementData = Object.entries(stockUpdates).map(([productId, qty]) => ({
      productId,
      branchId,
      change: -qty,
      reason: 'sale'
    }));
    
    await Promise.all([
      ...stockUpdatePromises,
      tx.stockMovement.createMany({ data: stockMovementData })
    ]);
    
    console.log('✅ Stock updated and movements logged');
    
    // 🔥 OPTIMIZATION 8: Batch create payments
    await tx.payment.createMany({
      data: payments.map(payment => ({
        transactionId: newTransaction.id,
        method: payment.method.toUpperCase(),
        amount: parseFloat(payment.amount)
      }))
    });
    
    console.log('✅ Payments recorded:', payments.length);
    
    // Update customer loyalty points if applicable
    if (customerId && (loyaltyPointsEarned > 0 || loyaltyPointsUsed > 0)) {
      const loyaltyTransactions = [];
      
      if (loyaltyPointsEarned > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { increment: parseInt(loyaltyPointsEarned) } }
        });
        
        loyaltyTransactions.push({
          customerId,
          points: parseInt(loyaltyPointsEarned),
          type: 'EARNED',
          reason: 'PURCHASE'
        });
      }
      
      if (loyaltyPointsUsed > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { decrement: parseInt(loyaltyPointsUsed) } }
        });
        
        loyaltyTransactions.push({
          customerId,
          points: parseInt(loyaltyPointsUsed),
          type: 'REDEEMED',
          reason: 'PURCHASE'
        });
      }
      
      if (loyaltyTransactions.length > 0) {
        await tx.loyaltyTransaction.createMany({ data: loyaltyTransactions });
      }
      
      console.log('✅ Loyalty points updated');
    }
    
    return newTransaction;
  }, {
    timeout: 10000, // 10 seconds
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
  });
  
  console.log('✅ Database transaction committed');
  
  // Fetch the complete transaction AFTER the transaction commits
  const completeTransaction = await prisma.transaction.findUnique({
    where: { id: result.id },
    include: {
      branch: { select: { id: true, name: true, address: true, phone: true } },
      cashier: { select: { id: true, name: true, email: true } },
      customer: { 
        select: { 
          id: true, 
          name: true, 
          phone: true, 
          email: true,
          loyaltyNumber: true,
          loyaltyPoints: true 
        } 
      },
      lines: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, unit: true }
          }
        }
      },
      payments: true,
      _count: {
        select: {
          lines: true,
          payments: true,
          returns: true
        }
      }
    }
  });

  // Log success
  logger.info({
    message: 'Transaction created successfully',
    transactionId: completeTransaction.id,
    receiptNumber: completeTransaction.receiptNumber,
    branchId,
    cashierId,
    customerId,
    totalGross,
    totalNet,
    totalTax,
    lineCount: validatedLines.length,
    paymentCount: payments.length,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.status(201).json(completeTransaction);
});

/**
 * ✅ Update transaction (limited - only status and metadata)
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  const { status, metadata } = req.body;
  
  const existingTransaction = await prisma.transaction.findUnique({
    where: { id: req.params.id }
  });
  
  if (!existingTransaction) {
    throw new NotFoundError('Transaction not found');
  }
  
  if (existingTransaction.status === 'COMPLETED' && status === 'PENDING') {
    throw new BadRequestError('Cannot change completed transaction back to pending');
  }
  
  const updatedTransaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status }),
      ...(metadata !== undefined && { metadata })
    },
    include: {
      branch: { select: { id: true, name: true } },
      cashier: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      _count: {
        select: {
          lines: true,
          payments: true,
          returns: true
        }
      }
    }
  });

  logger.info({
    message: 'Transaction updated',
    transactionId: req.params.id,
    userId: req.user?.id,
    changes: { status, metadata }
  });
  
  res.json(updatedTransaction);
});

/**
 * ✅ Delete transaction (soft delete - only pending transactions)
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const existingTransaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: {
      lines: {
        include: {
          product: true
        }
      }
    }
  });

  if (!existingTransaction) {
    throw new NotFoundError('Transaction not found');
  }

  if (existingTransaction.status === 'COMPLETED') {
    throw new BadRequestError('Cannot delete completed transaction. Use returns instead.');
  }

  await prisma.$transaction(async (tx) => {
    // Restore stock for each product
    for (const line of existingTransaction.lines) {
      await tx.product.update({
        where: { id: line.productId },
        data: {
          stock: { increment: line.qty }
        }
      });
      
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          branchId: existingTransaction.branchId,
          change: line.qty,
          reason: 'adjustment'
        }
      });
    }
    
    // Delete related records
    await tx.payment.deleteMany({
      where: { transactionId: req.params.id }
    });
    
    await tx.transactionLine.deleteMany({
      where: { transactionId: req.params.id }
    });
    
    await tx.transaction.delete({
      where: { id: req.params.id }
    });
  });

  logger.warn({
    message: 'Transaction deleted',
    transactionId: req.params.id,
    receiptNumber: existingTransaction.receiptNumber,
    userId: req.user?.id
  });
  
  res.json({ message: "Transaction deleted successfully" });
});

/**
 * ✅ Get transactions by branch
 */
export const getTransactionsByBranch = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, page = 1, limit = 100 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    branchId: req.params.branchId,
    ...(status && { status }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        cashier: { select: { name: true, email: true } },
        customer: { select: { name: true, phone: true } },
        _count: {
          select: {
            lines: true,
            payments: true,
            returns: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'Transaction',
    operation: 'getTransactionsByBranch',
    branchId: req.params.branchId,
    count: transactions.length,
    userId: req.user?.id
  });

  res.json({
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * ✅ Get transactions by customer
 */
export const getTransactionsByCustomer = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { customerId: req.params.customerId },
      include: {
        branch: { select: { name: true } },
        cashier: { select: { name: true } },
        _count: {
          select: {
            lines: true,
            payments: true,
            returns: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ 
      where: { customerId: req.params.customerId } 
    })
  ]);

  logger.logDatabase('READ', {
    model: 'Transaction',
    operation: 'getTransactionsByCustomer',
    customerId: req.params.customerId,
    count: transactions.length,
    userId: req.user?.id
  });

  res.json({
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * ✅ Get transaction receipt by RECEIPT NUMBER (not ID)
 * Real-world usage: Customer brings receipt with "STMA-20251106-0001"
 */
export const getTransactionReceipt = asyncHandler(async (req, res) => {
  const { receiptNumber } = req.params; // 👈 Changed from id to receiptNumber
  
  const transaction = await prisma.transaction.findUnique({
    where: { receiptNumber }, // 👈 Search by receiptNumber instead of id
    include: {
      branch: true,
      cashier: { select: { name: true, email: true } },
      customer: { 
        select: { 
          name: true, 
          phone: true,
          email: true,
          loyaltyNumber: true,
          loyaltyPoints: true 
        } 
      },
      lines: {
        include: {
          product: {
            select: { 
              name: true, 
              sku: true, 
              unit: true,
              imageUrl: true 
            }
          }
        },
        orderBy: { id: 'asc' }
      },
      payments: {
        orderBy: { createdAt: 'asc' }
      },
      returns: {
        select: {
          id: true,
          returnAmount: true,
          reason: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          lines: true,
          payments: true,
          returns: true
        }
      }
    }
  });
  
  if (!transaction) {
    throw new NotFoundError(`Receipt not found: ${receiptNumber}`);
  }

  logger.logDatabase('READ', {
    model: 'Transaction',
    operation: 'getTransactionReceipt',
    receiptNumber,
    transactionId: transaction.id,
    userId: req.user?.id
  });
  
  res.json(transaction);
});

