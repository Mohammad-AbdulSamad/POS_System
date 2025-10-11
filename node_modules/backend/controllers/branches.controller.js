// controllers/branches.controller.js - Updated with Error Handling & Logging
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// ✅ Get all branches
export const getAllBranches = asyncHandler(async (req, res) => {
  const { include_relations = 'false' } = req.query;
  
  const branches = await prisma.branch.findMany({
    include: include_relations === 'true' ? {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      },
      products: {
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          priceGross: true,
          active: true
        },
        take: 10
      },
      categories: true,
      _count: {
        select: {
          products: true,
          users: true,
          transactions: true,
          stockMovements: true,
          categories: true
        }
      }
    } : {
      _count: {
        select: {
          products: true,
          users: true,
          transactions: true,
          stockMovements: true,
          categories: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  logger.logDatabase('READ', {
    model: 'Branch',
    count: branches.length,
    userId: req.user?.id,
    includeRelations: include_relations === 'true'
  });
  
  res.json(branches);
});

// ✅ Get branch by ID
export const getBranchById = asyncHandler(async (req, res) => {
  const { include_relations = 'false' } = req.query;
  
  const branch = await prisma.branch.findUnique({
    where: { id: req.params.id },
    include: include_relations === 'true' ? {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      },
      products: {
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          priceGross: true,
          active: true
        },
        take: 20
      },
      categories: true,
      _count: {
        select: {
          products: true,
          users: true,
          transactions: true,
          stockMovements: true,
          categories: true
        }
      }
    } : {
      _count: {
        select: {
          products: true,
          users: true,
          transactions: true,
          stockMovements: true,
          categories: true
        }
      }
    },
  });
  
  if (!branch) {
    throw new NotFoundError('Branch not found');
  }

  logger.logDatabase('READ', {
    model: 'Branch',
    id: req.params.id,
    userId: req.user?.id
  });
  
  res.json(branch);
});

// ✅ Create branch
export const createBranch = asyncHandler(async (req, res) => {
  const { name, address, phone } = req.body;
  
  // Validate required fields
  if (!name || name.trim() === '') {
    throw new BadRequestError('Branch name is required');
  }
  
  const newBranch = await prisma.branch.create({
    data: { 
      name: name.trim(), 
      address: address?.trim() || null, 
      phone: phone?.trim() || null 
    },
  });

  logger.info({
    message: 'Branch created',
    branchId: newBranch.id,
    branchName: newBranch.name,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.status(201).json(newBranch);
});

// ✅ Update branch
export const updateBranch = asyncHandler(async (req, res) => {
  const { name, address, phone } = req.body;
  
  // Check if branch exists first
  const existingBranch = await prisma.branch.findUnique({
    where: { id: req.params.id }
  });
  
  if (!existingBranch) {
    throw new NotFoundError('Branch not found');
  }
  
  const updatedBranch = await prisma.branch.update({
    where: { id: req.params.id },
    data: { 
      ...(name && { name: name.trim() }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(phone !== undefined && { phone: phone?.trim() || null })
    },
  });

  logger.info({
    message: 'Branch updated',
    branchId: updatedBranch.id,
    branchName: updatedBranch.name,
    userId: req.user?.id,
    changes: { name, address, phone }
  });
  
  res.json(updatedBranch);
});

// ✅ Delete branch
export const deleteBranch = asyncHandler(async (req, res) => {
  // Check if branch exists first
  const branchWithRelations = await prisma.branch.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          products: true,
          users: true,
          transactions: true,
          categories: true,
          stockMovements: true
        }
      }
    }
  });

  if (!branchWithRelations) {
    throw new NotFoundError('Branch not found');
  }

  // Check if branch has data that would prevent deletion
  const counts = branchWithRelations._count;
  const hasRelatedData = counts.users > 0 || 
                        counts.products > 0 || 
                        counts.transactions > 0 ||
                        counts.categories > 0 ||
                        counts.stockMovements > 0;

  if (hasRelatedData) {
    throw new BadRequestError('Cannot delete branch with existing data', { details: counts });
  }

  await prisma.branch.delete({
    where: { id: req.params.id },
  });

  logger.warn({
    message: 'Branch deleted',
    branchId: req.params.id,
    branchName: branchWithRelations.name,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.json({ message: "Branch deleted successfully" });
});

// ✅ Get branch products with filtering
export const getBranchProducts = asyncHandler(async (req, res) => {
  const { categoryId, active, lowStock, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    branchId: req.params.id,
    ...(categoryId && { categoryId }),
    ...(active !== undefined && { active: active === 'true' }),
    ...(lowStock === 'true' && {
      stock: { lte: 10 }
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
        taxRate: true
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { name: 'asc' }
    }),
    prisma.product.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'Product',
    operation: 'getBranchProducts',
    branchId: req.params.id,
    count: products.length,
    userId: req.user?.id
  });

  res.json({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Get branch categories
export const getBranchCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { branchId: req.params.id },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  logger.logDatabase('READ', {
    model: 'Category',
    branchId: req.params.id,
    count: categories.length,
    userId: req.user?.id
  });
  
  res.json(categories);
});

// ✅ Get branch users
export const getBranchUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { branchId: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          transactions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  logger.logDatabase('READ', {
    model: 'User',
    branchId: req.params.id,
    count: users.length,
    userId: req.user?.id
  });
  
  res.json(users);
});

// ✅ Get branch transactions
export const getBranchTransactions = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, page = 1, limit = 100 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    branchId: req.params.id,
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
        cashier: {
          select: { name: true, email: true }
        },
        customer: {
          select: { name: true, phone: true }
        },
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
    branchId: req.params.id,
    count: transactions.length,
    userId: req.user?.id,
    filters: { startDate, endDate, status }
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

// ✅ Get branch stock movements
export const getBranchStockMovements = asyncHandler(async (req, res) => {
  const { reason, startDate, endDate, productId, page = 1, limit = 100 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    branchId: req.params.id,
    ...(reason && { reason }),
    ...(productId && { productId }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  const [stockMovements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: { name: true, sku: true }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.stockMovement.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'StockMovement',
    branchId: req.params.id,
    count: stockMovements.length,
    userId: req.user?.id
  });

  res.json({
    stockMovements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Get branch analytics
export const getBranchAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const [
    totalProducts,
    totalUsers,
    totalCategories,
    recentTransactions,
    lowStockProducts,
    salesSummary
  ] = await Promise.all([
    prisma.product.count({ where: { branchId: req.params.id, active: true } }),
    prisma.user.count({ where: { branchId: req.params.id } }),
    prisma.category.count({ where: { branchId: req.params.id } }),
    prisma.transaction.count({
      where: {
        branchId: req.params.id,
        createdAt: { gte: startDate }
      }
    }),
    prisma.product.count({
      where: {
        branchId: req.params.id,
        active: true,
        stock: { lte: 10 }
      }
    }),
    prisma.transaction.aggregate({
      where: {
        branchId: req.params.id,
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _sum: { totalGross: true },
      _count: true
    })
  ]);

  logger.info({
    message: 'Branch analytics generated',
    branchId: req.params.id,
    period: parseInt(period),
    userId: req.user?.id
  });

  res.json({
    period: parseInt(period),
    overview: {
      totalProducts,
      totalUsers,
      totalCategories,
      recentTransactions,
      lowStockProducts
    },
    sales: {
      totalRevenue: salesSummary._sum.totalGross || 0,
      totalTransactions: salesSummary._count,
      averageTransaction: salesSummary._count > 0 
        ? (salesSummary._sum.totalGross / salesSummary._count) 
        : 0
    }
  });
});

// ✅ Get inventory status
export const getInventoryStatus = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    stockValue
  ] = await Promise.all([
    prisma.product.count({ where: { branchId: req.params.id } }),
    prisma.product.count({ where: { branchId: req.params.id, active: true } }),
    prisma.product.count({
      where: {
        branchId: req.params.id,
        active: true,
        stock: { gt: 0, lte: 10 }
      }
    }),
    prisma.product.count({
      where: {
        branchId: req.params.id,
        active: true,
        stock: 0
      }
    }),
    prisma.product.aggregate({
      where: {
        branchId: req.params.id,
        active: true
      },
      _sum: {
        stock: true
      }
    })
  ]);

  const lowStockItems = await prisma.product.findMany({
    where: {
      branchId: req.params.id,
      active: true,
      stock: { gt: 0, lte: 10 }
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minStock: true,
      reorderPoint: true
    },
    take: 20,
    orderBy: { stock: 'asc' }
  });

  logger.info({
    message: 'Inventory status checked',
    branchId: req.params.id,
    lowStockCount: lowStockProducts,
    outOfStockCount: outOfStockProducts,
    userId: req.user?.id
  });

  res.json({
    summary: {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockUnits: stockValue._sum.stock || 0
    },
    lowStockItems
  });
});