// ES Module import
import pkg from '@prisma/client';
const { PrismaClient, Role, PaymentMethod } = pkg;


const prisma = new PrismaClient();
import bcrypt from "bcrypt";

// 🟢 Get all users (admin/manager only)
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, branchId: true },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

// 🟢 Get a single user by ID
export const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, branchId: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};

// 🟢 Create a user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, branchId },
      select: { id: true, name: true, email: true, role: true, branchId: true },
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
};

// 🟢 Update a user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role) updateData.role = role;
    if (branchId) updateData.branchId = branchId;

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, branchId: true },
    });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};

// 🟢 Delete a user (admin only)
export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};
