// routes/promotions.routes.js
import { Router } from "express";
import * as promotionsController from "../controllers/promotions.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", promotionsController.getAllPromotions);
router.get("/:id", promotionsController.getPromotionById);
router.post("/", promotionsController.createPromotion);
router.put("/:id", promotionsController.updatePromotion);
router.delete("/:id", promotionsController.deletePromotion);

// Promotion-specific operations
router.post("/calculate", promotionsController.calculateDiscount);
router.get("/:id/products", promotionsController.getPromotionProducts);

// Product and category management
router.post("/:id/assign-products", promotionsController.assignProductsToPromotion);
router.post("/:id/assign-categories", promotionsController.assignCategoriesToPromotion);

export default router;