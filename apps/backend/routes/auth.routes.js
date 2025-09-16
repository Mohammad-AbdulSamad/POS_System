import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { getUsers, getUser, createUser, updateUser, deleteUser } from "../controllers/user.controller.js";

const router = express.Router();

// Only ADMIN and MANAGER can list all users
router.get("/", authenticate, authorize("ADMIN", "MANAGER"), getUsers);

// Anyone authenticated can view their own user (or admin/manager can see others)
router.get("/:id", authenticate, getUser);

// Only ADMIN can create/update/delete users
router.post("/", authenticate, authorize("ADMIN"), createUser);
router.put("/:id", authenticate, authorize("ADMIN"), updateUser);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteUser);

export default router;
