import { Router } from "express";
import * as transactionLinesController from "../controllers/transactionLines.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", transactionLinesController.getAllTransactionLines);
router.get("/:id", transactionLinesController.getTransactionLineById);
router.post("/", transactionLinesController.createTransactionLine);
router.put("/:id", transactionLinesController.updateTransactionLine);
router.delete("/:id", transactionLinesController.deleteTransactionLine);

// Transaction-specific operations
router.get("/transaction/:transactionId", transactionLinesController.getLinesByTransaction);
router.post("/transaction/:transactionId/lines", transactionLinesController.addLineToTransaction);
router.delete("/transaction/:transactionId/lines/:lineId", transactionLinesController.removeLineFromTransaction);

// Product-specific operations
router.get("/product/:productId", transactionLinesController.getLinesByProduct);
router.get("/product/:productId/sales-stats", transactionLinesController.getProductSalesStats);

// Bulk operations
router.post("/bulk", transactionLinesController.createMultipleLines);
router.put("/bulk", transactionLinesController.updateMultipleLines);
router.delete("/bulk", transactionLinesController.deleteMultipleLines);

// Analytics & Reports
router.get("/analytics/top-products", transactionLinesController.getTopSellingProducts);
router.get("/analytics/sales-by-period", transactionLinesController.getSalesByPeriod);
router.get("/analytics/revenue-breakdown", transactionLinesController.getRevenueBreakdown);

// Validation & Calculations
router.post("/:id/calculate-total", transactionLinesController.calculateLineTotal);
router.post("/validate-line", transactionLinesController.validateTransactionLine);

export default router;