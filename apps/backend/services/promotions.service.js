// // services/promotion.service.js
// import { PrismaClient } from "@prisma/client";
// import { BadRequestError } from "../utils/errors.utils.js";

// const prisma = new PrismaClient();

// /**
//  * Get all applicable promotions for a product
//  * Returns both direct product promotions and category promotions
//  */
// export async function getApplicablePromotions(productId, branchId = null) {
//   const product = await prisma.product.findUnique({
//     where: { id: productId },
//     select: {
//       id: true,
//       name: true,
//       categoryId: true,
//       branchId: true,
//       priceGross: true
//     }
//   });

//   if (!product) {
//     throw new BadRequestError(`Product ${productId} not found`);
//   }

//   // Fetch all active promotions that apply to this product
//   const promotions = await prisma.promotion.findMany({
//     where: {
//       active: true,
//       OR: [
//         // Direct product promotions
//         {
//           scope: 'PRODUCT',
//           products: {
//             some: { id: productId }
//           }
//         },
//         // Category promotions (if product has a category)
//         ...(product.categoryId ? [{
//           scope: 'CATEGORY',
//           categories: {
//             some: { id: product.categoryId }
//           }
//         }] : [])
//       ]
//     },
//     include: {
//       products: { select: { id: true } },
//       categories: { select: { id: true } }
//     },
//     orderBy: [
//       { priority: 'desc' },  // Higher priority first
//       { createdAt: 'desc' }  // Newer promotions first if same priority
//     ]
//   });

//   return promotions;
// }

// /**
//  * Select the best promotion for a product based on priority and savings
//  * Priority rules:
//  * 1. Higher priority number wins
//  * 2. If same priority, calculate which gives better discount
//  * 3. Product-level promotions take precedence over category-level (implicit in priority)
//  */
// export function selectBestPromotion(promotions, unitPrice, quantity = 1) {
//   if (!promotions || promotions.length === 0) return null;

//   let bestPromotion = null;
//   let bestSavings = 0;
//   let highestPriority = -1;

//   for (const promo of promotions) {
//     const savings = calculatePromotionSavings(promo, unitPrice, quantity);
    
//     // Priority-based selection
//     if (promo.priority > highestPriority) {
//       highestPriority = promo.priority;
//       bestPromotion = promo;
//       bestSavings = savings;
//     } 
//     // If same priority, choose the one with better savings
//     else if (promo.priority === highestPriority && savings > bestSavings) {
//       bestPromotion = promo;
//       bestSavings = savings;
//     }
//   }

//   return {
//     promotion: bestPromotion,
//     savings: bestSavings,
//     discountAmount: bestSavings
//   };
// }

// /**
//  * Calculate savings for a promotion without applying it
//  */
// function calculatePromotionSavings(promotion, unitPrice, quantity) {
//   const price = parseFloat(unitPrice);
//   const qty = parseInt(quantity);

//   switch (promotion.type) {
//     case 'PERCENTAGE': {
//       const discount = (price * qty * parseFloat(promotion.discountPct)) / 100;
//       return parseFloat(discount.toFixed(2));
//     }

//     case 'FIXED_AMOUNT': {
//       const discount = parseFloat(promotion.discountAmt) * qty;
//       // Don't allow negative prices
//       return Math.min(discount, price * qty);
//     }

//     case 'BUY_X_GET_Y': {
//       const buyQty = promotion.buyQty;
//       const getQty = promotion.getQty;
//       const setSize = buyQty + getQty;
//       const sets = Math.floor(qty / setSize);
//       const freeItems = sets * getQty;
//       const savings = freeItems * price;
//       return parseFloat(savings.toFixed(2));
//     }

//     default:
//       return 0;
//   }
// }

// /**
//  * Calculate full promotion details with discount breakdown
//  */
// export async function calculatePromotionDiscount(promotionId, unitPrice, quantity = 1) {
//   const promotion = await prisma.promotion.findUnique({
//     where: { id: promotionId }
//   });

//   if (!promotion) {
//     throw new BadRequestError("Promotion not found");
//   }

