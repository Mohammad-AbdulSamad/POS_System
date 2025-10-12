// controllers/customers.controller.js - Updated with Error Handling & Logging
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// ✅ Get all customers
export const getAllCustomers = asyncHandler(async (req, res) => {
  const { 
    include_relations = 'false',
    loyaltyTier,
    search,
    hasTransactions,
    minLoyaltyPoints,
    page = 1,
    limit = 50 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = {
    ...(loyaltyTier && { loyaltyTier }),
    ...(minLoyaltyPoints && { loyaltyPoints: { gte: parseInt(minLoyaltyPoints) } }),
    ...(hasTransactions === 'true' && {
      transactions: {
        some: {}
      }
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { loyaltyNumber: { contains: search, mode: 'insensitive' } }
      ]
    })
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        loyaltyNumber: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        dateOfBirth: true,
        preferredStore: true,
        createdAt: true,
        ...(include_relations === 'true' && {
          transactions: {
            select: {
              id: true,
              receiptNumber: true,
              totalGross: true,
              createdAt: true,
              branch: {
                select: { id: true, name: true }
              }
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          loyaltyTransactions: {
            select: {
              id: true,
              points: true,
              type: true,
              reason: true,
              createdAt: true
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              transactions: true,
              loyaltyTransactions: true
            }
          }
        }),
        ...(!include_relations || include_relations === 'false') && {
          _count: {
            select: {
              transactions: true,
              loyaltyTransactions: true
            }
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.customer.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'Customer',
    count: customers.length,
    userId: req.user?.id,
    filters: { loyaltyTier, search, hasTransactions, minLoyaltyPoints }
  });
  
  res.json({
    customers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Get customer by ID
export const getCustomerById = asyncHandler(async (req, res) => {
  const { include_relations = 'false' } = req.query;
  
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      loyaltyNumber: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      dateOfBirth: true,
      preferredStore: true,
      createdAt: true,
      ...(include_relations === 'true' && {
        transactions: {
          select: {
            id: true,
            receiptNumber: true,
            totalGross: true,
            totalNet: true,
            loyaltyPointsEarned: true,
            loyaltyPointsUsed: true,
            createdAt: true,
            status: true,
            branch: {
              select: { id: true, name: true }
            },
            _count: {
              select: {
                lines: true,
                payments: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        loyaltyTransactions: {
          select: {
            id: true,
            points: true,
            type: true,
            reason: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }),
      _count: {
        select: {
          transactions: true,
          loyaltyTransactions: true
        }
      }
    }
  });
  
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  logger.logDatabase('READ', {
    model: 'Customer',
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(customer);
});

// ✅ Create customer
export const createCustomer = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    loyaltyNumber,
    dateOfBirth,
    preferredStore,
    loyaltyTier = 'BRONZE'
  } = req.body;
  
  // Validate required fields
  if (!name || name.trim() === '') {
    throw new BadRequestError('Customer name is required');
  }
  
  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError('Invalid email format');
  }
  
  // Validate phone format if provided (basic validation)
  if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''))) {
    throw new BadRequestError('Invalid phone format');
  }
  
  // Check for duplicate phone
  if (phone) {
    const existingPhone = await prisma.customer.findFirst({
      where: { phone: phone.trim() }
    });
    if (existingPhone) {
      throw new ConflictError('Phone number already exists');
    }
  }
  
  // Check for duplicate email
  if (email) {
    const existingEmail = await prisma.customer.findFirst({
      where: { email: email.trim() }
    });
    if (existingEmail) {
      throw new ConflictError('Email already exists');
    }
  }
  
  // Generate loyalty number if not provided
  const finalLoyaltyNumber = loyaltyNumber || 
    `LOYAL${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  const newCustomer = await prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      loyaltyNumber: finalLoyaltyNumber,
      loyaltyTier,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      preferredStore: preferredStore?.trim() || null
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      loyaltyNumber: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      dateOfBirth: true,
      preferredStore: true,
      createdAt: true,
      _count: {
        select: {
          transactions: true,
          loyaltyTransactions: true
        }
      }
    }
  });

  logger.info({
    message: 'Customer created',
    customerId: newCustomer.id,
    customerName: newCustomer.name,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.status(201).json(newCustomer);
});

// ✅ Update customer
export const updateCustomer = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    loyaltyNumber,
    loyaltyTier,
    dateOfBirth,
    preferredStore
  } = req.body;
  
  // Check if customer exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { id: req.params.id }
  });
  
  if (!existingCustomer) {
    throw new NotFoundError('Customer not found');
  }
  
  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError('Invalid email format');
  }
  
  // Validate phone format if provided
  if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''))) {
    throw new BadRequestError('Invalid phone format');
  }
  
  // Check for duplicate phone
  if (phone && phone !== existingCustomer.phone) {
    const duplicatePhone = await prisma.customer.findFirst({
      where: {
        phone: phone.trim(),
        NOT: { id: req.params.id }
      }
    });
    if (duplicatePhone) {
      throw new ConflictError('Phone number already exists');
    }
  }
  
  // Check for duplicate email
  if (email && email !== existingCustomer.email) {
    const duplicateEmail = await prisma.customer.findFirst({
      where: {
        email: email.trim(),
        NOT: { id: req.params.id }
      }
    });
    if (duplicateEmail) {
      throw new ConflictError('Email already exists');
    }
  }
  
  const updatedCustomer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(loyaltyNumber && { loyaltyNumber: loyaltyNumber.trim() }),
      ...(loyaltyTier && { loyaltyTier }),
      ...(dateOfBirth !== undefined && { 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null 
      }),
      ...(preferredStore !== undefined && { 
        preferredStore: preferredStore?.trim() || null 
      })
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      loyaltyNumber: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      dateOfBirth: true,
      preferredStore: true,
      createdAt: true,
      _count: {
        select: {
          transactions: true,
          loyaltyTransactions: true
        }
      }
    }
  });

  logger.info({
    message: 'Customer updated',
    customerId: updatedCustomer.id,
    customerName: updatedCustomer.name,
    userId: req.user?.id,
    changes: { name, phone, email, loyaltyTier }
  });
  
  res.json(updatedCustomer);
});

// ✅ Delete customer
export const deleteCustomer = asyncHandler(async (req, res) => {
  // Check if customer exists and has transactions
  const customerWithTransactions = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          transactions: true,
          loyaltyTransactions: true
        }
      }
    }
  });

  if (!customerWithTransactions) {
    throw new NotFoundError('Customer not found');
  }

  // Check if customer has transaction history
  const counts = customerWithTransactions._count;
  if (counts.transactions > 0) {
    throw new BadRequestError(
      'Cannot delete customer with transaction history. Consider deactivating instead.',
      { details: counts }
    );
  }

  // Delete loyalty transactions first, then customer
  await prisma.$transaction(async (tx) => {
    await tx.loyaltyTransaction.deleteMany({
      where: { customerId: req.params.id }
    });
    
    await tx.customer.delete({
      where: { id: req.params.id }
    });
  });

  logger.warn({
    message: 'Customer deleted',
    customerId: req.params.id,
    customerName: customerWithTransactions.name,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.json({ message: "Customer deleted successfully" });
});

// ✅ Get customer transactions
export const getCustomerTransactions = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    status, 
    branchId,
    page = 1, 
    limit = 50 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    customerId: req.params.id,
    ...(status && { status }),
    ...(branchId && { branchId }),
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
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        lines: {
          select: {
            id: true,
            qty: true,
            unitPrice: true,
            lineTotal: true,
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true
          }
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
    operation: 'getCustomerTransactions',
    customerId: req.params.id,
    count: transactions.length,
    userId: req.user?.id
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

// ✅ Get customer loyalty history
export const getCustomerLoyaltyHistory = asyncHandler(async (req, res) => {
  const { 
    type, 
    reason,
    startDate,
    endDate,
    page = 1, 
    limit = 50 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    customerId: req.params.id,
    ...(type && { type }),
    ...(reason && { reason }),
    ...(startDate && endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  const [loyaltyTransactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.loyaltyTransaction.count({ where })
  ]);

  // Get current customer points
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    select: { loyaltyPoints: true, loyaltyTier: true }
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  logger.logDatabase('READ', {
    model: 'LoyaltyTransaction',
    operation: 'getCustomerLoyaltyHistory',
    customerId: req.params.id,
    count: loyaltyTransactions.length,
    userId: req.user?.id
  });

  res.json({
    loyaltyTransactions,
    currentPoints: customer.loyaltyPoints,
    currentTier: customer.loyaltyTier,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Update customer loyalty points
export const updateCustomerLoyaltyPoints = asyncHandler(async (req, res) => {
  const { points, reason, type = 'ADJUSTMENT' } = req.body;
  
  if (!points || !reason) {
    throw new BadRequestError('Points and reason are required');
  }
  
  if (!['EARNED', 'REDEEMED', 'ADJUSTMENT'].includes(type)) {
    throw new BadRequestError('Type must be EARNED, REDEEMED, or ADJUSTMENT');
  }
  
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id }
  });
  
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }
  
  const pointsChange = parseInt(points);
  const newPoints = customer.loyaltyPoints + pointsChange;
  
  if (newPoints < 0) {
    throw new BadRequestError(
      `Insufficient loyalty points. Customer has ${customer.loyaltyPoints} points.`
    );
  }
  
  // Update points and create loyalty transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedCustomer = await tx.customer.update({
      where: { id: req.params.id },
      data: { loyaltyPoints: newPoints }
    });
    
    const loyaltyTransaction = await tx.loyaltyTransaction.create({
      data: {
        customerId: req.params.id,
        points: Math.abs(pointsChange),
        type: pointsChange > 0 ? 'EARNED' : 'REDEEMED',
        reason: reason.trim()
      }
    });
    
    return { updatedCustomer, loyaltyTransaction };
  });

  logger.info({
    message: 'Loyalty points updated',
    customerId: req.params.id,
    pointsChange,
    newPoints,
    reason,
    userId: req.user?.id
  });
  
  res.json({
    customer: {
      id: result.updatedCustomer.id,
      loyaltyPoints: result.updatedCustomer.loyaltyPoints,
      loyaltyTier: result.updatedCustomer.loyaltyTier
    },
    loyaltyTransaction: result.loyaltyTransaction
  });
});

// ✅ Get customer analytics
export const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const { period = '365' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const [
    customer,
    totalTransactions,
    totalSpent,
    averageOrderValue,
    loyaltyEarned,
    loyaltyRedeemed,
    favoriteProducts,
    recentActivity
  ] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        createdAt: true
      }
    }),
    prisma.transaction.count({
      where: {
        customerId: req.params.id,
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      }
    }),
    prisma.transaction.aggregate({
      where: {
        customerId: req.params.id,
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _sum: { totalGross: true }
    }),
    prisma.transaction.aggregate({
      where: {
        customerId: req.params.id,
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _avg: { totalGross: true }
    }),
    prisma.loyaltyTransaction.aggregate({
      where: {
        customerId: req.params.id,
        type: 'EARNED',
        createdAt: { gte: startDate }
      },
      _sum: { points: true }
    }),
    prisma.loyaltyTransaction.aggregate({
      where: {
        customerId: req.params.id,
        type: 'REDEEMED',
        createdAt: { gte: startDate }
      },
      _sum: { points: true }
    }),
    // Get most purchased products
    prisma.transactionLine.groupBy({
      by: ['productId'],
      where: {
        transaction: {
          customerId: req.params.id,
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        }
      },
      _sum: { qty: true },
      _count: true,
      orderBy: { _sum: { qty: 'desc' } },
      take: 5
    }),
    prisma.transaction.findMany({
      where: {
        customerId: req.params.id,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      select: {
        id: true,
        receiptNumber: true,
        totalGross: true,
        createdAt: true,
        branch: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Get product details for favorite products
  const favoriteProductsWithDetails = await Promise.all(
    favoriteProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, sku: true, priceGross: true }
      });
      return {
        ...product,
        totalQuantity: item._sum.qty,
        purchaseCount: item._count
      };
    })
  );

  logger.info({
    message: 'Customer analytics generated',
    customerId: req.params.id,
    period: parseInt(period),
    userId: req.user?.id
  });

  res.json({
    customer,
    period: parseInt(period),
    summary: {
      totalTransactions,
      totalSpent: totalSpent._sum.totalGross ? parseFloat(totalSpent._sum.totalGross) : 0,
      averageOrderValue: averageOrderValue._avg.totalGross ? parseFloat(averageOrderValue._avg.totalGross) : 0,
      loyaltyPointsEarned: loyaltyEarned._sum.points || 0,
      loyaltyPointsRedeemed: loyaltyRedeemed._sum.points || 0
    },
    favoriteProducts: favoriteProductsWithDetails,
    recentActivity
  });
});

// ✅ Search customers by loyalty number or phone
export const searchCustomers = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw new BadRequestError('Search query must be at least 2 characters');
  }
  
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { phone: { contains: q.trim() } },
        { loyaltyNumber: { contains: q.trim(), mode: 'insensitive' } },
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { email: { contains: q.trim(), mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      loyaltyNumber: true,
      loyaltyPoints: true,
      loyaltyTier: true
    },
    take: parseInt(limit),
    orderBy: { name: 'asc' }
  });

  logger.logDatabase('READ', {
    model: 'Customer',
    operation: 'searchCustomers',
    query: q,
    count: customers.length,
    userId: req.user?.id
  });
  
  res.json(customers);
});