import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        branchId: true,
      },
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories", error: err.message });
  }
};

// 🟢 Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
      },
    });

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Error fetching category", error: err.message });
  }
};

// 🟢 Create category
export const createCategory = async (req, res) => {
  try {
    const { name, branchId } = req.body;

    const category = await prisma.category.create({
      data: { name, branchId },
      select: { id: true, name: true, branchId: true },
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Error creating category", error: err.message });
  }
};

// 🟢 Update category
export const updateCategory = async (req, res) => {
  try {
    const { name, branchId } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, branchId },
      select: { id: true, name: true, branchId: true },
    });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Error updating category", error: err.message });
  }
};

// 🟢 Delete category
export const deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting category", error: err.message });
  }
};

// 🟢 Get categories by branchId
export const getCategoriesByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const categories = await prisma.category.findMany({
      where: { branchId },
      select: { id: true, name: true, branchId: true },
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Error fetching branch categories", error: err.message });
  }
};