//   if (!promotion.active) {
//     throw new BadRequestError(`Promotion "${promotion.name}" is no longer active`);
//   }

//   const price = parseFloat(unitPrice);
//   const qty = parseInt(quantity);

//   let discountAmount = 0;
//   let finalPrice = price * qty;
//   let paidItems = qty;
//   let freeItems = 0;

//   switch (promotion.type) {
//     case 'PERCENTAGE': {
//       discountAmount = (price * qty * parseFloat(promotion.discountPct)) / 100;
//       finalPrice = price * qty - discountAmount;
//       break;
//     }

//     case 'FIXED_AMOUNT': {
//       discountAmount = parseFloat(promotion.discountAmt) * qty;
//       finalPrice = price * qty - discountAmount;
//       if (finalPrice < 0) finalPrice = 0;
//       break;
//     }

//     case 'BUY_X_GET_Y': {
//       const buyQty = promotion.buyQty;
//       const getQty = promotion.getQty;
//       const setSize = buyQty + getQty;
//       const sets = Math.floor(qty / setSize);
//       freeItems = sets * getQty;
//       paidItems = qty - freeItems;
//       discountAmount = freeItems * price;
//       finalPrice = paidItems * price;
//       break;
//     }
//   }

//   return {
//     promotionId: promotion.id,
//     promotionName: promotion.name,
//     promotionType: promotion.type,
//     originalPrice: parseFloat(price.toFixed(2)),
//     quantity: qty,
//     subtotal: parseFloat((price * qty).toFixed(2)),
//     discountAmount: parseFloat(discountAmount.toFixed(2)),
//     finalPrice: parseFloat(finalPrice.toFixed(2)),
//     savings: parseFloat(discountAmount.toFixed(2)),
//     ...(promotion.type === 'BUY_X_GET_Y' && {
//       buyQty: promotion.buyQty,
//       getQty: promotion.getQty,
//       paidItems,
//       freeItems
//     }),
//     // Snapshot for storing in transaction
//     promotionSnapshot: {
//       id: promotion.id,
//       name: promotion.name,
//       type: promotion.type,
//       scope: promotion.scope,
//       priority: promotion.priority,
//       discountPct: promotion.discountPct ? parseFloat(promotion.discountPct) : null,
//       discountAmt: promotion.discountAmt ? parseFloat(promotion.discountAmt) : null,
//       buyQty: promotion.buyQty,
//       getQty: promotion.getQty
//     }
//   };
// }

// /**
//  * Apply promotions to entire cart
//  * Handles multiple products, each getting their best promotion
//  */
// export async function applyPromotionsToCart(cartItems) {
//   const processedItems = [];

//   for (const item of cartItems) {
//     const { productId, unitPrice, qty } = item;

//     // Get all applicable promotions for this product
//     const applicablePromotions = await getApplicablePromotions(productId);

//     if (applicablePromotions.length === 0) {
//       // No promotions - add item as-is
//       processedItems.push({
//         ...item,
//         discount: 0,
//         promotionId: null,
//         promotionSnapshot: null,
//         lineTotal: parseFloat((unitPrice * qty).toFixed(2))
//       });
//       continue;
//     }

//     // Select best promotion
//     const bestPromoResult = selectBestPromotion(applicablePromotions, unitPrice, qty);

//     if (!bestPromoResult || bestPromoResult.savings === 0) {
//       // No beneficial promotion found
//       processedItems.push({
//         ...item,
//         discount: 0,
//         promotionId: null,
//         promotionSnapshot: null,
//         lineTotal: parseFloat((unitPrice * qty).toFixed(2))
//       });
//       continue;
//     }

//     // Calculate full discount details
//     const discountDetails = await calculatePromotionDiscount(
//       bestPromoResult.promotion.id,
//       unitPrice,
//       qty
//     );

//     processedItems.push({
//       ...item,
//       discount: discountDetails.discountAmount,
//       promotionId: bestPromoResult.promotion.id,
//       promotionSnapshot: discountDetails.promotionSnapshot,
//       lineTotal: discountDetails.finalPrice,
//       promotionApplied: {
//         name: bestPromoResult.promotion.name,
//         type: bestPromoResult.promotion.type,
//         scope: bestPromoResult.promotion.scope,
//         savings: discountDetails.savings
//       }
//     });
//   }

