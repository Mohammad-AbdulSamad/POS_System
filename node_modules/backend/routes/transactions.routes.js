import { Router } from "express";
import * as transactionsController from "../controllers/transactions.controller.js";

const router = Router();

router.get("/", transactionsController.getAllTransactions);
router.get("/:id", transactionsController.getTransactionById);
router.post("/", transactionsController.createTransaction);
router.put("/:id", transactionsController.updateTransaction);
router.delete("/:id", transactionsController.deleteTransaction);

// Nested: get all transactions by branch
router.get("/branch/:branchId", transactionsController.getTransactionsByBranch);

// Nested: get all transactions by customer
router.get("/customer/:customerId", transactionsController.getTransactionsByCustomer);

export default router;
