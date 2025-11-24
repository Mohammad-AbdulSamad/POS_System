
// // controllers/promotions.controller.js
// import { PrismaClient } from "@prisma/client";
// import asyncHandler from "../middleware/asyncHandler.middleware.js";
// import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
// import logger from "../config/logger.config.js";
// import promotionService from "../services/promotions.service.js";

// const prisma = new PrismaClient();

// const toInt = (v, fallback = 0) => {
//   const n = parseInt(v);
//   return Number.isNaN(n) ? fallback : n;
// };

// // -------------------------
// // Get all promotions
// // -------------------------
// export const getAllPromotions = asyncHandler(async (req, res) => {
//   const {
//     include_relations = "false",
//     type,
//     active,
//     search,
//     page = 1,
//     limit = 50
//   } = req.query;

//   const skip = (toInt(page, 1) - 1) * toInt(limit, 50);

//   const where = {
//     ...(type && { type }),
//     ...(active !== undefined && { active: active === "true" }),
//     ...(search && {
//       OR: [
//         { name: { contains: search, mode: "insensitive" } },
//         { description: { contains: search, mode: "insensitive" } }
//       ]
//     })
//   };

//   const [promotions, total] = await Promise.all([
//     prisma.promotion.findMany({
//       where,
//       include:
//         include_relations === "true"
//           ? {
//               products: {
//                 select: {
//                   id: true,
//                   name: true,
//                   sku: true,
//                   priceGross: true,
//                   active: true,
//                   branch: { select: { id: true, name: true } }
//                 },
//                 take: 10,
//                 orderBy: { name: "asc" }
//               },
//               categories: {
//                 select: {
//                   id: true,
//                   name: true,
//                   branch: { select: { id: true, name: true } }
//                 }
//               },
//               _count: { select: { products: true, categories: true } }
//             }
//           : { _count: { select: { products: true, categories: true } } },
//       skip,
//       take: toInt(limit, 50),
//       orderBy: { createdAt: "desc" }
//     }),
//     prisma.promotion.count({ where })
//   ]);

//   logger.logDatabase("READ", {
//     model: "Promotion",
//     operation: "getAllPromotions",
//     count: promotions.length,
//     filters: { type, active, search },
//     userId: req.user?.id
//   });

//   res.json({
//     promotions,
//     pagination: {
//       page: toInt(page, 1),
//       limit: toInt(limit, 50),
//       total,
//       pages: Math.ceil(total / toInt(limit, 50))
//     }
//   });
// });

// // -------------------------
// // Get promotion by ID
// // -------------------------
// export const getPromotionById = asyncHandler(async (req, res) => {
//   const { include_relations = "false" } = req.query;

//   const promotion = await prisma.promotion.findUnique({
//     where: { id: req.params.id },
//     include:
//       include_relations === "true"
//         ? {
//             products: {
//               select: {
//                 id: true,
//                 name: true,
//                 sku: true,
//                 priceGross: true,
//                 cost: true,
//                 active: true,
//                 branch: { select: { id: true, name: true } },
//                 category: { select: { id: true, name: true } }
//               },
//               orderBy: { name: "asc" }
//             },
//             categories: {
//               select: {
//                 id: true,
//                 name: true,
//                 branch: { select: { id: true, name: true } },
//                 _count: { select: { products: true } }
//               }
//             },
//             _count: { select: { products: true, categories: true } }
//           }
//         : { _count: { select: { products: true, categories: true } } }
//   });

//   if (!promotion) {
//     throw new NotFoundError("Promotion not found");
//   }

//   logger.logDatabase("READ", {
//     model: "Promotion",
//     operation: "getPromotionById",
//     id: req.params.id,
//     userId: req.user?.id
//   });

//   res.json(promotion);
// });

// // -------------------------
// // Create promotion
// // -------------------------
// export const createPromotion = asyncHandler(async (req, res) => {
//   const {
//     name,
//     description,
//     type = "PERCENTAGE",
//     discountPct,
//     discountAmt,
//     buyQty,
//     getQty,
//     active = true
//   } = req.body;

//   if (!name || name.trim() === "") {
//     throw new BadRequestError("Promotion name is required");
//   }

//   if (!["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y"].includes(type)) {
//     throw new BadRequestError("Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y");
//   }

//   if (type === "PERCENTAGE") {
//     if (discountPct === undefined || parseFloat(discountPct) <= 0 || parseFloat(discountPct) > 100) {
//       throw new BadRequestError("Percentage discount must be between 0 and 100");
//     }
//   }

//   if (type === "FIXED_AMOUNT") {
//     if (discountAmt === undefined || parseFloat(discountAmt) <= 0) {
//       throw new BadRequestError("Fixed discount amount must be greater than 0");
//     }
//   }

//   if (type === "BUY_X_GET_Y") {
//     if (buyQty === undefined || toInt(buyQty) <= 0 || getQty === undefined || toInt(getQty) <= 0) {
//       throw new BadRequestError("Buy quantity and get quantity must be greater than 0 for BUY_X_GET_Y promotions");
//     }
//   }

//   const newPromotion = await prisma.promotion.create({
//     data: {
//       name: name.trim(),
//       description: description?.trim() || null,
//       type,
//       discountPct: type === "PERCENTAGE" ? parseFloat(discountPct) : null,
//       discountAmt: type === "FIXED_AMOUNT" ? parseFloat(discountAmt) : null,
//       buyQty: type === "BUY_X_GET_Y" ? toInt(buyQty) : null,
//       getQty: type === "BUY_X_GET_Y" ? toInt(getQty) : null,
//       active
//     },
//     include: {
//       _count: { select: { products: true, categories: true } }
//     }
//   });

//   logger.info({
//     message: "Promotion created",
//     promotionId: newPromotion.id,
//     promotionName: newPromotion.name,
//     type: newPromotion.type,
//     active: newPromotion.active,
//     userId: req.user?.id,
//     userEmail: req.user?.email
//   });

//   res.status(201).json(newPromotion);
// });

// // -------------------------
// // Update promotion
// // -------------------------
// export const updatePromotion = asyncHandler(async (req, res) => {
//   const {
//     name,
//     description,
//     type,
//     discountPct,
//     discountAmt,
//     buyQty,
//     getQty,
//     active
//   } = req.body;

