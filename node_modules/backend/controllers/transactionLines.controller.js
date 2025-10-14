// controllers/transactionLines.controller.js - Updated with Error Handling & Logging
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// Helper function to calculate line total
const calculateTotal = (unitPrice, qty, discount = 0, taxAmount = 0) => {
  const subtotal = unitPrice * qty;
  const afterDiscount = subtotal - discount;
  return afterDiscount + taxAmount;
};

// ✅ Get all transaction lines with filtering and pagination
export const getAllTransactionLines = asyncHandler(async (req, res) => {
  const { 
    transactionId, 
    productId, 
    minAmount, 
    maxAmount, 
    startDate, 
    endDate,
    page = 1, 
    limit = 100 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    ...(transactionId && { transactionId }),
    ...(productId && { productId }),
    ...(minAmount && { lineTotal: { gte: parseFloat(minAmount) } }),
    ...(maxAmount && { lineTotal: { lte: parseFloat(maxAmount) } }),
    ...(startDate && endDate && {
      transaction: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    })
  };

  const [lines, total] = await Promise.all([
    prisma.transactionLine.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            createdAt: true,
            receiptNumber: true,
            branch: { select: { name: true } }
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { transaction: { createdAt: 'desc' } }
    }),
    prisma.transactionLine.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'TransactionLine',
    count: lines.length,
    userId: req.user?.id,
    filters: { transactionId, productId, minAmount, maxAmount, startDate, endDate }
  });

  res.json({
    lines,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Get transaction line by ID
export const getTransactionLineById = asyncHandler(async (req, res) => {
  const line = await prisma.transactionLine.findUnique({
    where: { id: req.params.id },
    include: {
      transaction: {
        select: {
          id: true,
          receiptNumber: true,
          createdAt: true,
          branch: { select: { name: true } },
          cashier: { select: { name: true, email: true } }
        }
      },
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
          category: { select: { name: true } }
        }
      }
    }
  });

  if (!line) {
    throw new NotFoundError('Transaction line not found');
  }

  logger.logDatabase('READ', {
    model: 'TransactionLine',
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(line);
});

// ✅ Create transaction line
export const createTransactionLine = asyncHandler(async (req, res) => {
  const { transactionId, productId, unitPrice, qty, discount = 0, taxAmount = 0 } = req.body;

  // Validate required fields
  if (!transactionId || !productId || !unitPrice || !qty) {
    throw new BadRequestError('transactionId, productId, unitPrice, and qty are required');
  }

  // Validate transaction exists
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId }
  });
  
  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Calculate line total
  const lineTotal = calculateTotal(parseFloat(unitPrice), parseInt(qty), parseFloat(discount), parseFloat(taxAmount));

  const newLine = await prisma.transactionLine.create({
    data: {
      transactionId,
      productId,
      unitPrice: parseFloat(unitPrice),
      qty: parseInt(qty),
      discount: parseFloat(discount),
      taxAmount: parseFloat(taxAmount),
      lineTotal
    },
    include: {
      transaction: { select: { receiptNumber: true } },
      product: { select: { name: true, sku: true } }
    }
  });

  logger.info({
    message: 'Transaction line created',
    lineId: newLine.id,
    transactionId,
    productId,
    productName: product.name,
    qty: newLine.qty,
    lineTotal: newLine.lineTotal,
    userId: req.user?.id
  });

  res.status(201).json(newLine);
});

// ✅ Update transaction line
export const updateTransactionLine = asyncHandler(async (req, res) => {
  const { unitPrice, qty, discount, taxAmount } = req.body;
  
  // Check if line exists
  const existingLine = await prisma.transactionLine.findUnique({
    where: { id: req.params.id }
  });

  if (!existingLine) {
    throw new NotFoundError('Transaction line not found');
  }

  // Calculate new line total if price/qty/discount/tax changed
  const newUnitPrice = unitPrice !== undefined ? parseFloat(unitPrice) : existingLine.unitPrice;
  const newQty = qty !== undefined ? parseInt(qty) : existingLine.qty;
  const newDiscount = discount !== undefined ? parseFloat(discount) : existingLine.discount;
  const newTaxAmount = taxAmount !== undefined ? parseFloat(taxAmount) : existingLine.taxAmount;
  
  const lineTotal = calculateTotal(newUnitPrice, newQty, newDiscount, newTaxAmount);

  const updatedLine = await prisma.transactionLine.update({
    where: { id: req.params.id },
    data: {
      ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
      ...(qty !== undefined && { qty: parseInt(qty) }),
      ...(discount !== undefined && { discount: parseFloat(discount) }),
      ...(taxAmount !== undefined && { taxAmount: parseFloat(taxAmount) }),
      lineTotal
    },
    include: {
      transaction: { select: { receiptNumber: true } },
      product: { select: { name: true, sku: true } }
    }
  });

  logger.info({
    message: 'Transaction line updated',
    lineId: updatedLine.id,
    userId: req.user?.id,
    changes: { unitPrice, qty, discount, taxAmount, lineTotal }
  });

  res.json(updatedLine);
});

