// // controllers/promotions.controller.js
// import { PrismaClient } from "@prisma/client";
// import asyncHandler from "../middleware/asyncHandler.middleware.js";
// import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
// import logger from "../config/logger.config.js";

// const prisma = new PrismaClient();

// const toInt = (v, fallback = 0) => {
//   const n = parseInt(v);
//   return Number.isNaN(n) ? fallback : n;
// };

// // 🟢 Get all promotions
// export const getAllPromotions = async (req, res) => {
//   try {
//     const { 
//       include_relations = 'false',
//       type,
//       active,
//       search,
//       page = 1,
//       limit = 50 
//     } = req.query;
    
//     const skip = (parseInt(page) - 1) * parseInt(limit);
    
//     const where = {
//       ...(type && { type }),
//       ...(active !== undefined && { active: active === 'true' }),
//       ...(search && {
//         OR: [
//           { name: { contains: search, mode: 'insensitive' } },
//           { description: { contains: search, mode: 'insensitive' } }
//         ]
//       })
//     };

//     const [promotions, total] = await Promise.all([
//       prisma.promotion.findMany({
//         where,
//         include: include_relations === 'true' ? {
//           products: {
//             select: {
//               id: true,
//               name: true,
//               sku: true,
//               priceGross: true,
//               active: true,
//               branch: {
//                 select: { id: true, name: true }
//               }
//             },
//             take: 10,
//             orderBy: { name: 'asc' }
//           },
//           categories: {
//             select: {
//               id: true,
//               name: true,
//               branch: {
//                 select: { id: true, name: true }
//               }
//             }
//           },
//           _count: {
//             select: {
//               products: true,
//               categories: true
//             }
//           }
//         } : {
//           _count: {
//             select: {
//               products: true,
//               categories: true
//             }
//           }
//         },
//         skip: parseInt(skip),
//         take: parseInt(limit),
//         orderBy: { createdAt: 'desc' }
//       }),
//       prisma.promotion.count({ where })
//     ]);
    
//     res.json({
//       promotions,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });
//   } catch (err) {
//     console.error('Error in getAllPromotions:', err);
//     res.status(500).json({ message: "Error fetching promotions", error: err.message });
//   }
// };

// // 🟢 Get promotion by ID
// export const getPromotionById = async (req, res) => {
//   try {
//     const { include_relations = 'false' } = req.query;
    
//     const promotion = await prisma.promotion.findUnique({
//       where: { id: req.params.id },
//       include: include_relations === 'true' ? {
//         products: {
//           select: {
//             id: true,
//             name: true,
//             sku: true,
//             priceGross: true,
//             cost: true,
//             active: true,
//             branch: {
//               select: { id: true, name: true }
//             },
//             category: {
//               select: { id: true, name: true }
//             }
//           },
//           orderBy: { name: 'asc' }
//         },
//         categories: {
//           select: {
//             id: true,
//             name: true,
//             branch: {
//               select: { id: true, name: true }
//             },
//             _count: {
//               select: { products: true }
//             }
//           }
//         },
//         _count: {
//           select: {
//             products: true,
//             categories: true
//           }
//         }
//       } : {
//         _count: {
//           select: {
//             products: true,
//             categories: true
//           }
//         }
//       }
//     });
    
//     if (!promotion) return res.status(404).json({ message: "Promotion not found" });
//     res.json(promotion);
//   } catch (err) {
//     console.error('Error in getPromotionById:', err);
//     res.status(500).json({ message: "Error fetching promotion", error: err.message });
//   }
// };

// // 🟢 Create promotion
// export const createPromotion = async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       type = 'PERCENTAGE',
//       discountPct,
//       discountAmt,
//       buyQty,
//       getQty,
//       active = true
//     } = req.body;
    
//     // Validate required fields
//     if (!name || name.trim() === '') {
//       return res.status(400).json({ message: "Promotion name is required" });
//     }
    
//     if (!['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'].includes(type)) {
//       return res.status(400).json({ 
//         message: "Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y" 
//       });
//     }
    