//   const existingPromotion = await prisma.promotion.findUnique({
//     where: { id: req.params.id }
//   });

//   if (!existingPromotion) {
//     throw new NotFoundError("Promotion not found");
//   }

//   if (type && !["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y"].includes(type)) {
//     throw new BadRequestError("Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y");
//   }

//   const finalType = type || existingPromotion.type;

//   if (finalType === "PERCENTAGE" && discountPct !== undefined) {
//     if (parseFloat(discountPct) <= 0 || parseFloat(discountPct) > 100) {
//       throw new BadRequestError("Percentage discount must be between 0 and 100");
//     }
//   }

//   if (finalType === "FIXED_AMOUNT" && discountAmt !== undefined) {
//     if (parseFloat(discountAmt) <= 0) {
//       throw new BadRequestError("Fixed discount amount must be greater than 0");
//     }
//   }

//   if (finalType === "BUY_X_GET_Y") {
//     if (buyQty !== undefined && toInt(buyQty) <= 0) {
//       throw new BadRequestError("Buy quantity must be greater than 0");
//     }
//     if (getQty !== undefined && toInt(getQty) <= 0) {
//       throw new BadRequestError("Get quantity must be greater than 0");
//     }
//   }

//   const updatedPromotion = await prisma.promotion.update({
//     where: { id: req.params.id },
//     data: {
//       ...(name && { name: name.trim() }),
//       ...(description !== undefined && { description: description?.trim() || null }),
//       ...(type && { type }),
//       ...(discountPct !== undefined && { discountPct: parseFloat(discountPct) }),
//       ...(discountAmt !== undefined && { discountAmt: parseFloat(discountAmt) }),
//       ...(buyQty !== undefined && { buyQty: toInt(buyQty) }),
//       ...(getQty !== undefined && { getQty: toInt(getQty) }),
//       ...(active !== undefined && { active })
//     },
//     include: {
//       _count: { select: { products: true, categories: true } }
//     }
//   });

//   logger.info({
//     message: "Promotion updated",
//     promotionId: updatedPromotion.id,
//     promotionName: updatedPromotion.name,
//     userId: req.user?.id,
//     userEmail: req.user?.email,
//     changes: {
//       name,
//       type,
//       discountPct,
//       discountAmt,
//       buyQty,
//       getQty,
//       active
//     }
//   });

//   res.json(updatedPromotion);
// });

// // -------------------------
// // Delete promotion (HARD DELETE)
// // -------------------------
// export const deletePromotion = asyncHandler(async (req, res) => {
//   const promotion = await prisma.promotion.findUnique({
//     where: { id: req.params.id },
//     select: { id: true, name: true }
//   });

//   if (!promotion) {
//     throw new NotFoundError("Promotion not found");
//   }

//   await prisma.promotion.delete({
//     where: { id: req.params.id }
//   });

//   logger.warn({
//     message: "Promotion deleted (hard delete)",
//     promotionId: promotion.id,
//     promotionName: promotion.name,
//     userId: req.user?.id,
//     userEmail: req.user?.email
//   });

//   res.json({ message: "Promotion deleted successfully" });
// });

// // -------------------------
// // Calculate promotion discount
// // -------------------------
// export const calculateDiscount = asyncHandler(async (req, res) => {
//   const { promotionId, originalPrice, quantity = 1 } = req.body;

//   if (!promotionId || originalPrice === undefined) {
//     throw new BadRequestError("Promotion ID and original price are required");
//   }

//   const price = parseFloat(originalPrice);
//   const qty = toInt(quantity, 1);

//   if (price <= 0 || qty <= 0) {
//     throw new BadRequestError("Price and quantity must be greater than 0");
//   }

//   const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });

//   if (!promotion) throw new NotFoundError("Promotion not found");
//   if (!promotion.active) throw new BadRequestError("Promotion is not active");

//   let discountAmount = 0;
//   let finalPrice = price * qty;
//   let applicableQty = qty;

//   switch (promotion.type) {
//     case "PERCENTAGE":
//       discountAmount = (price * qty * parseFloat(promotion.discountPct)) / 100;
//       finalPrice = price * qty - discountAmount;
//       break;

//     case "FIXED_AMOUNT":
//       discountAmount = parseFloat(promotion.discountAmt) * qty;
//       finalPrice = price * qty - discountAmount;
//       if (finalPrice < 0) finalPrice = 0;
//       break;

//     case "BUY_X_GET_Y": {
//       const buy = promotion.buyQty;
//       const get = promotion.getQty;
//       const setSize = buy + get;
//       // sets = floor(qty / setSize)
//       const sets = Math.floor(qty / setSize);
//       const freeItems = sets * get;
//       const paidItems = qty - freeItems;
//       discountAmount = freeItems * price;
//       finalPrice = paidItems * price;
//       applicableQty = paidItems;
//       break;
//     }
//     default:
//       break;
//   }

//   logger.info({
//     message: "Promotion discount calculated",
//     promotionId: promotion.id,
//     promotionName: promotion.name,
//     type: promotion.type,
//     originalPrice: parseFloat(price.toFixed(2)),
//     quantity: qty,
//     discountAmount: parseFloat(discountAmount.toFixed(2)),
//     finalPrice: parseFloat(finalPrice.toFixed(2)),
//     userId: req.user?.id,
//     userEmail: req.user?.email
//   });

//   res.json({
//     promotion: { id: promotion.id, name: promotion.name, type: promotion.type },
//     originalPrice: parseFloat(price.toFixed(2)),
//     quantity: qty,
//     subtotal: parseFloat((price * qty).toFixed(2)),
//     discountAmount: parseFloat(discountAmount.toFixed(2)),
//     finalPrice: parseFloat(finalPrice.toFixed(2)),
//     savings: parseFloat(discountAmount.toFixed(2)),
//     ...(promotion.type === "BUY_X_GET_Y" && {
//       buyQty: promotion.buyQty,
//       getQty: promotion.getQty,
//       paidItems: applicableQty,
//       freeItems: qty - applicableQty
//     })
//   });
// });

