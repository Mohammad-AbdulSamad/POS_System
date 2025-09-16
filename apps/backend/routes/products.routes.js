import { Router } from "express";
import * as productsController from "../controllers/products.controller.js";

const router = Router();

// CRUD
router.get("/", productsController.getAllProducts);
router.get("/:id", productsController.getProductById);
router.post("/", productsController.createProduct);
router.put("/:id", productsController.updateProduct);
router.delete("/:id", productsController.deleteProduct);

// Extra: by branch
router.get("/branch/:branchId", productsController.getProductsByBranch);

// Extra: by category
router.get("/category/:categoryId", productsController.getProductsByCategory);

export default router;
