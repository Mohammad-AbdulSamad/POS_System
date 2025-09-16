// controllers/branches.controller.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 Get all branches
export const getAllBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        users: true,
        products: true,
        categories: true,
        stockMovements: true,
      },
    });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ message: "Error fetching branches", error: err.message });
  }
};

// 🟢 Get branch by ID
export const getBranchById = async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.id },
      include: {
        users: true,
        products: true,
        categories: true,
        stockMovements: true,
      },
    });
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: "Error fetching branch", error: err.message });
  }
};

// 🟢 Create branch
export const createBranch = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const newBranch = await prisma.branch.create({
      data: { name, address, phone },
    });
    res.status(201).json(newBranch);
  } catch (err) {
    res.status(500).json({ message: "Error creating branch", error: err.message });
  }
};

// 🟢 Update branch
export const updateBranch = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const updatedBranch = await prisma.branch.update({
      where: { id: req.params.id },
      data: { name, address, phone },
    });
    res.json(updatedBranch);
  } catch (err) {
    res.status(500).json({ message: "Error updating branch", error: err.message });
  }
};

// 🟢 Delete branch
export const deleteBranch = async (req, res) => {
  try {
    await prisma.branch.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting branch", error: err.message });
  }
};