// // -------------------------
// // Assign products to promotion
// // -------------------------
// export const assignProductsToPromotion = asyncHandler(async (req, res) => {
//   const { productIds } = req.body;

//   if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
//     throw new BadRequestError("Product IDs array is required");
//   }

//   const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
//   if (!promotion) throw new NotFoundError("Promotion not found");

//   const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
//   if (products.length !== productIds.length) {
//     throw new BadRequestError("Some products not found");
//   }

//   await prisma.promotion.update({
//     where: { id: req.params.id },
//     data: {
//       products: {
//         connect: productIds.map((id) => ({ id }))
//       }
//     }
//   });

//   logger.info({
//     message: "Products assigned to promotion",
//     promotionId: promotion.id,
//     promotionName: promotion.name,
//     assignedCount: productIds.length,
//     productIdsCount: productIds.length,
//     userId: req.user?.id,
//     userEmail: req.user?.email
//   });

//   res.json({
//     message: `Successfully assigned ${productIds.length} products to promotion "${promotion.name}"`,
//     assignedCount: productIds.length,
//     promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
//   });
// });

// // -------------------------
// // Assign categories to promotion
// // -------------------------
// export const assignCategoriesToPromotion = asyncHandler(async (req, res) => {
//   const { categoryIds } = req.body;

//   if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
//     throw new BadRequestError("Category IDs array is required");
//   }

//   const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
//   if (!promotion) throw new NotFoundError("Promotion not found");

//   const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
//   if (categories.length !== categoryIds.length) {
//     throw new BadRequestError("Some categories not found");
//   }

//   await prisma.promotion.update({
//     where: { id: req.params.id },
//     data: {
//       categories: {
//         connect: categoryIds.map((id) => ({ id }))
//       }
//     }
//   });

//   logger.info({
//     message: "Categories assigned to promotion",
//     promotionId: promotion.id,
//     promotionName: promotion.name,
//     assignedCount: categoryIds.length,
//     categoryIdsCount: categoryIds.length,
//     userId: req.user?.id,
//     userEmail: req.user?.email
//   });

//   res.json({
//     message: `Successfully assigned ${categoryIds.length} categories to promotion "${promotion.name}"`,
//     assignedCount: categoryIds.length,
//     promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
//   });
// });

// // -------------------------
// // Get promotion products
// // -------------------------
// export const getPromotionProducts = asyncHandler(async (req, res) => {
//   const { active, branchId, page = 1, limit = 50 } = req.query;
//   const skip = (toInt(page, 1) - 1) * toInt(limit, 50);

//   const baseWhere = {
//     promotions: { some: { id: req.params.id } },
//     ...(active !== undefined && { active: active === "true" }),
//     ...(branchId && { branchId })
//   };

//   const [products, total] = await Promise.all([
//     prisma.product.findMany({
//       where: baseWhere,
//       include: {
//         branch: { select: { id: true, name: true } },
//         category: { select: { id: true, name: true } }
//       },
//       skip,
//       take: toInt(limit, 50),
//       orderBy: { name: "asc" }
//     }),
//     prisma.product.count({ where: baseWhere })
//   ]);

//   logger.logDatabase("READ", {
//     model: "Product",
//     operation: "getPromotionProducts",
//     promotionId: req.params.id,
//     count: products.length,
//     filters: { active, branchId },
//     userId: req.user?.id
//   });

//   res.json({
//     products,
//     pagination: {
//       page: toInt(page, 1),
//       limit: toInt(limit, 50),
//       total,
//       pages: Math.ceil(total / toInt(limit, 50))
//     }
//   });
// });



// /**
//  * 🆕 Get applicable promotions for a specific product
//  * GET /api/promotions/applicable/:productId
//  * Query params: ?branchId=xxx (optional)
//  */
// export const getApplicablePromotionsForProduct = asyncHandler(async (req, res) => {
//   const { productId } = req.params;
//   const { branchId } = req.query;

//   const promotions = await promotionService.getApplicablePromotions(productId, branchId);

//   logger.logDatabase('READ', {
//     model: 'Promotion',
//     operation: 'getApplicablePromotionsForProduct',
//     productId,
//     count: promotions.length,
//     userId: req.user?.id
//   });

//   res.json({
//     productId,
//     promotions,
//     count: promotions.length
//   });
// });



// /**
//  * 🆕 Calculate best promotion for a product
//  * POST /api/promotions/calculate-best
//  * Body: { productId, unitPrice, quantity }
//  */
// export const calculateBestPromotion = asyncHandler(async (req, res) => {
//   const { productId, unitPrice, quantity = 1 } = req.body;

//   if (!productId || !unitPrice) {
//     throw new BadRequestError("productId and unitPrice are required");
//   }

//   // Get all applicable promotions
//   const promotions = await promotionService.getApplicablePromotions(productId);

//   if (promotions.length === 0) {
//     return res.json({
//       hasPromotion: false,
//       message: "No promotions available for this product"
//     });
//   }

//   // Select best promotion
//   const best = promotionService.selectBestPromotion(promotions, unitPrice, quantity);

//   if (!best || best.savings === 0) {
//     return res.json({
//       hasPromotion: false,
//       message: "No beneficial promotions found"
//     });
//   }

//   // Get full details
//   const details = await promotionService.calculatePromotionDiscount(
//     best.promotion.id,
//     unitPrice,
//     quantity
//   );

//   logger.info({
//     message: 'Best promotion calculated',
//     productId,
//     promotionId: best.promotion.id,
//     promotionName: best.promotion.name,
//     savings: best.savings,
//     userId: req.user?.id
//   });

//   res.json({
//     hasPromotion: true,
//     ...details
//   });
// });

// /**
//  * 🆕 Apply promotions to entire cart
//  * POST /api/promotions/apply-to-cart
//  * Body: { items: [{ productId, unitPrice, qty, ... }] }
//  */
// export const applyPromotionsToCart = asyncHandler(async (req, res) => {
//   const { items } = req.body;

//   if (!items || !Array.isArray(items) || items.length === 0) {
//     throw new BadRequestError("Items array is required");
//   }

//   const processedItems = await promotionService.applyPromotionsToCart(items);