//     // Validate type-specific fields
//     if (type === 'PERCENTAGE') {
//       if (!discountPct || discountPct <= 0 || discountPct > 100) {
//         return res.status(400).json({ 
//           message: "Percentage discount must be between 0 and 100" 
//         });
//       }
//     }
    
//     if (type === 'FIXED_AMOUNT') {
//       if (!discountAmt || discountAmt <= 0) {
//         return res.status(400).json({ 
//           message: "Fixed discount amount must be greater than 0" 
//         });
//       }
//     }
    
//     if (type === 'BUY_X_GET_Y') {
//       if (!buyQty || buyQty <= 0 || !getQty || getQty <= 0) {
//         return res.status(400).json({ 
//           message: "Buy quantity and get quantity must be greater than 0 for BUY_X_GET_Y promotions" 
//         });
//       }
//     }
    
//     const newPromotion = await prisma.promotion.create({
//       data: {
//         name: name.trim(),
//         description: description?.trim() || null,
//         type,
//         discountPct: type === 'PERCENTAGE' ? parseFloat(discountPct) : null,
//         discountAmt: type === 'FIXED_AMOUNT' ? parseFloat(discountAmt) : null,
//         buyQty: type === 'BUY_X_GET_Y' ? parseInt(buyQty) : null,
//         getQty: type === 'BUY_X_GET_Y' ? parseInt(getQty) : null,
//         active
//       },
//       include: {
//         _count: {
//           select: {
//             products: true,
//             categories: true
//           }
//         }
//       }
//     });
    
//     res.status(201).json(newPromotion);
//   } catch (err) {
//     console.error('Error in createPromotion:', err);
//     res.status(500).json({ message: "Error creating promotion", error: err.message });
//   }
// };

// // 🟢 Update promotion
// export const updatePromotion = async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       type,
//       discountPct,
//       discountAmt,
//       buyQty,
//       getQty,
//       active
//     } = req.body;
    
//     // Check if promotion exists
//     const existingPromotion = await prisma.promotion.findUnique({
//       where: { id: req.params.id }
//     });
    
//     if (!existingPromotion) {
//       return res.status(404).json({ message: "Promotion not found" });
//     }
    
//     // Validate type if being updated
//     if (type && !['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'].includes(type)) {
//       return res.status(400).json({ 
//         message: "Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y" 
//       });
//     }
    
//     const finalType = type || existingPromotion.type;
    
//     // Validate type-specific fields
//     if (finalType === 'PERCENTAGE' && discountPct !== undefined) {
//       if (discountPct <= 0 || discountPct > 100) {
//         return res.status(400).json({ 
//           message: "Percentage discount must be between 0 and 100" 
//         });
//       }
//     }
    
//     if (finalType === 'FIXED_AMOUNT' && discountAmt !== undefined) {
//       if (discountAmt <= 0) {
//         return res.status(400).json({ 
//           message: "Fixed discount amount must be greater than 0" 
//         });
//       }
//     }
    
//     if (finalType === 'BUY_X_GET_Y') {
//       if (buyQty !== undefined && buyQty <= 0) {
//         return res.status(400).json({ 
//           message: "Buy quantity must be greater than 0" 
//         });
//       }
//       if (getQty !== undefined && getQty <= 0) {
//         return res.status(400).json({ 
//           message: "Get quantity must be greater than 0" 
//         });
//       }
//     }
    
//     const updatedPromotion = await prisma.promotion.update({
//       where: { id: req.params.id },
//       data: {
//         ...(name && { name: name.trim() }),
//         ...(description !== undefined && { description: description?.trim() || null }),
//         ...(type && { type }),
//         ...(discountPct !== undefined && { discountPct: parseFloat(discountPct) }),
//         ...(discountAmt !== undefined && { discountAmt: parseFloat(discountAmt) }),
//         ...(buyQty !== undefined && { buyQty: parseInt(buyQty) }),
//         ...(getQty !== undefined && { getQty: parseInt(getQty) }),
//         ...(active !== undefined && { active })
//       },
//       include: {
//         _count: {
//           select: {
//             products: true,
//             categories: true
//           }
//         }
//       }
//     });
    
