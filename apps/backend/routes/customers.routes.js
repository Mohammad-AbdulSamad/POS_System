// // routes/customers.routes.js
// import { Router } from "express";
// import * as customersController from "../controllers/customers.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", customersController.getAllCustomers);
// router.get("/search", customersController.searchCustomers); // Must be before /:id to avoid conflict
// router.get("/:id", customersController.getCustomerById);
// router.post("/", customersController.createCustomer);
// router.put("/:id", customersController.updateCustomer);
// router.delete("/:id", customersController.deleteCustomer);

// // Customer-specific operations
// router.get("/:id/transactions", customersController.getCustomerTransactions);
// router.get("/:id/loyalty-history", customersController.getCustomerLoyaltyHistory);
// router.get("/:id/analytics", customersController.getCustomerAnalytics);

// // Loyalty management
// router.post("/:id/loyalty-points", customersController.updateCustomerLoyaltyPoints);

// export default router;

// routes/customers.routes.js
import { Router } from "express";
import * as customersController from "../controllers/customers.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all customers - Admin and Manager only (contains PII)
router.get("/", 
  requireRole(['ADMIN', 'MANAGER']), 
  customersController.getAllCustomers
);

// SEARCH customers - All authenticated users (for POS operations)
router.get("/search", customersController.searchCustomers);

// GET customer by ID - All authenticated users (need for transactions)
router.get("/:id", customersController.getCustomerById);

// CREATE customer - All authenticated users (cashier can add new customers)
router.post("/", customersController.createCustomer);

// UPDATE customer - Admin, Manager, or the customer can update their info
router.put("/:id", 
  requireRole(['ADMIN', 'MANAGER', 'CASHIER']), // Cashiers can update basic info
  customersController.updateCustomer
);

// DELETE customer - Admin and Manager only
router.delete("/:id", 
  requireRole(['ADMIN', 'MANAGER']), 
  customersController.deleteCustomer
);

// Customer-specific operations
// GET customer transactions - All authenticated users
router.get("/:id/transactions", customersController.getCustomerTransactions);

// GET loyalty history - All authenticated users
router.get("/:id/loyalty-history", customersController.getCustomerLoyaltyHistory);

// GET customer analytics - Admin and Manager only
router.get("/:id/analytics", 
  requireRole(['ADMIN', 'MANAGER']),
  customersController.getCustomerAnalytics
);

// Loyalty management - All authenticated users (cashiers give points)
router.post("/:id/loyalty-points", customersController.updateCustomerLoyaltyPoints);

export default router;