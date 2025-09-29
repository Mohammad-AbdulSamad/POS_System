import { Router } from "express";
import * as returnsController from "../controllers/returns.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", returnsController.getAllReturns);
router.get("/:id", returnsController.getReturnById);
router.post("/", returnsController.createReturn);
router.put("/:id", returnsController.updateReturn);
router.delete("/:id", returnsController.deleteReturn);

// Transaction-specific operations
router.get("/transaction/:transactionId", returnsController.getReturnsByTransaction);
router.post("/transaction/:transactionId/process", returnsController.processReturn);

// Analytics & Reports
router.get("/analytics/summary", returnsController.getReturnsSummary);
router.get("/analytics/by-reason", returnsController.getReturnsByReason);
router.get("/analytics/by-period", returnsController.getReturnsByPeriod);
router.get("/analytics/trends", returnsController.getReturnTrends);

// Validation
router.post("/validate", returnsController.validateReturn);

export default router;