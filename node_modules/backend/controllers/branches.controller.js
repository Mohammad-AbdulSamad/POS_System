// controllers/branches.controller.fixed.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 Get all branches
export const getAllBranches = async (req, res) => {
  try {
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
          take: 10 // Limit to prevent huge payloads
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
    
    res.json(branches);
  } catch (err) {
    console.error('Error in getAllBranches:', err);
    res.status(500).json({ message: "Error fetching branches", error: err.message });
  }
};

// 🟢 Get branch by ID
export const getBranchById = async (req, res) => {
  try {
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
    
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    console.error('Error in getBranchById:', err);
    res.status(500).json({ message: "Error fetching branch", error: err.message });
  }
};

// 🟢 Create branch
export const createBranch = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Branch name is required" });
    }
    
    const newBranch = await prisma.branch.create({
      data: { 
        name: name.trim(), 
        address: address?.trim() || null, 
        phone: phone?.trim() || null 
      },
    });
    
    res.status(201).json(newBranch);
  } catch (err) {
    console.error('Error in createBranch:', err);
    if (err.code === 'P2002') {
      res.status(409).json({ message: "Branch name already exists" });
    } else {
      res.status(500).json({ message: "Error creating branch", error: err.message });
    }
  }
};

// 🟢 Update branch
export const updateBranch = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    
    // Check if branch exists first
    const existingBranch = await prisma.branch.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    
    const updatedBranch = await prisma.branch.update({
      where: { id: req.params.id },
      data: { 
        ...(name && { name: name.trim() }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null })
      },
    });
    
    res.json(updatedBranch);
  } catch (err) {
    console.error('Error in updateBranch:', err);
    if (err.code === 'P2002') {
      res.status(409).json({ message: "Branch name already exists" });
    } else {
      res.status(500).json({ message: "Error updating branch", error: err.message });
    }
  }
};

// 🟢 Delete branch
export const deleteBranch = async (req, res) => {
  try {
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
      return res.status(404).json({ message: "Branch not found" });
    }

    // Check if branch has data that would prevent deletion
    const counts = branchWithRelations._count;
    const hasRelatedData = counts.users > 0 || 
                          counts.products > 0 || 
                          counts.transactions > 0 ||
                          counts.categories > 0 ||
                          counts.stockMovements > 0;

    if (hasRelatedData) {
      return res.status(400).json({ 
        message: "Cannot delete branch with existing data",
        details: counts
      });
    }

    await prisma.branch.delete({
      where: { id: req.params.id },
    });
    
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    console.error('Error in deleteBranch:', err);
    res.status(500).json({ message: "Error deleting branch", error: err.message });
  }
};

// 🆕 Get branch products with filtering
export const getBranchProducts = async (req, res) => {
  try {
    const { categoryId, active, lowStock, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      branchId: req.params.id,
      ...(categoryId && { categoryId }),
      ...(active !== undefined && { active: active === 'true' }),
      ...(lowStock === 'true' && {
        stock: { lte: 10 } // Simple low stock check
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

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getBranchProducts:', err);
    res.status(500).json({ message: "Error fetching branch products", error: err.message });
  }
};

// 🆕 Get branch categories
export const getBranchCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { branchId: req.params.id },
      include: {
        _count: {
          products: true
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(categories);
  } catch (err) {
    console.error('Error in getBranchCategories:', err);
    res.status(500).json({ message: "Error fetching branch categories", error: err.message });
  }
};

// 🆕 Get branch users
export const getBranchUsers = async (req, res) => {
  try {
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
    
    res.json(users);
  } catch (err) {
    console.error('Error in getBranchUsers:', err);
    res.status(500).json({ message: "Error fetching branch users", error: err.message });
  }
};

// 🆕 Get branch transactions
export const getBranchTransactions = async (req, res) => {
  try {
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

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getBranchTransactions:', err);
    res.status(500).json({ message: "Error fetching branch transactions", error: err.message });
  }
};

// 🆕 Get branch stock movements
export const getBranchStockMovements = async (req, res) => {
  try {
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

    res.json({
      stockMovements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getBranchStockMovements:', err);
    res.status(500).json({ message: "Error fetching branch stock movements", error: err.message });
  }
};

// 🆕 Get branch analytics
export const getBranchAnalytics = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error in getBranchAnalytics:', err);
    res.status(500).json({ message: "Error fetching branch analytics", error: err.message });
  }
};

// 🆕 Get inventory status
export const getInventoryStatus = async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Error in getInventoryStatus:', err);
    res.status(500).json({ message: "Error fetching inventory status", error: err.message });
  }
};