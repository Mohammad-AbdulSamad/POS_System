// import { Router } from "express";
// import * as branchesController from "../controllers/branches.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", branchesController.getAllBranches);
// router.get("/:id", branchesController.getBranchById);
// router.post("/", branchesController.createBranch);
// router.put("/:id", branchesController.updateBranch);
// router.delete("/:id", branchesController.deleteBranch);

// // Enhanced branch-specific operations
// router.get("/:id/products", branchesController.getBranchProducts);
// router.get("/:id/categories", branchesController.getBranchCategories);
// router.get("/:id/users", branchesController.getBranchUsers);
// router.get("/:id/transactions", branchesController.getBranchTransactions);
// router.get("/:id/stock-movements", branchesController.getBranchStockMovements);

// // Analytics and reports
// router.get("/:id/analytics", branchesController.getBranchAnalytics);
// router.get("/:id/inventory-status", branchesController.getInventoryStatus);

// export default router;
// routes/branches.routes.js
import { Router } from "express";
import * as branchesController from "../controllers/branches.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all branches - All authenticated users can view
router.get("/", branchesController.getAllBranches);

// GET branch by ID - All authenticated users can view
router.get("/:id", branchesController.getBranchById);

// CREATE branch - Admin only
router.post("/", 
  requireRole(['ADMIN']), 
  branchesController.createBranch
);

// UPDATE branch - Admin and Manager only
router.put("/:id", 
  requireRole(['ADMIN', 'MANAGER']), 
  branchesController.updateBranch
);

// DELETE branch - Admin only
router.delete("/:id", 
  requireRole(['ADMIN']), 
  branchesController.deleteBranch
);

// Enhanced branch-specific operations
// All authenticated users can view branch details
router.get("/:id/products", branchesController.getBranchProducts);
router.get("/:id/categories", branchesController.getBranchCategories);
router.get("/:id/users", 
  requireRole(['ADMIN', 'MANAGER']), // Only admin/manager can see all users
  branchesController.getBranchUsers
);
router.get("/:id/transactions", 
  requireRole(['ADMIN', 'MANAGER']), // Sensitive financial data
  branchesController.getBranchTransactions
);
router.get("/:id/stock-movements", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  branchesController.getBranchStockMovements
);

// Analytics and reports - Admin and Manager only
router.get("/:id/analytics", 
  requireRole(['ADMIN', 'MANAGER']), 
  branchesController.getBranchAnalytics
);
router.get("/:id/inventory-status", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  branchesController.getInventoryStatus
);

export default router;