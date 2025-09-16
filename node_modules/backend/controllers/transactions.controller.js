import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transactions", error: err.message });
  }
};

// 🟢 Get transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        branch: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        lines: true,
        payments: true,
      },
    });

    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transaction", error: err.message });
  }
};

// 🟢 Create transaction
export const createTransaction = async (req, res) => {
  try {
    const { branchId, cashierId, customerId, totalGross, totalTax, totalNet, metadata } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        branchId,
        cashierId,
        customerId,
        totalGross,
        totalTax,
        totalNet,
        metadata,
      },
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Error creating transaction", error: err.message });
  }
};

// 🟢 Update transaction
export const updateTransaction = async (req, res) => {
  try {
    const { branchId, cashierId, customerId, totalGross, totalTax, totalNet, metadata } = req.body;

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { branchId, cashierId, customerId, totalGross, totalTax, totalNet, metadata },
    });

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Error updating transaction", error: err.message });
  }
};

// 🟢 Delete transaction
export const deleteTransaction = async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting transaction", error: err.message });
  }
};

// 🟢 Get transactions by branch
export const getTransactionsByBranch = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { branchId: req.params.branchId },
      include: { customer: { select: { id: true, name: true } } },
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching branch transactions", error: err.message });
  }
};

// 🟢 Get transactions by customer
export const getTransactionsByCustomer = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { customerId: req.params.customerId },
      include: { branch: { select: { id: true, name: true } } },
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching customer transactions", error: err.message });
  }
};
