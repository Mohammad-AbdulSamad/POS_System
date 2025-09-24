// tests/setup.js - Global test setup
import { PrismaClient } from '@prisma/client';

let prisma;

beforeAll(async () => {
  // Use test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://user:password@localhost:5432/pos_test_db';
  
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  try {
    const tablenames = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
    
    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter(name => name !== '_prisma_migrations');

    // Disable foreign key checks temporarily
    await prisma.$executeRaw`SET session_replication_role = replica;`;
    
    // Truncate each table individually
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY;`);
    }
    
    // Re-enable foreign key checks
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
  } catch (error) {
    console.log('Database cleanup error:', error.message);
    
    // Fallback: delete records manually in correct order
    try {
      await prisma.loyaltyTransaction.deleteMany();
      await prisma.return.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.transactionLine.deleteMany();
      await prisma.transaction.deleteMany();
      await prisma.stockMovement.deleteMany();
      await prisma.product.deleteMany();
      await prisma.category.deleteMany();
      await prisma.customer.deleteMany();
      await prisma.user.deleteMany();
      await prisma.supplier.deleteMany();
      await prisma.taxRate.deleteMany();
      await prisma.promotion.deleteMany();
      await prisma.branch.deleteMany();
    } catch (fallbackError) {
      console.log('Fallback cleanup error:', fallbackError.message);
    }
  }
});

// tests/helpers/testData.js - Test data factory
export const createTestBranch = (overrides = {}) => ({
  name: 'Test Branch',
  address: '123 Test Street',
  phone: '+1234567890',
  ...overrides
});

export const createTestProduct = (branchId, overrides = {}) => ({
  branchId,
  sku: 'TEST-001',
  name: 'Test Product',
  description: 'Test product description',
  priceGross: 10.99,
  cost: 5.50,
  unit: 'pcs',
  stock: 100,
  active: true,
  ...overrides
});

export const createTestUser = (branchId, overrides = {}) => ({
  branchId,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword',
  role: 'CASHIER',
  ...overrides
});

// tests/helpers/apiHelpers.js - API testing utilities
export const expectValidationError = (response, field) => {
  expect(response.status).toBe(400);
  expect(response.body.message).toContain(field);
};

export const expectNotFound = (response, resource = 'resource') => {
  expect(response.status).toBe(404);
  expect(response.body.message).toContain('not found');
};

export const expectSuccessfulCreation = (response, data) => {
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  expect(response.body).toMatchObject(data);
  expect(response.body).toHaveProperty('createdAt');
};