//   // Calculate totals
//   const summary = {
//     itemCount: processedItems.length,
//     totalOriginal: processedItems.reduce((sum, item) => 
//       sum + (item.unitPrice * item.qty), 0
//     ),
//     totalDiscount: processedItems.reduce((sum, item) => 
//       sum + (item.discount || 0), 0
//     ),
//     totalFinal: processedItems.reduce((sum, item) => 
//       sum + item.lineTotal, 0
//     ),
//     promotionsApplied: processedItems.filter(item => item.promotionId).length
//   };

//   logger.info({
//     message: 'Promotions applied to cart',
//     itemCount: summary.itemCount,
//     promotionsApplied: summary.promotionsApplied,
//     totalDiscount: summary.totalDiscount,
//     userId: req.user?.id
//   });

//   res.json({
//     items: processedItems,
//     summary
//   });
// });

// /**
//  * 🆕 Validate cart promotions before checkout
//  * POST /api/promotions/validate-cart
//  * Body: { items: [{ productId, unitPrice, qty, promotionId, discount, ... }] }
//  */
// export const validateCartPromotions = asyncHandler(async (req, res) => {
//   const { items } = req.body;

//   if (!items || !Array.isArray(items)) {
//     throw new BadRequestError("Items array is required");
//   }

//   const validationResults = [];
//   let allValid = true;

//   for (const item of items) {
//     try {
//       await promotionService.validatePromotionAtCheckout(item);
//       validationResults.push({
//         productId: item.productId,
//         valid: true,
//         promotionId: item.promotionId
//       });
//     } catch (error) {
//       allValid = false;
//       validationResults.push({
//         productId: item.productId,
//         valid: false,
//         promotionId: item.promotionId,
//         error: error.message
//       });
//     }
//   }

//   logger.info({
//     message: 'Cart promotions validated',
//     totalItems: items.length,
//     allValid,
//     userId: req.user?.id
//   });

//   res.json({
//     valid: allValid,
//     results: validationResults,
//     message: allValid 
//       ? "All promotions are valid" 
//       : "Some promotions are invalid. Please refresh cart."
//   });
// });

// /**
//  * 🆕 Get promotion statistics
//  * GET /api/promotions/:id/stats
//  */
// export const getPromotionStats = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const { startDate, endDate } = req.query;

//   const where = {
//     promotionId: id,
//     ...(startDate && endDate && {
//       transaction: {
//         createdAt: {
//           gte: new Date(startDate),
//           lte: new Date(endDate)
//         }
//       }
//     })
//   };

//   const [
//     usageCount,
//     totalDiscount,
//     transactionLines
//   ] = await Promise.all([
//     prisma.transactionLine.count({ where }),
//     prisma.transactionLine.aggregate({
//       where,
//       _sum: { discount: true }
//     }),
//     prisma.transactionLine.findMany({
//       where,
//       select: {
//         discount: true,
//         qty: true,
//         transaction: {
//           select: {
//             createdAt: true,
//             branch: { select: { name: true } }
//           }
//         }
//       },
//       take: 100,
//       orderBy: { transaction: { createdAt: 'desc' } }
//     })
//   ]);

//   res.json({
//     promotionId: id,
//     stats: {
//       usageCount,
//       totalDiscount: totalDiscount._sum.discount || 0,
//       averageDiscount: usageCount > 0 
//         ? (totalDiscount._sum.discount / usageCount) 
//         : 0
//     },
//     recentUsage: transactionLines
//   });
// });




////////////////////////////////
// controllers/promotions.controller.js
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";
import promotionService from "../services/promotions.service.js";

const prisma = new PrismaClient();

const toInt = (v, fallback = 0) => {
  const n = parseInt(v);
  return Number.isNaN(n) ? fallback : n;
};

