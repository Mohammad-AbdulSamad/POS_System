// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Branches (Stores)
  console.log('🏪 Creating branches...');
  const branch1 = await prisma.branch.create({
    data: {
      name: 'Downtown Supermarket',
      address: '123 Main Street, Downtown City',
      phone: '+1-555-0101'
    }
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: 'Mall Grocery Store',
      address: '456 Shopping Mall, Uptown',
      phone: '+1-555-0102'
    }
  });

  // 2. Create Tax Rates
  console.log('💰 Creating tax rates...');
  const standardTax = await prisma.taxRate.create({
    data: {
      name: 'Standard VAT',
      rate: 15.00
    }
  });

  const foodTax = await prisma.taxRate.create({
    data: {
      name: 'Food Items',
      rate: 5.00
    }
  });

  const zeroTax = await prisma.taxRate.create({
    data: {
      name: 'Zero Rated',
      rate: 0.00
    }
  });

  // 3. Create Suppliers
  console.log('🚛 Creating suppliers...');
  const cocaColaCo = await prisma.supplier.create({
    data: {
      name: 'Coca Cola Company',
      phone: '+1-555-1001',
      address: '789 Beverage Ave, Atlanta'
    }
  });

  const freshFarmsCo = await prisma.supplier.create({
    data: {
      name: 'Fresh Farms Co-op',
      phone: '+1-555-1002',
      address: '321 Farm Road, Green Valley'
    }
  });

  const bakerySupplies = await prisma.supplier.create({
    data: {
      name: 'City Bakery Supplies',
      phone: '+1-555-1003',
      address: '654 Baker Street, Downtown'
    }
  });

  // 4. Create Categories for Branch 1
  console.log('📁 Creating categories...');
  const beveragesCategory = await prisma.category.create({
    data: {
      name: 'Beverages',
      branchId: branch1.id
    }
  });

  const produceCategory = await prisma.category.create({
    data: {
      name: 'Fresh Produce',
      branchId: branch1.id
    }
  });

  const bakeryCategory = await prisma.category.create({
    data: {
      name: 'Bakery',
      branchId: branch1.id
    }
  });

  const dairyCategory = await prisma.category.create({
    data: {
      name: 'Dairy & Eggs',
      branchId: branch1.id
    }
  });

  // 5. Create Products for Branch 1
  console.log('🛍️ Creating products...');
  
  // Beverages
  const cokeSmall = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'COKE-330',
      name: 'Coca Cola',
      description: 'Classic Coca Cola soft drink',
      size: '330ml Can',
      volume: 0.330,
      priceGross: 1.50,
      cost: 0.80,
      unit: 'can',
      stock: 120,
      minStock: 20,
      reorderPoint: 50,
      barcode: '1234567890123',
      categoryId: beveragesCategory.id,
      supplierId: cocaColaCo.id,
      taxRateId: standardTax.id,
      active: true
    }
  });

  const cokeLarge = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'COKE-500',
      name: 'Coca Cola',
      description: 'Classic Coca Cola soft drink',
      size: '500ml Bottle',
      volume: 0.500,
      priceGross: 2.25,
      cost: 1.20,
      unit: 'bottle',
      stock: 85,
      minStock: 15,
      reorderPoint: 30,
      barcode: '1234567890124',
      categoryId: beveragesCategory.id,
      supplierId: cocaColaCo.id,
      taxRateId: standardTax.id,
      active: true
    }
  });

  const water = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'WATER-500',
      name: 'Spring Water',
      description: 'Pure spring water',
      size: '500ml',
      volume: 0.500,
      priceGross: 0.99,
      cost: 0.45,
      unit: 'bottle',
      stock: 200,
      minStock: 50,
      reorderPoint: 100,
      barcode: '1234567890125',
      categoryId: beveragesCategory.id,
      taxRateId: zeroTax.id,
      active: true
    }
  });

  // Fresh Produce
  const bananas = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'BANANA-KG',
      name: 'Bananas',
      description: 'Fresh yellow bananas',
      size: 'Per kg',
      weight: 1.000,
      priceGross: 2.99,
      cost: 1.50,
      unit: 'kg',
      stock: 50,
      minStock: 10,
      reorderPoint: 20,
      categoryId: produceCategory.id,
      supplierId: freshFarmsCo.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  const apples = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'APPLE-KG',
      name: 'Red Apples',
      description: 'Fresh red apples',
      size: 'Per kg',
      weight: 1.000,
      priceGross: 4.99,
      cost: 2.50,
      unit: 'kg',
      stock: 75,
      minStock: 15,
      reorderPoint: 30,
      barcode: '1234567890127',
      categoryId: produceCategory.id,
      supplierId: freshFarmsCo.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  // Bakery
  const bread = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'BREAD-WHITE',
      name: 'White Bread',
      description: 'Fresh baked white bread loaf',
      size: 'Large Loaf',
      weight: 0.800,
      priceGross: 2.50,
      cost: 1.00,
      unit: 'loaf',
      stock: 30,
      minStock: 5,
      reorderPoint: 15,
      barcode: '1234567890128',
      categoryId: bakeryCategory.id,
      supplierId: bakerySupplies.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  // Dairy
  const milk = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'MILK-1L',
      name: 'Fresh Milk',
      description: 'Whole milk',
      size: '1 Liter',
      volume: 1.000,
      priceGross: 3.49,
      cost: 2.00,
      unit: 'liter',
      stock: 40,
      minStock: 10,
      reorderPoint: 20,
      barcode: '1234567890129',
      categoryId: dairyCategory.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  const eggs = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'EGGS-12',
      name: 'Fresh Eggs',
      description: 'Free range eggs',
      size: '12 Pack',
      packSize: 12,
      priceGross: 4.99,
      cost: 2.50,
      unit: 'dozen',
      stock: 60,
      minStock: 12,
      reorderPoint: 24,
      barcode: '1234567890130',
      categoryId: dairyCategory.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  // 6. Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@grocery.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      branchId: branch1.id
    }
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@grocery.com',
      name: 'Store Manager',
      password: hashedPassword,
      role: 'MANAGER',
      branchId: branch1.id
    }
  });

  const cashier1 = await prisma.user.create({
    data: {
      email: 'cashier1@grocery.com',
      name: 'Alice Johnson',
      password: hashedPassword,
      role: 'CASHIER',
      branchId: branch1.id
    }
  });

  const cashier2 = await prisma.user.create({
    data: {
      email: 'cashier2@grocery.com',
      name: 'Bob Smith',
      password: hashedPassword,
      role: 'CASHIER',
      branchId: branch1.id
    }
  });

  // 7. Create Customers
  console.log('👤 Creating customers...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      phone: '+1-555-2001',
      email: 'john.doe@email.com',
      loyaltyNumber: 'LOY001',
      loyaltyPoints: 150,
      loyaltyTier: 'SILVER',
      preferredStore: branch1.id
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jane Smith',
      phone: '+1-555-2002',
      email: 'jane.smith@email.com',
      loyaltyNumber: 'LOY002',
      loyaltyPoints: 75,
      loyaltyTier: 'BRONZE',
      preferredStore: branch1.id
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Mike Wilson',
      phone: '+1-555-2003',
      email: 'mike.wilson@email.com',
      loyaltyNumber: 'LOY003',
      loyaltyPoints: 350,
      loyaltyTier: 'GOLD',
      preferredStore: branch1.id
    }
  });

  // 8. Create Sample Transactions
  console.log('🧾 Creating sample transactions...');
  
  // Transaction 1: Customer buys drinks
  const transaction1 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier1.id,
      customerId: customer1.id,
      receiptNumber: 'R000001',
      status: 'COMPLETED',
      totalGross: 6.75,
      totalTax: 0.56,
      totalNet: 6.19,
      loyaltyPointsEarned: 7,
      lines: {
        create: [
          {
            productId: cokeSmall.id,
            unitPrice: 1.50,
            qty: 2,
            taxAmount: 0.39,
            lineTotal: 3.00
          },
          {
            productId: cokeLarge.id,
            unitPrice: 2.25,
            qty: 1,
            taxAmount: 0.17,
            lineTotal: 2.25
          },
          {
            productId: water.id,
            unitPrice: 0.99,
            qty: 1,
            taxAmount: 0.00,
            lineTotal: 0.99
          }
        ]
      },
      payments: {
        create: [
          {
            method: 'CARD',
            amount: 6.75
          }
        ]
      }
    }
  });

  // Transaction 2: Customer buys groceries
  const transaction2 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier2.id,
      customerId: customer2.id,
      receiptNumber: 'R000002',
      status: 'COMPLETED',
      totalGross: 14.97,
      totalTax: 0.62,
      totalNet: 14.35,
      loyaltyPointsEarned: 15,
      lines: {
        create: [
          {
            productId: milk.id,
            unitPrice: 3.49,
            qty: 1,
            taxAmount: 0.17,
            lineTotal: 3.49
          },
          {
            productId: bread.id,
            unitPrice: 2.50,
            qty: 2,
            taxAmount: 0.25,
            lineTotal: 5.00
          },
          {
            productId: eggs.id,
            unitPrice: 4.99,
            qty: 1,
            taxAmount: 0.25,
            lineTotal: 4.99
          },
          {
            productId: water.id,
            unitPrice: 0.99,
            qty: 1,
            taxAmount: 0.00,
            lineTotal: 0.99
          }
        ]
      },
      payments: {
        create: [
          {
            method: 'CASH',
            amount: 15.00
          }
        ]
      }
    }
  });

  // 9. Create Stock Movements (initial stock)
  console.log('📦 Creating stock movements...');
  const products = [cokeSmall, cokeLarge, water, bananas, apples, bread, milk, eggs];
  
  for (const product of products) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        branchId: branch1.id,
        change: product.stock,
        reason: 'initial_stock'
      }
    });
  }

  // Create some additional stock movements
  await prisma.stockMovement.create({
    data: {
      productId: cokeSmall.id,
      branchId: branch1.id,
      change: -2, // sold in transaction 1
      reason: 'sale'
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: cokeLarge.id,
      branchId: branch1.id,
      change: -1, // sold in transaction 1
      reason: 'sale'
    }
  });

  // 10. Create Loyalty Transactions
  console.log('🎯 Creating loyalty transactions...');
  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer1.id,
      points: 7,
      type: 'EARNED',
      reason: 'PURCHASE'
    }
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer2.id,
      points: 15,
      type: 'EARNED',
      reason: 'PURCHASE'
    }
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer3.id,
      points: 50,
      type: 'EARNED',
      reason: 'BIRTHDAY'
    }
  });

  // 11. Create a Return
  console.log('↩️ Creating return...');
  await prisma.return.create({
    data: {
      originalTransactionId: transaction1.id,
      returnAmount: 1.50,
      reason: 'Customer changed mind',
      processedBy: manager.id
    }
  });

  // 12. Create Promotions
  console.log('🏷️ Creating promotions...');
  await prisma.promotion.create({
    data: {
      name: 'Summer Drinks Special',
      description: '10% off all beverages',
      discountPct: 10.00,
      active: true
    }
  });

  await prisma.promotion.create({
    data: {
      name: 'Fresh Produce Week',
      description: '15% off fresh fruits and vegetables',
      discountPct: 15.00,
      active: true
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log('📊 Created:');
  console.log('  - 2 branches');
  console.log('  - 3 tax rates');
  console.log('  - 3 suppliers');
  console.log('  - 4 categories');
  console.log('  - 8 products with variants');
  console.log('  - 4 users (1 admin, 1 manager, 2 cashiers)');
  console.log('  - 3 customers with loyalty accounts');
  console.log('  - 2 completed transactions');
  console.log('  - 10 stock movements');
  console.log('  - 3 loyalty transactions');
  console.log('  - 1 return record');
  console.log('  - 2 promotions');
  console.log('');
  console.log('🔐 Test Login Credentials:');
  console.log('  Admin: admin@grocery.com / password123');
  console.log('  Manager: manager@grocery.com / password123');
  console.log('  Cashier 1: cashier1@grocery.com / password123');
  console.log('  Cashier 2: cashier2@grocery.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });