import { Router } from "express";
import * as transactionLinesController from "../controllers/transactionLines.controller.js";

const router = Router();

router.get("/", transactionLinesController.getAllTransactionLines);
router.get("/:id", transactionLinesController.getTransactionLineById);
router.post("/", transactionLinesController.createTransactionLine);
router.put("/:id", transactionLinesController.updateTransactionLine);
router.delete("/:id", transactionLinesController.deleteTransactionLine);

// Nested: get all lines for a transaction
router.get("/transaction/:transactionId", transactionLinesController.getLinesByTransaction);

export default router;
