import { Router } from "express";
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from "../controllers/promotions.controller.js";

const router = Router();

router.post("/", createPromotion);        // Create promotion
router.get("/", getPromotions);           // List promotions
router.get("/:id", getPromotionById);     // Get single promotion
router.put("/:id", updatePromotion);      // Update promotion
router.delete("/:id", deletePromotion);   // Delete promotion (later restrict to admin)

export default router;
