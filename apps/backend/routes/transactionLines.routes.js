// import { Router } from "express";
// import * as transactionLinesController from "../controllers/transactionLines.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", transactionLinesController.getAllTransactionLines);
// router.get("/:id", transactionLinesController.getTransactionLineById);
// router.post("/", transactionLinesController.createTransactionLine);
// router.put("/:id", transactionLinesController.updateTransactionLine);
// router.delete("/:id", transactionLinesController.deleteTransactionLine);

// // Transaction-specific operations
// router.get("/transaction/:transactionId", transactionLinesController.getLinesByTransaction);
// router.post("/transaction/:transactionId/lines", transactionLinesController.addLineToTransaction);
// router.delete("/transaction/:transactionId/lines/:lineId", transactionLinesController.removeLineFromTransaction);

// // Product-specific operations
// router.get("/product/:productId", transactionLinesController.getLinesByProduct);
// router.get("/product/:productId/sales-stats", transactionLinesController.getProductSalesStats);

// // Bulk operations
// router.post("/bulk", transactionLinesController.createMultipleLines);
// router.put("/bulk", transactionLinesController.updateMultipleLines);
// router.delete("/bulk", transactionLinesController.deleteMultipleLines);

// // Analytics & Reports
// router.get("/analytics/top-products", transactionLinesController.getTopSellingProducts);
// router.get("/analytics/sales-by-period", transactionLinesController.getSalesByPeriod);
// router.get("/analytics/revenue-breakdown", transactionLinesController.getRevenueBreakdown);

// // Validation & Calculations
// router.post("/:id/calculate-total", transactionLinesController.calculateLineTotal);
// router.post("/validate-line", transactionLinesController.validateTransactionLine);

// export default router;

// routes/transactionLines.routes.js
import { Router } from "express";
import * as transactionLinesController from "../controllers/transactionLines.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all transaction lines - Admin and Manager only (sensitive sales data)
router.get("/", 
  requireRole(['ADMIN', 'MANAGER']), 
  transactionLinesController.getAllTransactionLines
);

// GET transaction line by ID - All authenticated users
router.get("/:id", transactionLinesController.getTransactionLineById);

// CREATE transaction line - All authenticated users (cashiers add items)
router.post("/", transactionLinesController.createTransactionLine);

// UPDATE transaction line - All authenticated users (price adjustments, qty changes)
router.put("/:id", transactionLinesController.updateTransactionLine);

// DELETE transaction line - All authenticated users (remove items from cart)
router.delete("/:id", transactionLinesController.deleteTransactionLine);

// Transaction-specific operations - All authenticated users
router.get("/transaction/:transactionId", transactionLinesController.getLinesByTransaction);

router.post("/transaction/:transactionId/lines", 
  transactionLinesController.addLineToTransaction
);

router.delete("/transaction/:transactionId/lines/:lineId", 
  transactionLinesController.removeLineFromTransaction
);

// Product-specific operations - Admin, Manager, Stock Manager
router.get("/product/:productId", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  transactionLinesController.getLinesByProduct
);

router.get("/product/:productId/sales-stats", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  transactionLinesController.getProductSalesStats
);

// Bulk operations - All authenticated users (for POS operations)
router.post("/bulk", transactionLinesController.createMultipleLines);

router.put("/bulk", transactionLinesController.updateMultipleLines);

router.delete("/bulk", transactionLinesController.deleteMultipleLines);

// Analytics & Reports - Admin and Manager only
router.get("/analytics/top-products", 
  requireRole(['ADMIN', 'MANAGER']), 
  transactionLinesController.getTopSellingProducts
);

router.get("/analytics/sales-by-period", 
  requireRole(['ADMIN', 'MANAGER']), 
  transactionLinesController.getSalesByPeriod
);

router.get("/analytics/revenue-breakdown", 
  requireRole(['ADMIN', 'MANAGER']), 
  transactionLinesController.getRevenueBreakdown
);

// Validation & Calculations - All authenticated users (for POS)
router.post("/:id/calculate-total", transactionLinesController.calculateLineTotal);

router.post("/validate-line", transactionLinesController.validateTransactionLine);

export default router;