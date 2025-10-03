// // routes/categories.routes.js
// import { Router } from "express";
// import * as categoriesController from "../controllers/categories.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", categoriesController.getAllCategories);
// router.get("/:id", categoriesController.getCategoryById);
// router.post("/", categoriesController.createCategory);
// router.put("/:id", categoriesController.updateCategory);
// router.delete("/:id", categoriesController.deleteCategory);

// // Nested: get categories by branch
// router.get("/branch/:branchId", categoriesController.getCategoriesByBranch);

// // Category-specific operations
// router.get("/:id/products", categoriesController.getCategoryProducts);
// router.get("/:id/analytics", categoriesController.getCategoryAnalytics);

// // Advanced category management
// router.post("/:id/move-products", categoriesController.moveProductsToCategory);
// router.post("/:id/duplicate", categoriesController.duplicateCategory);

// export default router;
// routes/categories.routes.js
import { Router } from "express";
import * as categoriesController from "../controllers/categories.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all categories - All authenticated users can view
router.get("/", categoriesController.getAllCategories);

// GET category by ID - All authenticated users can view
router.get("/:id", categoriesController.getCategoryById);

// CREATE category - Admin, Manager, and Stock Manager
router.post("/", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  categoriesController.createCategory
);

// UPDATE category - Admin, Manager, and Stock Manager
router.put("/:id", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  categoriesController.updateCategory
);

// DELETE category - Admin and Manager only
router.delete("/:id", 
  requireRole(['ADMIN', 'MANAGER']), 
  categoriesController.deleteCategory
);

// Nested: get categories by branch - All authenticated users
router.get("/branch/:branchId", categoriesController.getCategoriesByBranch);

// Category-specific operations - All authenticated users can view
router.get("/:id/products", categoriesController.getCategoryProducts);
router.get("/:id/analytics", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  categoriesController.getCategoryAnalytics
);

// Advanced category management - Admin, Manager, Stock Manager
router.post("/:id/move-products", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  categoriesController.moveProductsToCategory
);
router.post("/:id/duplicate", 
  requireRole(['ADMIN', 'MANAGER']),
  categoriesController.duplicateCategory
);

export default router;