import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching suppliers", error: err.message });
  }
};

// 🟢 Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
        products: {
          select: { id: true, name: true, sku: true, priceGross: true },
        },
      },
    });

    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: "Error fetching supplier", error: err.message });
  }
};

// 🟢 Create supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const supplier = await prisma.supplier.create({
      data: { name, phone, address },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ message: "Error creating supplier", error: err.message });
  }
};

// 🟢 Update supplier
export const updateSupplier = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { name, phone, address },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: "Error updating supplier", error: err.message });
  }
};

// 🟢 Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting supplier", error: err.message });
  }
};

// 🟢 Get suppliers by product (nested example)
export const getSuppliersByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const suppliers = await prisma.supplier.findMany({
      where: { products: { some: { id: productId } } },
      select: { id: true, name: true, phone: true },
    });

    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching suppliers by product", error: err.message });
  }
};