const toDecimal = (v, fallback = 0) => {
  const n = parseFloat(v);
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
    branchId,
    scope,
    page = 1,
    limit = 50
  } = req.query;

  const skip = (toInt(page, 1) - 1) * toInt(limit, 50);

  const where = {
    ...(type && { type }),
    ...(active !== undefined && { active: active === "true" }),
    ...(scope && { scope }),
    ...(branchId && {
      OR: [
        { branches: { none: {} } }, // Applies to all branches
        { branches: { some: { id: branchId } } }
      ]
    }),
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
                },
                take: 10
              },
              branches: {
                select: {
                  id: true,
                  name: true,
                  address: true
                }
              },
              _count: { 
                select: { 
                  products: true, 
                  categories: true,
                  branches: true,
                  transactionLines: true
                } 
              }
            }
          : { 
              _count: { 
                select: { 
                  products: true, 
                  categories: true,
                  branches: true,
                  transactionLines: true
                } 
              } 
            },
      skip,
      take: toInt(limit, 50),
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ]
    }),
    prisma.promotion.count({ where })
  ]);

  logger.logDatabase("READ", {
    model: "Promotion",
    operation: "getAllPromotions",
    count: promotions.length,
    filters: { type, active, search, branchId, scope },
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
            branches: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true
              }
            },
            _count: { 
              select: { 
                products: true, 
                categories: true,
                branches: true,
                transactionLines: true
              } 
            }
          }
        : { 
            _count: { 
              select: { 
                products: true, 
                categories: true,
                branches: true,
                transactionLines: true
              } 
            } 
          }
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
    scope = "PRODUCT",
    priority = 0,
    discountPct,
    discountAmt,
    buyQty,
    getQty,
    active = true,
    productIds = [],
    categoryIds = [],
    branchIds = [] // Empty array = applies to all branches
  } = req.body;

  // Validation
  if (!name || name.trim() === "") {
    throw new BadRequestError("Promotion name is required");
  }

  if (!["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y"].includes(type)) {
    throw new BadRequestError("Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y");
  }

  if (!["PRODUCT", "CATEGORY"].includes(scope)) {
    throw new BadRequestError("Scope must be PRODUCT or CATEGORY");
  }

  // Type-specific validation
  if (type === "PERCENTAGE") {
    if (discountPct === undefined || toDecimal(discountPct) <= 0 || toDecimal(discountPct) > 100) {
      throw new BadRequestError("Percentage discount must be between 0 and 100");
    }
  }

  if (type === "FIXED_AMOUNT") {
    if (discountAmt === undefined || toDecimal(discountAmt) <= 0) {
      throw new BadRequestError("Fixed discount amount must be greater than 0");
    }
  }

  if (type === "BUY_X_GET_Y") {
    if (!buyQty || toInt(buyQty) <= 0 || !getQty || toInt(getQty) <= 0) {
      throw new BadRequestError("Buy quantity and get quantity must be greater than 0 for BUY_X_GET_Y promotions");
    }
  }

  // Scope-specific validation
  if (scope === "PRODUCT" && (!productIds || productIds.length === 0)) {
    throw new BadRequestError("At least one product must be selected for PRODUCT scope promotions");
  }

  if (scope === "CATEGORY" && (!categoryIds || categoryIds.length === 0)) {
    throw new BadRequestError("At least one category must be selected for CATEGORY scope promotions");
  }

  // Validate branch IDs if provided
  if (branchIds.length > 0) {
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true }
    });
    
    if (branches.length !== branchIds.length) {
      throw new BadRequestError("Some branch IDs are invalid");
    }
  }

  // Validate product IDs
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });
    
    if (products.length !== productIds.length) {
      throw new BadRequestError("Some product IDs are invalid");
    }
  }

  // Validate category IDs
  if (categoryIds.length > 0) {
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true }
    });
    
    if (categories.length !== categoryIds.length) {
      throw new BadRequestError("Some category IDs are invalid");
    }
  }

  const newPromotion = await prisma.promotion.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      type,
      scope,
      priority: toInt(priority, 0),
      discountPct: type === "PERCENTAGE" ? toDecimal(discountPct) : null,
      discountAmt: type === "FIXED_AMOUNT" ? toDecimal(discountAmt) : null,
      buyQty: type === "BUY_X_GET_Y" ? toInt(buyQty) : null,
      getQty: type === "BUY_X_GET_Y" ? toInt(getQty) : null,
      active,
      ...(productIds.length > 0 && {
        products: {
          connect: productIds.map(id => ({ id }))
        }
      }),
      ...(categoryIds.length > 0 && {
        categories: {
          connect: categoryIds.map(id => ({ id }))
        }
      }),
      ...(branchIds.length > 0 && {
        branches: {
          connect: branchIds.map(id => ({ id }))
        }
      })
    },
    include: {
      _count: { 
        select: { 
          products: true, 
          categories: true,
          branches: true
        } 
      },
      branches: {
        select: { id: true, name: true }
      }
    }
  });

  logger.info({
    message: "Promotion created",
    promotionId: newPromotion.id,
    promotionName: newPromotion.name,
    type: newPromotion.type,
    scope: newPromotion.scope,
    priority: newPromotion.priority,
    active: newPromotion.active,
    branchCount: branchIds.length,
    productCount: productIds.length,
    categoryCount: categoryIds.length,
    appliesTo: branchIds.length === 0 ? "ALL_BRANCHES" : "SPECIFIC_BRANCHES",
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
    scope,
    priority,
    discountPct,
    discountAmt,
    buyQty,
    getQty,
    active
  } = req.body;

  const existingPromotion = await prisma.promotion.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { transactionLines: true } }
    }
  });

  if (!existingPromotion) {
    throw new NotFoundError("Promotion not found");
  }

  // Prevent changing critical fields if promotion has been used
  if (existingPromotion._count.transactionLines > 0) {
    if (type && type !== existingPromotion.type) {
      throw new BadRequestError(
        "Cannot change promotion type after it has been used in transactions"
      );
    }
    if (scope && scope !== existingPromotion.scope) {
      throw new BadRequestError(
        "Cannot change promotion scope after it has been used in transactions"
      );
    }
  }

  if (type && !["PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y"].includes(type)) {
    throw new BadRequestError("Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y");
  }

  if (scope && !["PRODUCT", "CATEGORY"].includes(scope)) {
    throw new BadRequestError("Scope must be PRODUCT or CATEGORY");
  }

  const finalType = type || existingPromotion.type;

  // Type-specific validation
  if (finalType === "PERCENTAGE" && discountPct !== undefined) {
    if (toDecimal(discountPct) <= 0 || toDecimal(discountPct) > 100) {
      throw new BadRequestError("Percentage discount must be between 0 and 100");
    }
  }

  if (finalType === "FIXED_AMOUNT" && discountAmt !== undefined) {
    if (toDecimal(discountAmt) <= 0) {
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

  const updateData = {
    ...(name && { name: name.trim() }),
    ...(description !== undefined && { description: description?.trim() || null }),
    ...(type && { type }),
    ...(scope && { scope }),
    ...(priority !== undefined && { priority: toInt(priority, 0) }),
    ...(active !== undefined && { active })
  };

  // Update discount values based on type
  if (finalType === "PERCENTAGE") {
    if (discountPct !== undefined) {
      updateData.discountPct = toDecimal(discountPct);
    }
    // Clear other fields
    updateData.discountAmt = null;
    updateData.buyQty = null;
    updateData.getQty = null;
  } else if (finalType === "FIXED_AMOUNT") {
    if (discountAmt !== undefined) {
      updateData.discountAmt = toDecimal(discountAmt);
    }
    // Clear other fields
    updateData.discountPct = null;
    updateData.buyQty = null;
    updateData.getQty = null;
  } else if (finalType === "BUY_X_GET_Y") {
    if (buyQty !== undefined) {
      updateData.buyQty = toInt(buyQty);
    }
    if (getQty !== undefined) {
      updateData.getQty = toInt(getQty);
    }
    // Clear other fields
    updateData.discountPct = null;
    updateData.discountAmt = null;
  }

  const updatedPromotion = await prisma.promotion.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      _count: { 
        select: { 
          products: true, 
          categories: true,
          branches: true,
          transactionLines: true
        } 
      },
      branches: {
        select: { id: true, name: true }
      }
    }
  });

  logger.info({
    message: "Promotion updated",
    promotionId: updatedPromotion.id,
    promotionName: updatedPromotion.name,
    userId: req.user?.id,
    userEmail: req.user?.email,
    changes: Object.keys(updateData)
  });

  res.json(updatedPromotion);
});

