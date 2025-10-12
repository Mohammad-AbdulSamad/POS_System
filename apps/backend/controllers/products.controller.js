import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// Helper: parse ints safely
const toInt = (v, fallback = 0) => {
  const n = parseInt(v);
  return Number.isNaN(n) ? fallback : n;
};


export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    branchId,
    active,
    categoryId,
    search,
    sortBy = "name",
    sortOrder = "asc"
  } = req.query;

  const skip = (toInt(page, 1) - 1) * toInt(limit, 50);
  const take = toInt(limit, 50);

  const where = {};
  if (branchId) where.branchId = branchId;
  if (active !== undefined) where.active = active === "true";
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  const validSort = sortBy ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" } : { name: "asc" };

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
      orderBy: validSort,
      skip,
      take
    }),
    prisma.product.count({ where })
  ]);

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getAllProducts",
    count: products.length,
    filters: { branchId, active, categoryId, search },
    userId: req.user?.id
  });

  res.json({
    products,
    pagination: {
      page: toInt(page, 1),
      limit: toInt(limit, 50),
      total,
      pages: Math.ceil(total / toInt(limit, 50))
    }
  });
});

// 🟢 Get product by ID
export const getProductById = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      supplier: true,
      taxRate: true,
      // priceGross: true,
      // cost: true,
      // stock: true,
      branch: { select: { name: true } }
    }
  });

  if (!product) throw new NotFoundError("Product not found");

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getProductById",
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(product);
});

// 🟢 Create product
export const createProduct = asyncHandler(async (req, res) => {
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

  if (!branchId || !sku || !name || priceGross === undefined) {
    throw new BadRequestError("Missing required fields: branchId, sku, name, priceGross");
  }

  try {
    const newProduct = await prisma.product.create({
      data: {
        branchId,
        sku,
        name,
        description,
        priceGross: parseFloat(priceGross),
        cost: cost !== undefined ? parseFloat(cost) : null,
        unit,
        stock: toInt(stock, 0),
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

    // Create initial stock movement record if initial stock > 0
    if (toInt(stock, 0) > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: newProduct.id,
          branchId,
          change: toInt(stock, 0),
          reason: "initial_stock"
        }
      });

      logger.info({
        message: "Initial stock recorded for new product",
        productId: newProduct.id,
        stock: toInt(stock, 0),
        branchId,
        userId: req.user?.id
      });
    }

    logger.info({
      message: "Product created",
      productId: newProduct.id,
      sku: newProduct.sku,
      name: newProduct.name,
      branchId,
      userId: req.user?.id,
      userEmail: req.user?.email
    });

    res.status(201).json(newProduct);
  } catch (err) {
    // Unique constraint violation (sku per branch)
    if (err?.code === "P2002") {
      throw new ConflictError("Product with this SKU already exists in this branch");
    }
    // Re-throw for global error handler
    throw err;
  }
});

// 🟢 Update product
export const updateProduct = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };

  if (updateData.priceGross !== undefined) updateData.priceGross = parseFloat(updateData.priceGross);
  if (updateData.cost !== undefined) updateData.cost = parseFloat(updateData.cost);
  if (updateData.stock !== undefined) updateData.stock = toInt(updateData.stock);

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        category: true,
        supplier: true,
        taxRate: true
      }
    });

    logger.info({
      message: "Product updated",
      productId: updatedProduct.id,
      changes: updateData,
      userId: req.user?.id,
      userEmail: req.user?.email
    });

    res.json(updatedProduct);
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundError("Product not found");
    }
    if (err?.code === "P2002") {
      throw new ConflictError("Update conflict: SKU already exists in this branch");
    }
    throw err;
  }
});

// 🟢 Delete product (soft delete by setting active = false)
export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { active: false },
      select: { id: true, name: true, sku: true }
    });

    logger.warn({
      message: "Product deactivated (soft delete)",
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      userId: req.user?.id,
      userEmail: req.user?.email
    });

    res.json({ message: "Product deactivated successfully", product });
  } catch (err) {
    if (err?.code === "P2025") {
      throw new NotFoundError("Product not found");
    }
    throw err;
  }
});

// 🟢 Get products by branch
export const getProductsByBranch = asyncHandler(async (req, res) => {
  const { active = "true" } = req.query;
  const products = await prisma.product.findMany({
    where: {
      branchId: req.params.branchId,
      active: active === "true"
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
    orderBy: { name: "asc" }
  });

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getProductsByBranch",
    branchId: req.params.branchId,
    count: products.length,
    userId: req.user?.id
  });

  res.json(products);
});

// 🟢 Get products by category
export const getProductsByCategory = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { categoryId: req.params.categoryId, active: true },
    select: {
      id: true,
      sku: true,
      name: true,
      priceGross: true,
      stock: true,
      unit: true,
      active: true
    },
    orderBy: { name: "asc" }
  });

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getProductsByCategory",
    categoryId: req.params.categoryId,
    count: products.length,
    userId: req.user?.id
  });

  res.json(products);
});


// 🆕 CRITICAL: Search by barcode/SKU (most important for POS)
export const getProductByBarcode = asyncHandler(async (req, res) => {
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

  if (!product) throw new NotFoundError("Product not found");

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getProductByBarcode",
    barcode,
    branchId,
    productId: product.id,
    userId: req.user?.id
  });

  res.json(product);
});

