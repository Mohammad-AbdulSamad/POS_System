// CONTINUATION OF stockMovements.controller.js - REMAINING FUNCTIONS
// controllers/stockMovements.controller.js - COMPLETE VERSION
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Valid movement reasons
const MOVEMENT_REASONS = ['sale', 'purchase', 'adjustment', 'transfer', 'spoilage', 'return', 'damaged'];

// Helper function to validate movement reason
const isValidReason = (reason) => MOVEMENT_REASONS.includes(reason.toLowerCase());

// Helper function to update product stock
const updateProductStock = async (productId, change) => {
  await prisma.product.update({
    where: { id: productId },
    data: {
      stock: {
        increment: change
      },
      updatedAt: new Date()
    }
  });
};

// 🟢 Get all stock movements with filtering and pagination
export const getAllStockMovements = async (req, res) => {
  try {
    const { 
      productId, 
      branchId, 
      reason, 
      startDate, 
      endDate,
      changeType, // 'positive', 'negative', or 'all'
      page = 1, 
      limit = 100 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      ...(productId && { productId }),
      ...(branchId && { branchId }),
      ...(reason && { reason: reason.toLowerCase() }),
      ...(changeType === 'positive' && { change: { gt: 0 } }),
      ...(changeType === 'negative' && { change: { lt: 0 } }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              stock: true
            }
          },
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where })
    ]);

    res.json({
      movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getAllStockMovements:', err);
    res.status(500).json({ message: "Error fetching stock movements", error: err.message });
  }
};

// 🟢 Get stock movement by ID
export const getStockMovementById = async (req, res) => {
  try {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: req.params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            stock: true,
            category: { select: { name: true } }
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    if (!movement) return res.status(404).json({ message: "Stock movement not found" });
    res.json(movement);
  } catch (err) {
    console.error('Error in getStockMovementById:', err);
    res.status(500).json({ message: "Error fetching stock movement", error: err.message });
  }
};

// 🟢 Create stock movement
export const createStockMovement = async (req, res) => {
  try {
    const { productId, branchId, change, reason } = req.body;

    // Validate required fields
    if (!productId || !branchId || change === undefined || !reason) {
      return res.status(400).json({ 
        message: "productId, branchId, change, and reason are required" 
      });
    }

    // Validate reason
    if (!isValidReason(reason)) {
      return res.status(400).json({ 
        message: `Invalid reason. Must be one of: ${MOVEMENT_REASONS.join(', ')}` 
      });
    }

    // Validate change is a number
    if (isNaN(parseInt(change))) {
      return res.status(400).json({ message: "change must be a valid number" });
    }

    // Validate product and branch exist
    const [product, branch] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.branch.findUnique({ where: { id: branchId } })
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Check if negative movement would result in negative stock
    const changeInt = parseInt(change);
    if (changeInt < 0 && (product.stock + changeInt) < 0) {
      return res.status(400).json({ 
        message: `Insufficient stock. Current stock: ${product.stock}, Requested change: ${changeInt}` 
      });
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          branchId,
          change: changeInt,
          reason: reason.toLowerCase()
        },
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          branch: { select: { name: true } }
        }
      });

      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: changeInt
          },
          updatedAt: new Date()
        }
      });

      return movement;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in createStockMovement:', err);
    res.status(500).json({ message: "Error creating stock movement", error: err.message });
  }
};

