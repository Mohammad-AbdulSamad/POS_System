// controllers/transactions.controller.js
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";


const prisma = new PrismaClient();

// 🟢 Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const { 
      include_relations = 'false',
      branchId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      ...(branchId && { branchId }),
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
        include: include_relations === 'true' ? {
          branch: { select: { id: true, name: true } },
          cashier: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true, phone: true } },
          lines: {
            include: {
              product: {
                select: { id: true, name: true, sku: true }
              }
            }
          },
          payments: true,
          returns: {
            select: {
              id: true,
              returnAmount: true,
              reason: true,
              createdAt: true
            }
          }
        } : {
          branch: { select: { id: true, name: true } },
          cashier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          _count: {
            select: {
              lines: true,
              payments: true,
              returns: true
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
    console.error('Error in getAllTransactions:', err);
    res.status(500).json({ message: "Error fetching transactions", error: err.message });
  }
};

// 🟢 Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const { include_relations = 'false' } = req.query;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: include_relations === 'true' ? {
        branch: true,
        cashier: { 
          select: { id: true, name: true, email: true, role: true } 
        },
        customer: {
          select: { 
            id: true, 
            name: true, 
            phone: true, 
            email: true,
            loyaltyNumber: true,
            loyaltyPoints: true
          }
        },
        lines: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                sku: true, 
                unit: true,
                categoryId: true
              }
            }
          },
          orderBy: { id: 'asc' }
        },
        payments: {
          orderBy: { createdAt: 'asc' }
        },
        returns: {
          select: {
            id: true,
            returnAmount: true,
            reason: true,
            processedBy: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      } : {
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        _count: {
          select: {
            lines: true,
            payments: true,
            returns: true
          }
        }
      }
    });
    
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (err) {
    console.error('Error in getTransactionById:', err);
    res.status(500).json({ message: "Error fetching transaction", error: err.message });
  }
};

