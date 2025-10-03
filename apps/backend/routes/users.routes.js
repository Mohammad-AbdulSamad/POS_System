// // routes/users.routes.js
// import { Router } from "express";
// import * as usersController from "../controllers/users.controller.js";

// const router = Router();

// // Basic CRUD operations
// router.get("/", usersController.getAllUsers);
// router.get("/:id", usersController.getUserById);
// router.post("/", usersController.createUser);
// router.put("/:id", usersController.updateUser);
// router.delete("/:id", usersController.deleteUser);

// // Branch-specific operations
// router.get("/branch/:branchId", usersController.getUsersByBranch);

// // Role-specific operations
// router.get("/role/:role", usersController.getUsersByRole);

// // User statistics
// router.get("/:userId/stats", usersController.getUserStats);

// // Password management
// router.post("/:id/change-password", usersController.changePassword);
// router.post("/:id/reset-password", usersController.resetPassword);

// // Analytics & Summary
// router.get("/analytics/summary", usersController.getUsersSummary);

// // Validation
// router.post("/validate/email", usersController.validateEmail);

// export default router;

// routes/users.routes.js
import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { authenticate, requireRole, requireOwnership, requireSameBranch } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Basic CRUD operations
// GET all users - Admin and Manager only
router.get("/", 
  requireRole(['ADMIN', 'MANAGER']), 
  usersController.getAllUsers
);

// GET user by ID - Admin, Manager, or self
router.get("/:id", usersController.getUserById);

// CREATE user - Admin only
router.post("/", 
  requireRole(['ADMIN']), 
  usersController.createUser
);

// UPDATE user - Admin or self (for own profile)
router.put("/:id", usersController.updateUser);

// DELETE user - Admin only
router.delete("/:id", 
  requireRole(['ADMIN']), 
  usersController.deleteUser
);

// Branch-specific operations - All users in the same branch
router.get("/branch/:branchId", 
  requireSameBranch, 
  usersController.getUsersByBranch
);

// Role-specific operations - Admin and Manager only
router.get("/role/:role", 
  requireRole(['ADMIN', 'MANAGER']), 
  usersController.getUsersByRole
);

// User statistics - Admin, Manager, or self
router.get("/:userId/stats", usersController.getUserStats);

// Password management
// Change password - User can only change their own password
router.post("/:id/change-password", 
  requireOwnership('id'), 
  usersController.changePassword
);

// Reset password - Admin only (for resetting other users' passwords)
router.post("/:id/reset-password", 
  requireRole(['ADMIN']), 
  usersController.resetPassword
);

// Analytics & Summary - Admin and Manager only
router.get("/analytics/summary", 
  requireRole(['ADMIN', 'MANAGER']), 
  usersController.getUsersSummary
);

// Validation - All authenticated users
router.post("/validate/email", usersController.validateEmail);

export default router;