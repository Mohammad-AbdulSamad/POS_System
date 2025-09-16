import { Router } from "express";
import * as branchesController from "../controllers/branches.controller.js";

const router = Router();

router.get("/", branchesController.getAllBranches);
router.get("/:id", branchesController.getBranchById);
router.post("/", branchesController.createBranch);
router.put("/:id", branchesController.updateBranch);
router.delete("/:id", branchesController.deleteBranch);

export default router;