//     res.json(updatedPromotion);
//   } catch (err) {
//     console.error('Error in updatePromotion:', err);
//     res.status(500).json({ message: "Error updating promotion", error: err.message });
//   }
// };

// // 🟢 Delete promotion
// export const deletePromotion = async (req, res) => {
//   try {
//     // Check if promotion exists
//     const promotion = await prisma.promotion.findUnique({
//       where: { id: req.params.id }
//     });

//     if (!promotion) {
//       return res.status(404).json({ message: "Promotion not found" });
//     }

//     // Delete promotion (Prisma will handle disconnecting relations)
//     await prisma.promotion.delete({
//       where: { id: req.params.id }
//     });
    
//     res.json({ message: "Promotion deleted successfully" });
//   } catch (err) {
//     console.error('Error in deletePromotion:', err);
//     res.status(500).json({ message: "Error deleting promotion", error: err.message });
//   }
// };

// // 🆕 Calculate promotion discount
// export const calculateDiscount = async (req, res) => {
//   try {
//     const { promotionId, originalPrice, quantity = 1 } = req.body;
    
//     if (!promotionId || !originalPrice) {
//       return res.status(400).json({ 
//         message: "Promotion ID and original price are required" 
//       });
//     }
    
//     const price = parseFloat(originalPrice);
//     const qty = parseInt(quantity);
    
//     if (price <= 0 || qty <= 0) {
//       return res.status(400).json({ 
//         message: "Price and quantity must be greater than 0" 
//       });
//     }
    
//     const promotion = await prisma.promotion.findUnique({
//       where: { id: promotionId }
//     });
    
//     if (!promotion) {
//       return res.status(404).json({ message: "Promotion not found" });
//     }
    
//     if (!promotion.active) {
//       return res.status(400).json({ message: "Promotion is not active" });
//     }
    
//     let discountAmount = 0;
//     let finalPrice = price;
//     let applicableQty = qty;
    
//     switch (promotion.type) {
//       case 'PERCENTAGE':
//         discountAmount = (price * qty * parseFloat(promotion.discountPct)) / 100;
//         finalPrice = price * qty - discountAmount;
//         break;
        
//       case 'FIXED_AMOUNT':
//         discountAmount = parseFloat(promotion.discountAmt) * qty;
//         finalPrice = price * qty - discountAmount;
//         // Ensure final price doesn't go negative
//         if (finalPrice < 0) finalPrice = 0;
//         break;
        
//       case 'BUY_X_GET_Y':
//         const buyQty = promotion.buyQty;
//         const getQty = promotion.getQty;
//         const sets = Math.floor(qty / (buyQty + getQty));
//         const freeItems = sets * getQty;
//         const paidItems = qty - freeItems;
//         discountAmount = freeItems * price;
//         finalPrice = paidItems * price;
//         applicableQty = paidItems;
//         break;
//     }
    
//     res.json({
//       promotion: {
//         id: promotion.id,
//         name: promotion.name,
//         type: promotion.type
//       },
//       originalPrice: parseFloat(price.toFixed(2)),
//       quantity: qty,
//       subtotal: parseFloat((price * qty).toFixed(2)),
//       discountAmount: parseFloat(discountAmount.toFixed(2)),
//       finalPrice: parseFloat(finalPrice.toFixed(2)),
//       savings: parseFloat(discountAmount.toFixed(2)),
//       ...(promotion.type === 'BUY_X_GET_Y' && {
//         buyQty: promotion.buyQty,
//         getQty: promotion.getQty,
//         paidItems: applicableQty,
//         freeItems: qty - applicableQty
//       })
//     });
//   } catch (err) {
//     console.error('Error in calculateDiscount:', err);
//     res.status(500).json({ message: "Error calculating discount", error: err.message });
//   }
// };

