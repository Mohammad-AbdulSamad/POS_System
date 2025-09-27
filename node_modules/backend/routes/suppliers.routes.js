// routes/suppliers.routes.js
import { Router } from "express";
import * as suppliersController from "../controllers/suppliers.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", suppliersController.getAllSuppliers);
router.get("/search", suppliersController.searchSuppliers); // Must be before /:id to avoid conflict
router.get("/:id", suppliersController.getSupplierById);
router.post("/", suppliersController.createSupplier);
router.put("/:id", suppliersController.updateSupplier);
router.delete("/:id", suppliersController.deleteSupplier);

// Supplier-specific operations
router.get("/:id/products", suppliersController.getSupplierProducts);
router.get("/:id/analytics", suppliersController.getSupplierAnalytics);
router.get("/:id/reorder-products", suppliersController.getSupplierReorderProducts);

// Product management
router.post("/:id/assign-products", suppliersController.assignProductsToSupplier);

export default router;