// ✅ Delete transaction line
export const deleteTransactionLine = asyncHandler(async (req, res) => {
  const line = await prisma.transactionLine.findUnique({
    where: { id: req.params.id },
    include: {
      transaction: { select: { receiptNumber: true } },
      product: { select: { name: true } }
    }
  });

  if (!line) {
    throw new NotFoundError('Transaction line not found');
  }

  await prisma.transactionLine.delete({
    where: { id: req.params.id }
  });

  logger.warn({
    message: 'Transaction line deleted',
    lineId: req.params.id,
    transactionId: line.transactionId,
    productName: line.product.name,
    userId: req.user?.id
  });

  res.json({ message: "Transaction line deleted successfully" });
});

// ✅ Get lines by transaction
export const getLinesByTransaction = asyncHandler(async (req, res) => {
  const lines = await prisma.transactionLine.findMany({
    where: { transactionId: req.params.transactionId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
          category: { select: { name: true } }
        }
      }
    },
    orderBy: { product: { name: 'asc' } }
  });

  // Calculate transaction totals
  const summary = {
    totalLines: lines.length,
    totalQuantity: lines.reduce((sum, line) => sum + line.qty, 0),
    subtotal: lines.reduce((sum, line) => sum + (line.unitPrice * line.qty), 0),
    totalDiscount: lines.reduce((sum, line) => sum + line.discount, 0),
    totalTax: lines.reduce((sum, line) => sum + line.taxAmount, 0),
    grandTotal: lines.reduce((sum, line) => sum + line.lineTotal, 0)
  };

  logger.logDatabase('READ', {
    model: 'TransactionLine',
    operation: 'getLinesByTransaction',
    transactionId: req.params.transactionId,
    count: lines.length,
    userId: req.user?.id
  });

  res.json({ lines, summary });
});

// ✅ Add line to existing transaction
export const addLineToTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { productId, unitPrice, qty, discount = 0, taxAmount = 0 } = req.body;

  // Validate transaction exists and is not completed
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId }
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  if (transaction.status === 'COMPLETED') {
    throw new BadRequestError('Cannot modify completed transaction');
  }

  // Check if product already exists in transaction
  const existingLine = await prisma.transactionLine.findFirst({
    where: { transactionId, productId }
  });

  if (existingLine) {
    // Update existing line quantity
    const newQty = existingLine.qty + parseInt(qty);
    const lineTotal = calculateTotal(existingLine.unitPrice, newQty, existingLine.discount, existingLine.taxAmount);

    const updatedLine = await prisma.transactionLine.update({
      where: { id: existingLine.id },
      data: { qty: newQty, lineTotal },
      include: {
        product: { select: { name: true, sku: true } }
      }
    });

    logger.info({
      message: 'Transaction line quantity updated',
      lineId: updatedLine.id,
      transactionId,
      productId,
      newQty,
      userId: req.user?.id
    });

    res.json({ line: updatedLine, action: 'updated' });
  } else {
    // Create new line
    const lineTotal = calculateTotal(parseFloat(unitPrice), parseInt(qty), parseFloat(discount), parseFloat(taxAmount));

    const newLine = await prisma.transactionLine.create({
      data: {
        transactionId,
        productId,
        unitPrice: parseFloat(unitPrice),
        qty: parseInt(qty),
        discount: parseFloat(discount),
        taxAmount: parseFloat(taxAmount),
        lineTotal
      },
      include: {
        product: { select: { name: true, sku: true } }
      }
    });

    logger.info({
      message: 'Line added to transaction',
      lineId: newLine.id,
      transactionId,
      productId,
      userId: req.user?.id
    });

    res.status(201).json({ line: newLine, action: 'created' });
  }
});

