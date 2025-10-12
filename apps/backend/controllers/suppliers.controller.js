// controllers/suppliers.controller.js
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// 🟢 Get all suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const { 
      include_relations = 'false',
      search,
      hasProducts,
      page = 1,
      limit = 50 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      ...(hasProducts === 'true' && {
        products: {
          some: {}
        }
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: include_relations === 'true' ? {
          products: {
            select: {
              id: true,
              name: true,
              sku: true,
              priceGross: true,
              cost: true,
              stock: true,
              active: true,
              branch: {
                select: { id: true, name: true }
              }
            },
            where: { active: true },
            take: 10,
            orderBy: { name: 'asc' }
          },
          _count: {
            select: {
              products: true
            }
          }
        } : {
          _count: {
            select: {
              products: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.supplier.count({ where })
    ]);
    
    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getAllSuppliers:', err);
    res.status(500).json({ message: "Error fetching suppliers", error: err.message });
  }
};

// 🟢 Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const { include_relations = 'false' } = req.query;
    
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: include_relations === 'true' ? {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            priceGross: true,
            cost: true,
            stock: true,
            active: true,
            minStock: true,
            reorderPoint: true,
            createdAt: true,
            branch: {
              select: { id: true, name: true }
            },
            category: {
              select: { id: true, name: true }
            }
          },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            products: true
          }
        }
      } : {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    console.error('Error in getSupplierById:', err);
    res.status(500).json({ message: "Error fetching supplier", error: err.message });
  }
};

// 🟢 Create supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Supplier name is required" });
    }
    
    // Validate phone format if provided
    if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ message: "Invalid phone format" });
    }
    
    // Check for duplicate supplier name
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: name.trim()
      }
    });
    
    if (existingSupplier) {
      return res.status(409).json({ message: "Supplier name already exists" });
    }
    
    const newSupplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    res.status(201).json(newSupplier);
  } catch (err) {
    console.error('Error in createSupplier:', err);
    res.status(500).json({ message: "Error creating supplier", error: err.message });
  }
};

// 🟢 Update supplier
export const updateSupplier = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    
    // Validate phone format if provided
    if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ message: "Invalid phone format" });
    }
    
    // Check for duplicate name if updating name
    if (name && name.trim() !== existingSupplier.name) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: {
          name: name.trim(),
          NOT: { id: req.params.id }
        }
      });
      
      if (duplicateSupplier) {
        return res.status(409).json({ message: "Supplier name already exists" });
      }
    }
    
    const updatedSupplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null })
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    res.json(updatedSupplier);
  } catch (err) {
    console.error('Error in updateSupplier:', err);
    res.status(500).json({ message: "Error updating supplier", error: err.message });
  }
};

// 🟢 Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    // Check if supplier exists and has products
    const supplierWithProducts = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!supplierWithProducts) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Check if supplier has products
    if (supplierWithProducts._count.products > 0) {
      return res.status(400).json({ 
        message: "Cannot delete supplier with existing products. Remove products first or assign them to different suppliers.",
        details: { products: supplierWithProducts._count.products }
      });
    }

    await prisma.supplier.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error('Error in deleteSupplier:', err);
    res.status(500).json({ message: "Error deleting supplier", error: err.message });
  }
};

