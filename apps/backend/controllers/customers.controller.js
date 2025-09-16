import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 🟢 Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching customers", error: err.message });
  }
};

// 🟢 Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Error fetching customer", error: err.message });
  }
};

// 🟢 Create customer
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const customer = await prisma.customer.create({
      data: { name, phone, email },
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: "Error creating customer", error: err.message });
  }
};

// 🟢 Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, phone, email },
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
    });

    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Error updating customer", error: err.message });
  }
};

// 🟢 Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting customer", error: err.message });
  }
};


// 🟢 Get all transactions of a customer
export const getCustomerTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { customerId: req.params.id },
      select: {
        id: true,
        totalGross: true,
        totalNet: true,
        totalTax: true,
        createdAt: true,
      },
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching customer transactions", error: err.message });
  }
};

