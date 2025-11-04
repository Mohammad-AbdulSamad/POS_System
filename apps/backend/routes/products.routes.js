// import { Router } from "express";
// import * as productsController from "../controllers/products.controller.js";

// const router = Router();

// // Core CRUD
// router.get("/", productsController.getAllProducts);
// router.get("/:id", productsController.getProductById);
// router.post("/", productsController.createProduct);
// router.put("/:id", productsController.updateProduct);
// router.delete("/:id", productsController.deleteProduct);

// // Product lookups (place before ':id' if patterns may conflict)
// router.get("/barcode/:barcode", productsController.getProductByBarcode);
// router.get("/sku/:branchId/:sku", productsController.getProductBySku);

// // Branch / category scoped lists
// router.get("/branch/:branchId", productsController.getProductsByBranch);
// router.get("/branch/:branchId/low-stock", productsController.getLowStockProducts);
// router.get("/branch/:branchId/out-of-stock", productsController.getOutOfStockProducts);
// router.get("/branch/:branchId/inactive", productsController.getInactiveProducts);

// router.get("/category/:categoryId", productsController.getProductsByCategory);

// // Search / autocomplete
// router.get("/search", productsController.searchProductsByName);

// // Stock & history
// router.patch("/:id/stock", productsController.updateStock);
// router.get("/:id/stock-history", productsController.getStockHistory);

// // Price & status updates
// router.patch("/:id/price", productsController.updatePrice);
// router.patch("/:id/toggle-active", productsController.toggleProductActive);

// // Bulk operations
// router.patch("/bulk", productsController.bulkUpdateProducts);

// export default router;

// routes/products.routes.js
import { Router } from "express";
import * as productsController from "../controllers/products.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
// router.use(authenticate);

// Core CRUD
// GET all products - All authenticated users
router.get("/", productsController.getAllProducts);

// GET product by ID - All authenticated users
router.get("/:id", productsController.getProductById);

// CREATE product - Admin, Manager, and Stock Manager
router.post("/", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  productsController.createProduct
);

// UPDATE product - Admin, Manager, and Stock Manager
router.put("/:id", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  productsController.updateProduct
);

// DELETE product - Admin and Manager only
router.delete("/:id", 
  // requireRole(['ADMIN', 'MANAGER']), 
  productsController.deleteProduct
);

// Product lookups - All authenticated users (for POS scanning)
router.get("/barcode/:barcode", productsController.getProductByBarcode);
router.get("/sku/:branchId/:sku", productsController.getProductBySku);

// Branch / category scoped lists - All authenticated users
router.get("/branch/:branchId", productsController.getProductsByBranch);
router.get("/branch/:branchId/low-stock", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  productsController.getLowStockProducts
);
router.get("/branch/:branchId/out-of-stock", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  productsController.getOutOfStockProducts
);
router.get("/branch/:branchId/inactive", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  productsController.getInactiveProducts
);

router.get("/category/:categoryId", productsController.getProductsByCategory);

// Search / autocomplete - All authenticated users
router.get("/search", productsController.searchProductsByName);

// Stock & history - Stock Manager, Manager, and Admin
router.patch("/:id/stock", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  productsController.updateStock
);
router.get("/:id/stock-history", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']),
  productsController.getStockHistory
);

// Price & status updates - Admin, Manager, and Stock Manager
router.patch("/:id/price", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  productsController.updatePrice
);
router.patch("/:id/toggle-active", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  productsController.toggleProductActive
);

// Bulk operations - Admin, Manager, and Stock Manager
router.patch("/bulk", 
  // requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  productsController.bulkUpdateProducts
);

export default router;