// routes/taxrates.routes.js
import { Router } from "express";
import * as taxRatesController from "../controllers/taxrates.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", taxRatesController.getAllTaxRates);
router.get("/:id", taxRatesController.getTaxRateById);
router.post("/", taxRatesController.createTaxRate);
router.put("/:id", taxRatesController.updateTaxRate);
router.delete("/:id", taxRatesController.deleteTaxRate);

// Tax rate specific operations
router.get("/:id/products", taxRatesController.getTaxRateProducts);
router.get("/:id/analytics", taxRatesController.getTaxRateAnalytics);

// Product management
router.post("/:id/assign-products", taxRatesController.assignProductsToTaxRate);

// Utility operations
router.post("/calculate", taxRatesController.calculateTax);

export default router;