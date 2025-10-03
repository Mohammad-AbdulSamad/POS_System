// // routes/transactions.routes.js
// import { Router } from "express";
// import * as transactionsController from "../controllers/transactions.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", transactionsController.getAllTransactions);
// router.get("/:id", transactionsController.getTransactionById);
// router.post("/", transactionsController.createTransaction);
// router.put("/:id", transactionsController.updateTransaction);
// router.delete("/:id", transactionsController.deleteTransaction);

// // Nested: get all transactions by branch
// router.get("/branch/:branchId", transactionsController.getTransactionsByBranch);

// // Nested: get all transactions by customer
// router.get("/customer/:customerId", transactionsController.getTransactionsByCustomer);

// // Additional endpoints
// router.get("/:id/receipt", transactionsController.getTransactionReceipt);

// export default router;

// routes/transactions.routes.js
import { Router } from "express";
import * as transactionsController from "../controllers/transactions.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all transactions - Admin and Manager only (sensitive financial data)
router.get("/", 
  requireRole(['ADMIN', 'MANAGER']), 
  transactionsController.getAllTransactions
);

// GET transaction by ID - All authenticated users (need to view transactions)
router.get("/:id", transactionsController.getTransactionById);

// CREATE transaction - All authenticated users (cashiers create sales)
router.post("/", transactionsController.createTransaction);

// UPDATE transaction - Admin and Manager only (corrections, refunds)
router.put("/:id", 
  requireRole(['ADMIN', 'MANAGER']), 
  transactionsController.updateTransaction
);

// DELETE transaction - Admin only (critical financial operation)
router.delete("/:id", 
  requireRole(['ADMIN']), 
  transactionsController.deleteTransaction
);

// Nested: get all transactions by branch - Admin and Manager
router.get("/branch/:branchId", 
  requireRole(['ADMIN', 'MANAGER']), 
  transactionsController.getTransactionsByBranch
);

// Nested: get all transactions by customer - All authenticated users
router.get("/customer/:customerId", 
  transactionsController.getTransactionsByCustomer
);

// Additional endpoints
// GET transaction receipt - All authenticated users (print receipts)
router.get("/:id/receipt", transactionsController.getTransactionReceipt);

export default router;