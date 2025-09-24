import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all products with pagination and filtering
export const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      branchId, 
      active, 
      categoryId, 
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    if (branchId) where.branchId = branchId;
    if (active !== undefined) where.active = active === 'true';
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          priceGross: true,
          cost: true,
          stock: true,
          unit: true,
          active: true,
          branchId: true,
          categoryId: true,
          category: { select: { name: true } }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take
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
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
};

// 🟢 Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { 
        category: true, 
        supplier: true, 
        taxRate: true,
        branch: { select: { name: true } }
      }
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
};

// 🟢 Create product
export const createProduct = async (req, res) => {
  try {
    const {
      branchId,
      sku,
      name,
      description,
      priceGross,
      cost,
      unit,
      stock = 0,
      categoryId,
      supplierId,
      taxRateId,
      active = true,
      metadata
    } = req.body;

    // Validation
    if (!branchId || !sku || !name || !priceGross) {
      return res.status(400).json({ 
        message: "Missing required fields: branchId, sku, name, priceGross" 
      });
    }

    const newProduct = await prisma.product.create({
      data: {
        branchId,
        sku,
        name,
        description,
        priceGross: parseFloat(priceGross),
        cost: parseFloat(cost),
        unit,
        stock: parseInt(stock),
        categoryId,
        supplierId,
        taxRateId,
        active,
        metadata
      },
      include: {
        category: true,
        supplier: true,
        taxRate: true
      }
    });

    // Create initial stock movement record
    if (stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: newProduct.id,
          branchId: branchId,
          change: parseInt(stock),
          reason: "initial_stock"
        }
      });
    }

    res.status(201).json(newProduct);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        message: "Product with this SKU already exists in this branch" 
      });
    }
    res.status(500).json({ message: "Error creating product", error: err.message });
  }
};

// 🟢 Update product
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert numeric fields
    if (updateData.priceGross) updateData.priceGross = parseFloat(updateData.priceGross);
    if (updateData.cost) updateData.cost = parseFloat(updateData.cost);
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        category: true,
        supplier: true,
        taxRate: true
      }
    });

    res.json(updatedProduct);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
};

// 🟢 Delete product (soft delete by setting active = false)
export const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { active: false }
    });
    res.json({ message: "Product deactivated successfully", product });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
};

// 🟢 Get products by branch
export const getProductsByBranch = async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    
    const products = await prisma.product.findMany({
      where: { 
        branchId: req.params.branchId,
        active: active === 'true'
      },
      select: { 
        id: true, 
        sku: true, 
        name: true, 
        priceGross: true,
        stock: true, 
        unit: true,
        active: true,
        category: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching branch products", error: err.message });
  }
};

// 🟢 Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { 
        categoryId: req.params.categoryId,
        active: true
      },
      select: { 
        id: true, 
        sku: true, 
        name: true, 
        priceGross: true,
        stock: true, 
        unit: true,
        active: true 
      },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching category products", error: err.message });
  }
};

// 🆕 CRITICAL: Search by barcode/SKU (most important for POS)
export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const { branchId } = req.query;

    const where = {
      sku: barcode,
      active: true
    };
    if (branchId) where.branchId = branchId;

    const product = await prisma.product.findFirst({
      where,
      include: {
        category: { select: { name: true } },
        taxRate: { select: { rate: true } },
        branch: { select: { name: true } }
      }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error finding product by barcode", error: err.message });
  }
};

// 🆕 Search by SKU with branch
export const getProductBySku = async (req, res) => {
  try {
    const { branchId, sku } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        branchId_sku: {
          branchId,
          sku
        }
      },
      include: {
        category: { select: { name: true } },
        taxRate: { select: { rate: true } }
      }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error finding product by SKU", error: err.message });
  }
};

// 🆕 Search products by name (autocomplete)
export const searchProductsByName = async (req, res) => {
  try {
    const { q, branchId, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const where = {
      active: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    };
    if (branchId) where.branchId = branchId;

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        priceGross: true,
        stock: true,
        unit: true,
        category: { select: { name: true } }
      },
      orderBy: { name: 'asc' },
      take: parseInt(limit)
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error searching products", error: err.message });
  }
};