// // 🆕 Assign products to promotion
// export const assignProductsToPromotion = async (req, res) => {
//   try {
//     const { productIds } = req.body;
    
//     if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
//       return res.status(400).json({ message: "Product IDs array is required" });
//     }
    
//     // Validate promotion exists
//     const promotion = await prisma.promotion.findUnique({
//       where: { id: req.params.id }
//     });
    
//     if (!promotion) {
//       return res.status(404).json({ message: "Promotion not found" });
//     }
    
//     // Validate products exist
//     const products = await prisma.product.findMany({
//       where: { id: { in: productIds } }
//     });
    
//     if (products.length !== productIds.length) {
//       return res.status(400).json({ message: "Some products not found" });
//     }
    
//     // Connect products to promotion
//     await prisma.promotion.update({
//       where: { id: req.params.id },
//       data: {
//         products: {
//           connect: productIds.map(id => ({ id }))
//         }
//       }
//     });
    
//     res.json({ 
//       message: `Successfully assigned ${productIds.length} products to promotion "${promotion.name}"`,
//       assignedCount: productIds.length,
//       promotion: {
//         id: promotion.id,
//         name: promotion.name,
//         type: promotion.type
//       }
//     });
//   } catch (err) {
//     console.error('Error in assignProductsToPromotion:', err);
//     res.status(500).json({ message: "Error assigning products", error: err.message });
//   }
// };

// // 🆕 Assign categories to promotion
// export const assignCategoriesToPromotion = async (req, res) => {
//   try {
//     const { categoryIds } = req.body;
    
//     if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
//       return res.status(400).json({ message: "Category IDs array is required" });
//     }
    
//     // Validate promotion exists
//     const promotion = await prisma.promotion.findUnique({
//       where: { id: req.params.id }
//     });
    
//     if (!promotion) {
//       return res.status(404).json({ message: "Promotion not found" });
//     }
    
//     // Validate categories exist
//     const categories = await prisma.category.findMany({
//       where: { id: { in: categoryIds } }
//     });
    
//     if (categories.length !== categoryIds.length) {
//       return res.status(400).json({ message: "Some categories not found" });
//     }
    
//     // Connect categories to promotion
//     await prisma.promotion.update({
//       where: { id: req.params.id },
//       data: {
//         categories: {
//           connect: categoryIds.map(id => ({ id }))
//         }
//       }
//     });
    
//     res.json({ 
//       message: `Successfully assigned ${categoryIds.length} categories to promotion "${promotion.name}"`,
//       assignedCount: categoryIds.length,
//       promotion: {
//         id: promotion.id,
//         name: promotion.name,
//         type: promotion.type
//       }
//     });
//   } catch (err) {
//     console.error('Error in assignCategoriesToPromotion:', err);
//     res.status(500).json({ message: "Error assigning categories", error: err.message });
//   }
// };

// // 🆕 Get promotion products
// export const getPromotionProducts = async (req, res) => {
//   try {
//     const { active, branchId, page = 1, limit = 50 } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(limit);
    
//     const products = await prisma.product.findMany({
//       where: {
//         promotions: {
//           some: { id: req.params.id }
//         },
//         ...(active !== undefined && { active: active === 'true' }),
//         ...(branchId && { branchId })
//       },
//       include: {
//         branch: { select: { id: true, name: true } },
//         category: { select: { id: true, name: true } }
//       },
//       skip: parseInt(skip),
//       take: parseInt(limit),
//       orderBy: { name: 'asc' }
//     });
    
//     const total = await prisma.product.count({
//       where: {
//         promotions: {
//           some: { id: req.params.id }
//         },
//         ...(active !== undefined && { active: active === 'true' }),
//         ...(branchId && { branchId })
//       }
//     });
    
//     res.json({
//       products,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });
//   } catch (err) {
//     console.error('Error in getPromotionProducts:', err);
//     res.status(500).json({ message: "Error fetching promotion products", error: err.message });
//   }
// };

