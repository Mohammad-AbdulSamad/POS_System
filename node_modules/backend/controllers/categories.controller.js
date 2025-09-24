// controllers/categories.controller.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const { 
      include_relations = 'false', 
      branchId, 
      search,
      page = 1,
      limit = 100 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      ...(branchId && { branchId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' }
      })
    };
    
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: include_relations === 'true' ? {
          branch: { select: { id: true, name: true } },
          products: {
            select: {
              id: true,
              name: true,
              sku: true,
              priceGross: true,
              stock: true,
              active: true
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
          branch: { select: { id: true, name: true } },
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
      prisma.category.count({ where })
    ]);
    
    res.json({
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getAllCategories:', err);
    res.status(500).json({ message: "Error fetching categories", error: err.message });
  }
};

// 🟢 Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { include_relations = 'false' } = req.query;
    
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: include_relations === 'true' ? {
        branch: true,
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
            createdAt: true
          },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            products: true
          }
        }
      } : {
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error('Error in getCategoryById:', err);
    res.status(500).json({ message: "Error fetching category", error: err.message });
  }
};

// 🟢 Create category
export const createCategory = async (req, res) => {
  try {
    const { name, branchId } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Category name is required" });
    }
    
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }
    
    // Validate branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });
    
    if (!branch) {
      return res.status(400).json({ message: "Branch not found" });
    }
    
    // Check for duplicate category name in the same branch
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        branchId
      }
    });
    
    if (existingCategory) {
      return res.status(409).json({ message: "Category name already exists in this branch" });
    }
    
    const newCategory = await prisma.category.create({
      data: { 
        name: name.trim(), 
        branchId 
      },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Error in createCategory:', err);
    res.status(500).json({ message: "Error creating category", error: err.message });
  }
};

// 🟢 Update category
export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if category exists first
    const existingCategory = await prisma.category.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Check for duplicate name if updating name
    if (name && name.trim() !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: name.trim(),
          branchId: existingCategory.branchId,
          NOT: { id: req.params.id }
        }
      });
      
      if (duplicateCategory) {
        return res.status(409).json({ message: "Category name already exists in this branch" });
      }
    }
    
    const updatedCategory = await prisma.category.update({
      where: { id: req.params.id },
      data: { 
        ...(name && { name: name.trim() })
      },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    res.json(updatedCategory);
  } catch (err) {
    console.error('Error in updateCategory:', err);
    res.status(500).json({ message: "Error updating category", error: err.message });
  }
};

