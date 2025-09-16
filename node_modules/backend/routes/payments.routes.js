import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";

const router = Router();

router.get("/", paymentsController.getAllPayments);
router.get("/:id", paymentsController.getPaymentById);
router.post("/", paymentsController.createPayment);
router.put("/:id", paymentsController.updatePayment);
router.delete("/:id", paymentsController.deletePayment);

// Nested route: all payments for a transaction
router.get("/transaction/:transactionId", paymentsController.getPaymentsByTransaction);

export default router;