// ✅ Remove line from transaction
export const removeLineFromTransaction = asyncHandler(async (req, res) => {
  const { transactionId, lineId } = req.params;

  // Validate line belongs to transaction
  const line = await prisma.transactionLine.findUnique({
    where: { id: lineId },
    include: { 
      transaction: true,
      product: { select: { name: true } }
    }
  });

  if (!line) {
    throw new NotFoundError('Transaction line not found');
  }

  if (line.transactionId !== transactionId) {
    throw new BadRequestError('Line does not belong to this transaction');
  }

  if (line.transaction.status === 'COMPLETED') {
    throw new BadRequestError('Cannot modify completed transaction');
  }

  await prisma.transactionLine.delete({
    where: { id: lineId }
  });

  logger.info({
    message: 'Line removed from transaction',
    lineId,
    transactionId,
    productName: line.product.name,
    userId: req.user?.id
  });

  res.json({ message: "Line removed from transaction successfully" });
});

// ✅ Get lines by product
export const getLinesByProduct = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 100 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    productId: req.params.productId,
    ...(startDate && endDate && {
      transaction: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    })
  };

  const [lines, total] = await Promise.all([
    prisma.transactionLine.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            receiptNumber: true,
            createdAt: true,
            branch: { select: { name: true } }
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { transaction: { createdAt: 'desc' } }
    }),
    prisma.transactionLine.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'TransactionLine',
    operation: 'getLinesByProduct',
    productId: req.params.productId,
    count: lines.length,
    userId: req.user?.id
  });

  res.json({
    lines,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Get product sales statistics
export const getProductSalesStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const productId = req.params.productId;

  const where = {
    productId,
    transaction: {
      status: 'COMPLETED',
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }
  };

  const [stats, product] = await Promise.all([
    prisma.transactionLine.aggregate({
      where,
      _sum: {
        qty: true,
        lineTotal: true,
        discount: true,
        taxAmount: true
      },
      _avg: {
        unitPrice: true,
        qty: true
      },
      _count: true
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true, unit: true }
    })
  ]);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  logger.info({
    message: 'Product sales stats generated',
    productId,
    productName: product.name,
    userId: req.user?.id
  });

  res.json({
    product,
    stats: {
      totalSales: stats._count,
      totalQuantitySold: stats._sum.qty || 0,
      totalRevenue: stats._sum.lineTotal || 0,
      totalDiscount: stats._sum.discount || 0,
      totalTax: stats._sum.taxAmount || 0,
      averagePrice: stats._avg.unitPrice || 0,
      averageQuantityPerSale: stats._avg.qty || 0
    }
  });
});

// ✅ Create multiple lines (bulk operation)
export const createMultipleLines = asyncHandler(async (req, res) => {
  const { lines } = req.body;

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new BadRequestError('Lines array is required and cannot be empty');
  }

  // Validate and calculate totals for each line
  const processedLines = lines.map(line => {
    const { transactionId, productId, unitPrice, qty, discount = 0, taxAmount = 0 } = line;
    
    if (!transactionId || !productId || !unitPrice || !qty) {
      throw new BadRequestError('Each line must have transactionId, productId, unitPrice, and qty');
    }

    return {
      transactionId,
      productId,
      unitPrice: parseFloat(unitPrice),
      qty: parseInt(qty),
      discount: parseFloat(discount),
      taxAmount: parseFloat(taxAmount),
      lineTotal: calculateTotal(parseFloat(unitPrice), parseInt(qty), parseFloat(discount), parseFloat(taxAmount))
    };
  });

  const createdLines = await prisma.transactionLine.createMany({
    data: processedLines
  });

  logger.info({
    message: 'Multiple transaction lines created',
    count: createdLines.count,
    userId: req.user?.id
  });

  res.status(201).json({
    message: `${createdLines.count} transaction lines created successfully`,
    count: createdLines.count
  });
});

// ✅ Update multiple lines (bulk operation)
export const updateMultipleLines = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new BadRequestError('Updates array is required and cannot be empty');
  }

  const results = [];

  for (const update of updates) {
    const { id, unitPrice, qty, discount, taxAmount } = update;
    
    if (!id) continue;

    try {
      const existingLine = await prisma.transactionLine.findUnique({
        where: { id }
      });

      if (!existingLine) continue;

      const newUnitPrice = unitPrice !== undefined ? parseFloat(unitPrice) : existingLine.unitPrice;
      const newQty = qty !== undefined ? parseInt(qty) : existingLine.qty;
      const newDiscount = discount !== undefined ? parseFloat(discount) : existingLine.discount;
      const newTaxAmount = taxAmount !== undefined ? parseFloat(taxAmount) : existingLine.taxAmount;
      
      const lineTotal = calculateTotal(newUnitPrice, newQty, newDiscount, newTaxAmount);

      const updatedLine = await prisma.transactionLine.update({
        where: { id },
        data: {
          ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
          ...(qty !== undefined && { qty: parseInt(qty) }),
          ...(discount !== undefined && { discount: parseFloat(discount) }),
          ...(taxAmount !== undefined && { taxAmount: parseFloat(taxAmount) }),
          lineTotal
        }
      });

      results.push({ id, success: true, line: updatedLine });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }

  logger.info({
    message: 'Multiple transaction lines updated',
    processedCount: results.length,
    successCount: results.filter(r => r.success).length,
    userId: req.user?.id
  });

  res.json({
    message: `Processed ${results.length} update requests`,
    results
  });
});

