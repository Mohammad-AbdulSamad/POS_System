// controllers/returns.controller.js - Updated with Error Handling & Logging
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// Valid return reasons
const RETURN_REASONS = [
  'defective',
  'damaged',
  'wrong_item',
  'not_as_described',
  'customer_changed_mind',
  'expired',
  'quality_issue',
  'other'
];

// Helper function to validate return reason
const isValidReason = (reason) => {
  return !reason || RETURN_REASONS.includes(reason.toLowerCase());
};

// ✅ Get all returns with filtering and pagination
export const getAllReturns = asyncHandler(async (req, res) => {
  const {
    transactionId,
    startDate,
    endDate,
    reason,
    processedBy,
    minAmount,
    maxAmount,
    page = 1,
    limit = 100
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(transactionId && { originalTransactionId: transactionId }),
    ...(reason && { reason: reason.toLowerCase() }),
    ...(processedBy && { processedBy }),
    ...((minAmount || maxAmount) && {
      returnAmount: {
        ...(minAmount && { gte: parseFloat(minAmount) }),
        ...(maxAmount && { lte: parseFloat(maxAmount) })
      }
    }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where,
      include: {
        originalTransaction: {
          select: {
            id: true,
            receiptNumber: true,
            totalGross: true,
            status: true,
            createdAt: true,
            branch: {
              select: { id: true, name: true }
            },
            cashier: {
              select: { id: true, name: true, email: true }
            },
            customer: {
              select: { id: true, name: true, phone: true }
            }
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.return.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'Return',
    count: returns.length,
    userId: req.user?.id,
    filters: { transactionId, reason, processedBy }
  });

  res.json({
    returns,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Get return by ID
export const getReturnById = asyncHandler(async (req, res) => {
  const returnRecord = await prisma.return.findUnique({
    where: { id: req.params.id },
    include: {
      originalTransaction: {
        include: {
          branch: { select: { id: true, name: true, address: true } },
          cashier: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true, phone: true, email: true } },
          lines: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, priceGross: true }
              }
            }
          },
          payments: true
        }
      }
    }
  });

  if (!returnRecord) {
    throw new NotFoundError('Return not found');
  }

  logger.logDatabase('READ', {
    model: 'Return',
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(returnRecord);
});

// ✅ Create return
export const createReturn = asyncHandler(async (req, res) => {
  const { originalTransactionId, returnAmount, reason, processedBy } = req.body;

  // Validate required fields
  if (!originalTransactionId || !returnAmount) {
    throw new BadRequestError('originalTransactionId and returnAmount are required');
  }

  // Validate return amount
  const amount = parseFloat(returnAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new BadRequestError('Return amount must be a positive number');
  }

  // Validate reason if provided
  if (reason && !isValidReason(reason)) {
    throw new BadRequestError(`Invalid reason. Must be one of: ${RETURN_REASONS.join(', ')}`);
  }

  // Validate transaction exists
  const transaction = await prisma.transaction.findUnique({
    where: { id: originalTransactionId },
    include: {
      returns: true
    }
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  // Check if transaction can be returned
  if (transaction.status === 'REFUNDED') {
    throw new BadRequestError('Transaction has already been fully refunded');
  }

  // Calculate total already returned
  const totalReturned = transaction.returns.reduce(
    (sum, ret) => sum + parseFloat(ret.returnAmount),
    0
  );

  // Check if return amount exceeds remaining refundable amount
  const remainingRefundable = parseFloat(transaction.totalGross) - totalReturned;
  if (amount > remainingRefundable) {
    throw new BadRequestError(
      `Return amount (${amount}) exceeds remaining refundable amount (${remainingRefundable})`,
      {
        details: {
          transactionTotal: parseFloat(transaction.totalGross),
          alreadyReturned: totalReturned,
          remainingRefundable
        }
      }
    );
  }

  // Use transaction to ensure data consistency
  const result = await prisma.$transaction(async (tx) => {
    // Create the return record
    const newReturn = await tx.return.create({
      data: {
        originalTransactionId,
        returnAmount: amount,
        reason: reason?.toLowerCase() || null,
        processedBy: processedBy || null
      },
      include: {
        originalTransaction: {
          select: {
            id: true,
            receiptNumber: true,
            totalGross: true,
            status: true,
            branch: { select: { name: true } }
          }
        }
      }
    });

    // Update transaction status and refunded amount
    const newTotalReturned = totalReturned + amount;
    const newStatus = newTotalReturned >= parseFloat(transaction.totalGross)
      ? 'REFUNDED'
      : 'PARTIALLY_REFUNDED';

    await tx.transaction.update({
      where: { id: originalTransactionId },
      data: {
        status: newStatus,
        refundedAmount: newTotalReturned
      }
    });

    return newReturn;
  });

  logger.info({
    message: 'Return created',
    returnId: result.id,
    transactionId: originalTransactionId,
    returnAmount: amount,
    reason: reason?.toLowerCase() || 'not_specified',
    processedBy,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.status(201).json(result);
});

// ✅ Update return
export const updateReturn = asyncHandler(async (req, res) => {
  const { returnAmount, reason, processedBy } = req.body;

  // Check if return exists
  const existingReturn = await prisma.return.findUnique({
    where: { id: req.params.id },
    include: {
      originalTransaction: {
        include: { returns: true }
      }
    }
  });

  if (!existingReturn) {
    throw new NotFoundError('Return not found');
  }

  // Validate reason if provided
  if (reason && !isValidReason(reason)) {
    throw new BadRequestError(`Invalid reason. Must be one of: ${RETURN_REASONS.join(', ')}`);
  }

  // If updating return amount, validate it
  if (returnAmount !== undefined) {
    const amount = parseFloat(returnAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestError('Return amount must be a positive number');
    }

    // Calculate other returns total (excluding this one)
    const otherReturnsTotal = existingReturn.originalTransaction.returns
      .filter(r => r.id !== req.params.id)
      .reduce((sum, r) => sum + parseFloat(r.returnAmount), 0);

    const transactionTotal = parseFloat(existingReturn.originalTransaction.totalGross);
    
    if (amount + otherReturnsTotal > transactionTotal) {
      throw new BadRequestError(
        'Updated return amount would exceed transaction total',
        {
          details: {
            transactionTotal,
            otherReturnsTotal,
            requestedAmount: amount,
            maxAllowed: transactionTotal - otherReturnsTotal
          }
        }
      );
    }
  }

  // Use transaction for consistency
  const result = await prisma.$transaction(async (tx) => {
    // Update the return
    const updatedReturn = await tx.return.update({
      where: { id: req.params.id },
      data: {
        ...(returnAmount !== undefined && { returnAmount: parseFloat(returnAmount) }),
        ...(reason !== undefined && { reason: reason ? reason.toLowerCase() : null }),
        ...(processedBy !== undefined && { processedBy: processedBy || null })
      },
      include: {
        originalTransaction: {
          select: {
            id: true,
            receiptNumber: true,
            totalGross: true,
            branch: { select: { name: true } }
          }
        }
      }
    });

    // If amount changed, update transaction status
    if (returnAmount !== undefined) {
      const allReturns = await tx.return.findMany({
        where: { originalTransactionId: existingReturn.originalTransactionId }
      });

      const totalReturned = allReturns.reduce(
        (sum, r) => sum + parseFloat(r.returnAmount),
        0
      );

      const transactionTotal = parseFloat(existingReturn.originalTransaction.totalGross);
      const newStatus = totalReturned >= transactionTotal
        ? 'REFUNDED'
        : 'PARTIALLY_REFUNDED';

      await tx.transaction.update({
        where: { id: existingReturn.originalTransactionId },
        data: {
          status: newStatus,
          refundedAmount: totalReturned
        }
      });
    }

    return updatedReturn;
  });

  logger.info({
    message: 'Return updated',
    returnId: req.params.id,
    userId: req.user?.id,
    changes: { returnAmount, reason, processedBy }
  });

  res.json(result);
});

// ✅ Delete return
export const deleteReturn = asyncHandler(async (req, res) => {
  const returnRecord = await prisma.return.findUnique({
    where: { id: req.params.id },
    include: {
      originalTransaction: {
        include: { returns: true }
      }
    }
  });

  if (!returnRecord) {
    throw new NotFoundError('Return not found');
  }

  // Use transaction for consistency
  await prisma.$transaction(async (tx) => {
    // Delete the return
    await tx.return.delete({
      where: { id: req.params.id }
    });

    // Recalculate transaction status
    const remainingReturns = await tx.return.findMany({
      where: { originalTransactionId: returnRecord.originalTransactionId }
    });

    const totalReturned = remainingReturns.reduce(
      (sum, r) => sum + parseFloat(r.returnAmount),
      0
    );

    const transactionTotal = parseFloat(returnRecord.originalTransaction.totalGross);
    
    let newStatus = 'COMPLETED';
    if (totalReturned > 0) {
      newStatus = totalReturned >= transactionTotal ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    }

    await tx.transaction.update({
      where: { id: returnRecord.originalTransactionId },
      data: {
        status: newStatus,
        refundedAmount: totalReturned
      }
    });
  });

  logger.warn({
    message: 'Return deleted',
    returnId: req.params.id,
    transactionId: returnRecord.originalTransactionId,
    returnAmount: returnRecord.returnAmount,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({ message: "Return deleted successfully" });
});

// ✅ Get returns by transaction
export const getReturnsByTransaction = asyncHandler(async (req, res) => {
  const transactionId = req.params.transactionId;

  const [transaction, returns] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        receiptNumber: true,
        totalGross: true,
        refundedAmount: true,
        status: true,
        createdAt: true
      }
    }),
    prisma.return.findMany({
      where: { originalTransactionId: transactionId },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  const totalReturned = returns.reduce(
    (sum, ret) => sum + parseFloat(ret.returnAmount),
    0
  );

  const remainingRefundable = parseFloat(transaction.totalGross) - totalReturned;

  logger.logDatabase('READ', {
    model: 'Return',
    operation: 'getReturnsByTransaction',
    transactionId,
    count: returns.length,
    userId: req.user?.id
  });

  res.json({
    transaction,
    returns,
    summary: {
      totalReturns: returns.length,
      totalReturnedAmount: totalReturned,
      remainingRefundable,
      canReturn: remainingRefundable > 0
    }
  });
});

// ✅ Process a return (simplified workflow)
export const processReturn = asyncHandler(async (req, res) => {
  const { returnAmount, reason, processedBy, lineItems } = req.body;
  const transactionId = req.params.transactionId;

  // Validate required fields
  if (!returnAmount || !processedBy) {
    throw new BadRequestError('returnAmount and processedBy are required');
  }

  const amount = parseFloat(returnAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new BadRequestError('Return amount must be a positive number');
  }

  // Get transaction details
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      returns: true,
      lines: {
        include: {
          product: true
        }
      }
    }
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  // Calculate refundable amount
  const totalReturned = transaction.returns.reduce(
    (sum, ret) => sum + parseFloat(ret.returnAmount),
    0
  );
  const remainingRefundable = parseFloat(transaction.totalGross) - totalReturned;

  if (amount > remainingRefundable) {
    throw new BadRequestError(
      'Return amount exceeds remaining refundable amount',
      { details: { remainingRefundable } }
    );
  }

  // Process the return
  const result = await prisma.$transaction(async (tx) => {
    // Create return record
    const returnRecord = await tx.return.create({
      data: {
        originalTransactionId: transactionId,
        returnAmount: amount,
        reason: reason?.toLowerCase() || 'other',
        processedBy
      }
    });

    // Update transaction
    const newTotalReturned = totalReturned + amount;
    const transactionTotal = parseFloat(transaction.totalGross);
    const newStatus = newTotalReturned >= transactionTotal
      ? 'REFUNDED'
      : 'PARTIALLY_REFUNDED';

    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        refundedAmount: newTotalReturned
      }
    });

    return { returnRecord, newStatus };
  });

  logger.info({
    message: 'Return processed',
    returnId: result.returnRecord.id,
    transactionId,
    returnAmount: amount,
    processedBy,
    newStatus: result.newStatus,
    userId: req.user?.id
  });

  res.status(201).json({
    message: "Return processed successfully",
    return: result.returnRecord,
    newTransactionStatus: result.newStatus
  });
});

// ✅ Get returns summary
export const getReturnsSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate, branchId } = req.query;

  const where = {
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }),
    ...(branchId && {
      originalTransaction: {
        branchId
      }
    })
  };

  const [totalReturns, returnStats, byReason] = await Promise.all([
    prisma.return.count({ where }),
    prisma.return.aggregate({
      where,
      _sum: { returnAmount: true },
      _avg: { returnAmount: true },
      _max: { returnAmount: true },
      _min: { returnAmount: true }
    }),
    prisma.return.groupBy({
      by: ['reason'],
      where,
      _count: true,
      _sum: { returnAmount: true }
    })
  ]);

  logger.info({
    message: 'Returns summary generated',
    filters: { startDate, endDate, branchId },
    userId: req.user?.id
  });

  res.json({
    summary: {
      totalReturns,
      totalReturnAmount: parseFloat(returnStats._sum.returnAmount || 0),
      averageReturnAmount: parseFloat(returnStats._avg.returnAmount || 0),
      maxReturnAmount: parseFloat(returnStats._max.returnAmount || 0),
      minReturnAmount: parseFloat(returnStats._min.returnAmount || 0)
    },
    byReason: byReason.map(r => ({
      reason: r.reason || 'not_specified',
      count: r._count,
      totalAmount: parseFloat(r._sum.returnAmount || 0)
    }))
  });
});

