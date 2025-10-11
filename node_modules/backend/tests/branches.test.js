// tests/branches.test.js - Updated with Authentication & Error Handling
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { setupTestAuth, cleanupTestAuth } from './helpers/auth.helper.js';

const prisma = new PrismaClient();

// Helper functions with unique data
const createUniqueBranch = (overrides = {}) => ({
  name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  address: '123 Test Street',
  phone: '+1234567890',
  ...overrides
});

const createUniqueProduct = (branchId, overrides = {}) => ({
  branchId,
  sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  name: `Test Product ${Date.now()}`,
  description: 'Test product description',
  priceGross: 10.99,
  cost: 5.50,
  unit: 'pcs',
  stock: 100,
  active: true,
  ...overrides
});

const createUniqueUser = (branchId, overrides = {}) => ({
  branchId,
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
  name: 'Test User',
  password: 'hashedpassword',
  role: 'CASHIER',
  ...overrides
});

describe('Branches API - With Authentication', () => {
  let authTokens;
  let authUsers;

  // Setup authentication
  beforeAll(async () => {
    const auth = await setupTestAuth(app);
    authTokens = auth.tokens;
    authUsers = auth.users;
  });

  // Clean database before each test
  beforeEach(async () => {
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.return.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.transactionLine.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.taxRate.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.branch.deleteMany();
    // Don't delete auth users
    await prisma.user.deleteMany({
      where: {
        id: { notIn: Object.values(authUsers).map(u => u.id) }
      }
    });
  });

  // Cleanup auth after all tests
  afterAll(async () => {
    const userIds = Object.values(authUsers).map(u => u.id);
    await cleanupTestAuth(userIds);
    await prisma.$disconnect();
  });

  describe('POST /branches', () => {
    it('should create a new branch with admin token', async () => {
      const branchData = createUniqueBranch();
      
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(branchData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(branchData.name);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should deny creation without authentication', async () => {
      const branchData = createUniqueBranch();
      
      const response = await request(app)
        .post('/api/branches')
        .send(branchData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should deny creation for non-admin users', async () => {
      const branchData = createUniqueBranch();
      
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(branchData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    it('should create branch with minimal data (name only)', async () => {
      const branchData = { name: `Minimal Branch ${Date.now()}` };
      
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(branchData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(branchData.name);
      expect(response.body.address).toBeNull();
      expect(response.body.phone).toBeNull();
    });

    it('should trim whitespace from inputs', async () => {
      const branchData = {
        name: `  Whitespace Branch ${Date.now()}  `,
        address: '  123 Spaced Street  ',
        phone: '  +1234567890  '
      };
      
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(branchData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(branchData.name.trim());
      expect(response.body.address).toBe('123 Spaced Street');
      expect(response.body.phone).toBe('+1234567890');
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ address: '123 Test St' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
    });

    it('should fail when name is empty string', async () => {
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
    });

    it('should fail when name is only whitespace', async () => {
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
    });
  });

  describe('GET /branches', () => {
    beforeEach(async () => {
      // Create exactly 3 test branches
      const branches = [
        createUniqueBranch({ name: 'Branch 1' }),
        createUniqueBranch({ name: 'Branch 2' }),
        createUniqueBranch({ name: 'Branch 3' })
      ];

      await prisma.branch.createMany({ data: branches });
    });

    it('should get all branches with authentication', async () => {
      const response = await request(app)
        .get('/api/branches')
        .set('Authorization', `Bearer ${authTokens.cashier}`); // Any auth user

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).not.toHaveProperty('users');
      expect(response.body[0]).not.toHaveProperty('products');
      expect(response.body[0]).toHaveProperty('_count');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/branches');

      expect(response.status).toBe(401);
    });

    it('should get all branches with count relations', async () => {
      const response = await request(app)
        .get('/api/branches?include_relations=true')
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('_count');
      expect(response.body[0]._count).toHaveProperty('users');
      expect(response.body[0]._count).toHaveProperty('products');
    });

    it('should return branches ordered by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/branches')
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      const dates = response.body.map(b => new Date(b.createdAt));
      expect(dates[0].getTime()).toBeGreaterThanOrEqual(dates[1].getTime());
    });
  });

  describe('GET /branches/:id', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Single Branch' })
      });
      testBranchId = branch.id;
    });

    it('should get branch by ID with authentication', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testBranchId);
      expect(response.body.name).toBe('Single Branch');
      expect(response.body).toHaveProperty('_count');
    });

    it('should get branch with full relations when requested', async () => {
      // Add some related data first
      await prisma.user.create({
        data: createUniqueUser(testBranchId)
      });
      
      const response = await request(app)
        .get(`/api/branches/${testBranchId}?include_relations=true`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('categories');
      expect(response.body.users).toHaveLength(1);
    });

    it('should return 404 for non-existent branch', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/branches/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /branches/:id', () => {
    let testBranchId;
    let originalBranch;

    beforeEach(async () => {
      originalBranch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Update Branch' })
      });
      testBranchId = originalBranch.id;
    });

    it('should allow admin to update branch', async () => {
      const updateData = {
        name: `Only Name Updated ${Date.now()}`
      };
      
      const response = await request(app)
        .put(`/api/branches/${testBranchId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.address).toBe(originalBranch.address);
      expect(response.body.phone).toBe(originalBranch.phone);
    });

    it('should return 404 for non-existent branch', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/api/branches/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /branches/:id', () => {
    it('should allow admin to delete empty branch', async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/branches/${branch.id}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Branch deleted successfully');
      
      // Verify deletion
      const deletedBranch = await prisma.branch.findUnique({
        where: { id: branch.id }
      });
      expect(deletedBranch).toBeNull();
    });

    it('should deny non-admin from deleting branch', async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/branches/${branch.id}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(403);
    });

    it('should prevent deletion of branch with users', async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Branch with User' })
      });
      
      await prisma.user.create({
        data: createUniqueUser(branch.id)
      });
      
      const response = await request(app)
        .delete(`/api/branches/${branch.id}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing data');
    });

    it('should prevent deletion of branch with products', async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Branch with Product' })
      });
      
      await prisma.product.create({
        data: createUniqueProduct(branch.id)
      });
      
      const response = await request(app)
        .delete(`/api/branches/${branch.id}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing data');
    });

    it('should return 404 for non-existent branch', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/branches/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /branches/:id/products', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Products Branch' })
      });
      testBranchId = branch.id;
      
      // Create test products with specific stock levels
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { name: 'Product 1', stock: 100 }),
          createUniqueProduct(testBranchId, { name: 'Product 2', stock: 50, active: false }),
          createUniqueProduct(testBranchId, { name: 'Low Stock', stock: 5 })
        ]
      });
    });

    it('should get all branch products with authentication', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/products`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/products`);

      expect(response.status).toBe(401);
    });

    it('should filter active products', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/products?active=true`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.every(p => p.active)).toBe(true);
    });

    it('should filter low stock products', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/products?lowStock=true`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].stock).toBe(5);
    });
  });

  describe('GET /branches/:id/users', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Users Branch' })
      });
      testBranchId = branch.id;

      await prisma.user.create({
        data: createUniqueUser(testBranchId)
      });
    });

    it('should allow admin to view branch users', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/users`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should allow manager to view branch users', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/users`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from viewing branch users', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/users`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /branches/:id/transactions', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Transactions Branch' })
      });
      testBranchId = branch.id;
    });

    it('should allow admin to view branch transactions', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/transactions`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should allow manager to view branch transactions', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/transactions`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from viewing all branch transactions', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/transactions`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /branches/:id/analytics', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Analytics Branch' })
      });
      testBranchId = branch.id;
      
      // Create test data
      await prisma.user.create({
        data: createUniqueUser(testBranchId)
      });
      
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { stock: 5 }),
          createUniqueProduct(testBranchId, { stock: 15 })
        ]
      });
    });

    it('should return branch analytics for admin', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('sales');
      
      expect(response.body.overview).toMatchObject({
        totalProducts: 2,
        totalUsers: 1,
        totalCategories: 0,
        lowStockProducts: 1
      });
    });

    it('should return branch analytics for manager', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
    });

    it('should deny analytics access for cashier', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /branches/:id/inventory-status', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Inventory Branch' })
      });
      testBranchId = branch.id;
      
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { stock: 0 }), // out of stock
          createUniqueProduct(testBranchId, { stock: 5 }), // low stock
          createUniqueProduct(testBranchId, { stock: 50 }), // good stock
          createUniqueProduct(testBranchId, { active: false, stock: 100 }) // inactive
        ]
      });
    });

    it('should return inventory status for admin', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/inventory-status`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('lowStockItems');
      
      expect(response.body.summary).toMatchObject({
        totalProducts: 4,
        activeProducts: 3,
        outOfStockProducts: 1,
        lowStockProducts: 1,
        totalStockUnits: 55
      });
    });

    it('should return inventory status for stock manager', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/inventory-status`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
    });

    it('should deny inventory status for cashier', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/inventory-status`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });

    it('should return low stock items list', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/inventory-status`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.lowStockItems).toHaveLength(1);
      expect(response.body.lowStockItems[0].stock).toBe(5);
    });
  });

  describe('GET /branches/:id/stock-movements', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Stock Movements Branch' })
      });
      testBranchId = branch.id;
    });

    it('should allow admin to view stock movements', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/stock-movements`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stockMovements');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should allow stock manager to view stock movements', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/stock-movements`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from viewing stock movements', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/stock-movements`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /branches/:id/categories', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Categories Branch' })
      });
      testBranchId = branch.id;
    });

    it('should get branch categories with authentication', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/categories`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/categories`);

      expect(response.status).toBe(401);
    });
  });
});
