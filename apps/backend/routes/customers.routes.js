import { Router } from "express";
import * as customersController from "../controllers/customers.controller.js";

const router = Router();

router.get("/", customersController.getAllCustomers);
router.get("/:id", customersController.getCustomerById);
router.post("/", customersController.createCustomer);
router.put("/:id", customersController.updateCustomer);
router.delete("/:id", customersController.deleteCustomer);

// Nested: get all transactions of a customer
router.get("/:id/transactions", customersController.getCustomerTransactions);

export default router;
