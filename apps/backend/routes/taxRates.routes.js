// // routes/taxrates.routes.js
// import { Router } from "express";
// import * as taxRatesController from "../controllers/taxrates.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", taxRatesController.getAllTaxRates);
// router.get("/:id", taxRatesController.getTaxRateById);
// router.post("/", taxRatesController.createTaxRate);
// router.put("/:id", taxRatesController.updateTaxRate);
// router.delete("/:id", taxRatesController.deleteTaxRate);

// // Tax rate specific operations
// router.get("/:id/products", taxRatesController.getTaxRateProducts);
// router.get("/:id/analytics", taxRatesController.getTaxRateAnalytics);

// // Product management
// router.post("/:id/assign-products", taxRatesController.assignProductsToTaxRate);

// // Utility operations
// router.post("/calculate", taxRatesController.calculateTax);

// export default router;
// routes/taxRates.routes.js
import { Router } from "express";
import * as taxRatesController from "../controllers/taxrates.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all tax rates - All authenticated users (need for POS operations)
router.get("/", taxRatesController.getAllTaxRates);

// GET tax rate by ID - All authenticated users
router.get("/:id", taxRatesController.getTaxRateById);

// CREATE tax rate - Admin only (regulatory/compliance)
router.post("/", 
  requireRole(['ADMIN']), 
  taxRatesController.createTaxRate
);

// UPDATE tax rate - Admin only (regulatory/compliance)
router.put("/:id", 
  requireRole(['ADMIN']), 
  taxRatesController.updateTaxRate
);

// DELETE tax rate - Admin only (regulatory/compliance)
router.delete("/:id", 
  requireRole(['ADMIN']), 
  taxRatesController.deleteTaxRate
);

// Tax rate specific operations
// GET products with this tax rate - Admin, Manager, Stock Manager
router.get("/:id/products", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  taxRatesController.getTaxRateProducts
);

// GET tax rate analytics - Admin and Manager only
router.get("/:id/analytics", 
  requireRole(['ADMIN', 'MANAGER']), 
  taxRatesController.getTaxRateAnalytics
);

// Product management - Admin, Manager, Stock Manager
router.post("/:id/assign-products", 
  requireRole(['ADMIN', 'MANAGER', 'STOCK_MANAGER']), 
  taxRatesController.assignProductsToTaxRate
);

// Utility operations - All authenticated users (for POS calculations)
router.post("/calculate", taxRatesController.calculateTax);

export default router;