// 🆕 Get supplier products
export const getSupplierProducts = async (req, res) => {
  try {
    const { 
      active, 
      lowStock, 
      branchId,
      categoryId,
      search, 
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1, 
      limit = 50 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      supplierId: req.params.id,
      ...(branchId && { branchId }),
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

    const validSortFields = ['name', 'sku', 'priceGross', 'cost', 'stock', 'createdAt'];
    const orderBy = validSortFields.includes(sortBy) 
      ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' }
      : { name: 'asc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          taxRate: { select: { id: true, name: true, rate: true } }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy
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
    console.error('Error in getSupplierProducts:', err);
    res.status(500).json({ message: "Error fetching supplier products", error: err.message });
  }
};

// 🆕 Get supplier analytics
export const getSupplierAnalytics = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      priceStats,
      branchDistribution
    ] = await Promise.all([
      prisma.product.count({ where: { supplierId: req.params.id } }),
      prisma.product.count({ where: { supplierId: req.params.id, active: true } }),
      prisma.product.count({
        where: {
          supplierId: req.params.id,
          active: true,
          stock: { lte: 10 }
        }
      }),
      prisma.product.count({
        where: {
          supplierId: req.params.id,
          active: true,
          stock: 0
        }
      }),
      prisma.product.aggregate({
        where: {
          supplierId: req.params.id,
          active: true
        },
        _sum: {
          stock: true
        }
      }),
      prisma.product.aggregate({
        where: {
          supplierId: req.params.id,
          active: true
        },
        _avg: { priceGross: true, cost: true },
        _min: { priceGross: true, cost: true },
        _max: { priceGross: true, cost: true }
      }),
      // Get product distribution by branch
      prisma.product.groupBy({
        by: ['branchId'],
        where: {
          supplierId: req.params.id,
          active: true
        },
        _count: true,
        _sum: { stock: true }
      })
    ]);

    // Get branch names for distribution
    const branchIds = branchDistribution.map(item => item.branchId);
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true }
    });

    const branchDistributionWithNames = branchDistribution.map(item => {
      const branch = branches.find(b => b.id === item.branchId);
      return {
        branchId: item.branchId,
        branchName: branch?.name || 'Unknown',
        productCount: item._count,
        totalStock: item._sum.stock || 0
      };
    });

    // Get top products by stock value (cost * stock)
    const topProductsByValue = await prisma.product.findMany({
      where: {
        supplierId: req.params.id,
        active: true,
        stock: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        cost: true,
        priceGross: true,
        branch: { select: { name: true } }
      },
      orderBy: {
        stock: 'desc'
      },
      take: 5
    });

    res.json({
      overview: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStockUnits: totalStockValue._sum.stock || 0
      },
      pricing: {
        averagePrice: priceStats._avg.priceGross ? parseFloat(priceStats._avg.priceGross) : 0,
        minPrice: priceStats._min.priceGross ? parseFloat(priceStats._min.priceGross) : 0,
        maxPrice: priceStats._max.priceGross ? parseFloat(priceStats._max.priceGross) : 0,
        averageCost: priceStats._avg.cost ? parseFloat(priceStats._avg.cost) : 0,
        minCost: priceStats._min.cost ? parseFloat(priceStats._min.cost) : 0,
        maxCost: priceStats._max.cost ? parseFloat(priceStats._max.cost) : 0
      },
      branchDistribution: branchDistributionWithNames,
      topProducts: topProductsByValue
    });
  } catch (err) {
    console.error('Error in getSupplierAnalytics:', err);
    res.status(500).json({ message: "Error fetching supplier analytics", error: err.message });
  }
};

// 🆕 Get products needing reorder from supplier
export const getSupplierReorderProducts = async (req, res) => {
  try {
    const { branchId, limit = 50 } = req.query;
    
    const where = {
      supplierId: req.params.id,
      active: true,
      ...(branchId && { branchId }),
      stock: { lte: 10 }
    };
    
    const products = await prisma.product.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } }
      },
      orderBy: { stock: 'asc' },
      take: parseInt(limit)
    });
    
    res.json(products);
  } catch (err) {
    console.error('Error in getSupplierReorderProducts:', err);
    res.status(500).json({ message: "Error fetching reorder products", error: err.message });
  }
};

// 🆕 Search suppliers
export const searchSuppliers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        message: "Search query must be at least 2 characters" 
      });
    }
    
    const suppliers = await prisma.supplier.findMany({
      where: {
        OR: [
          { name: { contains: q.trim(), mode: 'insensitive' } },
          { phone: { contains: q.trim() } },
          { address: { contains: q.trim(), mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      take: parseInt(limit),
      orderBy: { name: 'asc' }
    });
    
    res.json(suppliers);
  } catch (err) {
    console.error('Error in searchSuppliers:', err);
    res.status(500).json({ message: "Error searching suppliers", error: err.message });
  }
};

// 🆕 Bulk assign products to supplier
export const assignProductsToSupplier = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs array is required" });
    }
    
    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id }
    });
    
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    
    // Validate products exist
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ 
        message: "Some products not found" 
      });
    }
    
    // Update products to assign to this supplier
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { supplierId: req.params.id }
    });
    
    res.json({ 
      message: `Successfully assigned ${result.count} products to ${supplier.name}`,
      assignedCount: result.count,
      supplier: {
        id: supplier.id,
        name: supplier.name
      }
    });
  } catch (err) {
    console.error('Error in assignProductsToSupplier:', err);
    res.status(500).json({ message: "Error assigning products", error: err.message });
  }
};