// 🆕 Search by SKU with branch
export const getProductBySku = asyncHandler(async (req, res) => {
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

  if (!product) throw new NotFoundError("Product not found");

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getProductBySku",
    branchId,
    sku,
    productId: product.id,
    userId: req.user?.id
  });

  res.json(product);
});

// 🆕 Search products by name (autocomplete)
export const searchProductsByName = asyncHandler(async (req, res) => {
  const { q, branchId, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    throw new BadRequestError("Search query must be at least 2 characters");
  }

  const where = {
    active: true,
    OR: [
      { name: { contains: q.trim(), mode: "insensitive" } },
      { description: { contains: q.trim(), mode: "insensitive" } }
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
    orderBy: { name: "asc" },
    take: toInt(limit, 10)
  });

  logger.logDatabase("READ", {
    model: "Product",
    operation: "searchProductsByName",
    query: q,
    count: products.length,
    userId: req.user?.id
  });

  res.json(products);
});


// 🆕 Get low stock products
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { threshold = 10 } = req.query;

  const products = await prisma.product.findMany({
    where: {
      branchId,
      active: true,
      stock: { lte: toInt(threshold, 10) }
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
    orderBy: { stock: "asc" }
  });

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getLowStockProducts",
    branchId,
    threshold: toInt(threshold, 10),
    count: products.length,
    userId: req.user?.id
  });

  res.json(products);
});

// 🆕 Get out of stock products
export const getOutOfStockProducts = asyncHandler(async (req, res) => {
  const { branchId } = req.params;

  const products = await prisma.product.findMany({
    where: { branchId, active: true, stock: 0 },
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      category: { select: { name: true } },
      supplier: { select: { name: true } }
    },
    orderBy: { name: "asc" }
  });

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getOutOfStockProducts",
    branchId,
    count: products.length,
    userId: req.user?.id
  });

  res.json(products);
});
// 🆕 Update stock with movement tracking
export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { change, reason = "manual_adjustment" } = req.body;

  if (change === undefined || change === null) {
    throw new BadRequestError("Stock change amount is required");
  }

  const currentProduct = await prisma.product.findUnique({
    where: { id },
    select: { stock: true, branchId: true, name: true }
  });

  if (!currentProduct) throw new NotFoundError("Product not found");

  const newStock = currentProduct.stock + toInt(change);

  if (newStock < 0) {
    throw new BadRequestError(`Insufficient stock. Current stock: ${currentProduct.stock}`);
  }

  const [updatedProduct] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: { category: { select: { name: true } } }
    }),
    prisma.stockMovement.create({
      data: {
        productId: id,
        branchId: currentProduct.branchId,
        change: toInt(change),
        reason
      }
    })
  ]);

  logger.info({
    message: "Stock updated",
    productId: id,
    productName: currentProduct.name,
    change: toInt(change),
    newStock,
    reason,
    userId: req.user?.id
  });

  res.json(updatedProduct);
});

// 🆕 Get stock movement history
export const getStockHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;

  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: toInt(limit, 50),
    include: {
      product: { select: { name: true, sku: true } }
    }
  });

  logger.logDatabase("READ", {
    model: "StockMovement",
    operation: "getStockHistory",
    productId: id,
    count: movements.length,
    userId: req.user?.id
  });

  res.json(movements);
});


// 🆕 Quick price update
export const updatePrice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { priceGross, cost } = req.body;

  if (priceGross === undefined) {
    throw new BadRequestError("Price is required");
  }

  try {
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

    logger.info({
      message: "Product price updated",
      productId: updatedProduct.id,
      sku: updatedProduct.sku,
      oldPrice: undefined, // old price not fetched here; if needed, fetch before update
      newPrice: updatedProduct.priceGross,
      userId: req.user?.id
    });

    res.json(updatedProduct);
  } catch (err) {
    if (err?.code === "P2025") throw new NotFoundError("Product not found");
    throw err;
  }
});

// 🆕 Toggle product active status
export const toggleProductActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const currentProduct = await prisma.product.findUnique({
    where: { id },
    select: { active: true, name: true, sku: true }
  });

  if (!currentProduct) throw new NotFoundError("Product not found");

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

  logger.warn({
    message: `Product ${updatedProduct.active ? "activated" : "deactivated"}`,
    productId: updatedProduct.id,
    sku: currentProduct.sku,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Product ${updatedProduct.active ? "activated" : "deactivated"} successfully`,
    product: updatedProduct
  });
});

// 🆕 Get inactive products
export const getInactiveProducts = asyncHandler(async (req, res) => {
  const { branchId } = req.params;

  const products = await prisma.product.findMany({
    where: { branchId, active: false },
    select: {
      id: true,
      sku: true,
      name: true,
      stock: true,
      updatedAt: true,
      category: { select: { name: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getInactiveProducts",
    branchId,
    count: products.length,
    userId: req.user?.id
  });

  res.json(products);
});

// 🆕 Bulk update products
export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { productIds, updateData } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new BadRequestError("Product IDs array is required");
  }

  const processedUpdateData = { ...updateData };
  if (processedUpdateData.priceGross !== undefined) processedUpdateData.priceGross = parseFloat(processedUpdateData.priceGross);
  if (processedUpdateData.cost !== undefined) processedUpdateData.cost = parseFloat(processedUpdateData.cost);

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: processedUpdateData
  });

  logger.warn({
    message: "Bulk product update executed",
    updatedCount: result.count,
    productIdsCount: productIds.length,
    updateData: processedUpdateData,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully updated ${result.count} products`,
    count: result.count
  });
});