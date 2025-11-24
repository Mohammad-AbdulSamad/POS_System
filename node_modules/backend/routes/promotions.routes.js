// routes/promotions.routes.js
import express from 'express';
import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  assignProductsToPromotion,
  assignCategoriesToPromotion,
  assignBranchesToPromotion,
  removeProductsFromPromotion,
  removeCategoriesFromPromotion,
  removeBranchesFromPromotion,
  getPromotionProducts,
  getApplicablePromotionsForProduct,
  calculateBestPromotion,
  applyPromotionsToCart,
  validateCartPromotions,
  getPromotionStats,
  calculateDiscount
} from '../controllers/promotions.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC/CASHIER ROUTES (for POS operations)
// ============================================

/**
 * Get applicable promotions for a specific product
 * Used during product selection at POS
 */
router.get(
  '/applicable/:productId',
  authenticate,
  getApplicablePromotionsForProduct
);

/**
 * Calculate best promotion for a product
 * Used when adding item to cart
 */
router.post(
  '/calculate-best',
  authenticate,
  calculateBestPromotion
);

/**
 * Apply promotions to entire cart
 * Used before checkout to calculate final prices
 */
router.post(
  '/apply-to-cart',
  authenticate,
  applyPromotionsToCart
);

/**
 * Validate cart promotions before finalizing checkout
 * Ensures promotions are still valid and amounts are correct
 */
router.post(
  '/validate-cart',
  authenticate,
  validateCartPromotions
);

/**
 * Calculate discount for testing/preview
 * Can be used by cashiers to preview discount
 */
router.post(
  '/calculate-discount',
  authenticate,
  calculateDiscount
);

// ============================================
// MANAGER/ADMIN ROUTES (for promotion management)
// ============================================

/**
 * Get all promotions with filtering
 * Query params: type, active, search, branchId, scope, page, limit, include_relations
 */
router.get(
  '/',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  getAllPromotions
);

/**
 * Get promotion by ID
 * Query params: include_relations
 */
router.get(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  getPromotionById
);

/**
 * Create new promotion
 * Body: name, description, type, scope, priority, discountPct/discountAmt/buyQty+getQty,
 *       active, productIds[], categoryIds[], branchIds[]
 */
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  createPromotion
);

/**
 * Update promotion
 * Body: name, description, type, scope, priority, discountPct/discountAmt/buyQty+getQty, active
 */
router.patch(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  updatePromotion
);

/**
 * Delete promotion (hard delete)
 * Only allowed if promotion hasn't been used in any transactions
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  deletePromotion
);

// ============================================
// PRODUCT ASSIGNMENT ROUTES
// ============================================

/**
 * Get products assigned to promotion
 * Query params: active, branchId, page, limit
 */
router.get(
  '/:id/products',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  getPromotionProducts
);

/**
 * Assign products to promotion
 * Body: productIds[], replace (boolean - default false)
 * - replace=false: adds to existing products
 * - replace=true: replaces all products
 */
router.post(
  '/:id/products',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  assignProductsToPromotion
);

/**
 * Remove specific products from promotion
 * Body: productIds[]
 */
router.delete(
  '/:id/products',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  removeProductsFromPromotion
);

// ============================================
// CATEGORY ASSIGNMENT ROUTES
// ============================================

/**
 * Assign categories to promotion
 * Body: categoryIds[], replace (boolean - default false)
 */
router.post(
  '/:id/categories',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  assignCategoriesToPromotion
);

/**
 * Remove specific categories from promotion
 * Body: categoryIds[]
 */
router.delete(
  '/:id/categories',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  removeCategoriesFromPromotion
);

// ============================================
// BRANCH ASSIGNMENT ROUTES
// ============================================

/**
 * Assign branches to promotion
 * Body: branchIds[] (empty array = applies to all branches), replace (boolean)
 * - replace=false: adds to existing branches
 * - replace=true: replaces all branches
 */
router.post(
  '/:id/branches',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  assignBranchesToPromotion
);

/**
 * Remove specific branches from promotion
 * Body: branchIds[]
 * Note: This doesn't set to "all branches", it just removes specific ones
 */
router.delete(
  '/:id/branches',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  removeBranchesFromPromotion
);

// ============================================
// STATISTICS & REPORTING
// ============================================

/**
 * Get promotion usage statistics
 * Query params: startDate, endDate, branchId
 * Returns usage count, total discount, branch breakdown, recent transactions
 */
router.get(
  '/:id/stats',
  authenticate,
  requireRole(['ADMIN', 'MANAGER']),
  getPromotionStats
);

export default router;