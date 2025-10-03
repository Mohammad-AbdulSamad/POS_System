// import { Router } from "express";
// import * as stockMovementsController from "../controllers/stockMovements.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", stockMovementsController.getAllStockMovements);
// router.get("/:id", stockMovementsController.getStockMovementById);
// router.post("/", stockMovementsController.createStockMovement);
// router.put("/:id", stockMovementsController.updateStockMovement);
// router.delete("/:id", stockMovementsController.deleteStockMovement);

// // Product-specific operations
// router.get("/product/:productId", stockMovementsController.getMovementsByProduct);
// router.get("/product/:productId/history", stockMovementsController.getProductStockHistory);
// router.get("/product/:productId/current-stock", stockMovementsController.getCurrentProductStock);

// // Branch-specific operations
// router.get("/branch/:branchId", stockMovementsController.getMovementsByBranch);
// router.get("/branch/:branchId/summary", stockMovementsController.getBranchStockSummary);
// router.get("/branch/:branchId/low-stock", stockMovementsController.getLowStockProducts);

// // Reason-based filtering
// router.get("/reason/:reason", stockMovementsController.getMovementsByReason);

// // Bulk operations
// router.post("/bulk", stockMovementsController.createBulkMovements);
// router.post("/bulk-adjustment", stockMovementsController.bulkStockAdjustment);

// // Stock operations
// router.post("/receive-stock", stockMovementsController.receiveStock);
// router.post("/adjust-stock", stockMovementsController.adjustStock);
// router.post("/transfer-stock", stockMovementsController.transferStock);
// router.post("/record-sale", stockMovementsController.recordSale);
// router.post("/record-spoilage", stockMovementsController.recordSpoilage);

// // Analytics & Reports
// router.get("/analytics/movement-trends", stockMovementsController.getMovementTrends);
// router.get("/analytics/stock-velocity", stockMovementsController.getStockVelocity);
// router.get("/analytics/waste-report", stockMovementsController.getWasteReport);
// router.get("/analytics/turnover-rate", stockMovementsController.getTurnoverRate);

// // Validation & Reconciliation
// router.post("/validate-stock", stockMovementsController.validateCurrentStock);
// router.post("/reconcile-stock", stockMovementsController.reconcileStock);
// router.get("/discrepancies", stockMovementsController.getStockDiscrepancies);

// export default router;

// routes/stockMovements.routes.js
import { Router } from "express";
import * as stockMovementsController from "../controllers/stockMovements.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all stock movements - Admin, Manager, and Stock Manager
router.get("/", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getAllStockMovements
);

// GET stock movement by ID - Admin, Manager, and Stock Manager
router.get("/:id", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getStockMovementById
);

// CREATE stock movement - Admin, Manager, and Stock Manager
router.post("/", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.createStockMovement
);

// UPDATE stock movement - Admin and Manager only
router.put("/:id", 
  requireRole(['ADMIN', 'MANAGER']), 
  stockMovementsController.updateStockMovement
);

// DELETE stock movement - Admin only (audit trail)
router.delete("/:id", 
  requireRole(['ADMIN']), 
  stockMovementsController.deleteStockMovement
);

// Product-specific operations - Admin, Manager, and Stock Manager
router.get("/product/:productId", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getMovementsByProduct
);

router.get("/product/:productId/history", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getProductStockHistory
);

router.get("/product/:productId/current-stock", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getCurrentProductStock
);

// Branch-specific operations - Admin, Manager, and Stock Manager
router.get("/branch/:branchId", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getMovementsByBranch
);

router.get("/branch/:branchId/summary", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getBranchStockSummary
);

router.get("/branch/:branchId/low-stock", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getLowStockProducts
);

// Reason-based filtering - Admin, Manager, and Stock Manager
router.get("/reason/:reason", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getMovementsByReason
);

// Bulk operations - Admin, Manager, and Stock Manager
router.post("/bulk", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.createBulkMovements
);

router.post("/bulk-adjustment", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.bulkStockAdjustment
);

// Stock operations - Admin, Manager, and Stock Manager
router.post("/receive-stock", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.receiveStock
);

router.post("/adjust-stock", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.adjustStock
);

router.post("/transfer-stock", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.transferStock
);

router.post("/record-sale", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.recordSale
);

router.post("/record-spoilage", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.recordSpoilage
);

// Analytics & Reports - Admin and Manager only
router.get("/analytics/movement-trends", 
  requireRole(['ADMIN', 'MANAGER']), 
  stockMovementsController.getMovementTrends
);

router.get("/analytics/stock-velocity", 
  requireRole(['ADMIN', 'MANAGER']), 
  stockMovementsController.getStockVelocity
);

router.get("/analytics/waste-report", 
  requireRole(['ADMIN', 'MANAGER']), 
  stockMovementsController.getWasteReport
);

router.get("/analytics/turnover-rate", 
  requireRole(['ADMIN', 'MANAGER']), 
  stockMovementsController.getTurnoverRate
);

// Validation & Reconciliation - Admin, Manager, and Stock Manager
router.post("/validate-stock", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.validateCurrentStock
);

router.post("/reconcile-stock", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.reconcileStock
);

router.get("/discrepancies", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  stockMovementsController.getStockDiscrepancies
);

export default router;