// controllers/promotions.controller.js
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();

const toInt = (v, fallback = 0) => {
  const n = parseInt(v);
  return Number.isNaN(n) ? fallback : n;
};

// -------------------------
// Get all promotions
// -------------------------
export const getAllPromotions = asyncHandler(async (req, res) => {
  const {
    include_relations = "false",
    type,
    active,
    search,
    page = 1,
    limit = 50
  } = req.query;

  const skip = (toInt(page, 1) - 1) * toInt(limit, 50);

  const where = {
    ...(type && { type }),
    ...(active !== undefined && { active: active === "true" }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ]
    })
  };

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      include:
        include_relations === "true"
          ? {
              products: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  priceGross: true,
                  active: true,
                  branch: { select: { id: true, name: true } }
                },
                take: 10,
                orderBy: { name: "asc" }
              },
              categories: {
                select: {
                  id: true,
                  name: true,
                  branch: { select: { id: true, name: true } }
                }
              },
              _count: { select: { products: true, categories: true } }
            }
          : { _count: { select: { products: true, categories: true } } },
      skip,
      take: toInt(limit, 50),
      orderBy: { createdAt: "desc" }
    }),
    prisma.promotion.count({ where })
  ]);

  logger.logDatabase("READ", {
    model: "Promotion",
    operation: "getAllPromotions",
    count: promotions.length,
    filters: { type, active, search },
    userId: req.user?.id
  });

  res.json({
    promotions,
    pagination: {
      page: toInt(page, 1),
      limit: toInt(limit, 50),
      total,
      pages: Math.ceil(total / toInt(limit, 50))
    }
  });
});

// -------------------------
// Get promotion by ID
// -------------------------
export const getPromotionById = asyncHandler(async (req, res) => {
  const { include_relations = "false" } = req.query;

  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id },
    include:
      include_relations === "true"
        ? {
            products: {
              select: {
                id: true,
                name: true,
                sku: true,
                priceGross: true,
                cost: true,
                active: true,
                branch: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } }
              },
              orderBy: { name: "asc" }
            },
            categories: {
              select: {
                id: true,
                name: true,
                branch: { select: { id: true, name: true } },
                _count: { select: { products: true } }
              }
            },
            _count: { select: { products: true, categories: true } }
          }
        : { _count: { select: { products: true, categories: true } } }
  });

  if (!promotion) {
    throw new NotFoundError("Promotion not found");
  }

  logger.logDatabase("READ", {
    model: "Promotion",
    operation: "getPromotionById",
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(promotion);
});

// -------------------------
// Create promotion
// -------------------------
export const createPromotion = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type = "PERCENTAGE",
    discountPct,
    discountAmt,
    buyQty,
    getQty,
    active = true
  } = req.body;

  if (!name || name.trim() === "") {
    throw new BadRequestError("Promotion name is required");
  }

  if (!["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y"].includes(type)) {
    throw new BadRequestError("Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y");
  }

  if (type === "PERCENTAGE") {
    if (discountPct === undefined || parseFloat(discountPct) <= 0 || parseFloat(discountPct) > 100) {
      throw new BadRequestError("Percentage discount must be between 0 and 100");
    }
  }

  if (type === "FIXED_AMOUNT") {
    if (discountAmt === undefined || parseFloat(discountAmt) <= 0) {
      throw new BadRequestError("Fixed discount amount must be greater than 0");
    }
  }

  if (type === "BUY_X_GET_Y") {
    if (buyQty === undefined || toInt(buyQty) <= 0 || getQty === undefined || toInt(getQty) <= 0) {
      throw new BadRequestError("Buy quantity and get quantity must be greater than 0 for BUY_X_GET_Y promotions");
    }
  }

  const newPromotion = await prisma.promotion.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      type,
      discountPct: type === "PERCENTAGE" ? parseFloat(discountPct) : null,
      discountAmt: type === "FIXED_AMOUNT" ? parseFloat(discountAmt) : null,
      buyQty: type === "BUY_X_GET_Y" ? toInt(buyQty) : null,
      getQty: type === "BUY_X_GET_Y" ? toInt(getQty) : null,
      active
    },
    include: {
      _count: { select: { products: true, categories: true } }
    }
  });

  logger.info({
    message: "Promotion created",
    promotionId: newPromotion.id,
    promotionName: newPromotion.name,
    type: newPromotion.type,
    active: newPromotion.active,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.status(201).json(newPromotion);
});

