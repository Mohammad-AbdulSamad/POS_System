import { Router } from "express";
import * as stockMovementsController from "../controllers/stockMovements.controller.js";

const router = Router();

// Get all stock movements
router.get("/", stockMovementsController.getAllMovements);

// Get movements for a specific product
router.get("/product/:productId", stockMovementsController.getMovementsByProduct);

// Get movements for a specific branch
router.get("/branch/:branchId", stockMovementsController.getMovementsByBranch);

// Get current stock (aggregate) for product in branch
router.get("/branch/:branchId/product/:productId", stockMovementsController.getCurrentStock);

// Create new stock movement
router.post("/", stockMovementsController.createMovement);

// Delete stock movement (🔒 admin only — for later auth)
router.delete("/:id", stockMovementsController.deleteMovement);

export default router;
