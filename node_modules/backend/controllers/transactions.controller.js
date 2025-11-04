// controllers/transactions.controller.js - Updated with Error Handling & Logging
import { PrismaClient, Prisma } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();




// 🔥 PRODUCTION OPTIMIZATION: Batch product validation to prevent N+1 queries
const validateAndFetchProducts = async (lines) => {
  const productIds = [...new Set(lines.map(l => l.productId))];
  
  const products = await prisma.product.findMany({
    where: { 
      id: { in: productIds },
      active: true 
    },
    select: { 
      id: true, 
      name: true, 
      stock: true, 
      priceGross: true 
    }
  });

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  
  // Validate all products exist
  const missingProducts = productIds.filter(id => !productMap[id]);
  if (missingProducts.length > 0) {
    console.log('Missing products:', missingProducts);
    throw new NotFoundError(`Products not found or inactive: ${missingProducts.join(', ')}`);
  }
  console.log('//////////////////////////////////////////////////////////////////////');
  console.log('Product map:', productMap);
   return productMap;
};

// 🔥 PRODUCTION OPTIMIZATION: Calculate totals in memory (no DB calls)
const calculateTransactionTotals = (lines, productMap) => {
  let totalNet = 0;
  let totalTax = 0;
  const validatedLines = [];
  const stockUpdates = {};

  for (const line of lines) {
    const { productId, qty, unitPrice, discount = 0, taxAmount = 0 } = line;
    const product = productMap[productId];

    // Accumulate stock changes
    stockUpdates[productId] = (stockUpdates[productId] || 0) + parseInt(qty);

    // Check stock availability (accumulated)
    if (product.stock < stockUpdates[productId]) {
      throw new BadRequestError(
        `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${stockUpdates[productId]}`
      );
    }

    const lineTotal = (parseFloat(unitPrice) * parseInt(qty)) - parseFloat(discount);
    totalNet += lineTotal;
    totalTax += parseFloat(taxAmount);

    validatedLines.push({
      productId,
      unitPrice: parseFloat(unitPrice),
      qty: parseInt(qty),
      discount: parseFloat(discount),
      taxAmount: parseFloat(taxAmount),
      lineTotal
    });
  }

  return {
    totalNet,
    totalTax,
    totalGross: totalNet + totalTax,
    validatedLines,
    stockUpdates
  };
};