// -------------------------
// Delete promotion (HARD DELETE)
// -------------------------
export const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id },
    select: { 
      id: true, 
      name: true,
      _count: { select: { transactionLines: true } }
    }
  });

  if (!promotion) {
    throw new NotFoundError("Promotion not found");
  }

  // Prevent deletion if promotion has been used
  if (promotion._count.transactionLines > 0) {
    throw new BadRequestError(
      `Cannot delete promotion "${promotion.name}" because it has been used in ${promotion._count.transactionLines} transaction(s). Consider deactivating it instead.`
    );
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
// Assign/Update products to promotion
// -------------------------
export const assignProductsToPromotion = asyncHandler(async (req, res) => {
  const { productIds, replace = false } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new BadRequestError("Product IDs array is required");
  }

  const promotion = await prisma.promotion.findUnique({ 
    where: { id: req.params.id },
    include: {
      _count: { select: { products: true } }
    }
  });
  
  if (!promotion) throw new NotFoundError("Promotion not found");

  if (promotion.scope !== "PRODUCT") {
    throw new BadRequestError("Can only assign products to PRODUCT scope promotions");
  }

  const products = await prisma.product.findMany({ 
    where: { id: { in: productIds } },
    select: { id: true, name: true, branchId: true }
  });
  
  if (products.length !== productIds.length) {
    throw new BadRequestError("Some products not found");
  }

  const updateData = replace
    ? {
        products: {
          set: [], // Clear existing
          connect: productIds.map((id) => ({ id }))
        }
      }
    : {
        products: {
          connect: productIds.map((id) => ({ id }))
        }
      };

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: updateData
  });

  logger.info({
    message: replace ? "Products replaced in promotion" : "Products assigned to promotion",
    promotionId: promotion.id,
    promotionName: promotion.name,
    assignedCount: productIds.length,
    previousCount: promotion._count.products,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully ${replace ? 'replaced' : 'assigned'} ${productIds.length} products to promotion "${promotion.name}"`,
    assignedCount: productIds.length,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

// -------------------------
// Assign/Update categories to promotion
// -------------------------
export const assignCategoriesToPromotion = asyncHandler(async (req, res) => {
  const { categoryIds, replace = false } = req.body;

  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new BadRequestError("Category IDs array is required");
  }

  const promotion = await prisma.promotion.findUnique({ 
    where: { id: req.params.id },
    include: {
      _count: { select: { categories: true } }
    }
  });
  
  if (!promotion) throw new NotFoundError("Promotion not found");

  if (promotion.scope !== "CATEGORY") {
    throw new BadRequestError("Can only assign categories to CATEGORY scope promotions");
  }

  const categories = await prisma.category.findMany({ 
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, branchId: true }
  });
  
  if (categories.length !== categoryIds.length) {
    throw new BadRequestError("Some categories not found");
  }

  const updateData = replace
    ? {
        categories: {
          set: [], // Clear existing
          connect: categoryIds.map((id) => ({ id }))
        }
      }
    : {
        categories: {
          connect: categoryIds.map((id) => ({ id }))
        }
      };

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: updateData
  });

  logger.info({
    message: replace ? "Categories replaced in promotion" : "Categories assigned to promotion",
    promotionId: promotion.id,
    promotionName: promotion.name,
    assignedCount: categoryIds.length,
    previousCount: promotion._count.categories,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully ${replace ? 'replaced' : 'assigned'} ${categoryIds.length} categories to promotion "${promotion.name}"`,
    assignedCount: categoryIds.length,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

// -------------------------
// Assign/Update branches to promotion
// -------------------------
export const assignBranchesToPromotion = asyncHandler(async (req, res) => {
  const { branchIds, replace = false } = req.body;

  if (!branchIds || !Array.isArray(branchIds)) {
    throw new BadRequestError("Branch IDs array is required (can be empty for all branches)");
  }

  const promotion = await prisma.promotion.findUnique({ 
    where: { id: req.params.id },
    include: {
      _count: { select: { branches: true } }
    }
  });
  
  if (!promotion) throw new NotFoundError("Promotion not found");

  // Validate branch IDs if any provided
  if (branchIds.length > 0) {
    const branches = await prisma.branch.findMany({ 
      where: { id: { in: branchIds } },
      select: { id: true, name: true }
    });
    
    if (branches.length !== branchIds.length) {
      throw new BadRequestError("Some branches not found");
    }
  }

  const updateData = branchIds.length === 0
    ? {
        branches: {
          set: [] // Empty = applies to all branches
        }
      }
    : replace
    ? {
        branches: {
          set: [], // Clear existing
          connect: branchIds.map((id) => ({ id }))
        }
      }
    : {
        branches: {
          connect: branchIds.map((id) => ({ id }))
        }
      };

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: updateData
  });

  const scope = branchIds.length === 0 ? "ALL_BRANCHES" : "SPECIFIC_BRANCHES";

  logger.info({
    message: `Branches ${replace ? 'replaced' : 'assigned'} for promotion`,
    promotionId: promotion.id,
    promotionName: promotion.name,
    branchCount: branchIds.length,
    scope,
    previousCount: promotion._count.branches,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: branchIds.length === 0
      ? `Promotion "${promotion.name}" now applies to ALL branches`
      : `Successfully ${replace ? 'replaced' : 'assigned'} ${branchIds.length} branches to promotion "${promotion.name}"`,
    branchCount: branchIds.length,
    scope,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

// -------------------------
// Get promotion products
// -------------------------
export const getPromotionProducts = asyncHandler(async (req, res) => {
  const { active, branchId, page = 1, limit = 50 } = req.query;
  const skip = (toInt(page, 1) - 1) * toInt(limit, 50);

  const promotion = await prisma.promotion.findUnique({
    where: { id: req.params.id },
    select: { id: true, scope: true }
  });

  if (!promotion) throw new NotFoundError("Promotion not found");

  if (promotion.scope !== "PRODUCT") {
    throw new BadRequestError("This endpoint only works for PRODUCT scope promotions");
  }

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

// -------------------------
// Get applicable promotions for a product
// -------------------------
export const getApplicablePromotionsForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { branchId } = req.query;

  if (!branchId) {
    throw new BadRequestError("branchId query parameter is required");
  }

  const promotions = await promotionService.getApplicablePromotions(productId, branchId);

  logger.logDatabase('READ', {
    model: 'Promotion',
    operation: 'getApplicablePromotionsForProduct',
    productId,
    branchId,
    count: promotions.length,
    userId: req.user?.id
  });

  res.json({
    productId,
    branchId,
    promotions,
    count: promotions.length
  });
});

// -------------------------
// Calculate best promotion for a product
// -------------------------
export const calculateBestPromotion = asyncHandler(async (req, res) => {
  const { productId, unitPrice, quantity = 1, branchId } = req.body;

  if (!productId || !unitPrice) {
    throw new BadRequestError("productId and unitPrice are required");
  }

  if (!branchId) {
    throw new BadRequestError("branchId is required");
  }

  // Get all applicable promotions
  const promotions = await promotionService.getApplicablePromotions(productId, branchId);

  if (promotions.length === 0) {
    return res.json({
      hasPromotion: false,
      message: "No promotions available for this product in this branch"
    });
  }

  // Select best promotion
  const best = promotionService.selectBestPromotion(promotions, unitPrice, quantity);

  if (!best || best.savings === 0) {
    return res.json({
      hasPromotion: false,
      message: "No beneficial promotions found"
    });
  }

  // Get full details
  const details = await promotionService.calculatePromotionDiscount(
    best.promotion.id,
    unitPrice,
    quantity,
    branchId
  );

  logger.info({
    message: 'Best promotion calculated',
    productId,
    branchId,
    promotionId: best.promotion.id,
    promotionName: best.promotion.name,
    savings: best.savings,
    userId: req.user?.id
  });

  res.json({
    hasPromotion: true,
    ...details
  });
});

// -------------------------
// Apply promotions to entire cart
// -------------------------
export const applyPromotionsToCart = asyncHandler(async (req, res) => {
  const { items, branchId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestError("Items array is required");
  }

  if (!branchId) {
    throw new BadRequestError("branchId is required");
  }

  const processedItems = await promotionService.applyPromotionsToCart(items, branchId);

  // Calculate totals
  const summary = {
    branchId,
    itemCount: processedItems.length,
    totalOriginal: parseFloat(processedItems.reduce((sum, item) => 
      sum + (item.unitPrice * item.qty), 0
    ).toFixed(2)),
    totalDiscount: parseFloat(processedItems.reduce((sum, item) => 
      sum + (item.discount || 0), 0
    ).toFixed(2)),
    totalFinal: parseFloat(processedItems.reduce((sum, item) => 
      sum + item.lineTotal, 0
    ).toFixed(2)),
    promotionsApplied: processedItems.filter(item => item.promotionId).length,
    savingsPercentage: 0
  };

  if (summary.totalOriginal > 0) {
    summary.savingsPercentage = parseFloat(
      ((summary.totalDiscount / summary.totalOriginal) * 100).toFixed(2)
    );
  }

  logger.info({
    message: 'Promotions applied to cart',
    branchId,
    itemCount: summary.itemCount,
    promotionsApplied: summary.promotionsApplied,
    totalDiscount: summary.totalDiscount,
    userId: req.user?.id
  });

  res.json({
    items: processedItems,
    summary
  });
});

// -------------------------
// Validate cart promotions before checkout
// -------------------------
export const validateCartPromotions = asyncHandler(async (req, res) => {
  const { items, branchId } = req.body;

  if (!items || !Array.isArray(items)) {
    throw new BadRequestError("Items array is required");
  }

  if (!branchId) {
    throw new BadRequestError("branchId is required");
  }

  const { allValid, results } = await promotionService.validateCartPromotions(items, branchId);

  logger.info({
    message: 'Cart promotions validated',
    branchId,
    totalItems: items.length,
    allValid,
    invalidCount: results.filter(r => !r.valid).length,
    userId: req.user?.id
  });

  res.json({
    valid: allValid,
    branchId,
    results,
    message: allValid 
      ? "All promotions are valid" 
      : "Some promotions are invalid. Please refresh cart."
  });
});

// -------------------------
// Get promotion statistics
// -------------------------
export const getPromotionStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, branchId } = req.query;

  // Verify promotion exists
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    select: { 
      id: true, 
      name: true,
      type: true,
      scope: true
    }
  });

  if (!promotion) {
    throw new NotFoundError("Promotion not found");
  }

  const where = {
    promotionId: id,
    ...(startDate && endDate && {
      transaction: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        ...(branchId && { branchId })
      }
    }),
    ...(!startDate && !endDate && branchId && {
      transaction: {
        branchId
      }
    })
  };

  const [
    usageCount,
    totalDiscount,
    totalQuantitySold,
    transactionLines,
    branchBreakdown
  ] = await Promise.all([
    prisma.transactionLine.count({ where }),
    prisma.transactionLine.aggregate({
      where,
      _sum: { 
        discount: true,
        qty: true
      }
    }),
    prisma.transactionLine.aggregate({
      where,
      _sum: { qty: true }
    }),
    prisma.transactionLine.findMany({
      where,
      select: {
        discount: true,
        qty: true,
        unitPrice: true,
        lineTotal: true,
        createdAt: true,
        transaction: {
          select: {
            id: true,
            receiptNumber: true,
            createdAt: true,
            branch: { select: { id: true, name: true } }
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      },
      take: 50,
      orderBy: { transaction: { createdAt: 'desc' } }
    }),
    // Branch-level breakdown
    prisma.transactionLine.groupBy({
      by: ['transactionId'],
      where,
      _sum: {
        discount: true,
        qty: true
      }
    }).then(async (grouped) => {
      const transactionIds = grouped.map(g => g.transactionId);
      const transactions = await prisma.transaction.findMany({
        where: { id: { in: transactionIds } },
        select: {
          id: true,
          branchId: true,
          branch: { select: { id: true, name: true } }
        }
      });

      const branchStats = {};
      grouped.forEach(g => {
        const transaction = transactions.find(t => t.id === g.transactionId);
        if (transaction) {
          const branchId = transaction.branchId;
          const branchName = transaction.branch.name;
          
          if (!branchStats[branchId]) {
            branchStats[branchId] = {
              branchId,
              branchName,
              usageCount: 0,
              totalDiscount: 0,
              totalQuantity: 0
            };
          }
          
          branchStats[branchId].usageCount++;
          branchStats[branchId].totalDiscount += parseFloat(g._sum.discount || 0);
          branchStats[branchId].totalQuantity += parseInt(g._sum.qty || 0);
        }
      });

      return Object.values(branchStats);
    })
  ]);

  const stats = {
    usageCount,
    totalDiscount: parseFloat((totalDiscount._sum.discount || 0).toFixed(2)),
    totalQuantitySold: totalQuantitySold._sum.qty || 0,
    averageDiscount: usageCount > 0 
      ? parseFloat(((totalDiscount._sum.discount || 0) / usageCount).toFixed(2))
      : 0,
    averageQuantityPerUse: usageCount > 0
      ? parseFloat(((totalQuantitySold._sum.qty || 0) / usageCount).toFixed(2))
      : 0
  };

  logger.logDatabase('READ', {
    model: 'Promotion',
    operation: 'getPromotionStats',
    promotionId: id,
    filters: { startDate, endDate, branchId },
    usageCount: stats.usageCount,
    userId: req.user?.id
  });

  res.json({
    promotion: {
      id: promotion.id,
      name: promotion.name,
      type: promotion.type,
      scope: promotion.scope
    },
    dateRange: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    stats,
    branchBreakdown,
    recentUsage: transactionLines.map(line => ({
      transactionId: line.transaction.id,
      receiptNumber: line.transaction.receiptNumber,
      date: line.transaction.createdAt,
      branch: line.transaction.branch,
      product: line.product,
      quantity: line.qty,
      unitPrice: parseFloat(line.unitPrice),
      discount: parseFloat(line.discount),
      lineTotal: parseFloat(line.lineTotal)
    }))
  });
});