// -------------------------
// Update promotion
// -------------------------
export const updatePromotion = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type,
    discountPct,
    discountAmt,
    buyQty,
    getQty,
    active
  } = req.body;

  const existingPromotion = await prisma.promotion.findUnique({
    where: { id: req.params.id }
  });

  if (!existingPromotion) {
    throw new NotFoundError("Promotion not found");
  }

  if (type && !["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y"].includes(type)) {
    throw new BadRequestError("Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y");
  }

  const finalType = type || existingPromotion.type;

  if (finalType === "PERCENTAGE" && discountPct !== undefined) {
    if (parseFloat(discountPct) <= 0 || parseFloat(discountPct) > 100) {
      throw new BadRequestError("Percentage discount must be between 0 and 100");
    }
  }

  if (finalType === "FIXED_AMOUNT" && discountAmt !== undefined) {
    if (parseFloat(discountAmt) <= 0) {
      throw new BadRequestError("Fixed discount amount must be greater than 0");
    }
  }

  if (finalType === "BUY_X_GET_Y") {
    if (buyQty !== undefined && toInt(buyQty) <= 0) {
      throw new BadRequestError("Buy quantity must be greater than 0");
    }
    if (getQty !== undefined && toInt(getQty) <= 0) {
      throw new BadRequestError("Get quantity must be greater than 0");
    }
  }

  const updatedPromotion = await prisma.promotion.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(type && { type }),
      ...(discountPct !== undefined && { discountPct: parseFloat(discountPct) }),
      ...(discountAmt !== undefined && { discountAmt: parseFloat(discountAmt) }),
      ...(buyQty !== undefined && { buyQty: toInt(buyQty) }),
      ...(getQty !== undefined && { getQty: toInt(getQty) }),
      ...(active !== undefined && { active })
    },
    include: {
      _count: { select: { products: true, categories: true } }
    }
  });

  logger.info({
    message: "Promotion updated",
    promotionId: updatedPromotion.id,
    promotionName: updatedPromotion.name,
    userId: req.user?.id,
    userEmail: req.user?.email,
    changes: {
      name,
      type,
      discountPct,
      discountAmt,
      buyQty,
      getQty,
      active
    }
  });

  res.json(updatedPromotion);
});

// -------------------------
// Delete promotion (HARD DELETE)
// -------------------------
export const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true }
  });

  if (!promotion) {
    throw new NotFoundError("Promotion not found");
  }

  await prisma.promotion.delete({
    where: { id: req.params.id }
  });

  logger.warn({
    message: "Promotion deleted (hard delete)",
    promotionId: promotion.id,
    promotionName: promotion.name,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({ message: "Promotion deleted successfully" });
});

