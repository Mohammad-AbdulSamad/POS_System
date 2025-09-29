import { Router } from "express";
import * as stockMovementsController from "../controllers/stockMovements.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", stockMovementsController.getAllStockMovements);
router.get("/:id", stockMovementsController.getStockMovementById);
router.post("/", stockMovementsController.createStockMovement);
router.put("/:id", stockMovementsController.updateStockMovement);
router.delete("/:id", stockMovementsController.deleteStockMovement);

// Product-specific operations
router.get("/product/:productId", stockMovementsController.getMovementsByProduct);
router.get("/product/:productId/history", stockMovementsController.getProductStockHistory);
router.get("/product/:productId/current-stock", stockMovementsController.getCurrentProductStock);

// Branch-specific operations
router.get("/branch/:branchId", stockMovementsController.getMovementsByBranch);
router.get("/branch/:branchId/summary", stockMovementsController.getBranchStockSummary);
router.get("/branch/:branchId/low-stock", stockMovementsController.getLowStockProducts);

// Reason-based filtering
router.get("/reason/:reason", stockMovementsController.getMovementsByReason);

// Bulk operations
router.post("/bulk", stockMovementsController.createBulkMovements);
router.post("/bulk-adjustment", stockMovementsController.bulkStockAdjustment);

// Stock operations
router.post("/receive-stock", stockMovementsController.receiveStock);
router.post("/adjust-stock", stockMovementsController.adjustStock);
router.post("/transfer-stock", stockMovementsController.transferStock);
router.post("/record-sale", stockMovementsController.recordSale);
router.post("/record-spoilage", stockMovementsController.recordSpoilage);

// Analytics & Reports
router.get("/analytics/movement-trends", stockMovementsController.getMovementTrends);
router.get("/analytics/stock-velocity", stockMovementsController.getStockVelocity);
router.get("/analytics/waste-report", stockMovementsController.getWasteReport);
router.get("/analytics/turnover-rate", stockMovementsController.getTurnoverRate);

// Validation & Reconciliation
router.post("/validate-stock", stockMovementsController.validateCurrentStock);
router.post("/reconcile-stock", stockMovementsController.reconcileStock);
router.get("/discrepancies", stockMovementsController.getStockDiscrepancies);

export default router;