// 🟢 Update stock movement
export const updateStockMovement = async (req, res) => {
  try {
    const { change, reason } = req.body;

    // Check if movement exists
    const existingMovement = await prisma.stockMovement.findUnique({
      where: { id: req.params.id },
      include: { product: true }
    });

    if (!existingMovement) {
      return res.status(404).json({ message: "Stock movement not found" });
    }

    // Validate reason if provided
    if (reason && !isValidReason(reason)) {
      return res.status(400).json({ 
        message: `Invalid reason. Must be one of: ${MOVEMENT_REASONS.join(', ')}` 
      });
    }

    // If change is being updated, we need to adjust product stock
    let stockAdjustment = 0;
    if (change !== undefined) {
      const newChange = parseInt(change);
      if (isNaN(newChange)) {
        return res.status(400).json({ message: "change must be a valid number" });
      }
      
      stockAdjustment = newChange - existingMovement.change;
      
      // Check if the adjustment would result in negative stock
      const currentStock = existingMovement.product.stock;
      if ((currentStock + stockAdjustment) < 0) {
        return res.status(400).json({ 
          message: `Stock adjustment would result in negative stock. Current: ${currentStock}, Adjustment: ${stockAdjustment}` 
        });
      }
    }

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update the movement
      const updatedMovement = await tx.stockMovement.update({
        where: { id: req.params.id },
        data: {
          ...(change !== undefined && { change: parseInt(change) }),
          ...(reason && { reason: reason.toLowerCase() })
        },
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          branch: { select: { name: true } }
        }
      });

      // Update product stock if change was modified
      if (stockAdjustment !== 0) {
        await tx.product.update({
          where: { id: existingMovement.productId },
          data: {
            stock: {
              increment: stockAdjustment
            },
            updatedAt: new Date()
          }
        });
      }

      return updatedMovement;
    });

    res.json(result);
  } catch (err) {
    console.error('Error in updateStockMovement:', err);
    res.status(500).json({ message: "Error updating stock movement", error: err.message });
  }
};

// 🟢 Delete stock movement
export const deleteStockMovement = async (req, res) => {
  try {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: req.params.id },
      include: { product: true }
    });

    if (!movement) {
      return res.status(404).json({ message: "Stock movement not found" });
    }

    // Check if reversing the movement would result in negative stock
    const reversalChange = -movement.change;
    const currentStock = movement.product.stock;
    if ((currentStock + reversalChange) < 0) {
      return res.status(400).json({ 
        message: `Cannot delete movement. Would result in negative stock. Current: ${currentStock}, Required reversal: ${reversalChange}` 
      });
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete the movement
      await tx.stockMovement.delete({
        where: { id: req.params.id }
      });

      // Reverse the stock change
      await tx.product.update({
        where: { id: movement.productId },
        data: {
          stock: {
            increment: reversalChange
          },
          updatedAt: new Date()
        }
      });
    });

    res.json({ message: "Stock movement deleted successfully" });
  } catch (err) {
    console.error('Error in deleteStockMovement:', err);
    res.status(500).json({ message: "Error deleting stock movement", error: err.message });
  }
};

// 🆕 Get movements by product
export const getMovementsByProduct = async (req, res) => {
  try {
    const { startDate, endDate, reason, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      productId: req.params.productId,
      ...(reason && { reason: reason.toLowerCase() }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          branch: { select: { name: true } }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where })
    ]);

    res.json({
      movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getMovementsByProduct:', err);
    res.status(500).json({ message: "Error fetching product movements", error: err.message });
  }
};

// 🆕 Get product stock history with running balance
export const getProductStockHistory = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    const productId = req.params.productId;

    // Get product info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true, unit: true, stock: true }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const where = {
      productId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Get movements in chronological order
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        branch: { select: { name: true } }
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'asc' }
    });

    // Calculate running balance
    let runningBalance = product.stock;
    
    // Work backwards from current stock
    const totalChange = movements.reduce((sum, m) => sum + m.change, 0);
    const startingBalance = runningBalance - totalChange;
    
    runningBalance = startingBalance;
    
    const history = movements.map(movement => {
      const balanceBefore = runningBalance;
      runningBalance += movement.change;
      
      return {
        ...movement,
        balanceBefore,
        balanceAfter: runningBalance
      };
    });

    res.json({
      product,
      currentStock: product.stock,
      startingBalance,
      history
    });
  } catch (err) {
    console.error('Error in getProductStockHistory:', err);
    res.status(500).json({ message: "Error fetching product stock history", error: err.message });
  }
};