// -------------------------
// Calculate promotion discount
// -------------------------
export const calculateDiscount = asyncHandler(async (req, res) => {
  const { promotionId, originalPrice, quantity = 1 } = req.body;

  if (!promotionId || originalPrice === undefined) {
    throw new BadRequestError("Promotion ID and original price are required");
  }

  const price = parseFloat(originalPrice);
  const qty = toInt(quantity, 1);

  if (price <= 0 || qty <= 0) {
    throw new BadRequestError("Price and quantity must be greater than 0");
  }

  const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });

  if (!promotion) throw new NotFoundError("Promotion not found");
  if (!promotion.active) throw new BadRequestError("Promotion is not active");

  let discountAmount = 0;
  let finalPrice = price * qty;
  let applicableQty = qty;

  switch (promotion.type) {
    case "PERCENTAGE":
      discountAmount = (price * qty * parseFloat(promotion.discountPct)) / 100;
      finalPrice = price * qty - discountAmount;
      break;

    case "FIXED_AMOUNT":
      discountAmount = parseFloat(promotion.discountAmt) * qty;
      finalPrice = price * qty - discountAmount;
      if (finalPrice < 0) finalPrice = 0;
      break;

    case "BUY_X_GET_Y": {
      const buy = promotion.buyQty;
      const get = promotion.getQty;
      const setSize = buy + get;
      // sets = floor(qty / setSize)
      const sets = Math.floor(qty / setSize);
      const freeItems = sets * get;
      const paidItems = qty - freeItems;
      discountAmount = freeItems * price;
      finalPrice = paidItems * price;
      applicableQty = paidItems;
      break;
    }
    default:
      break;
  }

  logger.info({
    message: "Promotion discount calculated",
    promotionId: promotion.id,
    promotionName: promotion.name,
    type: promotion.type,
    originalPrice: parseFloat(price.toFixed(2)),
    quantity: qty,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type },
    originalPrice: parseFloat(price.toFixed(2)),
    quantity: qty,
    subtotal: parseFloat((price * qty).toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    savings: parseFloat(discountAmount.toFixed(2)),
    ...(promotion.type === "BUY_X_GET_Y" && {
      buyQty: promotion.buyQty,
      getQty: promotion.getQty,
      paidItems: applicableQty,
      freeItems: qty - applicableQty
    })
  });
});

// -------------------------
// Assign products to promotion
// -------------------------
export const assignProductsToPromotion = asyncHandler(async (req, res) => {
  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new BadRequestError("Product IDs array is required");
  }

  const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!promotion) throw new NotFoundError("Promotion not found");

  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    throw new BadRequestError("Some products not found");
  }

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: {
      products: {
        connect: productIds.map((id) => ({ id }))
      }
    }
  });

  logger.info({
    message: "Products assigned to promotion",
    promotionId: promotion.id,
    promotionName: promotion.name,
    assignedCount: productIds.length,
    productIdsCount: productIds.length,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully assigned ${productIds.length} products to promotion "${promotion.name}"`,
    assignedCount: productIds.length,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

// -------------------------
// Assign categories to promotion
// -------------------------
export const assignCategoriesToPromotion = asyncHandler(async (req, res) => {
  const { categoryIds } = req.body;

  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new BadRequestError("Category IDs array is required");
  }

  const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
  if (!promotion) throw new NotFoundError("Promotion not found");

  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  if (categories.length !== categoryIds.length) {
    throw new BadRequestError("Some categories not found");
  }

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: {
      categories: {
        connect: categoryIds.map((id) => ({ id }))
      }
    }
  });

  logger.info({
    message: "Categories assigned to promotion",
    promotionId: promotion.id,
    promotionName: promotion.name,
    assignedCount: categoryIds.length,
    categoryIdsCount: categoryIds.length,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully assigned ${categoryIds.length} categories to promotion "${promotion.name}"`,
    assignedCount: categoryIds.length,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

// -------------------------
// Get promotion products
// -------------------------
export const getPromotionProducts = asyncHandler(async (req, res) => {
  const { active, branchId, page = 1, limit = 50 } = req.query;
  const skip = (toInt(page, 1) - 1) * toInt(limit, 50);

  const baseWhere = {
    promotions: { some: { id: req.params.id } },
    ...(active !== undefined && { active: active === "true" }),
    ...(branchId && { branchId })
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: baseWhere,
      include: {
        branch: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } }
      },
      skip,
      take: toInt(limit, 50),
      orderBy: { name: "asc" }
    }),
    prisma.product.count({ where: baseWhere })
  ]);

  logger.logDatabase("READ", {
    model: "Product",
    operation: "getPromotionProducts",
    promotionId: req.params.id,
    count: products.length,
    filters: { active, branchId },
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