// ✅ Get all transactions
export const getAllTransactions = asyncHandler(async (req, res) => {
  const { 
    include_relations = 'false',
    branchId,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 50 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    ...(branchId && { branchId }),
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
      include: include_relations === 'true' ? {
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, phone: true } },
        lines: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
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
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'Transaction',
    count: transactions.length,
    userId: req.user?.id,
    filters: { branchId, status, startDate, endDate }
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

// ✅ Get transaction by ID
export const getTransactionById = asyncHandler(async (req, res) => {
  const { include_relations = 'false' } = req.query;
  
  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: include_relations === 'true' ? {
      branch: true,
      cashier: { 
        select: { id: true, name: true, email: true, role: true } 
      },
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
            select: { 
              id: true, 
              name: true, 
              sku: true, 
              unit: true,
              categoryId: true
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

// 🔥 ✅ Create transaction - PRODUCTION OPTIMIZED
// export const createTransaction = asyncHandler(async (req, res) => {
//   const {
//     branchId,
//     cashierId,
//     customerId,
//     lines,
//     payments,
//     loyaltyPointsEarned = 0,
//     loyaltyPointsUsed = 0,
//     metadata
//   } = req.body;
  
//   // 🔥 OPTIMIZATION 1: Batch validate branch, cashier, customer in parallel
//   const [branch, cashier, customer] = await Promise.all([
//     prisma.branch.findUnique({ where: { id: branchId } }),
//     cashierId ? prisma.user.findUnique({ where: { id: cashierId } }) : null,
//     customerId ? prisma.customer.findUnique({ where: { id: customerId } }) : null
//   ]);
  
//   if (!branch) throw new NotFoundError('Branch not found');
//   if (cashierId && !cashier) throw new NotFoundError('Cashier not found');
//   if (customerId && !customer) throw new NotFoundError('Customer not found');
  
//   // 🔥 OPTIMIZATION 2: Batch fetch and validate all products at once (prevents N+1)
//   const productMap = await validateAndFetchProducts(lines);
  
//   // 🔥 OPTIMIZATION 3: Calculate totals in memory (no DB calls)
//   const { totalNet, totalTax, totalGross, validatedLines, stockUpdates } = 
//     calculateTransactionTotals(lines, productMap);
//     console.log('//////////////////////////////////////////////////////////////////////');
//   console.log('totalNet:', totalNet, 'totalTax:', totalTax, 'totalGross:', totalGross);

//   // Generate unique receipt number
//   const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
//   console.log('//////////////////////////////////////////////////////////////////////');
//   console.log('Generated receipt number:', receiptNumber);
//   // 🔥 OPTIMIZATION 4: Use Prisma transaction with row-level locking
//   const result = await prisma.$transaction(async (tx) => {
// //     // 🔥 CRITICAL: Lock product rows to prevent race conditions
//     const productIds = Object.keys(stockUpdates);
//     // ✅ CORRECT (fixed version)
//    await tx.$executeRaw`
//      SELECT id FROM "Product"
//      WHERE id = ANY(${productIds}::uuid[])
//      FOR UPDATE
//    `;

//     console.log('//////////////////////////////////////////////////////////////////////');
//     console.log('//////////////////////////////////////////////////////////////////////');
//     console.log('//////////////////////////////////////////////////////////////////////');
//     console.log('//////////////////////////////////////////////////////////////////////');
//     // Create the transaction
//     const newTransaction = await tx.transaction.create({
//       data: {
//         branchId,
//         cashierId: cashierId || null,
//         customerId: customerId || null,
//         receiptNumber,
//         totalGross,
//         totalTax,
//         totalNet,
//         loyaltyPointsEarned: parseInt(loyaltyPointsEarned),
//         loyaltyPointsUsed: parseInt(loyaltyPointsUsed),
//         metadata: metadata || null,
//         status: 'COMPLETED'
//       }
//     });
    
//     // 🔥 OPTIMIZATION 5: Batch create transaction lines
//     await tx.transactionLine.createMany({
//       data: validatedLines.map(line => ({
//         transactionId: newTransaction.id,
//         ...line
//       }))
//     });
    
//     // 🔥 OPTIMIZATION 6: Batch update product stock
//     const stockUpdatePromises = Object.entries(stockUpdates).map(([productId, qty]) =>
//       tx.product.update({
//         where: { id: productId },
//         data: { stock: { decrement: qty } }
//       })
//     );
    
//     // 🔥 OPTIMIZATION 7: Batch create stock movements
//     const stockMovementData = Object.entries(stockUpdates).map(([productId, qty]) => ({
//       productId,
//       branchId,
//       change: -qty,
//       reason: 'sale'
//     }));
    
//     await Promise.all([
//       ...stockUpdatePromises,
//       tx.stockMovement.createMany({ data: stockMovementData })
//     ]);
    
//     // 🔥 OPTIMIZATION 8: Batch create payments if provided
//     if (payments && Array.isArray(payments) && payments.length > 0) {
//       await tx.payment.createMany({
//         data: payments.map(payment => ({
//           transactionId: newTransaction.id,
//           method: payment.method,
//           amount: parseFloat(payment.amount)
//         }))
//       });
//     }
    
//     // Update customer loyalty points if applicable
//     if (customerId && (loyaltyPointsEarned > 0 || loyaltyPointsUsed > 0)) {
//       const loyaltyTransactions = [];
      
//       if (loyaltyPointsEarned > 0) {
//         await tx.customer.update({
//           where: { id: customerId },
//           data: { loyaltyPoints: { increment: parseInt(loyaltyPointsEarned) } }
//         });
        
//         loyaltyTransactions.push({
//           customerId,
//           points: parseInt(loyaltyPointsEarned),
//           type: 'EARNED',
//           reason: 'PURCHASE'
//         });
//       }
      
//       if (loyaltyPointsUsed > 0) {
//         await tx.customer.update({
//           where: { id: customerId },
//           data: { loyaltyPoints: { decrement: parseInt(loyaltyPointsUsed) } }
//         });
        
//         loyaltyTransactions.push({
//           customerId,
//           points: parseInt(loyaltyPointsUsed),
//           type: 'REDEEMED',
//           reason: 'PURCHASE'
//         });
//       }
      
//       if (loyaltyTransactions.length > 0) {
//         await tx.loyaltyTransaction.createMany({ data: loyaltyTransactions });
//       }
//     }
    
//     return newTransaction;
//   }, {
//     // 🔥 PRODUCTION: Set transaction timeout and isolation level
//     timeout: 10000, // 10 seconds
//     isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
//   });
  
//   // Fetch the complete transaction AFTER the transaction commits (not inside)
//   const completeTransaction = await prisma.transaction.findUnique({
//     where: { id: result.id },
//     include: {
//       branch: { select: { id: true, name: true } },
//       cashier: { select: { id: true, name: true } },
//       customer: { select: { id: true, name: true } },
//       lines: {
//         include: {
//           product: {
//             select: { id: true, name: true, sku: true }
//           }
//         }
//       },
//       payments: true
//     }
//   });

//   // 🔥 RESILIENCE: Log OUTSIDE transaction to avoid side effects
//   logger.info({
//     message: 'Transaction created',
//     transactionId: completeTransaction.id,
//     receiptNumber: completeTransaction.receiptNumber,
//     branchId,
//     cashierId,
//     customerId,
//     totalGross,
//     lineCount: validatedLines.length,
//     userId: req.user?.id,
//     userEmail: req.user?.email
//   });
  
//   res.status(201).json(completeTransaction);
// });



// 🔥 ✅ Create transaction - PRODUCTION OPTIMIZED
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
  
  // 🔥 OPTIMIZATION 1: Batch validate branch, cashier, customer in parallel
  const [branch, cashier, customer] = await Promise.all([
    prisma.branch.findUnique({ where: { id: branchId } }),
    cashierId ? prisma.user.findUnique({ where: { id: cashierId } }) : null,
    customerId ? prisma.customer.findUnique({ where: { id: customerId } }) : null
  ]);
  
  if (!branch) throw new NotFoundError('Branch not found');
  if (cashierId && !cashier) throw new NotFoundError('Cashier not found');
  if (customerId && !customer) throw new NotFoundError('Customer not found');
  
  console.log('////////////////////////// First Step');
  // 🔥 OPTIMIZATION 2: Batch fetch and validate all products at once (prevents N+1)
  const productMap = await validateAndFetchProducts(lines);
  console.log('////////////////////////// Second Step');
  // 🔥 OPTIMIZATION 3: Calculate totals in memory (no DB calls)
  const { totalNet, totalTax, totalGross, validatedLines, stockUpdates } = 
    calculateTransactionTotals(lines, productMap);
  console.log('////////////////////////// Third Step');
  
  // Generate unique receipt number
  const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  console.log('////////////////////////// First Step');
  
  // 🔥 OPTIMIZATION 4: Use Prisma transaction with row-level locking
  const result = await prisma.$transaction(async (tx) => {
    // 🔥 CRITICAL: Lock product rows to prevent race conditions
    const productIds = Object.keys(stockUpdates);
    
    if (productIds.length > 0) {
      try {
        // ✅ FIXED: Proper array parameter binding for Prisma
        console.log('Attempting to lock products:', productIds);
        
         await tx.$queryRaw`
          SELECT id
          FROM "Product"
          WHERE id = ANY(${productIds})
          FOR UPDATE
        `;
        
        console.log('Successfully locked products');
      } catch (lockError) {
        console.error('Lock error details:', {
          message: lockError.message,
          code: lockError.code,
          meta: lockError.meta,
          productIds
        });
        throw lockError;
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
        metadata: metadata || null,
        status: 'COMPLETED'
      }
    });
    
    // 🔥 OPTIMIZATION 5: Batch create transaction lines
    await tx.transactionLine.createMany({
      data: validatedLines.map(line => ({
        transactionId: newTransaction.id,
        ...line
      }))
    });
    
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
    
    // 🔥 OPTIMIZATION 8: Batch create payments if provided
    if (payments && Array.isArray(payments) && payments.length > 0) {
      await tx.payment.createMany({
        data: payments.map(payment => ({
          transactionId: newTransaction.id,
          method: payment.method,
          amount: parseFloat(payment.amount)
        }))
      });
    }
    
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
    }
    
    return newTransaction;
  }, {
    // 🔥 PRODUCTION: Set transaction timeout and isolation level
    timeout: 10000, // 10 seconds
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
  });
  
  // Fetch the complete transaction AFTER the transaction commits (not inside)
  const completeTransaction = await prisma.transaction.findUnique({
    where: { id: result.id },
    include: {
      branch: { select: { id: true, name: true } },
      cashier: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      lines: {
        include: {
          product: {
            select: { id: true, name: true, sku: true }
          }
        }
      },
      payments: true
    }
  });

  // 🔥 RESILIENCE: Log OUTSIDE transaction to avoid side effects
  logger.info({
    message: 'Transaction created',
    transactionId: completeTransaction.id,
    receiptNumber: completeTransaction.receiptNumber,
    branchId,
    cashierId,
    customerId,
    totalGross,
    lineCount: validatedLines.length,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.status(201).json(completeTransaction);
});



// ✅ Update transaction (limited - only status and metadata)
export const updateTransaction = asyncHandler(async (req, res) => {
  const { status, metadata } = req.body;
  
  // Check if transaction exists
  const existingTransaction = await prisma.transaction.findUnique({
    where: { id: req.params.id }
  });
  
  if (!existingTransaction) {
    throw new NotFoundError('Transaction not found');
  }
  
  // Prevent updating completed transactions to pending
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
      customer: { select: { id: true, name: true } }
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

// ✅ Delete transaction (soft delete - mark as cancelled)
export const deleteTransaction = asyncHandler(async (req, res) => {
  // Check if transaction exists
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

  // Only allow deletion of pending transactions
  if (existingTransaction.status === 'COMPLETED') {
    throw new BadRequestError('Cannot delete completed transaction. Use returns instead.');
  }

  // Restore product stock in a transaction
  await prisma.$transaction(async (tx) => {
    // Restore stock for each product
    for (const line of existingTransaction.lines) {
      await tx.product.update({
        where: { id: line.productId },
        data: {
          stock: {
            increment: line.qty
          }
        }
      });
      
      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          branchId: existingTransaction.branchId,
          change: line.qty,
          reason: 'adjustment'
        }
      });
    }
    
    // Delete the transaction and related records
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
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.json({ message: "Transaction deleted successfully" });
});

// ✅ Get transactions by branch
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
            payments: true
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

// ✅ Get transactions by customer
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
            payments: true
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

// ✅ Get transaction receipt (formatted for printing)
export const getTransactionReceipt = asyncHandler(async (req, res) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: {
      branch: true,
      cashier: { select: { name: true } },
      customer: { 
        select: { 
          name: true, 
          phone: true,
          loyaltyNumber: true 
        } 
      },
      lines: {
        include: {
          product: {
            select: { name: true, sku: true, unit: true }
          }
        },
        orderBy: { id: 'asc' }
      },
      payments: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  
  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  logger.logDatabase('READ', {
    model: 'Transaction',
    operation: 'getTransactionReceipt',
    id: req.params.id,
    userId: req.user?.id
  });
  
  res.json(transaction);
});