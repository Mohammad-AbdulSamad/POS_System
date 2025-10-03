// routes/returns.routes.js
import { Router } from "express";
import * as returnsController from "../controllers/returns.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all returns - Admin and Manager only (financial sensitive data)
router.get("/", 
  requireRole(['ADMIN', 'MANAGER']), 
  returnsController.getAllReturns
);

// GET return by ID - Admin, Manager, and Cashier (cashiers process returns)
router.get("/:id", returnsController.getReturnById);

// CREATE return - All authenticated users (cashiers process returns)
router.post("/", returnsController.createReturn);

// UPDATE return - Admin and Manager only (modify return records)
router.put("/:id", 
  requireRole(['ADMIN', 'MANAGER']), 
  returnsController.updateReturn
);

// DELETE return - Admin only (critical financial operation)
router.delete("/:id", 
  requireRole(['ADMIN']), 
  returnsController.deleteReturn
);

// Transaction-specific operations
// GET returns by transaction - All authenticated users
router.get("/transaction/:transactionId", returnsController.getReturnsByTransaction);

// PROCESS return - All authenticated users (cashiers process returns)
router.post("/transaction/:transactionId/process", returnsController.processReturn);

// Analytics & Reports - Admin and Manager only
router.get("/analytics/summary", 
  requireRole(['ADMIN', 'MANAGER']), 
  returnsController.getReturnsSummary
);

router.get("/analytics/by-reason", 
  requireRole(['ADMIN', 'MANAGER']), 
  returnsController.getReturnsByReason
);

router.get("/analytics/by-period", 
  requireRole(['ADMIN', 'MANAGER']), 
  returnsController.getReturnsByPeriod
);

router.get("/analytics/trends", 
  requireRole(['ADMIN', 'MANAGER']), 
  returnsController.getReturnTrends
);

// Validation - All authenticated users (validate before processing)
router.post("/validate", returnsController.validateReturn);

export default router;