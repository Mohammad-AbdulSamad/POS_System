import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        priceGross: true,
        stock: true,
        active: true,
        branchId: true,
        categoryId: true
      }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
};

// 🟢 Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, supplier: true, taxRate: true }
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
};

// 🟢 Create product
export const createProduct = async (req, res) => {
  try {
    const {
      branchId,
      sku,
      name,
      description,
      priceGross,
      cost,
      unit,
      stock,
      categoryId,
      supplierId,
      taxRateId,
      active,
      metadata
    } = req.body;

    const newProduct = await prisma.product.create({
      data: {
        branchId,
        sku,
        name,
        description,
        priceGross,
        cost,
        unit,
        stock,
        categoryId,
        supplierId,
        taxRateId,
        active,
        metadata
      }
    });

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: "Error creating product", error: err.message });
  }
};

// 🟢 Update product
export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
};

// 🟢 Delete product
export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
};

// 🟢 Get products by branch
export const getProductsByBranch = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId },
      select: { id: true, sku: true, name: true, stock: true, active: true }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching branch products", error: err.message });
  }
};

// 🟢 Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { categoryId: req.params.categoryId },
      select: { id: true, sku: true, name: true, stock: true, active: true }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching category products", error: err.message });
  }
};
