import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Create promotion
export const createPromotion = async (req, res) => {
  try {
    const { name, description, discountPct, active } = req.body;

    const promotion = await prisma.promotion.create({
      data: { name, description, discountPct, active },
    });

    res.status(201).json(promotion);
  } catch (error) {
    res.status(500).json({ message: "Error creating promotion", error: error.message });
  }
};

// List promotions
export const getPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany();
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching promotions", error: error.message });
  }
};

// Get single promotion
export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await prisma.promotion.findUnique({ where: { id } });

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.json(promotion);
  } catch (error) {
    res.status(500).json({ message: "Error fetching promotion", error: error.message });
  }
};

// Update promotion
export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, discountPct, active } = req.body;

    const promotion = await prisma.promotion.update({
      where: { id },
      data: { name, description, discountPct, active },
    });

    res.json(promotion);
  } catch (error) {
    res.status(500).json({ message: "Error updating promotion", error: error.message });
  }
};

// Delete promotion
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.promotion.delete({ where: { id } });
    res.json({ message: "Promotion deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting promotion", error: error.message });
  }
};
