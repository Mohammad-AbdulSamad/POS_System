import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all transaction lines
export const getAllTransactionLines = async (req, res) => {
  try {
    const lines = await prisma.transactionLine.findMany({
      include: {
        transaction: { select: { id: true, createdAt: true } },
        product: { select: { id: true, name: true, priceGross: true } },
      },
    });
    res.json(lines);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transaction lines", error: err.message });
  }
};

// 🟢 Get transaction line by ID
export const getTransactionLineById = async (req, res) => {
  try {
    const line = await prisma.transactionLine.findUnique({
      where: { id: req.params.id },
      include: {
        transaction: { select: { id: true, createdAt: true } },
        product: { select: { id: true, name: true, priceGross: true } },
      },
    });

    if (!line) return res.status(404).json({ message: "Transaction line not found" });
    res.json(line);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transaction line", error: err.message });
  }
};

// 🟢 Create transaction line
export const createTransactionLine = async (req, res) => {
  try {
    const { transactionId, productId, unitPrice, qty, discount, taxAmount, lineTotal } = req.body;

    const line = await prisma.transactionLine.create({
      data: { transactionId, productId, unitPrice, qty, discount, taxAmount, lineTotal },
    });

    res.status(201).json(line);
  } catch (err) {
    res.status(500).json({ message: "Error creating transaction line", error: err.message });
  }
};

// 🟢 Update transaction line
export const updateTransactionLine = async (req, res) => {
  try {
    const { transactionId, productId, unitPrice, qty, discount, taxAmount, lineTotal } = req.body;

    const line = await prisma.transactionLine.update({
      where: { id: req.params.id },
      data: { transactionId, productId, unitPrice, qty, discount, taxAmount, lineTotal },
    });

    res.json(line);
  } catch (err) {
    res.status(500).json({ message: "Error updating transaction line", error: err.message });
  }
};

// 🟢 Delete transaction line
export const deleteTransactionLine = async (req, res) => {
  try {
    await prisma.transactionLine.delete({ where: { id: req.params.id } });
    res.json({ message: "Transaction line deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting transaction line", error: err.message });
  }
};

// 🟢 Get lines by transaction
export const getLinesByTransaction = async (req, res) => {
  try {
    const lines = await prisma.transactionLine.findMany({
      where: { transactionId: req.params.transactionId },
      include: {
        product: { select: { id: true, name: true, priceGross: true } },
      },
    });

    res.json(lines);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transaction lines by transaction", error: err.message });
  }
};