// 🟢 Create transaction
export const createTransaction = async (req, res) => {
  try {
    const {
      branchId,
      cashierId,
      customerId,
      lines,
      payments,
      loyaltyPointsEarned = 0,
      loyaltyPointsUsed = 0,
      metadata
    } = req.body;
    
    // Validate required fields
    if (!branchId || !lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ 
        message: "Required fields: branchId, lines (array with at least one item)" 
      });
    }
    
    // Validate branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });
    
    if (!branch) {
      return res.status(400).json({ message: "Branch not found" });
    }
    
    // Validate cashier if provided
    if (cashierId) {
      const cashier = await prisma.user.findUnique({
        where: { id: cashierId }
      });
      
      if (!cashier) {
        return res.status(400).json({ message: "Cashier not found" });
      }
    }
    
    // Validate customer if provided
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer) {
        return res.status(400).json({ message: "Customer not found" });
      }
    }
    
    // Calculate totals from lines
    let totalNet = 0;   // sum of line totals excluding tax
    let totalTax = 0;   // sum of taxes
    const validatedLines = [];
    
    for (const line of lines) {
      const { productId, qty, unitPrice, discount = 0, taxAmount = 0 } = line;
      
      if (!productId || !qty || qty <= 0 || !unitPrice || unitPrice <= 0) {
        return res.status(400).json({ 
          message: "Each line must have: productId, qty (> 0), unitPrice (> 0)" 
        });
      }
      
      // Verify product exists and has sufficient stock
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (!product) {
        return res.status(400).json({ message: `Product ${productId} not found` });
      }
      
      if (product.stock < qty) {
        return res.status(400).json({ 
          message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${qty}` 
        });
      }
      
      const lineTotal = (parseFloat(unitPrice) * parseInt(qty)) - parseFloat(discount);
      // lineTotal is net (excluding tax)
      totalNet += lineTotal;
      totalTax += parseFloat(taxAmount);
      
      validatedLines.push({
        productId,
        unitPrice: parseFloat(unitPrice),
        qty: parseInt(qty),
        discount: parseFloat(discount),
        taxAmount: parseFloat(taxAmount),
        lineTotal
      });
    }
    
    const totalGross = totalNet + totalTax;
    
    // Generate unique receipt number
    const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Create transaction with all related data in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const newTransaction = await tx.transaction.create({
        data: {
          branchId,
          cashierId: cashierId || null,
          customerId: customerId || null,
          receiptNumber,
          totalGross,
          totalTax,
          totalNet: totalNet,
          loyaltyPointsEarned: parseInt(loyaltyPointsEarned),
          loyaltyPointsUsed: parseInt(loyaltyPointsUsed),
          metadata: metadata || null
        }
      });
      
      // Create transaction lines and update product stock
      for (const line of validatedLines) {
        await tx.transactionLine.create({
          data: {
            transactionId: newTransaction.id,
            ...line
          }
        });
        
        // Update product stock
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stock: {
              decrement: line.qty
            }
          }
        });
        
        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            branchId,
            change: -line.qty,
            reason: 'sale'
          }
        });
      }
      
      // Create payments if provided
      if (payments && Array.isArray(payments)) {
        for (const payment of payments) {
          await tx.payment.create({
            data: {
              transactionId: newTransaction.id,
              method: payment.method,
              amount: parseFloat(payment.amount)
            }
          });
        }
      }
      
      // Update customer loyalty points if applicable
      if (customerId && (loyaltyPointsEarned > 0 || loyaltyPointsUsed > 0)) {
        if (loyaltyPointsEarned > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyaltyPoints: {
                increment: parseInt(loyaltyPointsEarned)
              }
            }
          });
          
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              points: parseInt(loyaltyPointsEarned),
              type: 'EARNED',
              reason: 'PURCHASE'
            }
          });
        }
        
        if (loyaltyPointsUsed > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              loyaltyPoints: {
                decrement: parseInt(loyaltyPointsUsed)
              }
            }
          });
          
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              points: parseInt(loyaltyPointsUsed),
              type: 'REDEEMED',
              reason: 'PURCHASE'
            }
          });
        }
      }
      
      return newTransaction;
    });
    
    // Fetch the complete transaction with relations
    const completeTransaction = await prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        lines: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        payments: true
      }
    });
    
    res.status(201).json(completeTransaction);
  } catch (err) {
    console.error('Error in createTransaction:', err);
    res.status(500).json({ message: "Error creating transaction", error: err.message });
  }
};

// 🟢 Update transaction (limited - only status and metadata)
export const updateTransaction = async (req, res) => {
  try {
    const { status, metadata } = req.body;
    
    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    // Prevent updating completed transactions to pending
    if (existingTransaction.status === 'COMPLETED' && status === 'PENDING') {
      return res.status(400).json({ 
        message: "Cannot change completed transaction back to pending" 
      });
    }
    
    const updatedTransaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(metadata !== undefined && { metadata })
      },
      include: {
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } }
      }
    });
    
    res.json(updatedTransaction);
  } catch (err) {
    console.error('Error in updateTransaction:', err);
    res.status(500).json({ message: "Error updating transaction", error: err.message });
  }
};

// 🟢 Delete transaction (soft delete - mark as cancelled)
export const deleteTransaction = async (req, res) => {
  try {
    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Only allow deletion of pending transactions
    if (existingTransaction.status === 'COMPLETED') {
      return res.status(400).json({ 
        message: "Cannot delete completed transaction. Use returns instead." 
      });
    }

    // Restore product stock in a transaction
    await prisma.$transaction(async (tx) => {
      // Restore stock for each product
      for (const line of existingTransaction.lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stock: {
              increment: line.qty
            }
          }
        });
        
        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            branchId: existingTransaction.branchId,
            change: line.qty,
            reason: 'transaction_cancelled'
          }
        });
      }
      
      // Delete the transaction and related records
      await tx.payment.deleteMany({
        where: { transactionId: req.params.id }
      });
      
      await tx.transactionLine.deleteMany({
        where: { transactionId: req.params.id }
      });
      
      await tx.transaction.delete({
        where: { id: req.params.id }
      });
    });
    
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error('Error in deleteTransaction:', err);
    res.status(500).json({ message: "Error deleting transaction", error: err.message });
  }
};

// 🆕 Get transactions by branch
export const getTransactionsByBranch = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      branchId: req.params.branchId,
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
          cashier: { select: { name: true, email: true } },
          customer: { select: { name: true, phone: true } },
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
    console.error('Error in getTransactionsByBranch:', err);
    res.status(500).json({ message: "Error fetching branch transactions", error: err.message });
  }
};

// 🆕 Get transactions by customer
export const getTransactionsByCustomer = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { customerId: req.params.customerId },
        include: {
          branch: { select: { name: true } },
          cashier: { select: { name: true } },
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
      prisma.transaction.count({ 
        where: { customerId: req.params.customerId } 
      })
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
    console.error('Error in getTransactionsByCustomer:', err);
    res.status(500).json({ message: "Error fetching customer transactions", error: err.message });
  }
};

// 🆕 Get transaction receipt (formatted for printing)
export const getTransactionReceipt = async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        branch: true,
        cashier: { select: { name: true } },
        customer: { 
          select: { 
            name: true, 
            phone: true,
            loyaltyNumber: true 
          } 
        },
        lines: {
          include: {
            product: {
              select: { name: true, sku: true, unit: true }
            }
          },
          orderBy: { id: 'asc' }
        },
        payments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error('Error in getTransactionReceipt:', err);
    res.status(500).json({ message: "Error fetching transaction receipt", error: err.message });
  }
};