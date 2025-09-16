import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all movements
export const getAllMovements = async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (err) {
    res.status(500).json({ message: "Error fetching stock movements", error: err.message });
  }
};

// 🟢 Get movements by product
export const getMovementsByProduct = async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { productId: req.params.productId },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product movements", error: err.message });
  }
};

// 🟢 Get movements by branch
export const getMovementsByBranch = async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { branchId: req.params.branchId },
      orderBy: { createdAt: "desc" },
    });
    res.json(movements);
  } catch (err) {
    res.status(500).json({ message: "Error fetching branch movements", error: err.message });
  }
};

// 🟢 Get current stock of a product in a branch
export const getCurrentStock = async (req, res) => {
  try {
    const { branchId, productId } = req.params;

    const result = await prisma.stockMovement.aggregate({
      where: { branchId, productId },
      _sum: { change: true },
    });

    const currentStock = result._sum.change || 0;
    res.json({ productId, branchId, currentStock });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stock", error: err.message });
  }
};

// 🟢 Create a stock movement
export const createMovement = async (req, res) => {
  try {
    const { productId, branchId, change, reason } = req.body;

    const movement = await prisma.stockMovement.create({
      data: { productId, branchId, change, reason },
      include: {
        product: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(movement);
  } catch (err) {
    res.status(500).json({ message: "Error creating stock movement", error: err.message });
  }
};

// 🟢 Delete stock movement (admin only)
export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;

    // In future: check if user has admin role before deleting

    await prisma.stockMovement.delete({
      where: { id },
    });

    res.json({ message: "Stock movement deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting stock movement", error: err.message });
  }
};