//   return processedItems;
// }

// /**
//  * Validate promotion is still applicable at checkout
//  * Prevents race conditions where promotion becomes inactive between cart and checkout
//  */
// export async function validatePromotionAtCheckout(line) {
//   if (!line.promotionId) return true; // No promotion, nothing to validate

//   const promotion = await prisma.promotion.findUnique({
//     where: { id: line.promotionId }
//   });

//   if (!promotion) {
//     throw new BadRequestError(
//       `Promotion "${line.promotionSnapshot?.name || 'Unknown'}" no longer exists. Please refresh cart.`
//     );
//   }

//   if (!promotion.active) {
//     throw new BadRequestError(
//       `Promotion "${promotion.name}" is no longer active. Please refresh cart.`
//     );
//   }

//   // Recalculate to prevent tampering
//   const recalculated = await calculatePromotionDiscount(
//     line.promotionId,
//     line.unitPrice,
//     line.qty
//   );

//   // Allow small floating point differences (1 cent)
//   if (Math.abs(recalculated.discountAmount - line.discount) > 0.01) {
//     throw new BadRequestError(
//       `Discount amount mismatch for promotion "${promotion.name}". Please refresh cart.`
//     );
//   }

//   return true;
// }

// export default {
//   getApplicablePromotions,
//   selectBestPromotion,
//   calculatePromotionDiscount,
//   applyPromotionsToCart,
//   validatePromotionAtCheckout
// };

// services/promotion.service.js
import { PrismaClient, Prisma } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../utils/errors.utils.js";

const prisma = new PrismaClient();

/**
 * Get all applicable promotions for a product in a specific branch
 * Returns both direct product promotions and category promotions
 * Filters by branch assignment (if promotion is branch-specific)
 */
export async function getApplicablePromotions(productId, branchId = null) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      categoryId: true,
      branchId: true,
      priceGross: true,
      active: true
    }
  });

  if (!product) {
    throw new NotFoundError(`Product ${productId} not found`);
  }

  if (!product.active) {
    throw new BadRequestError(`Product ${product.name} is not active`);
  }

  // Use product's branch if not explicitly provided
  const targetBranchId = branchId || product.branchId;

  // Build promotion query
  const promotions = await prisma.promotion.findMany({
    where: {
      active: true,
      // Branch filter: promotion must either have no branches (applies to all)
      // OR include the target branch
      OR: [
        { branches: { none: {} } }, // No branches = applies to all
        { branches: { some: { id: targetBranchId } } } // Specific branch
      ],
      AND: {
        OR: [
          // Direct product promotions
          {
            scope: 'PRODUCT',
            products: {
              some: { id: productId }
            }
          },
          // Category promotions (if product has a category)
          ...(product.categoryId ? [{
            scope: 'CATEGORY',
            categories: {
              some: { id: product.categoryId }
            }
          }] : [])
        ]
      }
    },
    include: {
      products: { 
        select: { id: true, name: true },
        take: 5 // Limit for performance
      },
      categories: { 
        select: { id: true, name: true },
        take: 5
      },
      branches: {
        select: { id: true, name: true },
        take: 5
      }
    },
    orderBy: [
      { priority: 'desc' },  // Higher priority first
      { createdAt: 'desc' }  // Newer promotions first if same priority
    ]
  });

  return promotions;
}

/**
 * Select the best promotion for a product based on priority and savings
 * Priority rules:
 * 1. Higher priority number wins
 * 2. If same priority, calculate which gives better discount
 * 3. Product-level promotions over category-level (implicit in priority)
 */
