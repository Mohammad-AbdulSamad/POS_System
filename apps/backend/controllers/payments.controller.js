import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        transaction: { select: { id: true, totalGross: true, createdAt: true } },
      },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching payments", error: err.message });
  }
};

// 🟢 Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        transaction: { select: { id: true, totalGross: true, createdAt: true } },
      },
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching payment", error: err.message });
  }
};

// 🟢 Create payment
export const createPayment = async (req, res) => {
  try {
    const { transactionId, method, amount } = req.body;

    const payment = await prisma.payment.create({
      data: { transactionId, method, amount },
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: "Error creating payment", error: err.message });
  }
};

// 🟢 Update payment
export const updatePayment = async (req, res) => {
  try {
    const { transactionId, method, amount } = req.body;

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { transactionId, method, amount },
    });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Error updating payment", error: err.message });
  }
};

// 🟢 Delete payment
export const deletePayment = async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting payment", error: err.message });
  }
};

// 🟢 Get all payments for a transaction
export const getPaymentsByTransaction = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { transactionId: req.params.transactionId },
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching payments by transaction", error: err.message });
  }
};
