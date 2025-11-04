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

  const branch3 = await prisma.branch.create({
    data: {
      name: 'Westside Market',
      address: '789 West Avenue, Westside',
      phone: '+1-555-0103'
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

  const luxuryTax = await prisma.taxRate.create({
    data: {
      name: 'Luxury Items',
      rate: 20.00
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

  const dairyDistributors = await prisma.supplier.create({
    data: {
      name: 'Premium Dairy Distributors',
      phone: '+1-555-1004',
      address: '111 Dairy Lane, Farmtown'
    }
  });

  const snackWorld = await prisma.supplier.create({
    data: {
      name: 'Snack World Wholesale',
      phone: '+1-555-1005',
      address: '222 Snack Street, Food City'
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

  const snacksCategory = await prisma.category.create({
    data: {
      name: 'Snacks & Chips',
      branchId: branch1.id
    }
  });

  const householdCategory = await prisma.category.create({
    data: {
      name: 'Household Items',
      branchId: branch1.id
    }
  });

  // Categories for Branch 2
  const beveragesCategory2 = await prisma.category.create({
    data: {
      name: 'Beverages',
      branchId: branch2.id
    }
  });

  const snacksCategory2 = await prisma.category.create({
    data: {
      name: 'Snacks',
      branchId: branch2.id
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

  const cokeMultipack = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'COKE-330-6PK',
      name: 'Coca Cola 6-Pack',
      description: 'Coca Cola 6-pack multipack',
      size: '330ml Can',
      volume: 0.330,
      packSize: 6,
      priceGross: 7.99,
      cost: 4.50,
      unit: 'pack',
      stock: 45,
      minStock: 10,
      reorderPoint: 20,
      barcode: '1234567890140',
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

  const orangeJuice = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'JUICE-OJ-1L',
      name: 'Fresh Orange Juice',
      description: '100% pure orange juice',
      size: '1 Liter',
      volume: 1.000,
      priceGross: 4.99,
      cost: 2.80,
      unit: 'liter',
      stock: 60,
      minStock: 15,
      reorderPoint: 30,
      barcode: '1234567890141',
      categoryId: beveragesCategory.id,
      taxRateId: foodTax.id,
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
      barcode: '1234567890126',
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

  const tomatoes = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'TOMATO-KG',
      name: 'Fresh Tomatoes',
      description: 'Ripe red tomatoes',
      size: 'Per kg',
      weight: 1.000,
      priceGross: 3.49,
      cost: 1.80,
      unit: 'kg',
      stock: 40,
      minStock: 10,
      reorderPoint: 20,
      barcode: '1234567890142',
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

  const brownBread = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'BREAD-BROWN',
      name: 'Whole Wheat Bread',
      description: 'Healthy whole wheat bread',
      size: 'Large Loaf',
      weight: 0.800,
      priceGross: 3.25,
      cost: 1.50,
      unit: 'loaf',
      stock: 25,
      minStock: 5,
      reorderPoint: 12,
      barcode: '1234567890143',
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
      supplierId: dairyDistributors.id,
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
      supplierId: dairyDistributors.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  const cheese = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'CHEESE-CHEDDAR',
      name: 'Cheddar Cheese',
      description: 'Aged cheddar cheese block',
      size: '500g',
      weight: 0.500,
      priceGross: 6.99,
      cost: 4.00,
      unit: 'block',
      stock: 35,
      minStock: 8,
      reorderPoint: 15,
      barcode: '1234567890144',
      categoryId: dairyCategory.id,
      supplierId: dairyDistributors.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  const yogurt = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'YOGURT-PLAIN',
      name: 'Plain Yogurt',
      description: 'Natural plain yogurt',
      size: '500g',
      weight: 0.500,
      priceGross: 2.99,
      cost: 1.50,
      unit: 'tub',
      stock: 50,
      minStock: 12,
      reorderPoint: 25,
      barcode: '1234567890145',
      categoryId: dairyCategory.id,
      supplierId: dairyDistributors.id,
      taxRateId: foodTax.id,
      active: true
    }
  });

  // Snacks
  const chips = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'CHIPS-CLASSIC',
      name: 'Classic Potato Chips',
      description: 'Crispy salted potato chips',
      size: 'Large 200g',
      weight: 0.200,
      priceGross: 3.49,
      cost: 1.80,
      unit: 'bag',
      stock: 80,
      minStock: 20,
      reorderPoint: 40,
      barcode: '1234567890146',
      categoryId: snacksCategory.id,
      supplierId: snackWorld.id,
      taxRateId: standardTax.id,
      active: true
    }
  });

  const chocolateBar = await prisma.product.create({
    data: {
      branchId: branch1.id,
      sku: 'CHOCO-MILK',
      name: 'Milk Chocolate Bar',
      description: 'Premium milk chocolate',
      size: '100g',
      weight: 0.100,
      priceGross: 2.49,
      cost: 1.20,
      unit: 'bar',
      stock: 100,
      minStock: 25,
      reorderPoint: 50,
      barcode: '1234567890147',
      categoryId: snacksCategory.id,
      supplierId: snackWorld.id,
      taxRateId: standardTax.id,
      active: true
    }
  });

  // Some products for Branch 2
  const cokeSmallB2 = await prisma.product.create({
    data: {
      branchId: branch2.id,
      sku: 'COKE-330',
      name: 'Coca Cola',
      description: 'Classic Coca Cola soft drink',
      size: '330ml Can',
      volume: 0.330,
      priceGross: 1.55,
      cost: 0.80,
      unit: 'can',
      stock: 95,
      minStock: 20,
      reorderPoint: 50,
      barcode: '1234567890123',
      categoryId: beveragesCategory2.id,
      supplierId: cocaColaCo.id,
      taxRateId: standardTax.id,
      active: true
    }
  });

  const chipsB2 = await prisma.product.create({
    data: {
      branchId: branch2.id,
      sku: 'CHIPS-CLASSIC',
      name: 'Classic Potato Chips',
      description: 'Crispy salted potato chips',
      size: 'Large 200g',
      weight: 0.200,
      priceGross: 3.49,
      cost: 1.80,
      unit: 'bag',
      stock: 65,
      minStock: 20,
      reorderPoint: 40,
      barcode: '1234567890146',
      categoryId: snacksCategory2.id,
      supplierId: snackWorld.id,
      taxRateId: standardTax.id,
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
      phone: '+1-555-9001',
      role: 'ADMIN',
      branchId: branch1.id
    }
  });

  const manager1 = await prisma.user.create({
    data: {
      email: 'manager@grocery.com',
      name: 'Store Manager',
      password: hashedPassword,
      phone: '+1-555-9002',
      role: 'MANAGER',
      branchId: branch1.id
    }
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@grocery.com',
      name: 'Sarah Williams',
      password: hashedPassword,
      phone: '+1-555-9003',
      role: 'MANAGER',
      branchId: branch2.id
    }
  });

  const stockManager = await prisma.user.create({
    data: {
      email: 'stock@grocery.com',
      name: 'David Chen',
      password: hashedPassword,
      phone: '+1-555-9004',
      role: 'STOCK_MANAGER',
      branchId: branch1.id
    }
  });

  const cashier1 = await prisma.user.create({
    data: {
      email: 'cashier1@grocery.com',
      name: 'Alice Johnson',
      password: hashedPassword,
      phone: '+1-555-9005',
      role: 'CASHIER',
      branchId: branch1.id
    }
  });

  const cashier2 = await prisma.user.create({
    data: {
      email: 'cashier2@grocery.com',
      name: 'Bob Smith',
      password: hashedPassword,
      phone: '+1-555-9006',
      role: 'CASHIER',
      branchId: branch1.id
    }
  });

  const cashier3 = await prisma.user.create({
    data: {
      email: 'cashier3@grocery.com',
      name: 'Maria Garcia',
      password: hashedPassword,
      phone: '+1-555-9007',
      role: 'CASHIER',
      branchId: branch2.id
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
      dateOfBirth: new Date('1985-06-15'),
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
      dateOfBirth: new Date('1990-03-22'),
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
      dateOfBirth: new Date('1978-11-08'),
      preferredStore: branch1.id
    }
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Emily Brown',
      phone: '+1-555-2004',
      email: 'emily.brown@email.com',
      loyaltyNumber: 'LOY004',
      loyaltyPoints: 520,
      loyaltyTier: 'PLATINUM',
      dateOfBirth: new Date('1982-09-12'),
      preferredStore: branch1.id
    }
  });

  const customer5 = await prisma.customer.create({
    data: {
      name: 'Robert Taylor',
      phone: '+1-555-2005',
      email: 'robert.taylor@email.com',
      loyaltyNumber: 'LOY005',
      loyaltyPoints: 45,
      loyaltyTier: 'BRONZE',
      preferredStore: branch2.id
    }
  });

  // Guest customer (no loyalty)
  const guestCustomer = await prisma.customer.create({
    data: {
      name: 'Walk-in Customer',
      phone: '+1-555-0000'
    }
  });

  // 8. Create Promotions
  console.log('🏷️ Creating promotions...');
  const beveragePromo = await prisma.promotion.create({
    data: {
      name: 'Summer Drinks Special',
      description: '10% off all beverages',
      type: 'PERCENTAGE',
      discountPct: 10.00,
      active: true,
      categories: {
        connect: [{ id: beveragesCategory.id }]
      }
    }
  });

  const producePromo = await prisma.promotion.create({
    data: {
      name: 'Fresh Produce Week',
      description: '15% off fresh fruits and vegetables',
      type: 'PERCENTAGE',
      discountPct: 15.00,
      active: true,
      categories: {
        connect: [{ id: produceCategory.id }]
      }
    }
  });

  const cokeMultipackPromo = await prisma.promotion.create({
    data: {
      name: 'Coke Multipack Deal',
      description: '$2 off Coke 6-packs',
      type: 'FIXED_AMOUNT',
      discountAmt: 2.00,
      active: true,
      products: {
        connect: [{ id: cokeMultipack.id }]
      }
    }
  });

  const buyOneGetOne = await prisma.promotion.create({
    data: {
      name: 'BOGO Chips',
      description: 'Buy 2 Get 1 Free on potato chips',
      type: 'BUY_X_GET_Y',
      buyQty: 2,
      getQty: 1,
      active: true,
      products: {
        connect: [{ id: chips.id }]
      }
    }
  });

  const inactivePromo = await prisma.promotion.create({
    data: {
      name: 'Expired Winter Sale',
      description: '20% off winter items (expired)',
      type: 'PERCENTAGE',
      discountPct: 20.00,
      active: false
    }
  });

  // 9. Create Sample Transactions
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
            taxAmount: 0.29,
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
      totalTax: 0.67,
      totalNet: 14.30,
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

  // Transaction 3: Large shopping with multiple items
  const transaction3 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier1.id,
      customerId: customer3.id,
      receiptNumber: 'R000003',
      status: 'COMPLETED',
      totalGross: 38.43,
      totalTax: 1.72,
      totalNet: 36.71,
      loyaltyPointsEarned: 38,
      lines: {
        create: [
          {
            productId: cokeMultipack.id,
            unitPrice: 7.99,
            qty: 1,
            discount: 2.00, // promotion applied
            taxAmount: 0.77,
            lineTotal: 5.99
          },
          {
            productId: bananas.id,
            unitPrice: 2.99,
            qty: 2,
            taxAmount: 0.30,
            lineTotal: 5.98
          },
          {
            productId: apples.id,
            unitPrice: 4.99,
            qty: 1,
            taxAmount: 0.25,
            lineTotal: 4.99
          },
          {
            productId: cheese.id,
            unitPrice: 6.99,
            qty: 1,
            taxAmount: 0.35,
            lineTotal: 6.99
          },
          {
            productId: chips.id,
            unitPrice: 3.49,
            qty: 3,
            taxAmount: 1.35,
            lineTotal: 10.47 // BOGO applied manually in discount
          },
          {
            productId: orangeJuice.id,
            unitPrice: 4.99,
            qty: 1,
            taxAmount: 0.25,
            lineTotal: 4.99
          }
        ]
      },
      payments: {
        create: [
          {
            method: 'CARD',
            amount: 38.43
          }
        ]
      }
    }
  });

  // Transaction 4: Customer with loyalty points redemption
  const transaction4 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier2.id,
      customerId: customer4.id,
      receiptNumber: 'R000004',
      status: 'COMPLETED',
      totalGross: 18.45,
      totalTax: 0.82,
      totalNet: 17.63,
      loyaltyPointsEarned: 18,
      loyaltyPointsUsed: 50,
      lines: {
        create: [
          {
            productId: brownBread.id,
            unitPrice: 3.25,
            qty: 2,
            taxAmount: 0.33,
            lineTotal: 6.50
          },
          {
            productId: yogurt.id,
            unitPrice: 2.99,
            qty: 2,
            taxAmount: 0.30,
            lineTotal: 5.98
          },
          {
            productId: tomatoes.id,
            unitPrice: 3.49,
            qty: 1,
            taxAmount: 0.17,
            lineTotal: 3.49
          },
          {
            productId: water.id,
            unitPrice: 0.99,
            qty: 2,
            taxAmount: 0.00,
            lineTotal: 1.98
          }
        ]
      },
      payments: {
        create: [
          {
            method: 'MOBILE',
            amount: 18.45
          }
        ]
      }
    }
  });

  // Transaction 5: Split payment transaction
  const transaction5 = await prisma.transaction.create({
    data: {
      branchId: branch2.id,
      cashierId: cashier3.id,
      customerId: customer5.id,
      receiptNumber: 'R000005',
      status: 'COMPLETED',
      totalGross: 8.53,
      totalTax: 0.86,
      totalNet: 7.67,
      loyaltyPointsEarned: 9,
      lines: {
        create: [
          {
            productId: cokeSmallB2.id,
            unitPrice: 1.55,
            qty: 3,
            taxAmount: 0.61,
            lineTotal: 4.65
          },
          {
            productId: chipsB2.id,
            unitPrice: 3.49,
            qty: 1,
            taxAmount: 0.45,
            lineTotal: 3.49
          }
        ]
      },
      payments: {
        create: [
          {
            method: 'CASH',
            amount: 5.00
          },
          {
            method: 'CARD',
            amount: 3.53
          }
        ]
      }
    }
  });

  // Transaction 6: Guest customer (no loyalty)
  const transaction6 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier1.id,
      customerId: guestCustomer.id,
      receiptNumber: 'R000006',
      status: 'COMPLETED',
      totalGross: 7.48,
      totalTax: 0.37,
      totalNet: 7.11,
      lines: {
        create: [
          {
            productId: bread.id,
            unitPrice: 2.50,
            qty: 1,
            taxAmount: 0.13,
            lineTotal: 2.50
          },
          {
            productId: milk.id,
            unitPrice: 3.49,
            qty: 1,
            taxAmount: 0.17,
            lineTotal: 3.49
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
            amount: 10.00
          }
        ]
      }
    }
  });

  // Transaction 7: Pending transaction (not completed)
  const transaction7 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier2.id,
      receiptNumber: 'R000007',
      status: 'PENDING',
      totalGross: 12.46,
      totalTax: 0.62,
      totalNet: 11.84,
      lines: {
        create: [
          {
            productId: chocolateBar.id,
            unitPrice: 2.49,
            qty: 5,
            taxAmount: 1.61,
            lineTotal: 12.45
          }
        ]
      },
      payments: {
        create: []
      }
    }
  });

  // Transaction 8: Transaction to be refunded
  const transaction8 = await prisma.transaction.create({
    data: {
      branchId: branch1.id,
      cashierId: cashier1.id,
      customerId: customer2.id,
      receiptNumber: 'R000008',
      status: 'COMPLETED',
      totalGross: 5.00,
      totalTax: 0.25,
      totalNet: 4.75,
      loyaltyPointsEarned: 5,
      lines: {
        create: [
          {
            productId: bread.id,
            unitPrice: 2.50,
            qty: 2,
            taxAmount: 0.25,
            lineTotal: 5.00
          }
        ]
      },
      payments: {
        create: [
          {
            method: 'CARD',
            amount: 5.00
          }
        ]
      }
    }
  });

  // 10. Create Stock Movements (initial stock)
  console.log('📦 Creating stock movements...');
  const branch1Products = [
    cokeSmall, cokeLarge, cokeMultipack, water, orangeJuice,
    bananas, apples, tomatoes,
    bread, brownBread,
    milk, eggs, cheese, yogurt,
    chips, chocolateBar
  ];
  
  for (const product of branch1Products) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        branchId: branch1.id,
        change: product.stock,
        reason: 'initial_stock'
      }
    });
  }

  // Stock movements for branch 2
  await prisma.stockMovement.create({
    data: {
      productId: cokeSmallB2.id,
      branchId: branch2.id,
      change: 95,
      reason: 'initial_stock'
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: chipsB2.id,
      branchId: branch2.id,
      change: 65,
      reason: 'initial_stock'
    }
  });

  // Create sales-related stock movements
  await prisma.stockMovement.create({
    data: {
      productId: cokeSmall.id,
      branchId: branch1.id,
      change: -2,
      reason: 'sale'
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: cokeLarge.id,
      branchId: branch1.id,
      change: -1,
      reason: 'sale'
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: water.id,
      branchId: branch1.id,
      change: -5,
      reason: 'sale'
    }
  });

  // Stock adjustment (spoilage)
  await prisma.stockMovement.create({
    data: {
      productId: bananas.id,
      branchId: branch1.id,
      change: -3,
      reason: 'spoilage'
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: milk.id,
      branchId: branch1.id,
      change: -1,
      reason: 'damaged'
    }
  });

  // Stock received (purchase)
  await prisma.stockMovement.create({
    data: {
      productId: cokeSmall.id,
      branchId: branch1.id,
      change: 50,
      reason: 'purchase'
    }
  });

  await prisma.stockMovement.create({
    data: {
      productId: chips.id,
      branchId: branch1.id,
      change: 30,
      reason: 'purchase'
    }
  });

  // Manual adjustment
  await prisma.stockMovement.create({
    data: {
      productId: eggs.id,
      branchId: branch1.id,
      change: -2,
      reason: 'adjustment'
    }
  });

  // 11. Create Loyalty Transactions
  console.log('🎯 Creating loyalty transactions...');
  
  // Points earned from purchases
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
      points: 38,
      type: 'EARNED',
      reason: 'PURCHASE'
    }
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer4.id,
      points: 18,
      type: 'EARNED',
      reason: 'PURCHASE'
    }
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer5.id,
      points: 9,
      type: 'EARNED',
      reason: 'PURCHASE'
    }
  });

  // Birthday bonus points
  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer3.id,
      points: 50,
      type: 'EARNED',
      reason: 'BIRTHDAY'
    }
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer1.id,
      points: 25,
      type: 'EARNED',
      reason: 'BIRTHDAY'
    }
  });

  // Promotional bonus points
  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer4.id,
      points: 100,
      type: 'EARNED',
      reason: 'PROMOTION'
    }
  });

  // Points redeemed
  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer4.id,
      points: -50,
      type: 'REDEEMED',
      reason: 'PURCHASE'
    }
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer3.id,
      points: -100,
      type: 'REDEEMED',
      reason: 'PURCHASE'
    }
  });

  // 12. Create Returns
  console.log('↩️ Creating returns...');
  
  // Partial return from transaction 1
  await prisma.return.create({
    data: {
      originalTransactionId: transaction1.id,
      returnAmount: 1.50,
      reason: 'Customer changed mind - returned 1 Coke can',
      processedBy: manager1.id
    }
  });

  // Full return from transaction 8
  const return2 = await prisma.return.create({
    data: {
      originalTransactionId: transaction8.id,
      returnAmount: 5.00,
      reason: 'Product defect - full refund',
      processedBy: manager1.id
    }
  });

  // Update transaction 8 status to REFUNDED
  await prisma.transaction.update({
    where: { id: transaction8.id },
    data: {
      status: 'REFUNDED',
      refundedAmount: 5.00
    }
  });

  // Update transaction 1 to PARTIALLY_REFUNDED
  await prisma.transaction.update({
    where: { id: transaction1.id },
    data: {
      status: 'PARTIALLY_REFUNDED',
      refundedAmount: 1.50
    }
  });

  // Return with different reason
  await prisma.return.create({
    data: {
      originalTransactionId: transaction3.id,
      returnAmount: 7.99,
      reason: 'Duplicate purchase - returned Coke 6-pack',
      processedBy: manager1.id
    }
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Database Summary:');
  console.log('  ✓ 3 branches');
  console.log('  ✓ 4 tax rates');
  console.log('  ✓ 5 suppliers');
  console.log('  ✓ 8 categories (across branches)');
  console.log('  ✓ 18 products with variants and details');
  console.log('  ✓ 7 users (1 admin, 2 managers, 1 stock manager, 3 cashiers)');
  console.log('  ✓ 6 customers (5 with loyalty, 1 guest)');
  console.log('  ✓ 8 transactions (various statuses)');
  console.log('  ✓ 22 stock movements');
  console.log('  ✓ 10 loyalty transactions');
  console.log('  ✓ 3 returns');
  console.log('  ✓ 5 promotions (4 active, 1 inactive)');
  console.log('');
  console.log('🔐 Test Login Credentials:');
  console.log('  Admin:         admin@grocery.com / password123');
  console.log('  Manager 1:     manager@grocery.com / password123');
  console.log('  Manager 2:     manager2@grocery.com / password123');
  console.log('  Stock Manager: stock@grocery.com / password123');
  console.log('  Cashier 1:     cashier1@grocery.com / password123');
  console.log('  Cashier 2:     cashier2@grocery.com / password123');
  console.log('  Cashier 3:     cashier3@grocery.com / password123');
  console.log('');
  console.log('🎯 Loyalty Customers:');
  console.log('  Bronze:   Jane Smith (75 pts) - LOY002');
  console.log('  Bronze:   Robert Taylor (45 pts) - LOY005');
  console.log('  Silver:   John Doe (150 pts) - LOY001');
  console.log('  Gold:     Mike Wilson (350 pts) - LOY003');
  console.log('  Platinum: Emily Brown (520 pts) - LOY004');
  console.log('');
  console.log('🏷️ Active Promotions:');
  console.log('  - 10% off Beverages');
  console.log('  - 15% off Fresh Produce');
  console.log('  - $2 off Coke 6-packs');
  console.log('  - Buy 2 Get 1 Free on Chips');
  console.log('');
  console.log('📈 Transaction Statuses:');
  console.log('  - 5 COMPLETED');
  console.log('  - 1 PENDING');
  console.log('  - 1 REFUNDED');
  console.log('  - 1 PARTIALLY_REFUNDED');
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