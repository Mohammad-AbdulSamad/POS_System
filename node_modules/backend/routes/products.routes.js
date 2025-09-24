import { Router } from "express";
import * as productsController from "../controllers/products.controller.js";

const router = Router();

// Core CRUD
router.get("/", productsController.getAllProducts);
router.get("/:id", productsController.getProductById);
router.post("/", productsController.createProduct);
router.put("/:id", productsController.updateProduct);
router.delete("/:id", productsController.deleteProduct);

// Product lookups (place before ':id' if patterns may conflict)
router.get("/barcode/:barcode", productsController.getProductByBarcode);
router.get("/sku/:branchId/:sku", productsController.getProductBySku);

// Branch / category scoped lists
router.get("/branch/:branchId", productsController.getProductsByBranch);
router.get("/branch/:branchId/low-stock", productsController.getLowStockProducts);
router.get("/branch/:branchId/out-of-stock", productsController.getOutOfStockProducts);
router.get("/branch/:branchId/inactive", productsController.getInactiveProducts);

router.get("/category/:categoryId", productsController.getProductsByCategory);

// Search / autocomplete
router.get("/search", productsController.searchProductsByName);

// Stock & history
router.patch("/:id/stock", productsController.updateStock);
router.get("/:id/stock-history", productsController.getStockHistory);

// Price & status updates
router.patch("/:id/price", productsController.updatePrice);
router.patch("/:id/toggle-active", productsController.toggleProductActive);

// Bulk operations
router.patch("/bulk", productsController.bulkUpdateProducts);

export default router;
