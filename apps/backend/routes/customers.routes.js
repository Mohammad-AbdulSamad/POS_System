// routes/customers.routes.js
import { Router } from "express";
import * as customersController from "../controllers/customers.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", customersController.getAllCustomers);
router.get("/search", customersController.searchCustomers); // Must be before /:id to avoid conflict
router.get("/:id", customersController.getCustomerById);
router.post("/", customersController.createCustomer);
router.put("/:id", customersController.updateCustomer);
router.delete("/:id", customersController.deleteCustomer);

// Customer-specific operations
router.get("/:id/transactions", customersController.getCustomerTransactions);
router.get("/:id/loyalty-history", customersController.getCustomerLoyaltyHistory);
router.get("/:id/analytics", customersController.getCustomerAnalytics);

// Loyalty management
router.post("/:id/loyalty-points", customersController.updateCustomerLoyaltyPoints);

export default router;