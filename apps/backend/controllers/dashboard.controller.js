// ==========================================
// Dashboard Statistics Endpoints - FIXED
// ==========================================
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// ==========================================
// 1. Dashboard Overview Stats
// ==========================================
export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Today's sales (using correct field names from schema)
  const todaySales = await prisma.transaction.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: today }
    },
    _sum: { totalNet: true },
    _count: true
  });

  // Yesterday's sales
  const yesterdaySales = await prisma.transaction.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: yesterday, lt: today }
    },
    _sum: { totalNet: true },
    _count: true
  });

  // Total active products
  const totalProducts = await prisma.product.count({
    where: { active: true }
  });

  // Low stock items
  const allProducts = await prisma.product.findMany({
    where: { active: true },
    select: { 
      stock: true,
      reorderPoint: true
    }
  });

  const lowStockItems = allProducts.filter(
    (p) => p.stock <= (p.reorderPoint || 0) || p.stock === 0
  ).length;

  // Calculate percentage changes
  const todayTotal = Number(todaySales._sum.totalNet) || 0;
  const yesterdayTotal = Number(yesterdaySales._sum.totalNet) || 0;

  const salesChange = yesterdayTotal > 0
    ? (((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1)
    : todayTotal > 0 ? 100 : 0;

  const ordersChange = yesterdaySales._count > 0
    ? (((todaySales._count - yesterdaySales._count) / yesterdaySales._count) * 100).toFixed(1)
    : todaySales._count > 0 ? 100 : 0;

  res.json({
    todaySales: {
      value: todayTotal,
      change: parseFloat(salesChange),
      trend: salesChange > 0 ? 'up' : salesChange < 0 ? 'down' : 'neutral'
    },
    totalOrders: {
      value: todaySales._count || 0,
      change: parseFloat(ordersChange),
      trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'neutral'
    },
    totalProducts: {
      value: totalProducts,
      change: 0,
      trend: 'neutral'
    },
    lowStockItems: {
      value: lowStockItems,
      change: 0,
      trend: lowStockItems > 0 ? 'warning' : 'neutral'
    }
  });
});

// ==========================================
// 2. Sales Chart Data
// ==========================================
export const getSalesChartData = asyncHandler(async (req, res) => {
  // ✅ FIX: Provide default value if query params are missing
  const period = req.query?.period || 'week';
  
  let startDate = new Date();
  let groupBy = 'day';
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'hour';
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      groupBy = 'day';
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      groupBy = 'day';
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupBy = 'month';
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
      groupBy = 'day';
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true,
      totalNet: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group and format data based on period
  const dataMap = new Map();

  transactions.forEach(transaction => {
    const date = new Date(transaction.createdAt);
    let key;
    let sortKey;
    
    if (groupBy === 'hour') {
      const hour = date.getHours();
      key = `${hour}:00`;
      sortKey = hour;
    } else if (groupBy === 'day') {
      const dayIndex = date.getDay();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      key = days[dayIndex];
      sortKey = date.toISOString().split('T')[0];
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      key = monthNames[date.getMonth()];
      sortKey = date.getMonth();
    }

    const amount = Number(transaction.totalNet) || 0;
    
    if (dataMap.has(sortKey)) {
      const existing = dataMap.get(sortKey);
      existing.sales += amount;
    } else {
      dataMap.set(sortKey, { name: key, sales: amount, sortKey });
    }
  });

  // Convert to array and sort
  const sortedData = Array.from(dataMap.values())
    .sort((a, b) => {
      if (typeof a.sortKey === 'number') {
        return a.sortKey - b.sortKey;
      }
      return a.sortKey.localeCompare(b.sortKey);
    })
    .map(({ name, sales }) => ({ name, sales: Number(sales.toFixed(2)) }));

  res.json(sortedData);
});

