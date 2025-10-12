// import { Router } from "express";
// import * as paymentsController from "../controllers/payments.controller.js";

// const router = Router();

// router.get("/", paymentsController.getAllPayments);
// router.get("/:id", paymentsController.getPaymentById);
// router.post("/", paymentsController.createPayment);
// router.put("/:id", paymentsController.updatePayment);
// router.delete("/:id", paymentsController.deletePayment);

// // Nested route: all payments for a transaction
// router.get("/transaction/:transactionId", paymentsController.getPaymentsByTransaction);

// export default router;

// routes/payments.routes.js
import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Analytics routes - Must come before /:id
// GET analytics - Admin and Manager only
router.get("/analytics/overview", 
  requireRole(['ADMIN', 'MANAGER']),
  paymentsController.getPaymentAnalytics
);

// Multiple payments route - Must come before /:id
// POST multiple payments - All authenticated users (cashiers process payments)
router.post("/multiple", 
  paymentsController.processMultiplePayments
);

// Transaction-specific route - Must come before /:id
// GET payments by transaction - All authenticated users
router.get("/transaction/:transactionId", 
  paymentsController.getPaymentsByTransaction
);

// Basic CRUD operations
// GET all payments - All authenticated users
router.get("/", 
  paymentsController.getAllPayments
);

// GET payment by ID - All authenticated users
router.get("/:id", 
  paymentsController.getPaymentById
);

// CREATE payment - All authenticated users (cashiers need to process payments)
router.post("/", 
  paymentsController.createPayment
);

// UPDATE payment - All authenticated users (for corrections)
router.put("/:id", 
  paymentsController.updatePayment
);

// DELETE payment - Admin and Manager only (sensitive operation)
router.delete("/:id", 
  requireRole(['ADMIN', 'MANAGER']),
  paymentsController.deletePayment
);

export default router;