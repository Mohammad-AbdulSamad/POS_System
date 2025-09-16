import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all tax rates
export const getAllTaxRates = async (req, res) => {
  try {
    const taxRates = await prisma.taxRate.findMany({
      select: {
        id: true,
        name: true,
        rate: true,
      },
    });
    res.json(taxRates);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tax rates", error: err.message });
  }
};

// 🟢 Get a tax rate by ID
export const getTaxRateById = async (req, res) => {
  try {
    const taxRate = await prisma.taxRate.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        rate: true,
      },
    });

    if (!taxRate) return res.status(404).json({ message: "Tax rate not found" });
    res.json(taxRate);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tax rate", error: err.message });
  }
};

// 🟢 Create a tax rate
export const createTaxRate = async (req, res) => {
  try {
    const { name, rate } = req.body;

    const taxRate = await prisma.taxRate.create({
      data: { name, rate },
      select: { id: true, name: true, rate: true },
    });

    res.status(201).json(taxRate);
  } catch (err) {
    res.status(500).json({ message: "Error creating tax rate", error: err.message });
  }
};

// 🟢 Update a tax rate
export const updateTaxRate = async (req, res) => {
  try {
    const { name, rate } = req.body;

    const taxRate = await prisma.taxRate.update({
      where: { id: req.params.id },
      data: { name, rate },
      select: { id: true, name: true, rate: true },
    });

    res.json(taxRate);
  } catch (err) {
    res.status(500).json({ message: "Error updating tax rate", error: err.message });
  }
};

// 🟢 Delete a tax rate
export const deleteTaxRate = async (req, res) => {
  try {
    await prisma.taxRate.delete({ where: { id: req.params.id } });
    res.json({ message: "Tax rate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting tax rate", error: err.message });
  }
};
