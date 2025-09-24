// tests/branches.test.fixed.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';

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

describe('Branches API - Fixed', () => {
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
    await prisma.user.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.taxRate.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.branch.deleteMany();
  });

  describe('POST /branches', () => {
    it('should create a new branch with valid data', async () => {
      const branchData = createUniqueBranch();
      
      const response = await request(app)
        .post('/api/branches')
        .send(branchData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(branchData.name);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should create branch with minimal data (name only)', async () => {
      const branchData = { name: `Minimal Branch ${Date.now()}` };
      
      const response = await request(app)
        .post('/api/branches')
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
        .send(branchData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(branchData.name.trim());
      expect(response.body.address).toBe('123 Spaced Street');
      expect(response.body.phone).toBe('+1234567890');
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/branches')
        .send({ address: '123 Test St' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
    });

    it('should fail when name is empty string', async () => {
      const response = await request(app)
        .post('/api/branches')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
    });

    it('should fail when name is only whitespace', async () => {
      const response = await request(app)
        .post('/api/branches')
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

    it('should get all branches without relations', async () => {
      const response = await request(app)
        .get('/api/branches');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).not.toHaveProperty('users');
      expect(response.body[0]).not.toHaveProperty('products');
      expect(response.body[0]).toHaveProperty('_count');
    });

    it('should get all branches with count relations', async () => {
      const response = await request(app)
        .get('/api/branches?include_relations=true');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('_count');
      expect(response.body[0]._count).toHaveProperty('users');
      expect(response.body[0]._count).toHaveProperty('products');
    });

    it('should return branches ordered by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/branches');

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

    it('should get branch by ID without full relations', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}`);

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
        .get(`/api/branches/${testBranchId}?include_relations=true`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('categories');
      expect(response.body.users).toHaveLength(1);
    });

    it('should return 404 for non-existent branch', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/branches/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /branches/:id', () => {
    let testBranchId;

    beforeEach(async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Update Branch' })
      });
      testBranchId = branch.id;
    });

    it('should update branch with valid data', async () => {
      const updateData = {
        name: `Updated Branch ${Date.now()}`,
        address: 'New Address',
        phone: 'New Phone'
      };
      
      const response = await request(app)
        .put(`/api/branches/${testBranchId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.address).toBe('New Address');
      expect(response.body.phone).toBe('New Phone');
    });

    it('should update only provided fields', async () => {
      const originalBranch = await prisma.branch.findUnique({
        where: { id: testBranchId }
      });

      const response = await request(app)
        .put(`/api/branches/${testBranchId}`)
        .send({ name: `Only Name Updated ${Date.now()}` });

      expect(response.status).toBe(200);
      expect(response.body.name).not.toBe(originalBranch.name);
      expect(response.body.address).toBe(originalBranch.address);
      expect(response.body.phone).toBe(originalBranch.phone);
    });

    it('should return 404 for non-existent branch', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/api/branches/${fakeId}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /branches/:id', () => {
    it('should delete empty branch successfully', async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/branches/${branch.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Branch deleted successfully');
      
      // Verify deletion
      const deletedBranch = await prisma.branch.findUnique({
        where: { id: branch.id }
      });
      expect(deletedBranch).toBeNull();
    });

    it('should prevent deletion of branch with users', async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Branch with User' })
      });
      
      await prisma.user.create({
        data: createUniqueUser(branch.id)
      });
      
      const response = await request(app)
        .delete(`/api/branches/${branch.id}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing data');
      expect(response.body.details.users).toBe(1);
    });

    it('should prevent deletion of branch with products', async () => {
      const branch = await prisma.branch.create({
        data: createUniqueBranch({ name: 'Branch with Product' })
      });
      
      await prisma.product.create({
        data: createUniqueProduct(branch.id)
      });
      
      const response = await request(app)
        .delete(`/api/branches/${branch.id}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing data');
      expect(response.body.details.products).toBe(1);
    });

    it('should return 404 for non-existent branch', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/branches/${fakeId}`);

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

    it('should get all branch products with pagination', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/products`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter active products', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/products?active=true`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.every(p => p.active)).toBe(true);
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

    it('should return branch analytics', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/analytics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('sales');
      
      expect(response.body.overview).toMatchObject({
        totalProducts: 2,
        totalUsers: 1,
        totalCategories: 0,
        lowStockProducts: 1 // stock <= 10
      });
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

    it('should return inventory status summary', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/inventory-status`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('lowStockItems');
      
      // Expected: 0 + 5 + 50 = 55 (active products only)
      expect(response.body.summary).toMatchObject({
        totalProducts: 4,
        activeProducts: 3,
        outOfStockProducts: 1,
        lowStockProducts: 1,
        totalStockUnits: 55
      });
    });

    it('should return low stock items list', async () => {
      const response = await request(app)
        .get(`/api/branches/${testBranchId}/inventory-status`);

      expect(response.status).toBe(200);
      expect(response.body.lowStockItems).toHaveLength(1);
      expect(response.body.lowStockItems[0].stock).toBe(5);
    });
  });
});