// -------------------------
// Calculate promotion discount (for testing/preview)
// -------------------------
export const calculateDiscount = asyncHandler(async (req, res) => {
  const { promotionId, unitPrice, quantity = 1, branchId } = req.body;

  if (!promotionId || unitPrice === undefined) {
    throw new BadRequestError("promotionId and unitPrice are required");
  }

  if (!branchId) {
    throw new BadRequestError("branchId is required");
  }

  const price = toDecimal(unitPrice);
  const qty = toInt(quantity, 1);

  if (price <= 0 || qty <= 0) {
    throw new BadRequestError("unitPrice and quantity must be greater than 0");
  }

  const result = await promotionService.calculatePromotionDiscount(
    promotionId,
    price,
    qty,
    branchId
  );

  logger.info({
    message: "Promotion discount calculated",
    promotionId,
    branchId,
    unitPrice: price,
    quantity: qty,
    discountAmount: result.discountAmount,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json(result);
});

// -------------------------
// Remove products from promotion
// -------------------------
export const removeProductsFromPromotion = asyncHandler(async (req, res) => {
  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new BadRequestError("Product IDs array is required");
  }

  const promotion = await prisma.promotion.findUnique({ 
    where: { id: req.params.id },
    include: {
      _count: { select: { products: true } }
    }
  });
  
  if (!promotion) throw new NotFoundError("Promotion not found");

  if (promotion.scope !== "PRODUCT") {
    throw new BadRequestError("Can only remove products from PRODUCT scope promotions");
  }

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: {
      products: {
        disconnect: productIds.map((id) => ({ id }))
      }
    }
  });

  logger.info({
    message: "Products removed from promotion",
    promotionId: promotion.id,
    promotionName: promotion.name,
    removedCount: productIds.length,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully removed ${productIds.length} products from promotion "${promotion.name}"`,
    removedCount: productIds.length,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

// -------------------------
// Remove categories from promotion
// -------------------------
export const removeCategoriesFromPromotion = asyncHandler(async (req, res) => {
  const { categoryIds } = req.body;

  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new BadRequestError("Category IDs array is required");
  }

  const promotion = await prisma.promotion.findUnique({ 
    where: { id: req.params.id },
    include: {
      _count: { select: { categories: true } }
    }
  });
  
  if (!promotion) throw new NotFoundError("Promotion not found");

  if (promotion.scope !== "CATEGORY") {
    throw new BadRequestError("Can only remove categories from CATEGORY scope promotions");
  }

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: {
      categories: {
        disconnect: categoryIds.map((id) => ({ id }))
      }
    }
  });

  logger.info({
    message: "Categories removed from promotion",
    promotionId: promotion.id,
    promotionName: promotion.name,
    removedCount: categoryIds.length,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully removed ${categoryIds.length} categories from promotion "${promotion.name}"`,
    removedCount: categoryIds.length,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

// -------------------------
// Remove branches from promotion (removes specific branches, doesn't set to "all")
// -------------------------
export const removeBranchesFromPromotion = asyncHandler(async (req, res) => {
  const { branchIds } = req.body;

  if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
    throw new BadRequestError("Branch IDs array is required");
  }

  const promotion = await prisma.promotion.findUnique({ 
    where: { id: req.params.id },
    include: {
      _count: { select: { branches: true } }
    }
  });
  
  if (!promotion) throw new NotFoundError("Promotion not found");

  await prisma.promotion.update({
    where: { id: req.params.id },
    data: {
      branches: {
        disconnect: branchIds.map((id) => ({ id }))
      }
    }
  });

  logger.info({
    message: "Branches removed from promotion",
    promotionId: promotion.id,
    promotionName: promotion.name,
    removedCount: branchIds.length,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  res.json({
    message: `Successfully removed ${branchIds.length} branches from promotion "${promotion.name}"`,
    removedCount: branchIds.length,
    promotion: { id: promotion.id, name: promotion.name, type: promotion.type }
  });
});

export default {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  assignProductsToPromotion,
  assignCategoriesToPromotion,
  assignBranchesToPromotion,
  getPromotionProducts,
  getApplicablePromotionsForProduct,
  calculateBestPromotion,
  applyPromotionsToCart,
  validateCartPromotions,
  getPromotionStats,
  calculateDiscount,
  removeProductsFromPromotion,
  removeCategoriesFromPromotion,
  removeBranchesFromPromotion
};