// 🆕 Get low stock products
export const getLowStockProducts = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { threshold = 10 } = req.query;

    const products = await prisma.product.findMany({
      where: {
        branchId,
        active: true,
        stock: {
          lte: parseInt(threshold)
        }
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        unit: true,
        category: { select: { name: true } },
        supplier: { select: { name: true } }
      },
      orderBy: { stock: 'asc' }
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching low stock products", error: err.message });
  }
};

// 🆕 Get out of stock products
export const getOutOfStockProducts = async (req, res) => {
  try {
    const { branchId } = req.params;

    const products = await prisma.product.findMany({
      where: {
        branchId,
        active: true,
        stock: 0
      },
      select: {
        id: true,
        sku: true,
        name: true,
        unit: true,
        category: { select: { name: true } },
        supplier: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching out of stock products", error: err.message });
  }
};

// 🆕 Update stock with movement tracking
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { change, reason = "manual_adjustment" } = req.body;

    if (!change) {
      return res.status(400).json({ message: "Stock change amount is required" });
    }

    // Get current product
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { stock: true, branchId: true, name: true }
    });

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newStock = currentProduct.stock + parseInt(change);
    
    if (newStock < 0) {
      return res.status(400).json({ 
        message: "Insufficient stock. Current stock: " + currentProduct.stock 
      });
    }

    // Update stock and create movement record in transaction
    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { stock: newStock },
        include: {
          category: { select: { name: true } }
        }
      }),
      prisma.stockMovement.create({
        data: {
          productId: id,
          branchId: currentProduct.branchId,
          change: parseInt(change),
          reason
        }
      })
    ]);

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Error updating stock", error: err.message });
  }
};

// 🆕 Get stock movement history
export const getStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const movements = await prisma.stockMovement.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        product: { select: { name: true, sku: true } }
      }
    });

    res.json(movements);
  } catch (err) {
    res.status(500).json({ message: "Error fetching stock history", error: err.message });
  }
};

// 🆕 Quick price update
export const updatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { priceGross, cost } = req.body;

    if (!priceGross) {
      return res.status(400).json({ message: "Price is required" });
    }

    const updateData = { priceGross: parseFloat(priceGross) };
    if (cost !== undefined) updateData.cost = parseFloat(cost);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        sku: true,
        name: true,
        priceGross: true,
        cost: true,
        updatedAt: true
      }
    });

    res.json(updatedProduct);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(500).json({ message: "Error updating price", error: err.message });
  }
};

// 🆕 Toggle product active status
export const toggleProductActive = async (req, res) => {
  try {
    const { id } = req.params;

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { active: true, name: true }
    });

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { active: !currentProduct.active },
      select: {
        id: true,
        name: true,
        active: true,
        updatedAt: true
      }
    });

    res.json({
      message: `Product ${updatedProduct.active ? 'activated' : 'deactivated'} successfully`,
      product: updatedProduct
    });
  } catch (err) {
    res.status(500).json({ message: "Error toggling product status", error: err.message });
  }
};

// 🆕 Get inactive products
export const getInactiveProducts = async (req, res) => {
  try {
    const { branchId } = req.params;

    const products = await prisma.product.findMany({
      where: {
        branchId,
        active: false
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        updatedAt: true,
        category: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inactive products", error: err.message });
  }
};

// 🆕 Bulk update products
export const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updateData } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs array is required" });
    }

    // Convert numeric fields if present
    const processedUpdateData = { ...updateData };
    if (processedUpdateData.priceGross) {
      processedUpdateData.priceGross = parseFloat(processedUpdateData.priceGross);
    }
    if (processedUpdateData.cost) {
      processedUpdateData.cost = parseFloat(processedUpdateData.cost);
    }

    const updatedProducts = await prisma.product.updateMany({
      where: {
        id: { in: productIds }
      },
      data: processedUpdateData
    });

    res.json({
      message: `Successfully updated ${updatedProducts.count} products`,
      count: updatedProducts.count
    });
  } catch (err) {
    res.status(500).json({ message: "Error bulk updating products", error: err.message });
  }
};