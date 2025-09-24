import { Router } from "express";
import * as branchesController from "../controllers/branches.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", branchesController.getAllBranches);
router.get("/:id", branchesController.getBranchById);
router.post("/", branchesController.createBranch);
router.put("/:id", branchesController.updateBranch);
router.delete("/:id", branchesController.deleteBranch);

// Enhanced branch-specific operations
router.get("/:id/products", branchesController.getBranchProducts);
router.get("/:id/categories", branchesController.getBranchCategories);
router.get("/:id/users", branchesController.getBranchUsers);
router.get("/:id/transactions", branchesController.getBranchTransactions);
router.get("/:id/stock-movements", branchesController.getBranchStockMovements);

// Analytics and reports
router.get("/:id/analytics", branchesController.getBranchAnalytics);
router.get("/:id/inventory-status", branchesController.getInventoryStatus);

export default router;