// ✅ Delete multiple lines (bulk operation)
export const deleteMultipleLines = asyncHandler(async (req, res) => {
  const { lineIds } = req.body;

  if (!Array.isArray(lineIds) || lineIds.length === 0) {
    throw new BadRequestError('lineIds array is required and cannot be empty');
  }

  const deletedLines = await prisma.transactionLine.deleteMany({
    where: {
      id: {
        in: lineIds
      }
    }
  });

  logger.warn({
    message: 'Multiple transaction lines deleted',
    count: deletedLines.count,
    userId: req.user?.id
  });

  res.json({
    message: `${deletedLines.count} transaction lines deleted successfully`,
    count: deletedLines.count
  });
});

// ✅ Get top selling products
export const getTopSellingProducts = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;

  const where = {
    transaction: {
      status: 'COMPLETED',
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }
  };

  const topProducts = await prisma.transactionLine.groupBy({
    by: ['productId'],
    where,
    _sum: {
      qty: true,
      lineTotal: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        qty: 'desc'
      }
    },
    take: parseInt(limit)
  });

  // Get product details
  const productIds = topProducts.map(p => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, unit: true }
  });

  const result = topProducts.map(tp => {
    const product = products.find(p => p.id === tp.productId);
    return {
      product,
      totalQuantitySold: tp._sum.qty,
      totalRevenue: tp._sum.lineTotal,
      totalTransactions: tp._count.id
    };
  });

  logger.info({
    message: 'Top selling products retrieved',
    count: result.length,
    userId: req.user?.id
  });

  res.json(result);
});

// ✅ Get sales by period
export const getSalesByPeriod = asyncHandler(async (req, res) => {
  const { period = 'day', startDate, endDate, productId } = req.query;

  let dateFormat;
  switch (period) {
    case 'hour':
      dateFormat = 'YYYY-MM-DD HH24:00:00';
      break;
    case 'day':
      dateFormat = 'YYYY-MM-DD';
      break;
    case 'month':
      dateFormat = 'YYYY-MM';
      break;
    case 'year':
      dateFormat = 'YYYY';
      break;
    default:
      dateFormat = 'YYYY-MM-DD';
  }

  const where = {
    ...(productId && { productId }),
    transaction: {
      status: 'COMPLETED',
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }
  };

  const salesData = await prisma.$queryRaw`
    SELECT 
      to_char(t."createdAt", ${dateFormat}) as period,
      SUM(tl.qty) as total_quantity,
      SUM(tl."lineTotal") as total_revenue,
      COUNT(DISTINCT tl."transactionId") as total_transactions,
      COUNT(tl.id) as total_lines
    FROM "TransactionLine" tl
    JOIN "Transaction" t ON tl."transactionId" = t.id
    WHERE t.status = 'COMPLETED'
    ${productId ? Prisma.sql`AND tl."productId" = ${productId}` : Prisma.empty}
    ${startDate && endDate ? Prisma.sql`AND t."createdAt" BETWEEN ${startDate} AND ${endDate}` : Prisma.empty}
    GROUP BY to_char(t."createdAt", ${dateFormat})
    ORDER BY period
  `;

  logger.info({
    message: 'Sales by period retrieved',
    period,
    dataPoints: salesData.length,
    userId: req.user?.id
  });

  res.json(salesData);
});

