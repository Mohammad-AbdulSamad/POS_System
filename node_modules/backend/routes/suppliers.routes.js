// // routes/suppliers.routes.js
// import { Router } from "express";
// import * as suppliersController from "../controllers/suppliers.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", suppliersController.getAllSuppliers);
// router.get("/search", suppliersController.searchSuppliers); // Must be before /:id to avoid conflict
// router.get("/:id", suppliersController.getSupplierById);
// router.post("/", suppliersController.createSupplier);
// router.put("/:id", suppliersController.updateSupplier);
// router.delete("/:id", suppliersController.deleteSupplier);

// // Supplier-specific operations
// router.get("/:id/products", suppliersController.getSupplierProducts);
// router.get("/:id/analytics", suppliersController.getSupplierAnalytics);
// router.get("/:id/reorder-products", suppliersController.getSupplierReorderProducts);

// // Product management
// router.post("/:id/assign-products", suppliersController.assignProductsToSupplier);

// export default router;

// routes/suppliers.routes.js
import { Router } from "express";
import * as suppliersController from "../controllers/suppliers.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all suppliers - Admin, Manager, and Stock Manager
router.get("/", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  suppliersController.getAllSuppliers
);

// SEARCH suppliers - Admin, Manager, and Stock Manager
router.get("/search", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  suppliersController.searchSuppliers
);

// GET supplier by ID - Admin, Manager, and Stock Manager
router.get("/:id", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  suppliersController.getSupplierById
);

// CREATE supplier - Admin and Manager only
router.post("/", 
  requireRole(['ADMIN', 'MANAGER']), 
  suppliersController.createSupplier
);

// UPDATE supplier - Admin and Manager only
router.put("/:id", 
  requireRole(['ADMIN', 'MANAGER']), 
  suppliersController.updateSupplier
);

// DELETE supplier - Admin only
router.delete("/:id", 
  requireRole(['ADMIN']), 
  suppliersController.deleteSupplier
);

// Supplier-specific operations
// GET supplier products - Admin, Manager, and Stock Manager
router.get("/:id/products", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  suppliersController.getSupplierProducts
);

// GET supplier analytics - Admin and Manager only
router.get("/:id/analytics", 
  requireRole(['ADMIN', 'MANAGER']), 
  suppliersController.getSupplierAnalytics
);

// GET reorder products - Admin, Manager, and Stock Manager
router.get("/:id/reorder-products", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  suppliersController.getSupplierReorderProducts
);

// Product management - Admin, Manager, and Stock Manager
router.post("/:id/assign-products", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  suppliersController.assignProductsToSupplier
);

export default router;