// ✅ Get returns by reason
export const getReturnsByReason = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  const byReason = await prisma.return.groupBy({
    by: ['reason'],
    where,
    _count: true,
    _sum: { returnAmount: true }
  });

  const formatted = byReason.map(r => ({
    reason: r.reason || 'not_specified',
    count: r._count,
    totalAmount: r._sum.returnAmount || 0,
    percentage: 0
  }));

  const totalCount = formatted.reduce((sum, r) => sum + r.count, 0);
  formatted.forEach(r => {
    r.percentage = totalCount > 0 ? (r.count / totalCount) * 100 : 0;
  });

  logger.logDatabase('READ', {
    model: 'Return',
    operation: 'getReturnsByReason',
    userId: req.user?.id
  });

  res.json({
    byReason: formatted.sort((a, b) => b.count - a.count),
    validReasons: RETURN_REASONS
  });
});

// ✅ Get returns by period
export const getReturnsByPeriod = asyncHandler(async (req, res) => {
  const { period = 'day', startDate, endDate } = req.query;

  let dateFormat;
  switch (period) {
    case 'hour':
      dateFormat = 'YYYY-MM-DD HH24:00:00';
      break;
    case 'day':
      dateFormat = 'YYYY-MM-DD';
      break;
    case 'week':
      dateFormat = 'YYYY-"W"WW';
      break;
    case 'month':
      dateFormat = 'YYYY-MM';
      break;
    default:
      dateFormat = 'YYYY-MM-DD';
  }

  const whereConditions = [];
  if (startDate && endDate) {
    whereConditions.push(`r."createdAt" BETWEEN '${startDate}' AND '${endDate}'`);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const returns = await prisma.$queryRaw`
    SELECT 
      to_char(r."createdAt", ${dateFormat}) as period,
      COUNT(*) as return_count,
      SUM(r."returnAmount") as total_return_amount,
      AVG(r."returnAmount") as avg_return_amount
    FROM "Return" r
    ${whereClause}
    GROUP BY to_char(r."createdAt", ${dateFormat})
    ORDER BY period
  `;

  logger.logDatabase('READ', {
    model: 'Return',
    operation: 'getReturnsByPeriod',
    period,
    userId: req.user?.id
  });

  res.json({ period, returns });
});

// ✅ Get return trends
export const getReturnTrends = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const [returns, transactions] = await Promise.all([
    prisma.return.aggregate({
      where: {
        createdAt: { gte: startDate }
      },
      _count: true,
      _sum: { returnAmount: true }
    }),
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED'] }
      },
      _count: true,
      _sum: { totalGross: true }
    })
  ]);

  const returnRate = transactions._count > 0
    ? (returns._count / transactions._count) * 100
    : 0;

  const returnAmountRate = transactions._sum.totalGross > 0
    ? (returns._sum.returnAmount / transactions._sum.totalGross) * 100
    : 0;

  logger.info({
    message: 'Return trends generated',
    days: parseInt(days),
    userId: req.user?.id
  });

  res.json({
    period: `${days} days`,
    trends: {
      totalReturns: returns._count,
      totalReturnAmount: returns._sum.returnAmount || 0,
      totalTransactions: transactions._count,
      totalSalesAmount: transactions._sum.totalGross || 0,
      returnRate: parseFloat(returnRate.toFixed(2)),
      returnAmountRate: parseFloat(returnAmountRate.toFixed(2))
    }
  });
});

