import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";

const router = Router();

// List all users (admin/manager only)
router.get("/", usersController.getUsers);

// Get one user
router.get("/:id", usersController.getUser);

// Create new user
router.post("/", usersController.createUser);

// Update user
router.put("/:id", usersController.updateUser);

// Delete user
router.delete("/:id", usersController.deleteUser);

export default router;