// 🆕 Get current product stock
export const getCurrentProductStock = async (req, res) => {
  try {
    const productId = req.params.productId;

    const [product, movementSummary] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
          stock: true,
          minStock: true,
          reorderPoint: true
        }
      }),
      prisma.stockMovement.groupBy({
        by: ['reason'],
        where: { productId },
        _sum: { change: true },
        _count: true
      })
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const stockStatus = {
      current: product.stock,
      isLowStock: product.stock <= (product.reorderPoint || 10),
      isOutOfStock: product.stock <= 0,
      needsReorder: product.minStock ? product.stock <= product.minStock : false
    };

    res.json({
      product,
      stockStatus,
      movementSummary
    });
  } catch (err) {
    console.error('Error in getCurrentProductStock:', err);
    res.status(500).json({ message: "Error fetching current product stock", error: err.message });
  }
};

// 🆕 Get movements by branch
export const getMovementsByBranch = async (req, res) => {
  try {
    const { startDate, endDate, reason, productId, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      branchId: req.params.branchId,
      ...(reason && { reason: reason.toLowerCase() }),
      ...(productId && { productId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where })
    ]);

    res.json({
      movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getMovementsByBranch:', err);
    res.status(500).json({ message: "Error fetching branch movements", error: err.message });
  }
};

// 🆕 Get branch stock summary
export const getBranchStockSummary = async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const { startDate, endDate } = req.query;

    const where = {
      branchId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [totalMovements, movementsByReason, recentMovements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.groupBy({
        by: ['reason'],
        where,
        _sum: { change: true },
        _count: true
      }),
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const summary = {
      totalMovements,
      byReason: movementsByReason.reduce((acc, item) => {
        acc[item.reason] = {
          count: item._count,
          totalChange: item._sum.change || 0
        };
        return acc;
      }, {}),
      recentMovements
    };

    res.json(summary);
  } catch (err) {
    console.error('Error in getBranchStockSummary:', err);
    res.status(500).json({ message: "Error fetching branch stock summary", error: err.message });
  }
};

// 🆕 Get low stock products for branch
export const getLowStockProducts = async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const { threshold = 10 } = req.query;

    const products = await prisma.product.findMany({
      where: {
        branchId,
        active: true,
        stock: { lte: parseInt(threshold) }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        stock: true,
        minStock: true,
        reorderPoint: true,
        category: { select: { name: true } }
      },
      orderBy: { stock: 'asc' }
    });

    res.json({
      threshold: parseInt(threshold),
      count: products.length,
      products
    });
  } catch (err) {
    console.error('Error in getLowStockProducts:', err);
    res.status(500).json({ message: "Error fetching low stock products", error: err.message });
  }
};

