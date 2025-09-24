// routes/transactions.routes.js
import { Router } from "express";
import * as transactionsController from "../controllers/transactions.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", transactionsController.getAllTransactions);
router.get("/:id", transactionsController.getTransactionById);
router.post("/", transactionsController.createTransaction);
router.put("/:id", transactionsController.updateTransaction);
router.delete("/:id", transactionsController.deleteTransaction);

// Nested: get all transactions by branch
router.get("/branch/:branchId", transactionsController.getTransactionsByBranch);

// Nested: get all transactions by customer
router.get("/customer/:customerId", transactionsController.getTransactionsByCustomer);

// Additional endpoints
router.get("/:id/receipt", transactionsController.getTransactionReceipt);

export default router;