export function selectBestPromotion(promotions, unitPrice, quantity = 1) {
  if (!promotions || promotions.length === 0) return null;

  const price = parseFloat(unitPrice);
  const qty = parseInt(quantity);

  if (isNaN(price) || price <= 0) {
    throw new BadRequestError("Invalid unit price");
  }

  if (isNaN(qty) || qty <= 0) {
    throw new BadRequestError("Invalid quantity");
  }

  let bestPromotion = null;
  let bestSavings = 0;
  let highestPriority = -Infinity;

  for (const promo of promotions) {
    const savings = calculatePromotionSavings(promo, price, qty);
    
    // Priority-based selection
    if (promo.priority > highestPriority) {
      highestPriority = promo.priority;
      bestPromotion = promo;
      bestSavings = savings;
    } 
    // If same priority, choose the one with better savings
    else if (promo.priority === highestPriority && savings > bestSavings) {
      bestPromotion = promo;
      bestSavings = savings;
    }
  }

  return bestPromotion ? {
    promotion: bestPromotion,
    savings: bestSavings,
    discountAmount: bestSavings
  } : null;
}

/**
 * Calculate savings for a promotion without applying it
 * Handles all promotion types correctly
 */
function calculatePromotionSavings(promotion, unitPrice, quantity) {
  const price = parseFloat(unitPrice);
  const qty = parseInt(quantity);

  switch (promotion.type) {
    case 'PERCENTAGE': {
      if (!promotion.discountPct) return 0;
      const discountPct = parseFloat(promotion.discountPct);
      const discount = (price * qty * discountPct) / 100;
      return parseFloat(discount.toFixed(2));
    }

    case 'FIXED_AMOUNT': {
      if (!promotion.discountAmt) return 0;
      const discountAmt = parseFloat(promotion.discountAmt);
      const totalDiscount = discountAmt * qty;
      const maxDiscount = price * qty; // Can't discount more than total price
      return parseFloat(Math.min(totalDiscount, maxDiscount).toFixed(2));
    }

    case 'BUY_X_GET_Y': {
      if (!promotion.buyQty || !promotion.getQty) return 0;
      
      const buyQty = parseInt(promotion.buyQty);
      const getQty = parseInt(promotion.getQty);
      
      if (buyQty <= 0 || getQty <= 0) return 0;
      
      const setSize = buyQty + getQty;
      
      // How many complete sets can we make?
      const completeSets = Math.floor(qty / setSize);
      
      // Each complete set gives us 'getQty' items free
      const freeItems = completeSets * getQty;
      
      // Savings = free items × unit price
      const savings = freeItems * price;
      
      return parseFloat(savings.toFixed(2));
    }

    default:
      return 0;
  }
}

/**
 * Calculate full promotion details with discount breakdown
 * This is the authoritative calculation used at checkout
 */