// ✅ Get revenue breakdown
export const getRevenueBreakdown = asyncHandler(async (req, res) => {
  const { startDate, endDate, branchId } = req.query;

  const where = {
    transaction: {
      status: 'COMPLETED',
      ...(branchId && { branchId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }
  };

  const [overall, byCategory] = await Promise.all([
    prisma.transactionLine.aggregate({
      where,
      _sum: {
        lineTotal: true,
        discount: true,
        taxAmount: true,
        qty: true
      },
      _count: true
    }),
    prisma.transactionLine.groupBy({
      by: ['productId'],
      where,
      _sum: {
        lineTotal: true,
        qty: true
      },
      _count: true
    })
  ]);

  // Get product categories for breakdown
  const productIds = byCategory.map(bc => bc.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } }
    }
  });

  const categoryBreakdown = {};
  byCategory.forEach(bc => {
    const product = products.find(p => p.id === bc.productId);
    const categoryName = product?.category?.name || 'Uncategorized';
    
    if (!categoryBreakdown[categoryName]) {
      categoryBreakdown[categoryName] = {
        totalRevenue: 0,
        totalQuantity: 0,
        totalLines: 0
      };
    }
    
    categoryBreakdown[categoryName].totalRevenue += bc._sum.lineTotal || 0;
    categoryBreakdown[categoryName].totalQuantity += bc._sum.qty || 0;
    categoryBreakdown[categoryName].totalLines += bc._count || 0;
  });

  logger.info({
    message: 'Revenue breakdown generated',
    branchId,
    userId: req.user?.id
  });

  res.json({
    overall: {
      totalRevenue: overall._sum.lineTotal || 0,
      totalDiscount: overall._sum.discount || 0,
      totalTax: overall._sum.taxAmount || 0,
      totalQuantity: overall._sum.qty || 0,
      totalLines: overall._count
    },
    byCategory: categoryBreakdown
  });
});

// ✅ Calculate line total
export const calculateLineTotal = asyncHandler(async (req, res) => {
  const line = await prisma.transactionLine.findUnique({
    where: { id: req.params.id }
  });

  if (!line) {
    throw new NotFoundError('Transaction line not found');
  }

  const calculatedTotal = calculateTotal(line.unitPrice, line.qty, line.discount, line.taxAmount);

  res.json({
    lineId: line.id,
    unitPrice: line.unitPrice,
    quantity: line.qty,
    discount: line.discount,
    taxAmount: line.taxAmount,
    calculatedTotal,
    currentTotal: line.lineTotal,
    isCorrect: Math.abs(calculatedTotal - line.lineTotal) < 0.01
  });
});

// ✅ Validate transaction line
export const validateTransactionLine = asyncHandler(async (req, res) => {
  const { transactionId, productId, unitPrice, qty, discount = 0, taxAmount = 0 } = req.body;

  const errors = [];
  const warnings = [];

  // Required field validation
  if (!transactionId) errors.push("transactionId is required");
  if (!productId) errors.push("productId is required");
  if (!unitPrice || unitPrice <= 0) errors.push("unitPrice must be greater than 0");
  if (!qty || qty <= 0) errors.push("qty must be greater than 0");

  // Type validation
  if (isNaN(parseFloat(unitPrice))) errors.push("unitPrice must be a valid number");
  if (isNaN(parseInt(qty))) errors.push("qty must be a valid integer");
  if (isNaN(parseFloat(discount))) errors.push("discount must be a valid number");
  if (isNaN(parseFloat(taxAmount))) errors.push("taxAmount must be a valid number");

  // Business logic validation
  if (parseFloat(discount) < 0) warnings.push("Discount is negative");
  if (parseFloat(taxAmount) < 0) warnings.push("Tax amount is negative");
  if (parseFloat(discount) > (parseFloat(unitPrice) * parseInt(qty))) {
    warnings.push("Discount exceeds line subtotal");
  }

  // Check if transaction and product exist (if no errors so far)
  if (errors.length === 0) {
    const [transaction, product] = await Promise.all([
      transactionId ? prisma.transaction.findUnique({ where: { id: transactionId } }) : null,
      productId ? prisma.product.findUnique({ where: { id: productId } }) : null
    ]);

    if (!transaction) errors.push("Transaction not found");
    if (!product) errors.push("Product not found");

    if (transaction && transaction.status === 'COMPLETED') {
      errors.push("Cannot add lines to completed transaction");
    }

    if (product && !product.active) {
      warnings.push("Product is inactive");
    }
  }

  const calculatedTotal = errors.length === 0 ? 
    calculateTotal(parseFloat(unitPrice), parseInt(qty), parseFloat(discount), parseFloat(taxAmount)) : 0;

  logger.info({
    message: 'Transaction line validated',
    valid: errors.length === 0,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    userId: req.user?.id
  });

  res.json({
    valid: errors.length === 0,
    errors,
    warnings,
    calculatedTotal: calculatedTotal || 0
  });
});