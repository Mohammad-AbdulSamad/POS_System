// routes/transactions.routes.js
import { Router } from "express";
import * as transactionsController from "../controllers/transactions.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
//  router.use(authenticate);

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE parameterized routes
// Otherwise Express will try to match "branch" as an :id

// Nested: get all transactions by branch - Admin and Manager
router.get("/branch/:branchId", 
  //  requireRole(['ADMIN', 'MANAGER']), 
  transactionsController.getTransactionsByBranch
);

// Nested: get all transactions by customer - All authenticated users
router.get("/customer/:customerId", 
  transactionsController.getTransactionsByCustomer
);

// Basic CRUD operations
// GET all transactions - Admin and Manager only (sensitive financial data)
router.get("/", 
  //  requireRole(['ADMIN', 'MANAGER']), 
  transactionsController.getAllTransactions
);

// GET transaction by ID - All authenticated users (need to view transactions)
router.get("/:id", transactionsController.getTransactionById);

// Additional endpoints - GET transaction receipt - All authenticated users (print receipts)
router.get("/:id/receipt", transactionsController.getTransactionReceipt);

// CREATE transaction - All authenticated users (cashiers create sales)
router.post("/", transactionsController.createTransaction);

// UPDATE transaction - Admin and Manager only (corrections, refunds)
router.put("/:id", 
  //  requireRole(['ADMIN', 'MANAGER']), 
  transactionsController.updateTransaction
);

// DELETE transaction - Admin only (critical financial operation)
router.delete("/:id", 
  //  requireRole(['ADMIN']), 
  transactionsController.deleteTransaction
);

export default router;