export async function calculatePromotionDiscount(promotionId, unitPrice, quantity = 1, branchId = null) {
  const promotion = await prisma.promotion.findUnique({
    where: { id: promotionId },
    include: {
      branches: {
        select: { id: true, name: true }
      }
    }
  });

  if (!promotion) {
    throw new NotFoundError("Promotion not found");
  }

  if (!promotion.active) {
    throw new BadRequestError(`Promotion "${promotion.name}" is no longer active`);
  }

  // Validate branch access if promotion is branch-specific
  if (branchId && promotion.branches.length > 0) {
    const hasAccess = promotion.branches.some(b => b.id === branchId);
    if (!hasAccess) {
      throw new BadRequestError(
        `Promotion "${promotion.name}" is not available in this branch`
      );
    }
  }

  const price = parseFloat(unitPrice);
  const qty = parseInt(quantity);

  if (isNaN(price) || price <= 0) {
    throw new BadRequestError("Invalid unit price");
  }

  if (isNaN(qty) || qty <= 0) {
    throw new BadRequestError("Invalid quantity");
  }

  let discountAmount = 0;
  let finalPrice = price * qty;
  let paidItems = qty;
  let freeItems = 0;
  let effectiveUnitPrice = price;

  switch (promotion.type) {
    case 'PERCENTAGE': {
      if (!promotion.discountPct) {
        throw new BadRequestError("Percentage discount value missing");
      }
      const discountPct = parseFloat(promotion.discountPct);
      discountAmount = (price * qty * discountPct) / 100;
      finalPrice = price * qty - discountAmount;
      effectiveUnitPrice = finalPrice / qty;
      break;
    }

    case 'FIXED_AMOUNT': {
      if (!promotion.discountAmt) {
        throw new BadRequestError("Fixed discount amount missing");
      }
      const discountAmt = parseFloat(promotion.discountAmt);
      discountAmount = discountAmt * qty;
      finalPrice = Math.max(0, price * qty - discountAmount);
      discountAmount = price * qty - finalPrice; // Adjust if capped at 0
      effectiveUnitPrice = finalPrice / qty;
      break;
    }

    case 'BUY_X_GET_Y': {
      if (!promotion.buyQty || !promotion.getQty) {
        throw new BadRequestError("Buy/Get quantities missing for BUY_X_GET_Y promotion");
      }
      
      const buyQty = parseInt(promotion.buyQty);
      const getQty = parseInt(promotion.getQty);
      const setSize = buyQty + getQty;
      
      // Calculate complete sets
      const completeSets = Math.floor(qty / setSize);
      
      // Calculate free items from complete sets
      freeItems = completeSets * getQty;
      
      // Items customer pays for
      paidItems = qty - freeItems;
      
      // Discount = value of free items
      discountAmount = freeItems * price;
      
      // Final price = paid items × unit price
      finalPrice = paidItems * price;
      
      // Effective unit price (for display purposes)
      effectiveUnitPrice = qty > 0 ? finalPrice / qty : 0;
      
      break;
    }

    default:
      throw new BadRequestError(`Unknown promotion type: ${promotion.type}`);
  }

  return {
    promotionId: promotion.id,
    promotionName: promotion.name,
    promotionType: promotion.type,
    originalPrice: parseFloat(price.toFixed(2)),
    quantity: qty,
    subtotal: parseFloat((price * qty).toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    effectiveUnitPrice: parseFloat(effectiveUnitPrice.toFixed(2)),
    savings: parseFloat(discountAmount.toFixed(2)),
    ...(promotion.type === 'BUY_X_GET_Y' && {
      buyQty: promotion.buyQty,
      getQty: promotion.getQty,
      paidItems,
      freeItems,
      completeSets: Math.floor(qty / (promotion.buyQty + promotion.getQty)),
      message: freeItems > 0 
        ? `Buy ${promotion.buyQty}, Get ${promotion.getQty} Free! You get ${freeItems} free item${freeItems > 1 ? 's' : ''}`
        : `Buy ${promotion.buyQty}, Get ${promotion.getQty} Free (need ${promotion.buyQty + promotion.getQty} items)`
    }),
    // Snapshot for storing in transaction
    promotionSnapshot: {
      id: promotion.id,
      name: promotion.name,
      type: promotion.type,
      scope: promotion.scope,
      priority: promotion.priority,
      discountPct: promotion.discountPct ? parseFloat(promotion.discountPct) : null,
      discountAmt: promotion.discountAmt ? parseFloat(promotion.discountAmt) : null,
      buyQty: promotion.buyQty,
      getQty: promotion.getQty,
      appliedAt: new Date().toISOString()
    }
  };
}

/**
 * Apply promotions to entire cart
 * Handles multiple products, each getting their best promotion
 */
export async function applyPromotionsToCart(cartItems, branchId = null) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new BadRequestError("Cart items must be a non-empty array");
  }

  const processedItems = [];

  for (const item of cartItems) {
    const { productId, unitPrice, qty } = item;

    if (!productId || unitPrice === undefined || qty === undefined) {
      throw new BadRequestError("Each item must have productId, unitPrice, and qty");
    }

    try {
      // Get all applicable promotions for this product
      const applicablePromotions = await getApplicablePromotions(productId, branchId);

      if (applicablePromotions.length === 0) {
        // No promotions - add item as-is
        processedItems.push({
          ...item,
          discount: 0,
          promotionId: null,
          promotionSnapshot: null,
          lineTotal: parseFloat((unitPrice * qty).toFixed(2)),
          promotionApplied: null
        });
        continue;
      }

      // Select best promotion
      const bestPromoResult = selectBestPromotion(applicablePromotions, unitPrice, qty);

      if (!bestPromoResult || bestPromoResult.savings === 0) {
        // No beneficial promotion found
        processedItems.push({
          ...item,
          discount: 0,
          promotionId: null,
          promotionSnapshot: null,
          lineTotal: parseFloat((unitPrice * qty).toFixed(2)),
          promotionApplied: null
        });
        continue;
      }

      // Calculate full discount details
      const discountDetails = await calculatePromotionDiscount(
        bestPromoResult.promotion.id,
        unitPrice,
        qty,
        branchId
      );

      processedItems.push({
        ...item,
        discount: discountDetails.discountAmount,
        promotionId: bestPromoResult.promotion.id,
        promotionSnapshot: discountDetails.promotionSnapshot,
        lineTotal: discountDetails.finalPrice,
        promotionApplied: {
          id: bestPromoResult.promotion.id,
          name: bestPromoResult.promotion.name,
          type: bestPromoResult.promotion.type,
          scope: bestPromoResult.promotion.scope,
          savings: discountDetails.savings,
          ...(discountDetails.freeItems !== undefined && {
            freeItems: discountDetails.freeItems,
            paidItems: discountDetails.paidItems,
            message: discountDetails.message
          })
        }
      });
    } catch (error) {
      // If promotion fails, add item without discount but log the error
      console.error(`Failed to apply promotion to product ${productId}:`, error.message);
      processedItems.push({
        ...item,
        discount: 0,
        promotionId: null,
        promotionSnapshot: null,
        lineTotal: parseFloat((unitPrice * qty).toFixed(2)),
        promotionApplied: null,
        promotionError: error.message
      });
    }
  }

  return processedItems;
}