// 🆕 Get movements by reason
export const getMovementsByReason = async (req, res) => {
  try {
    const reason = req.params.reason.toLowerCase();
    const { branchId, productId, startDate, endDate, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!isValidReason(reason)) {
      return res.status(400).json({ 
        message: `Invalid reason. Must be one of: ${MOVEMENT_REASONS.join(', ')}` 
      });
    }

    const where = {
      reason,
      ...(branchId && { branchId }),
      ...(productId && { productId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [movements, total, summary] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          branch: { select: { name: true } }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.aggregate({
        where,
        _sum: { change: true },
        _avg: { change: true }
      })
    ]);

    res.json({
      reason,
      movements,
      summary: {
        totalMovements: total,
        totalChange: summary._sum.change || 0,
        averageChange: summary._avg.change || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getMovementsByReason:', err);
    res.status(500).json({ message: "Error fetching movements by reason", error: err.message });
  }
};

// 🆕 Create bulk movements
export const createBulkMovements = async (req, res) => {
  try {
    const { movements } = req.body;

    if (!Array.isArray(movements) || movements.length === 0) {
      return res.status(400).json({ message: "Movements array is required and cannot be empty" });
    }

    // Validate all movements first
    const validatedMovements = [];
    const errors = [];

    for (let i = 0; i < movements.length; i++) {
      const movement = movements[i];
      const { productId, branchId, change, reason } = movement;

      if (!productId || !branchId || change === undefined || !reason) {
        errors.push(`Movement ${i + 1}: Missing required fields`);
        continue;
      }

      if (!isValidReason(reason)) {
        errors.push(`Movement ${i + 1}: Invalid reason '${reason}'`);
        continue;
      }

      if (isNaN(parseInt(change))) {
        errors.push(`Movement ${i + 1}: Invalid change value`);
        continue;
      }

      validatedMovements.push({
        productId,
        branchId,
        change: parseInt(change),
        reason: reason.toLowerCase()
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation errors", errors });
    }

    // Process movements in transaction
    const results = await prisma.$transaction(async (tx) => {
      const createdMovements = [];
      
      for (const movement of validatedMovements) {
        // Check product exists and has sufficient stock
        const product = await tx.product.findUnique({
          where: { id: movement.productId }
        });

        if (!product) {
          throw new Error(`Product not found: ${movement.productId}`);
        }

        if (movement.change < 0 && (product.stock + movement.change) < 0) {
          throw new Error(`Insufficient stock for product ${product.sku}. Current: ${product.stock}, Requested: ${movement.change}`);
        }

        // Create movement
        const createdMovement = await tx.stockMovement.create({
          data: movement
        });

        // Update product stock
        await tx.product.update({
          where: { id: movement.productId },
          data: {
            stock: { increment: movement.change },
            updatedAt: new Date()
          }
        });

        createdMovements.push(createdMovement);
      }

      return createdMovements;
    });

    res.status(201).json({
      message: `${results.length} stock movements created successfully`,
      count: results.length,
      movements: results
    });
  } catch (err) {
    console.error('Error in createBulkMovements:', err);
    res.status(500).json({ message: "Error creating bulk movements", error: err.message });
  }
};

// 🆕 Bulk stock adjustment
export const bulkStockAdjustment = async (req, res) => {
  try {
    const { adjustments, reason = 'adjustment' } = req.body;

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({ message: "Adjustments array is required and cannot be empty" });
    }

    if (!isValidReason(reason)) {
      return res.status(400).json({ 
        message: `Invalid reason. Must be one of: ${MOVEMENT_REASONS.join(', ')}` 
      });
    }

    const results = await prisma.$transaction(async (tx) => {
      const movements = [];

      for (const adj of adjustments) {
        const { productId, branchId, newStock } = adj;

        if (!productId || !branchId || newStock === undefined) {
          throw new Error("Each adjustment must have productId, branchId, and newStock");
        }

        // Get current product stock
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        const change = parseInt(newStock) - product.stock;
        
        if (change !== 0) {
          // Create movement record
          const movement = await tx.stockMovement.create({
            data: {
              productId,
              branchId,
              change,
              reason: reason.toLowerCase()
            }
          });

          // Update product stock
          await tx.product.update({
            where: { id: productId },
            data: {
              stock: parseInt(newStock),
              updatedAt: new Date()
            }
          });

          movements.push({ ...movement, oldStock: product.stock, newStock: parseInt(newStock) });
        }
      }

      return movements;
    });

    res.json({
      message: `${results.length} stock adjustments processed`,
      adjustments: results
    });
  } catch (err) {
    console.error('Error in bulkStockAdjustment:', err);
    res.status(500).json({ message: "Error processing bulk adjustments", error: err.message });
  }
};

// ... CONTINUED IN NEXT PART DUE TO LENGTH ...
// 🆕 Receive stock (purchase/delivery)
export const receiveStock = async (req, res) => {
  try {
    const { productId, branchId, quantity, reason = 'purchase' } = req.body;

    if (!productId || !branchId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        message: "productId, branchId, and positive quantity are required" 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          branchId,
          change: parseInt(quantity),
          reason: reason.toLowerCase()
        },
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          branch: { select: { name: true } }
        }
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: parseInt(quantity) },
          updatedAt: new Date()
        }
      });

      return movement;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in receiveStock:', err);
    res.status(500).json({ message: "Error receiving stock", error: err.message });
  }
};

