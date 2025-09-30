// routes/users.routes.js
import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";

const router = Router();

// Basic CRUD operations
router.get("/", usersController.getAllUsers);
router.get("/:id", usersController.getUserById);
router.post("/", usersController.createUser);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);

// Branch-specific operations
router.get("/branch/:branchId", usersController.getUsersByBranch);

// Role-specific operations
router.get("/role/:role", usersController.getUsersByRole);

// User statistics
router.get("/:userId/stats", usersController.getUserStats);

// Password management
router.post("/:id/change-password", usersController.changePassword);
router.post("/:id/reset-password", usersController.resetPassword);

// Analytics & Summary
router.get("/analytics/summary", usersController.getUsersSummary);

// Validation
router.post("/validate/email", usersController.validateEmail);

export default router;