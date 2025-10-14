// controllers/taxRates.controller.js - Updated with Error Handling & Logging
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

// ✅ Get all tax rates
export const getAllTaxRates = asyncHandler(async (req, res) => {
  const { 
    include_relations = 'false',
    search,
    minRate,
    maxRate,
    hasProducts,
    page = 1,
    limit = 50 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build the "where" filter properly
  const where = {
    ...(search && {
      name: { contains: search, mode: 'insensitive' }
    }),
    ...(hasProducts === 'true' && {
      products: { some: {} }
    }),
    ...(minRate || maxRate ? {
      rate: {
        ...(minRate ? { gte: parseFloat(minRate) } : {}),
        ...(maxRate ? { lte: parseFloat(maxRate) } : {})
      }
    } : {})
  };

  const [taxRates, total] = await Promise.all([
    prisma.taxRate.findMany({
      where,
      include: include_relations === 'true' ? {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            priceGross: true,
            active: true,
            branch: {
              select: { id: true, name: true }
            }
          },
          where: { active: true },
          take: 10,
          orderBy: { name: 'asc' }
        },
        _count: { select: { products: true } }
      } : {
        _count: { select: { products: true } }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { rate: 'asc' }
    }),
    prisma.taxRate.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'TaxRate',
    count: taxRates.length,
    userId: req.user?.id,
    filters: { search, minRate, maxRate, hasProducts }
  });
  
  res.json({
    taxRates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ✅ Get tax rate by ID
export const getTaxRateById = asyncHandler(async (req, res) => {
  const { include_relations = 'false' } = req.query;
  
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: req.params.id },
    include: include_relations === 'true' ? {
      products: {
        select: {
          id: true,
          name: true,
          sku: true,
          priceGross: true,
          cost: true,
          active: true,
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
  
  if (!taxRate) {
    throw new NotFoundError('Tax rate not found');
  }

  logger.logDatabase('READ', {
    model: 'TaxRate',
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(taxRate);
});

// ✅ Create tax rate
export const createTaxRate = asyncHandler(async (req, res) => {
  const { name, rate } = req.body;
  
  // Validate required fields
  if (!name || name.trim() === '') {
    throw new BadRequestError('Tax rate name is required');
  }
  
  if (rate === undefined || rate === null) {
    throw new BadRequestError('Tax rate percentage is required');
  }
  
  // Validate rate range (0-100%)
  const taxRate = parseFloat(rate);
  if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new BadRequestError('Tax rate must be a number between 0 and 100');
  }
  
  // Check for duplicate tax rate name
  const existingTaxRate = await prisma.taxRate.findFirst({
    where: {
      name: name.trim()
    }
  });
  
  if (existingTaxRate) {
    throw new ConflictError('Tax rate name already exists');
  }
  
  // Check for duplicate rate value
  const existingRate = await prisma.taxRate.findFirst({
    where: {
      rate: taxRate
    }
  });
  
  if (existingRate) {
    throw new ConflictError(`Tax rate ${taxRate}% already exists as "${existingRate.name}"`);
  }
  
  const newTaxRate = await prisma.taxRate.create({
    data: {
      name: name.trim(),
      rate: taxRate
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  logger.info({
    message: 'Tax rate created',
    taxRateId: newTaxRate.id,
    taxRateName: newTaxRate.name,
    rate: taxRate,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.status(201).json(newTaxRate);
});

// ✅ Update tax rate
export const updateTaxRate = asyncHandler(async (req, res) => {
  const { name, rate } = req.body;
  
  // Check if tax rate exists
  const existingTaxRate = await prisma.taxRate.findUnique({
    where: { id: req.params.id }
  });
  
  if (!existingTaxRate) {
    throw new NotFoundError('Tax rate not found');
  }
  
  // Validate rate if provided
  if (rate !== undefined) {
    const taxRate = parseFloat(rate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      throw new BadRequestError('Tax rate must be a number between 0 and 100');
    }
    
    // Check for duplicate rate value (excluding current record)
    const duplicateRate = await prisma.taxRate.findFirst({
      where: {
        rate: taxRate,
        NOT: { id: req.params.id }
      }
    });
    
    if (duplicateRate) {
      throw new ConflictError(`Tax rate ${taxRate}% already exists as "${duplicateRate.name}"`);
    }
  }
  
  // Check for duplicate name if updating name
  if (name && name.trim() !== existingTaxRate.name) {
    const duplicateName = await prisma.taxRate.findFirst({
      where: {
        name: name.trim(),
        NOT: { id: req.params.id }
      }
    });
    
    if (duplicateName) {
      throw new ConflictError('Tax rate name already exists');
    }
  }
  
  const updatedTaxRate = await prisma.taxRate.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(rate !== undefined && { rate: parseFloat(rate) })
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  logger.info({
    message: 'Tax rate updated',
    taxRateId: req.params.id,
    taxRateName: updatedTaxRate.name,
    userId: req.user?.id,
    changes: { name, rate }
  });
  
  res.json(updatedTaxRate);
});

// ✅ Delete tax rate
export const deleteTaxRate = asyncHandler(async (req, res) => {
  // Check if tax rate exists and has products
  const taxRateWithProducts = await prisma.taxRate.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!taxRateWithProducts) {
    throw new NotFoundError('Tax rate not found');
  }

  // Check if tax rate has products
  if (taxRateWithProducts._count.products > 0) {
    throw new BadRequestError(
      'Cannot delete tax rate with existing products. Remove tax rate from products first or assign them to different tax rates.',
      { details: { products: taxRateWithProducts._count.products } }
    );
  }

  await prisma.taxRate.delete({
    where: { id: req.params.id }
  });

  logger.warn({
    message: 'Tax rate deleted',
    taxRateId: req.params.id,
    taxRateName: taxRateWithProducts.name,
    rate: taxRateWithProducts.rate,
    userId: req.user?.id,
    userEmail: req.user?.email
  });
  
  res.json({ message: "Tax rate deleted successfully" });
});

// ✅ Get tax rate products
export const getTaxRateProducts = asyncHandler(async (req, res) => {
  const { 
    active, 
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
    taxRateId: req.params.id,
    ...(branchId && { branchId }),
    ...(categoryId && { categoryId }),
    ...(active !== undefined && { active: active === 'true' }),
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
        supplier: { select: { id: true, name: true } }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy
    }),
    prisma.product.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'Product',
    operation: 'getTaxRateProducts',
    taxRateId: req.params.id,
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

// ✅ Calculate tax amount
export const calculateTax = asyncHandler(async (req, res) => {
  const { amount, taxRateId } = req.body;
  
  if (!amount || !taxRateId) {
    throw new BadRequestError('Amount and tax rate ID are required');
  }
  
  const baseAmount = parseFloat(amount);
  if (isNaN(baseAmount) || baseAmount < 0) {
    throw new BadRequestError('Amount must be a valid positive number or zero');
  }
  
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: taxRateId }
  });
  
  if (!taxRate) {
    throw new NotFoundError('Tax rate not found');
  }
  
  const taxAmount = (baseAmount * parseFloat(taxRate.rate)) / 100;
  const totalAmount = baseAmount + taxAmount;

  logger.info({
    message: 'Tax calculated',
    taxRateId,
    baseAmount,
    taxAmount,
    totalAmount,
    userId: req.user?.id
  });
  
  res.json({
    baseAmount: parseFloat(baseAmount.toFixed(2)),
    taxRate: {
      id: taxRate.id,
      name: taxRate.name,
      rate: parseFloat(taxRate.rate)
    },
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  });
});

// ✅ Bulk assign products to tax rate
export const assignProductsToTaxRate = asyncHandler(async (req, res) => {
  const { productIds } = req.body;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new BadRequestError('Product IDs array is required');
  }
  
  // Validate tax rate exists
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: req.params.id }
  });
  
  if (!taxRate) {
    throw new NotFoundError('Tax rate not found');
  }
  
  // Validate products exist
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });
  
  if (products.length !== productIds.length) {
    throw new BadRequestError('Some products not found');
  }
  
  // Update products to assign to this tax rate
  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { taxRateId: req.params.id }
  });

  logger.info({
    message: 'Products assigned to tax rate',
    taxRateId: req.params.id,
    taxRateName: taxRate.name,
    assignedCount: result.count,
    userId: req.user?.id
  });
  
  res.json({ 
    message: `Successfully assigned ${result.count} products to tax rate "${taxRate.name}" (${taxRate.rate}%)`,
    assignedCount: result.count,
    taxRate: {
      id: taxRate.id,
      name: taxRate.name,
      rate: parseFloat(taxRate.rate)
    }
  });
});

// ✅ Get tax rate analytics
export const getTaxRateAnalytics = asyncHandler(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    productsByBranch,
    averageProductPrice,
    totalTaxImpact
  ] = await Promise.all([
    prisma.product.count({ where: { taxRateId: req.params.id } }),
    prisma.product.count({ where: { taxRateId: req.params.id, active: true } }),
    prisma.product.groupBy({
      by: ['branchId'],
      where: { taxRateId: req.params.id, active: true },
      _count: true
    }),
    prisma.product.aggregate({
      where: { taxRateId: req.params.id, active: true },
      _avg: { priceGross: true }
    }),
    prisma.product.findMany({
      where: { taxRateId: req.params.id, active: true },
      select: { priceGross: true }
    })
  ]);

  // Get branch names for distribution
  const branchIds = productsByBranch.map(item => item.branchId);
  const branches = await prisma.branch.findMany({
    where: { id: { in: branchIds } },
    select: { id: true, name: true }
  });

  const branchDistribution = productsByBranch.map(item => {
    const branch = branches.find(b => b.id === item.branchId);
    return {
      branchId: item.branchId,
      branchName: branch?.name || 'Unknown',
      productCount: item._count
    };
  });

  // Get tax rate details
  const taxRate = await prisma.taxRate.findUnique({
    where: { id: req.params.id }
  });

  if (!taxRate) {
    throw new NotFoundError('Tax rate not found');
  }

  // Calculate total tax impact (if all products sold at current price)
  const avgPrice = averageProductPrice._avg.priceGross 
    ? parseFloat(averageProductPrice._avg.priceGross) 
    : 0;
  
  const taxImpactPerUnit = (avgPrice * parseFloat(taxRate.rate)) / 100;

  logger.info({
    message: 'Tax rate analytics generated',
    taxRateId: req.params.id,
    userId: req.user?.id
  });

  res.json({
    taxRate: {
      id: taxRate.id,
      name: taxRate.name,
      rate: parseFloat(taxRate.rate)
    },
    overview: {
      totalProducts,
      activeProducts,
      averageProductPrice: avgPrice,
      estimatedTaxPerUnit: parseFloat(taxImpactPerUnit.toFixed(2))
    },
    branchDistribution
  });
});