// 🆕 Adjust stock (inventory correction)
export const adjustStock = async (req, res) => {
  try {
    const { productId, branchId, adjustment, reason = 'adjustment' } = req.body;

    if (!productId || !branchId || adjustment === undefined) {
      return res.status(400).json({ 
        message: "productId, branchId, and adjustment are required" 
      });
    }

    const adjustmentInt = parseInt(adjustment);
    if (adjustmentInt === 0) {
      return res.status(400).json({ message: "Adjustment cannot be zero" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      
      if (!product) {
        throw new Error("Product not found");
      }

      if (adjustmentInt < 0 && (product.stock + adjustmentInt) < 0) {
        throw new Error(`Insufficient stock. Current: ${product.stock}, Adjustment: ${adjustmentInt}`);
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          branchId,
          change: adjustmentInt,
          reason: reason.toLowerCase()
        },
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          branch: { select: { name: true } }
        }
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: adjustmentInt },
          updatedAt: new Date()
        }
      });

      return { movement, newStock: updatedProduct.stock };
    });

    res.json(result);
  } catch (err) {
    console.error('Error in adjustStock:', err);
    res.status(500).json({ message: "Error adjusting stock", error: err.message });
  }
};

// 🆕 Transfer stock between branches
export const transferStock = async (req, res) => {
  try {
    const { productId, fromBranchId, toBranchId, quantity } = req.body;

    if (!productId || !fromBranchId || !toBranchId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        message: "productId, fromBranchId, toBranchId, and positive quantity are required" 
      });
    }

    if (fromBranchId === toBranchId) {
      return res.status(400).json({ message: "Cannot transfer to the same branch" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verify branches exist
      const [fromBranch, toBranch] = await Promise.all([
        tx.branch.findUnique({ where: { id: fromBranchId } }),
        tx.branch.findUnique({ where: { id: toBranchId } })
      ]);

      if (!fromBranch) throw new Error("Source branch not found");
      if (!toBranch) throw new Error("Destination branch not found");

      // Get product from source branch
      const product = await tx.product.findFirst({
        where: { id: productId, branchId: fromBranchId }
      });

      if (!product) {
        throw new Error("Product not found in source branch");
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock in source branch. Available: ${product.stock}, Requested: ${quantity}`);
      }

      // Create outbound movement (negative)
      const outboundMovement = await tx.stockMovement.create({
        data: {
          productId,
          branchId: fromBranchId,
          change: -parseInt(quantity),
          reason: 'transfer'
        }
      });

      // Create inbound movement (positive)
      const inboundMovement = await tx.stockMovement.create({
        data: {
          productId,
          branchId: toBranchId,
          change: parseInt(quantity),
          reason: 'transfer'
        }
      });

      // Update source product stock
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: parseInt(quantity) },
          updatedAt: new Date()
        }
      });

      // Check if product exists in destination branch, create or update
      const destProduct = await tx.product.findFirst({
        where: { id: productId, branchId: toBranchId }
      });

      if (destProduct) {
        await tx.product.update({
          where: { id: destProduct.id },
          data: {
            stock: { increment: parseInt(quantity) },
            updatedAt: new Date()
          }
        });
      } else {
        // Create product in destination branch
        await tx.product.create({
          data: {
            ...product,
            id: undefined, // Let Prisma generate new ID
            branchId: toBranchId,
            stock: parseInt(quantity),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      return {
        outboundMovement,
        inboundMovement,
        fromBranch: fromBranch.name,
        toBranch: toBranch.name,
        quantity: parseInt(quantity)
      };
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in transferStock:', err);
    res.status(500).json({ message: "Error transferring stock", error: err.message });
  }
};

// 🆕 Record sale (decrease stock)
export const recordSale = async (req, res) => {
  try {
    const { productId, branchId, quantity } = req.body;

    if (!productId || !branchId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        message: "productId, branchId, and positive quantity are required" 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          branchId,
          change: -parseInt(quantity),
          reason: 'sale'
        },
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          branch: { select: { name: true } }
        }
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: parseInt(quantity) },
          updatedAt: new Date()
        }
      });

      return movement;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in recordSale:', err);
    res.status(500).json({ message: "Error recording sale", error: err.message });
  }
};

// 🆕 Record spoilage/waste
export const recordSpoilage = async (req, res) => {
  try {
    const { productId, branchId, quantity, reason = 'spoilage' } = req.body;

    if (!productId || !branchId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        message: "productId, branchId, and positive quantity are required" 
      });
    }

    const validWasteReasons = ['spoilage', 'damaged', 'expired'];
    if (!validWasteReasons.includes(reason.toLowerCase())) {
      return res.status(400).json({ 
        message: `Invalid reason. Must be one of: ${validWasteReasons.join(', ')}` 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          branchId,
          change: -parseInt(quantity),
          reason: reason.toLowerCase()
        },
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          branch: { select: { name: true } }
        }
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: parseInt(quantity) },
          updatedAt: new Date()
        }
      });

      return movement;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error in recordSpoilage:', err);
    res.status(500).json({ message: "Error recording spoilage", error: err.message });
  }
};

// 🆕 Get movement trends
export const getMovementTrends = async (req, res) => {
  try {
    const { branchId, productId, period = 'day', startDate, endDate } = req.query;

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
    if (branchId) whereConditions.push(`sm."branchId" = '${branchId}'`);
    if (productId) whereConditions.push(`sm."productId" = '${productId}'`);
    if (startDate && endDate) {
      whereConditions.push(`sm."createdAt" BETWEEN '${startDate}' AND '${endDate}'`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const trends = await prisma.$queryRaw`
      SELECT 
        to_char(sm."createdAt", ${dateFormat}) as period,
        sm.reason,
        SUM(sm.change) as total_change,
        COUNT(*) as movement_count,
        SUM(CASE WHEN sm.change > 0 THEN sm.change ELSE 0 END) as total_in,
        SUM(CASE WHEN sm.change < 0 THEN ABS(sm.change) ELSE 0 END) as total_out
      FROM "StockMovement" sm
      ${whereClause}
      GROUP BY to_char(sm."createdAt", ${dateFormat}), sm.reason
      ORDER BY period, sm.reason
    `;

    res.json({ period, trends });
  } catch (err) {
    console.error('Error in getMovementTrends:', err);
    res.status(500).json({ message: "Error fetching movement trends", error: err.message });
  }
};

// 🆕 Get stock velocity (turnover rate)
export const getStockVelocity = async (req, res) => {
  try {
    const { branchId, productId, days = 30 } = req.query;
    const daysInt = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    const where = {
      reason: 'sale',
      createdAt: { gte: startDate },
      ...(branchId && { branchId }),
      ...(productId && { productId })
    };

    const velocityData = await prisma.stockMovement.groupBy({
      by: ['productId'],
      where,
      _sum: { change: true },
      _count: true
    });

    // Get product details
    const productIds = velocityData.map(v => v.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        unit: true
      }
    });

    const velocity = velocityData.map(v => {
      const product = products.find(p => p.id === v.productId);
      const soldQuantity = Math.abs(v._sum.change || 0);
      const currentStock = product?.stock || 0;
      const daysToStockout = currentStock > 0 && soldQuantity > 0 
        ? (currentStock / (soldQuantity / daysInt)) 
        : null;

      return {
        product,
        soldQuantity,
        salesCount: v._count,
        averagePerSale: soldQuantity / v._count,
        velocityPerDay: soldQuantity / daysInt,
        daysToStockout,
        turnoverRate: currentStock > 0 ? (soldQuantity / currentStock) * 100 : 0
      };
    });

    res.json({
      period: `${daysInt} days`,
      velocity: velocity.sort((a, b) => b.velocityPerDay - a.velocityPerDay)
    });
  } catch (err) {
    console.error('Error in getStockVelocity:', err);
    res.status(500).json({ message: "Error fetching stock velocity", error: err.message });
  }
};

// 🆕 Get waste report
export const getWasteReport = async (req, res) => {
  try {
    const { branchId, startDate, endDate, productId } = req.query;

    const wasteReasons = ['spoilage', 'damaged', 'expired'];
    const where = {
      reason: { in: wasteReasons },
      ...(branchId && { branchId }),
      ...(productId && { productId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [wasteByReason, wasteByProduct, totalWaste] = await Promise.all([
      prisma.stockMovement.groupBy({
        by: ['reason'],
        where,
        _sum: { change: true },
        _count: true
      }),
      prisma.stockMovement.groupBy({
        by: ['productId'],
        where,
        _sum: { change: true },
        _count: true
      }),
      prisma.stockMovement.aggregate({
        where,
        _sum: { change: true },
        _count: true
      })
    ]);

    // Get product details for waste by product
    const productIds = wasteByProduct.map(w => w.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, cost: true }
    });

    const wasteByProductWithDetails = wasteByProduct.map(w => {
      const product = products.find(p => p.id === w.productId);
      const wastedQuantity = Math.abs(w._sum.change || 0);
      const estimatedCost = product ? wastedQuantity * product.cost : 0;

      return {
        product,
        wastedQuantity,
        wasteCount: w._count,
        estimatedCost
      };
    }).sort((a, b) => b.wastedQuantity - a.wastedQuantity);

    res.json({
      summary: {
        totalWasteEvents: totalWaste._count,
        totalWastedQuantity: Math.abs(totalWaste._sum.change || 0)
      },
      byReason: wasteByReason.map(w => ({
        reason: w.reason,
        quantity: Math.abs(w._sum.change || 0),
        count: w._count
      })),
      byProduct: wasteByProductWithDetails
    });
  } catch (err) {
    console.error('Error in getWasteReport:', err);
    res.status(500).json({ message: "Error fetching waste report", error: err.message });
  }
};

// 🆕 Get turnover rate
export const getTurnoverRate = async (req, res) => {
  try {
    const { branchId, productId, days = 30 } = req.query;
    const daysInt = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    const where = {
      ...(branchId && { branchId }),
      ...(productId && { productId }),
      createdAt: { gte: startDate }
    };

    const movements = await prisma.stockMovement.groupBy({
      by: ['productId', 'reason'],
      where,
      _sum: { change: true },
      _count: true
    });

    // Group by product
    const productMovements = {};
    movements.forEach(m => {
      if (!productMovements[m.productId]) {
        productMovements[m.productId] = { sales: 0, purchases: 0, adjustments: 0 };
      }
      
      const quantity = Math.abs(m._sum.change || 0);
      if (m.reason === 'sale') {
        productMovements[m.productId].sales += quantity;
      } else if (m.reason === 'purchase') {
        productMovements[m.productId].purchases += quantity;
      } else {
        productMovements[m.productId].adjustments += quantity;
      }
    });

    // Get product details
    const productIds = Object.keys(productMovements);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, stock: true, cost: true }
    });

    const turnoverRates = productIds.map(productId => {
      const product = products.find(p => p.id === productId);
      const movement = productMovements[productId];
      
      const averageInventory = (movement.purchases + product.stock) / 2;
      const turnoverRate = averageInventory > 0 ? movement.sales / averageInventory : 0;
      const daysSalesInventory = turnoverRate > 0 ? daysInt / turnoverRate : null;

      return {
        product,
        sales: movement.sales,
        purchases: movement.purchases,
        currentStock: product.stock,
        averageInventory,
        turnoverRate,
        daysSalesInventory
      };
    }).sort((a, b) => b.turnoverRate - a.turnoverRate);

    res.json({
      period: `${daysInt} days`,
      turnoverRates
    });
  } catch (err) {
    console.error('Error in getTurnoverRate:', err);
    res.status(500).json({ message: "Error fetching turnover rate", error: err.message });
  }
};

// 🆕 Validate current stock
export const validateCurrentStock = async (req, res) => {
  try {
    const { productId, branchId, expectedStock } = req.body;

    if (!productId || expectedStock === undefined) {
      return res.status(400).json({ message: "productId and expectedStock are required" });
    }

    const where = {
      id: productId,
      ...(branchId && { branchId })
    };

    const product = await prisma.product.findFirst({ where });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentStock = product.stock;
    const expected = parseInt(expectedStock);
    const discrepancy = currentStock - expected;

    const validation = {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      currentStock,
      expectedStock: expected,
      discrepancy,
      isAccurate: discrepancy === 0,
      status: discrepancy === 0 ? 'accurate' : 
              discrepancy > 0 ? 'overstocked' : 'understocked'
    };

    res.json(validation);
  } catch (err) {
    console.error('Error in validateCurrentStock:', err);
    res.status(500).json({ message: "Error validating stock", error: err.message });
  }
};

// 🆕 Reconcile stock
export const reconcileStock = async (req, res) => {
  try {
    const { productId, branchId, actualStock, reason = 'adjustment' } = req.body;

    if (!productId || !branchId || actualStock === undefined) {
      return res.status(400).json({ 
        message: "productId, branchId, and actualStock are required" 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });

      if (!product) {
        throw new Error("Product not found");
      }

      const currentStock = product.stock;
      const actual = parseInt(actualStock);
      const adjustment = actual - currentStock;

      if (adjustment === 0) {
        return {
          message: "No adjustment needed - stock is accurate",
          product: { id: product.id, name: product.name, sku: product.sku },
          currentStock,
          actualStock: actual,
          adjustment: 0
        };
      }

      // Create adjustment movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          branchId,
          change: adjustment,
          reason: 'reconciliation'
        }
      });

      // Update product stock
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: actual,
          updatedAt: new Date()
        }
      });

      return {
        message: "Stock reconciled successfully",
        product: { id: product.id, name: product.name, sku: product.sku },
        previousStock: currentStock,
        actualStock: actual,
        adjustment,
        movement
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error in reconcileStock:', err);
    res.status(500).json({ message: "Error reconciling stock", error: err.message });
  }
};

// 🆕 Get stock discrepancies
export const getStockDiscrepancies = async (req, res) => {
  try {
    const { branchId, threshold = 0 } = req.query;

    // This would typically compare system stock vs physical count
    // For now, we'll identify products with unusual movement patterns
    const recentAdjustments = await prisma.stockMovement.findMany({
      where: {
        reason: { in: ['adjustment', 'reconciliation'] },
        ...(branchId && { branchId }),
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, stock: true }
        },
        branch: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by product to find frequent adjustments
    const productAdjustments = {};
    recentAdjustments.forEach(adj => {
      const productId = adj.productId;
      if (!productAdjustments[productId]) {
        productAdjustments[productId] = {
          product: adj.product,
          branch: adj.branch,
          adjustments: [],
          totalAdjustment: 0,
          adjustmentCount: 0
        };
      }
      
      productAdjustments[productId].adjustments.push({
        date: adj.createdAt,
        change: adj.change,
        reason: adj.reason
      });
      productAdjustments[productId].totalAdjustment += Math.abs(adj.change);
      productAdjustments[productId].adjustmentCount++;
    });

    // Filter products with significant discrepancies
    const significantDiscrepancies = Object.values(productAdjustments)
      .filter(p => p.adjustmentCount >= parseInt(threshold) + 1)
      .sort((a, b) => b.totalAdjustment - a.totalAdjustment);

    res.json({
      threshold: parseInt(threshold),
      discrepancies: significantDiscrepancies,
      summary: {
        totalProducts: significantDiscrepancies.length,
        totalAdjustments: significantDiscrepancies.reduce((sum, p) => sum + p.adjustmentCount, 0),
        totalAdjustmentQuantity: significantDiscrepancies.reduce((sum, p) => sum + p.totalAdjustment, 0)
      }
    });
  } catch (err) {
    console.error('Error in getStockDiscrepancies:', err);
    res.status(500).json({ message: "Error fetching stock discrepancies", error: err.message });
  }
};