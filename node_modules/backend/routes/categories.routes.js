// routes/categories.routes.js
import { Router } from "express";
import * as categoriesController from "../controllers/categories.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", categoriesController.getAllCategories);
router.get("/:id", categoriesController.getCategoryById);
router.post("/", categoriesController.createCategory);
router.put("/:id", categoriesController.updateCategory);
router.delete("/:id", categoriesController.deleteCategory);

// Nested: get categories by branch
router.get("/branch/:branchId", categoriesController.getCategoriesByBranch);

// Category-specific operations
router.get("/:id/products", categoriesController.getCategoryProducts);
router.get("/:id/analytics", categoriesController.getCategoryAnalytics);

// Advanced category management
router.post("/:id/move-products", categoriesController.moveProductsToCategory);
router.post("/:id/duplicate", categoriesController.duplicateCategory);

export default router;