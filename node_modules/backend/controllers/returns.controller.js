// controllers/returns.controller.js
import { PrismaClient } from "@prisma/client";

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

// 🟢 Get all returns with filtering and pagination
export const getAllReturns = async (req, res) => {
  try {
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

    res.json({
      returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getAllReturns:', err);
    res.status(500).json({ message: "Error fetching returns", error: err.message });
  }
};

// 🟢 Get return by ID
export const getReturnById = async (req, res) => {
  try {
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
      return res.status(404).json({ message: "Return not found" });
    }

    res.json(returnRecord);
  } catch (err) {
    console.error('Error in getReturnById:', err);
    res.status(500).json({ message: "Error fetching return", error: err.message });
  }
};

// 🟢 Create return
export const createReturn = async (req, res) => {
  try {
    const { originalTransactionId, returnAmount, reason, processedBy } = req.body;

    // Validate required fields
    if (!originalTransactionId || !returnAmount) {
      return res.status(400).json({
        message: "originalTransactionId and returnAmount are required"
      });
    }

    // Validate return amount
    const amount = parseFloat(returnAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Return amount must be a positive number"
      });
    }

    // Validate reason if provided
    if (reason && !isValidReason(reason)) {
      return res.status(400).json({
        message: `Invalid reason. Must be one of: ${RETURN_REASONS.join(', ')}`
      });
    }

    // Validate transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: originalTransactionId },
      include: {
        returns: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if transaction can be returned
    if (transaction.status === 'REFUNDED') {
      return res.status(400).json({
        message: "Transaction has already been fully refunded"
      });
    }

    // Calculate total already returned
    const totalReturned = transaction.returns.reduce(
      (sum, ret) => sum + parseFloat(ret.returnAmount),
      0
    );

    // Check if return amount exceeds remaining refundable amount
    const remainingRefundable = parseFloat(transaction.totalGross) - totalReturned;
    if (amount > remainingRefundable) {
      return res.status(400).json({
        message: `Return amount (${amount}) exceeds remaining refundable amount (${remainingRefundable})`,
        details: {
          transactionTotal: parseFloat(transaction.totalGross),
          alreadyReturned: totalReturned,
          remainingRefundable
        }
      });
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

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createReturn:', err);
    res.status(500).json({ message: "Error creating return", error: err.message });
  }
};

// 🟢 Update return
export const updateReturn = async (req, res) => {
  try {
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
      return res.status(404).json({ message: "Return not found" });
    }

    // Validate reason if provided
    if (reason && !isValidReason(reason)) {
      return res.status(400).json({
        message: `Invalid reason. Must be one of: ${RETURN_REASONS.join(', ')}`
      });
    }

    // If updating return amount, validate it
    if (returnAmount !== undefined) {
      const amount = parseFloat(returnAmount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          message: "Return amount must be a positive number"
        });
      }

      // Calculate other returns total (excluding this one)
      const otherReturnsTotal = existingReturn.originalTransaction.returns
        .filter(r => r.id !== req.params.id)
        .reduce((sum, r) => sum + parseFloat(r.returnAmount), 0);

      const transactionTotal = parseFloat(existingReturn.originalTransaction.totalGross);
      
      if (amount + otherReturnsTotal > transactionTotal) {
        return res.status(400).json({
          message: `Updated return amount would exceed transaction total`,
          details: {
            transactionTotal,
            otherReturnsTotal,
            requestedAmount: amount,
            maxAllowed: transactionTotal - otherReturnsTotal
          }
        });
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

    res.json(result);
  } catch (err) {
    console.error('Error in updateReturn:', err);
    res.status(500).json({ message: "Error updating return", error: err.message });
  }
};

// 🟢 Delete return
export const deleteReturn = async (req, res) => {
  try {
    const returnRecord = await prisma.return.findUnique({
      where: { id: req.params.id },
      include: {
        originalTransaction: {
          include: { returns: true }
        }
      }
    });

    if (!returnRecord) {
      return res.status(404).json({ message: "Return not found" });
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

    res.json({ message: "Return deleted successfully" });
  } catch (err) {
    console.error('Error in deleteReturn:', err);
    res.status(500).json({ message: "Error deleting return", error: err.message });
  }
};

// 🆕 Get returns by transaction
export const getReturnsByTransaction = async (req, res) => {
  try {
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
      return res.status(404).json({ message: "Transaction not found" });
    }

    const totalReturned = returns.reduce(
      (sum, ret) => sum + parseFloat(ret.returnAmount),
      0
    );

    const remainingRefundable = parseFloat(transaction.totalGross) - totalReturned;

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
  } catch (err) {
    console.error('Error in getReturnsByTransaction:', err);
    res.status(500).json({ message: "Error fetching transaction returns", error: err.message });
  }
};

// 🆕 Process a return (simplified workflow)
export const processReturn = async (req, res) => {
  try {
    const { returnAmount, reason, processedBy, lineItems } = req.body;
    const transactionId = req.params.transactionId;

    // Validate required fields
    if (!returnAmount || !processedBy) {
      return res.status(400).json({
        message: "returnAmount and processedBy are required"
      });
    }

    const amount = parseFloat(returnAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Return amount must be a positive number"
      });
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
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Calculate refundable amount
    const totalReturned = transaction.returns.reduce(
      (sum, ret) => sum + parseFloat(ret.returnAmount),
      0
    );
    const remainingRefundable = parseFloat(transaction.totalGross) - totalReturned;

    if (amount > remainingRefundable) {
      return res.status(400).json({
        message: `Return amount exceeds remaining refundable amount`,
        details: { remainingRefundable }
      });
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

      return returnRecord;
    });

    res.status(201).json({
      message: "Return processed successfully",
      return: result,
      newTransactionStatus: result.status
    });
  } catch (err) {
    console.error('Error in processReturn:', err);
    res.status(500).json({ message: "Error processing return", error: err.message });
  }
};

// 🆕 Get returns summary
export const getReturnsSummary = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error in getReturnsSummary:', err);
    res.status(500).json({ message: "Error fetching returns summary", error: err.message });
  }
};

// 🆕 Get returns by reason
export const getReturnsByReason = async (req, res) => {
  try {
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
      percentage: 0 // Will be calculated below
    }));

    const totalCount = formatted.reduce((sum, r) => sum + r.count, 0);
    formatted.forEach(r => {
      r.percentage = totalCount > 0 ? (r.count / totalCount) * 100 : 0;
    });

    res.json({
      byReason: formatted.sort((a, b) => b.count - a.count),
      validReasons: RETURN_REASONS
    });
  } catch (err) {
    console.error('Error in getReturnsByReason:', err);
    res.status(500).json({ message: "Error fetching returns by reason", error: err.message });
  }
};

// 🆕 Get returns by period
export const getReturnsByPeriod = async (req, res) => {
  try {
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

    res.json({ period, returns });
  } catch (err) {
    console.error('Error in getReturnsByPeriod:', err);
    res.status(500).json({ message: "Error fetching returns by period", error: err.message });
  }
};

// 🆕 Get return trends
export const getReturnTrends = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error in getReturnTrends:', err);
    res.status(500).json({ message: "Error fetching return trends", error: err.message });
  }
};

// 🆕 Validate return
export const validateReturn = async (req, res) => {
  try {
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

    res.json({
      valid: errors.length === 0,
      errors,
      warnings
    });
  } catch (err) {
    console.error('Error in validateReturn:', err);
    res.status(500).json({ message: "Error validating return", error: err.message });
  }
};