// ==========================================
// 3. Recent Transactions
// ==========================================
export const getRecentTransactions = asyncHandler(async (req, res) => {
  // ✅ FIX: Provide default value if query params are missing
  const limit = parseInt(req.query?.limit) || 10;

  const transactions = await prisma.transaction.findMany({
    where: { status: 'COMPLETED' },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      totalNet: true,
      createdAt: true,
      receiptNumber: true,
      customer: {
        select: { name: true }
      },
      payments: {
        select: { method: true }
      },
      lines: {
        select: { qty: true }
      }
    }
  });

  const formatted = transactions.map(t => ({
    id: t.id,
    receiptNumber: t.receiptNumber,
    customer: t.customer?.name || 'Walk-in Customer',
    amount: Number(t.totalNet),
    items: t.lines.reduce((sum, line) => sum + line.qty, 0),
    paymentMethod: t.payments[0]?.method?.toLowerCase() || 'cash',
    status: 'completed',
    date: t.createdAt.toISOString()
  }));

  res.json(formatted);
});

// ==========================================
// 4. Top Selling Products
// ==========================================
export const getTopProducts = asyncHandler(async (req, res) => {
  // ✅ FIX: Provide default values if query params are missing
  const sortBy = req.query?.sortBy || 'sales';
  const limit = parseInt(req.query?.limit) || 10;
  const startDate = req.query?.startDate;
  const endDate = req.query?.endDate;

  // Date filter for transactions
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }

  // ✅ FIX: Changed _count from { id: true } to { _all: true } to avoid ambiguous column error
  const topProducts = await prisma.transactionLine.groupBy({
    by: ['productId'],
    where: {
      transaction: {
        status: 'COMPLETED',
        ...dateFilter
      }
    },
    _sum: {
      qty: true,
      lineTotal: true
    },
    _count: {
      _all: true  // ✅ FIXED: Use _all instead of id to avoid ambiguous column
    },
    orderBy: sortBy === 'revenue' 
      ? { _sum: { lineTotal: 'desc' } }
      : { _sum: { qty: 'desc' } },
    take: limit
  });

  // Get product details
  const productIds = topProducts.map(p => p.productId);
  
  if (productIds.length === 0) {
    return res.json([]);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      sku: true,
      category: {
        select: { name: true }
      },
      imageUrl: true
    }
  });

  // Combine data
  const result = topProducts.map(stat => {
    const product = products.find(p => p.id === stat.productId);
    if (!product) return null;
    
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || 'Uncategorized',
      image: product.imageUrl,
      sales: stat._sum.qty || 0,
      revenue: Number(stat._sum.lineTotal) || 0,
      transactions: stat._count._all  // ✅ FIXED: Use _all instead of id
    };
  }).filter(Boolean);

  logger.info({
    message: 'Top products retrieved',
    count: result.length,
    sortBy,
    userId: req.user?.id
  });

  res.json(result);
});

// ==========================================
// 5. Low Stock Items
// ==========================================
export const getLowStockItems = asyncHandler(async (req, res) => {
  // ✅ FIX: Provide default values if query params are missing
  const threshold = parseInt(req.query?.threshold) || 10;
  const limit = parseInt(req.query?.limit) || 20;

  const items = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { stock: 0 },
        { 
          AND: [
            { stock: { lte: threshold } },
            { stock: { gt: 0 } }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      reorderPoint: true,
      category: {
        select: { name: true }
      },
      imageUrl: true
    },
    orderBy: { stock: 'asc' },
    take: limit
  });

  const formatted = items.map(item => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category?.name || 'Uncategorized',
    stock: item.stock,
    reorderPoint: item.reorderPoint || 10,
    status: item.stock === 0 ? 'out_of_stock' : 'low_stock',
    image: item.imageUrl
  }));

  res.json(formatted);
});

// ==========================================
// 6. Sales Summary (Optional - useful addition)
// ==========================================
export const getSalesSummary = asyncHandler(async (req, res) => {
  const period = req.query?.period || 'today';
  
  let startDate = new Date();
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const summary = await prisma.transaction.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate }
    },
    _sum: {
      totalGross: true,
      totalTax: true,
      totalNet: true
    },
    _count: true,
    _avg: {
      totalNet: true
    }
  });

  res.json({
    period,
    totalSales: Number(summary._sum.totalNet) || 0,
    totalGross: Number(summary._sum.totalGross) || 0,
    totalTax: Number(summary._sum.totalTax) || 0,
    transactionCount: summary._count,
    averageTransaction: Number(summary._avg.totalNet) || 0
  });
});