// 🟢 Delete category
export const deleteCategory = async (req, res) => {
  try {
    // Check if category exists and has products
    const categoryWithProducts = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!categoryWithProducts) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if category has products
    if (categoryWithProducts._count.products > 0) {
      return res.status(400).json({ 
        message: "Cannot delete category with existing products. Move or delete products first.",
        details: { products: categoryWithProducts._count.products }
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error('Error in deleteCategory:', err);
    res.status(500).json({ message: "Error deleting category", error: err.message });
  }
};

// 🆕 Get categories by branch
export const getCategoriesByBranch = async (req, res) => {
  try {
    const { include_products = 'false', active_only = 'false' } = req.query;
    
    const categories = await prisma.category.findMany({
      where: { branchId: req.params.branchId },
      include: include_products === 'true' ? {
        products: {
          where: active_only === 'true' ? { active: true } : {},
          select: {
            id: true,
            name: true,
            sku: true,
            priceGross: true,
            stock: true,
            active: true
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
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(categories);
  } catch (err) {
    console.error('Error in getCategoriesByBranch:', err);
    res.status(500).json({ message: "Error fetching branch categories", error: err.message });
  }
};

// 🆕 Get category products
export const getCategoryProducts = async (req, res) => {
  try {
    const { 
      active, 
      lowStock, 
      search, 
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1, 
      limit = 50 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      categoryId: req.params.id,
      ...(active !== undefined && { active: active === 'true' }),
      ...(lowStock === 'true' && { stock: { lte: 10 } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const validSortFields = ['name', 'sku', 'priceGross', 'stock', 'createdAt'];
    const orderBy = validSortFields.includes(sortBy) 
      ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' }
      : { name: 'asc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
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
    console.error('Error in getCategoryProducts:', err);
    res.status(500).json({ message: "Error fetching category products", error: err.message });
  }
};

// 🆕 Get category analytics
export const getCategoryAnalytics = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      priceStats
    ] = await Promise.all([
      prisma.product.count({ where: { categoryId: req.params.id } }),
      prisma.product.count({ where: { categoryId: req.params.id, active: true } }),
      prisma.product.count({
        where: {
          categoryId: req.params.id,
          active: true,
          OR: [
            { stock: { lte: prisma.raw('COALESCE("minStock", 10)') } },
            { stock: { lte: 10 } }
          ]
        }
      }),
      prisma.product.count({
        where: {
          categoryId: req.params.id,
          active: true,
          stock: 0
        }
      }),
      prisma.product.aggregate({
        where: {
          categoryId: req.params.id,
          active: true
        },
        _sum: {
          stock: true
        }
      }),
      prisma.product.aggregate({
        where: {
          categoryId: req.params.id,
          active: true
        },
        _avg: { priceGross: true },
        _min: { priceGross: true },
        _max: { priceGross: true }
      })
    ]);

    // Get top products by stock value
    const topProducts = await prisma.product.findMany({
      where: {
        categoryId: req.params.id,
        active: true,
        stock: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        priceGross: true
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
        averagePrice: priceStats._avg.priceGross || 0,
        minPrice: priceStats._min.priceGross || 0,
        maxPrice: priceStats._max.priceGross || 0
      },
      topProducts
    });
  } catch (err) {
    console.error('Error in getCategoryAnalytics:', err);
    res.status(500).json({ message: "Error fetching category analytics", error: err.message });
  }
};

// 🆕 Move products to different category
export const moveProductsToCategory = async (req, res) => {
  try {
    const { productIds, targetCategoryId } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs array is required" });
    }
    
    if (!targetCategoryId) {
      return res.status(400).json({ message: "Target category ID is required" });
    }
    
    // Validate target category exists
    const targetCategory = await prisma.category.findUnique({
      where: { id: targetCategoryId },
      include: { branch: { select: { id: true, name: true } } }
    });
    
    if (!targetCategory) {
      return res.status(400).json({ message: "Target category not found" });
    }
    
    // Validate products exist and belong to same branch
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        categoryId: req.params.id
      }
    });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ 
        message: "Some products not found or don't belong to this category" 
      });
    }
    
    // Check if products belong to same branch as target category
    const differentBranchProducts = products.filter(p => p.branchId !== targetCategory.branchId);
    if (differentBranchProducts.length > 0) {
      return res.status(400).json({ 
        message: "Cannot move products to category in different branch" 
      });
    }
    
    // Move products
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds }
      },
      data: {
        categoryId: targetCategoryId
      }
    });
    
    res.json({ 
      message: `Successfully moved ${result.count} products to ${targetCategory.name}`,
      movedCount: result.count,
      targetCategory: {
        id: targetCategory.id,
        name: targetCategory.name
      }
    });
  } catch (err) {
    console.error('Error in moveProductsToCategory:', err);
    res.status(500).json({ message: "Error moving products", error: err.message });
  }
};

// 🆕 Duplicate category (with or without products)
export const duplicateCategory = async (req, res) => {
  try {
    const { newName, includeProducts = false } = req.body;
    
    if (!newName || newName.trim() === '') {
      return res.status(400).json({ message: "New category name is required" });
    }
    
    // Get original category
    const originalCategory = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        products: includeProducts === true
      }
    });
    
    if (!originalCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Check if new name already exists in branch
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: newName.trim(),
        branchId: originalCategory.branchId
      }
    });
    
    if (existingCategory) {
      return res.status(409).json({ message: "Category name already exists in this branch" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      // Create new category
      const newCategory = await tx.category.create({
        data: {
          name: newName.trim(),
          branchId: originalCategory.branchId
        }
      });
      
      let duplicatedProductsCount = 0;
      
      // Duplicate products if requested
      if (includeProducts === true && originalCategory.products.length > 0) {
        for (const product of originalCategory.products) {
          const newSku = `${product.sku}-COPY-${Date.now()}`;
          const newName = `${product.name} (Copy)`;
          
          await tx.product.create({
            data: {
              branchId: product.branchId,
              categoryId: newCategory.id,
              sku: newSku,
              name: newName,
              description: product.description,
              priceGross: product.priceGross,
              cost: product.cost,
              unit: product.unit,
              stock: 0, // Start with 0 stock for duplicated products
              supplierId: product.supplierId,
              taxRateId: product.taxRateId,
              active: false, // Start inactive for review
              minStock: product.minStock,
              reorderPoint: product.reorderPoint,
              barcode: null, // Don't duplicate barcode
              imageUrl: product.imageUrl,
              size: product.size,
              weight: product.weight,
              volume: product.volume,
              packSize: product.packSize,
              metadata: product.metadata
            }
          });
          duplicatedProductsCount++;
        }
      }
      
      return { newCategory, duplicatedProductsCount };
    });
    
    // Get complete category with counts
    const completeCategory = await prisma.category.findUnique({
      where: { id: result.newCategory.id },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            products: true
          }
        }
      }
    });
    
    res.status(201).json({
      category: completeCategory,
      duplicatedProductsCount: result.duplicatedProductsCount,
      message: `Category duplicated successfully${includeProducts ? ` with ${result.duplicatedProductsCount} products` : ''}`
    });
  } catch (err) {
    console.error('Error in duplicateCategory:', err);
    res.status(500).json({ message: "Error duplicating category", error: err.message });
  }
};