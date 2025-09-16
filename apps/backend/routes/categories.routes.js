import { Router } from "express";
import * as categoriesController from "../controllers/categories.controller.js";

const router = Router();

router.get("/", categoriesController.getAllCategories);
router.get("/:id", categoriesController.getCategoryById);
router.post("/", categoriesController.createCategory);
router.put("/:id", categoriesController.updateCategory);
router.delete("/:id", categoriesController.deleteCategory);


// Nested: get categories by branch
router.get("/branch/:branchId", categoriesController.getCategoriesByBranch);

export default router;
