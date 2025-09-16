const { PrismaClient, Prisma, Role, PaymentMethod } = require('./node_modules/.prisma/client');


const prisma = new PrismaClient();

async function main() {
  console.log("🟢 Starting full seed...");

  // ---- Branches ----
  const branch1 = await prisma.branch.create({
    data: { name: "Main Branch", address: "Ramallah", phone: "022-123-456" },
  });
  const branch2 = await prisma.branch.create({
    data: { name: "North Branch", address: "Nablus", phone: "092-654-321" },
  });
  const branch3 = await prisma.branch.create({
    data: { name: "South Branch", address: "Hebron", phone: "059-987-654" },
  });

  // ---- Users ----
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: "hashedpassword1",
      role: Role.ADMIN,
      branchId: branch1.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@example.com",
      name: "Manager User",
      password: "hashedpassword2",
      role: Role.MANAGER,
      branchId: branch2.id,
    },
  });

  const cashier1 = await prisma.user.create({
    data: {
      email: "cashier1@example.com",
      name: "Cashier One",
      password: "hashedpassword3",
      role: Role.CASHIER,
      branchId: branch1.id,
    },
  });

  const cashier2 = await prisma.user.create({
    data: {
      email: "cashier2@example.com",
      name: "Cashier Two",
      password: "hashedpassword4",
      role: Role.CASHIER,
      branchId: branch3.id,
    },
  });

  // ---- Categories ----
  const drinksCat = await prisma.category.create({
    data: { name: "Drinks", branchId: branch1.id },
  });

  const foodCat = await prisma.category.create({
    data: { name: "Food", branchId: branch2.id },
  });

  // ---- Suppliers ----
  const supplier = await prisma.supplier.create({
    data: { name: "Local Supplier", phone: "056-111-222", address: "Al-Manara" },
  });

  // ---- Tax Rates ----
  const tax15 = await prisma.taxRate.create({
    data: { name: "Standard VAT", rate: 15.0 },
  });

  // ---- Products ----
  const coffee = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: "C001",
      name: "Coffee",
      priceGross: 10.0,
      cost: 5.0,
      stock: 100,
      unit: "pcs",
      categoryId: drinksCat.id,
      supplierId: supplier.id,
      taxRateId: tax15.id,
    },
  });

  const sandwich = await prisma.product.create({
    data: {
      branchId: branch2.id,
      sku: "F001",
      name: "Sandwich",
      priceGross: 20.0,
      cost: 10.0,
      stock: 50,
      unit: "pcs",
      categoryId: foodCat.id,
      supplierId: supplier.id,
      taxRateId: tax15.id,
    },
  });

  // ---- Customers ----
  const customer = await prisma.customer.create({
    data: { name: "John Doe", phone: "059-333-444", email: "john@example.com" },
  });

  // ---- Transactions ----
  const transaction1 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier1.id,
      customerId: customer.id,
      totalGross: 30.0,
      totalTax: 4.5,
      totalNet: 25.5,
      lines: {
        create: [
          {
            productId: coffee.id,
            unitPrice: 10.0,
            qty: 2,
            discount: 0,
            taxAmount: 3.0,
            lineTotal: 20.0,
          },
        ],
      },
      payments: {
        create: [{ method: PaymentMethod.CASH, amount: 30.0 }],
      },
    },
  });

  const transaction2 = await prisma.transaction.create({
    data: {
      branchId: branch2.id,
      cashierId: cashier2.id,
      customerId: customer.id,
      totalGross: 20.0,
      totalTax: 3.0,
      totalNet: 17.0,
      lines: {
        create: [
          {
            productId: sandwich.id,
            unitPrice: 20.0,
            qty: 1,
            discount: 0,
            taxAmount: 3.0,
            lineTotal: 20.0,
          },
        ],
      },
      payments: {
        create: [{ method: PaymentMethod.CARD, amount: 20.0 }],
      },
    },
  });

  // ---- Stock Movements ----
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: coffee.id,
        branchId: branch1.id,
        change: -2,
        reason: "sale",
      },
      {
        productId: sandwich.id,
        branchId: branch2.id,
        change: -1,
        reason: "sale",
      },
    ],
  });

  // ---- Promotion ----
  await prisma.promotion.create({
    data: { name: "Weekend Discount", discountPct: 10.0, description: "10% off all products" },
  });

  console.log("✅ Full seed completed successfully!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    prisma.$disconnect();
    process.exit(1);
  });
