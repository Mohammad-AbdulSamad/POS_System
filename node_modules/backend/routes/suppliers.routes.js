import { Router } from "express";
import * as suppliersController from "../controllers/suppliers.controller.js";

const router = Router();

router.get("/", suppliersController.getAllSuppliers);
router.get("/:id", suppliersController.getSupplierById);
router.post("/", suppliersController.createSupplier);
router.put("/:id", suppliersController.updateSupplier);
router.delete("/:id", suppliersController.deleteSupplier);

// Nested: get suppliers by product (optional example)
router.get("/product/:productId", suppliersController.getSuppliersByProduct);

export default router;
