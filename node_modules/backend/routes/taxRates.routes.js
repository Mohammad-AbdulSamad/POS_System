import { Router } from "express";
import * as taxRatesController from "../controllers/taxRates.controller.js";

const router = Router();

// Get all tax rates
router.get("/", taxRatesController.getAllTaxRates);

// Get a single tax rate by ID
router.get("/:id", taxRatesController.getTaxRateById);

// Create a new tax rate
router.post("/", taxRatesController.createTaxRate);

// Update an existing tax rate
router.put("/:id", taxRatesController.updateTaxRate);

// Delete a tax rate
router.delete("/:id", taxRatesController.deleteTaxRate);

export default router;