/**
 * Validate promotion is still applicable at checkout
 * Prevents race conditions where promotion becomes inactive between cart and checkout
 */
export async function validatePromotionAtCheckout(line, branchId = null) {
  if (!line.promotionId) return true; // No promotion, nothing to validate

  const promotion = await prisma.promotion.findUnique({
    where: { id: line.promotionId },
    include: {
      branches: {
        select: { id: true }
      }
    }
  });

  if (!promotion) {
    throw new BadRequestError(
      `Promotion "${line.promotionSnapshot?.name || 'Unknown'}" no longer exists. Please refresh cart.`
    );
  }

  if (!promotion.active) {
    throw new BadRequestError(
      `Promotion "${promotion.name}" is no longer active. Please refresh cart.`
    );
  }

  // Validate branch access
  if (branchId && promotion.branches.length > 0) {
    const hasAccess = promotion.branches.some(b => b.id === branchId);
    if (!hasAccess) {
      throw new BadRequestError(
        `Promotion "${promotion.name}" is not available in this branch. Please refresh cart.`
      );
    }
  }

  // Recalculate to prevent tampering
  const recalculated = await calculatePromotionDiscount(
    line.promotionId,
    line.unitPrice,
    line.qty,
    branchId
  );

  // Allow small floating point differences (1 cent)
  const discountDiff = Math.abs(recalculated.discountAmount - parseFloat(line.discount));
  if (discountDiff > 0.01) {
    throw new BadRequestError(
      `Discount amount mismatch for promotion "${promotion.name}". Expected ${recalculated.discountAmount}, got ${line.discount}. Please refresh cart.`
    );
  }

  return true;
}

/**
 * Validate all cart items have valid promotions
 */
export async function validateCartPromotions(cartItems, branchId = null) {
  const results = [];
  let allValid = true;

  for (const item of cartItems) {
    try {
      await validatePromotionAtCheckout(item, branchId);
      results.push({
        productId: item.productId,
        valid: true,
        promotionId: item.promotionId || null
      });
    } catch (error) {
      allValid = false;
      results.push({
        productId: item.productId,
        valid: false,
        promotionId: item.promotionId || null,
        error: error.message
      });
    }
  }

  return {
    allValid,
    results
  };
}

export default {
  getApplicablePromotions,
  selectBestPromotion,
  calculatePromotionDiscount,
  applyPromotionsToCart,
  validatePromotionAtCheckout,
  validateCartPromotions
};