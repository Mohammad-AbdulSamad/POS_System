// controllers/taxrates.controller.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 Get all tax rates
// 🟢 Get all tax rates
export const getAllTaxRates = async (req, res) => {
  try {
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
    
    res.json({
      taxRates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error in getAllTaxRates:', err);
    res.status(500).json({ message: "Error fetching tax rates", error: err.message });
  }
};

// 🟢 Get tax rate by ID
export const getTaxRateById = async (req, res) => {
  try {
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
    
    if (!taxRate) return res.status(404).json({ message: "Tax rate not found" });
    res.json(taxRate);
  } catch (err) {
    console.error('Error in getTaxRateById:', err);
    res.status(500).json({ message: "Error fetching tax rate", error: err.message });
  }
};

// 🟢 Create tax rate
export const createTaxRate = async (req, res) => {
  try {
    const { name, rate } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Tax rate name is required" });
    }
    
    if (rate === undefined || rate === null) {
      return res.status(400).json({ message: "Tax rate percentage is required" });
    }
    
    // Validate rate range (0-100%)
    const taxRate = parseFloat(rate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ 
        message: "Tax rate must be a number between 0 and 100" 
      });
    }
    
    // Check for duplicate tax rate name
    const existingTaxRate = await prisma.taxRate.findFirst({
      where: {
        name: name.trim()
      }
    });
    
    if (existingTaxRate) {
      return res.status(409).json({ message: "Tax rate name already exists" });
    }
    
    // Check for duplicate rate value
    const existingRate = await prisma.taxRate.findFirst({
      where: {
        rate: taxRate
      }
    });
    
    if (existingRate) {
      return res.status(409).json({ 
        message: `Tax rate ${taxRate}% already exists as "${existingRate.name}"` 
      });
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
    
    res.status(201).json(newTaxRate);
  } catch (err) {
    console.error('Error in createTaxRate:', err);
    res.status(500).json({ message: "Error creating tax rate", error: err.message });
  }
};

// 🟢 Update tax rate
export const updateTaxRate = async (req, res) => {
  try {
    const { name, rate } = req.body;
    
    // Check if tax rate exists
    const existingTaxRate = await prisma.taxRate.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingTaxRate) {
      return res.status(404).json({ message: "Tax rate not found" });
    }
    
    // Validate rate if provided
    if (rate !== undefined) {
      const taxRate = parseFloat(rate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        return res.status(400).json({ 
          message: "Tax rate must be a number between 0 and 100" 
        });
      }
      
      // Check for duplicate rate value (excluding current record)
      const duplicateRate = await prisma.taxRate.findFirst({
        where: {
          rate: taxRate,
          NOT: { id: req.params.id }
        }
      });
      
      if (duplicateRate) {
        return res.status(409).json({ 
          message: `Tax rate ${taxRate}% already exists as "${duplicateRate.name}"` 
        });
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
        return res.status(409).json({ message: "Tax rate name already exists" });
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
    
    res.json(updatedTaxRate);
  } catch (err) {
    console.error('Error in updateTaxRate:', err);
    res.status(500).json({ message: "Error updating tax rate", error: err.message });
  }
};

// 🟢 Delete tax rate
export const deleteTaxRate = async (req, res) => {
  try {
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
      return res.status(404).json({ message: "Tax rate not found" });
    }

    // Check if tax rate has products
    if (taxRateWithProducts._count.products > 0) {
      return res.status(400).json({ 
        message: "Cannot delete tax rate with existing products. Remove tax rate from products first or assign them to different tax rates.",
        details: { products: taxRateWithProducts._count.products }
      });
    }

    await prisma.taxRate.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: "Tax rate deleted successfully" });
  } catch (err) {
    console.error('Error in deleteTaxRate:', err);
    res.status(500).json({ message: "Error deleting tax rate", error: err.message });
  }
};

// 🆕 Get tax rate products
export const getTaxRateProducts = async (req, res) => {
  try {
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
    console.error('Error in getTaxRateProducts:', err);
    res.status(500).json({ message: "Error fetching tax rate products", error: err.message });
  }
};

// 🆕 Calculate tax amount
export const calculateTax = async (req, res) => {
  try {
    const { amount, taxRateId } = req.body;
    
    if (!amount || !taxRateId) {
      return res.status(400).json({ 
        message: "Amount and tax rate ID are required" 
      });
    }
    
    const baseAmount = parseFloat(amount);
    if (isNaN(baseAmount) || baseAmount < 0) {
      return res.status(400).json({ 
        message: "Amount must be a valid positive number or zero" 
      });
    }
    
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: taxRateId }
    });
    
    if (!taxRate) {
      return res.status(404).json({ message: "Tax rate not found" });
    }
    
    const taxAmount = (baseAmount * parseFloat(taxRate.rate)) / 100;
    const totalAmount = baseAmount + taxAmount;
    
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
  } catch (err) {
    console.error('Error in calculateTax:', err);
    res.status(500).json({ message: "Error calculating tax", error: err.message });
  }
};

// 🆕 Bulk assign products to tax rate
export const assignProductsToTaxRate = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs array is required" });
    }
    
    // Validate tax rate exists
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: req.params.id }
    });
    
    if (!taxRate) {
      return res.status(404).json({ message: "Tax rate not found" });
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
    
    // Update products to assign to this tax rate
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { taxRateId: req.params.id }
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
  } catch (err) {
    console.error('Error in assignProductsToTaxRate:', err);
    res.status(500).json({ message: "Error assigning products", error: err.message });
  }
};

// 🆕 Get tax rate analytics
export const getTaxRateAnalytics = async (req, res) => {
  try {
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

    // Calculate total tax impact (if all products sold at current price)
    const avgPrice = averageProductPrice._avg.priceGross 
      ? parseFloat(averageProductPrice._avg.priceGross) 
      : 0;
    
    const taxImpactPerUnit = taxRate 
      ? (avgPrice * parseFloat(taxRate.rate)) / 100 
      : 0;

    res.json({
      taxRate: {
        id: taxRate?.id,
        name: taxRate?.name,
        rate: taxRate ? parseFloat(taxRate.rate) : 0
      },
      overview: {
        totalProducts,
        activeProducts,
        averageProductPrice: avgPrice,
        estimatedTaxPerUnit: parseFloat(taxImpactPerUnit.toFixed(2))
      },
      branchDistribution
    });
  } catch (err) {
    console.error('Error in getTaxRateAnalytics:', err);
    res.status(500).json({ message: "Error fetching tax rate analytics", error: err.message });
  }
};