// ✅ Validate return
export const validateReturn = asyncHandler(async (req, res) => {
  const { originalTransactionId, returnAmount, reason } = req.body;

  const errors = [];
  const warnings = [];

  // Validate required fields
  if (!originalTransactionId) errors.push("originalTransactionId is required");
  if (!returnAmount) errors.push("returnAmount is required");

  // Validate amount
  if (returnAmount) {
    const amount = parseFloat(returnAmount);
    if (isNaN(amount)) errors.push("returnAmount must be a valid number");
    else if (amount <= 0) errors.push("returnAmount must be positive");
  }

  // Validate reason
  if (reason && !isValidReason(reason)) {
    errors.push(`Invalid reason. Must be one of: ${RETURN_REASONS.join(', ')}`);
  }

  // Check transaction if no errors so far
  if (errors.length === 0 && originalTransactionId) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: originalTransactionId },
      include: { returns: true }
    });

    if (!transaction) {
      errors.push("Transaction not found");
    } else {
      // Check transaction status
      if (transaction.status === 'REFUNDED') {
        errors.push("Transaction already fully refunded");
      }

      // Check return amount
      const totalReturned = transaction.returns.reduce(
        (sum, r) => sum + parseFloat(r.returnAmount),
        0
      );
      const remainingRefundable = parseFloat(transaction.totalGross) - totalReturned;
      
      if (parseFloat(returnAmount) > remainingRefundable) {
        errors.push(
          `Return amount (${returnAmount}) exceeds remaining refundable amount (${remainingRefundable})`
        );
      }

      // Add warnings
      if (parseFloat(returnAmount) === remainingRefundable) {
        warnings.push("This will fully refund the transaction");
      }

      const daysSincePurchase = Math.floor(
        (new Date() - new Date(transaction.createdAt)) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSincePurchase > 30) {
        warnings.push(`Transaction is ${daysSincePurchase} days old`);
      }
    }
  }

  logger.info({
    message: 'Return validation performed',
    valid: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    userId: req.user?.id
  });

  res.json({
    valid: errors.length === 0,
    errors,
    warnings
  });
});