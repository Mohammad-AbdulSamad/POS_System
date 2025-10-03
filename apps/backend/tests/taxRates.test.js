// tests/taxRates.test.js - Updated with Authentication
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { setupTestAuth, cleanupTestAuth } from './helpers/auth.helper.js';

const prisma = new PrismaClient();

const createUniqueBranch = (overrides = {}) => ({
  name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  address: '123 Test Street',
  phone: '+1234567890',
  ...overrides
});

const createUniqueProduct = (branchId, overrides = {}) => ({
  branchId,
  sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  name: `Test Product ${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
  description: 'Test product description',
  priceGross: 10.99,
  cost: 5.50,
  unit: 'pcs',
  stock: 100,
  active: true,
  ...overrides
});

describe('TaxRates API - With Authentication', () => {
  let testBranchId;
  let testBranch2Id;
  let authTokens;
  let authUsers;

  beforeAll(async () => {
    // Setup authentication (create users and get tokens)
    const auth = await setupTestAuth(app);
    authTokens = auth.tokens;
    authUsers = auth.users;
  });

  beforeEach(async () => {
    // Clean database
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

    // Create test branches
    const branch1 = await prisma.branch.create({
      data: createUniqueBranch({ name: 'Main Branch' })
    });
    testBranchId = branch1.id;

    const branch2 = await prisma.branch.create({
      data: createUniqueBranch({ name: 'Secondary Branch' })
    });
    testBranch2Id = branch2.id;
  });

  afterAll(async () => {
    // Cleanup auth users
    const userIds = Object.values(authUsers).map(u => u.id);
    await cleanupTestAuth(userIds);
    await prisma.$disconnect();
  });

  describe('POST /taxrates', () => {
    it('should create a new tax rate with admin token', async () => {
      const taxRateData = {
        name: `Standard VAT ${Date.now()}`,
        rate: 20.00
      };
      
      const response = await request(app)
        .post('/api/taxrates')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(taxRateData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(taxRateData.name);
      expect(parseFloat(response.body.rate)).toBe(20.00);
    });

    it('should deny access without authentication', async () => {
      const taxRateData = {
        name: `Standard VAT ${Date.now()}`,
        rate: 20.00
      };
      
      const response = await request(app)
        .post('/api/taxrates')
        .send(taxRateData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should deny access for non-admin roles', async () => {
      const taxRateData = {
        name: `Standard VAT ${Date.now()}`,
        rate: 20.00
      };
      
      // Try with cashier token
      const response = await request(app)
        .post('/api/taxrates')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(taxRateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    it('should prevent duplicate tax rate names', async () => {
      const taxRateName = `Duplicate Tax ${Date.now()}`;
      
      await request(app)
        .post('/api/taxrates')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: taxRateName, rate: 10.00 });

      const response = await request(app)
        .post('/api/taxrates')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: taxRateName, rate: 15.00 });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should prevent duplicate tax rate values', async () => {
      const uniqueRate = 12.5;
      
      await request(app)
        .post('/api/taxrates')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: `First Tax ${Date.now()}`, rate: uniqueRate });

      const response = await request(app)
        .post('/api/taxrates')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: `Second Tax ${Date.now()}`, rate: uniqueRate });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /taxrates', () => {
    beforeEach(async () => {
      // Create test tax rates with unique rates
      await prisma.taxRate.createMany({
        data: [
          { name: `Standard Rate ${Date.now()}`, rate: 20.00 },
          { name: `Reduced Rate ${Date.now()}`, rate: 5.00 },
          { name: `Zero Rate ${Date.now()}`, rate: 0.00 }
        ]
      });
    });

    it('should get all tax rates with authentication', async () => {
      const response = await request(app)
        .get('/api/taxrates')
        .set('Authorization', `Bearer ${authTokens.cashier}`); // Any authenticated user

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('taxRates');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.taxRates.length).toBeGreaterThanOrEqual(3);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/taxrates');

      expect(response.status).toBe(401);
    });

    it('should filter tax rates by rate range', async () => {
      const response = await request(app)
        .get('/api/taxrates?minRate=5&maxRate=20')
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.taxRates.every(tr => {
        const rate = parseFloat(tr.rate);
        return rate >= 5.00 && rate <= 20.00;
      })).toBe(true);
    });
  });

  describe('POST /taxrates/calculate', () => {
    let testTaxRateId;

    beforeEach(async () => {
      const taxRate = await prisma.taxRate.create({
        data: { name: `Calculate Tax ${Date.now()}`, rate: 20.00 }
      });
      testTaxRateId = taxRate.id;
    });

    it('should calculate tax correctly for any authenticated user', async () => {
      const response = await request(app)
        .post('/api/taxrates/calculate')
        .set('Authorization', `Bearer ${authTokens.cashier}`) // Cashier can calculate
        .send({
          amount: 100.00,
          taxRateId: testTaxRateId
        });

      expect(response.status).toBe(200);
      expect(response.body.baseAmount).toBe(100.00);
      expect(response.body.taxAmount).toBe(20.00);
      expect(response.body.totalAmount).toBe(120.00);
    });

    it('should handle zero amount', async () => {
      const response = await request(app)
        .post('/api/taxrates/calculate')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          amount: 0.01,
          taxRateId: testTaxRateId
        });

      expect(response.status).toBe(200);
      expect(response.body.baseAmount).toBe(0.01);
    });

    it('should handle precise calculations with rounding', async () => {
      const preciseTaxRate = await prisma.taxRate.create({
        data: { name: `Precise ${Date.now()}`, rate: 8.88 }
      });

      const response = await request(app)
        .post('/api/taxrates/calculate')
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({
          amount: 1000.00,
          taxRateId: preciseTaxRate.id
        });

      expect(response.status).toBe(200);
      expect(response.body.taxAmount).toBeCloseTo(88.80, 1);
    });
  });

  describe('GET /taxrates/:id/products', () => {
    let testTaxRateId;

    beforeEach(async () => {
      const taxRate = await prisma.taxRate.create({
        data: { name: `Products Tax ${Date.now()}`, rate: 20.00 }
      });
      testTaxRateId = taxRate.id;
      
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { 
            taxRateId: testTaxRateId,
            name: `Taxed Product 1 ${Date.now()}`,
            active: true
          }),
          createUniqueProduct(testBranchId, { 
            taxRateId: testTaxRateId,
            name: `Taxed Product 2 ${Date.now()}`,
            active: true
          }),
          createUniqueProduct(testBranch2Id, { 
            taxRateId: testTaxRateId,
            name: `Inactive Product ${Date.now()}`,
            active: false
          })
        ]
      });
    });

    it('should get tax rate products for admin/manager/stock manager', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/products`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(3);
    });

    it('should deny access for cashier', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/products`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });

    it('should filter active products only', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/products?active=true`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.every(p => p.active)).toBe(true);
    });
  });

  describe('POST /taxrates/:id/assign-products', () => {
    let testTaxRateId, product1Id, product2Id;

    beforeEach(async () => {
      const taxRate = await prisma.taxRate.create({
        data: { name: `Assign Tax ${Date.now()}`, rate: 15.00 }
      });
      testTaxRateId = taxRate.id;

      const product1 = await prisma.product.create({
        data: createUniqueProduct(testBranchId)
      });
      product1Id = product1.id;

      const product2 = await prisma.product.create({
        data: createUniqueProduct(testBranchId)
      });
      product2Id = product2.id;
    });

    it('should assign products to tax rate with proper authorization', async () => {
      const response = await request(app)
        .post(`/api/taxrates/${testTaxRateId}/assign-products`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({
          productIds: [product1Id, product2Id]
        });

      expect(response.status).toBe(200);
      expect(response.body.assignedCount).toBe(2);

      const assignedProducts = await prisma.product.findMany({
        where: { id: { in: [product1Id, product2Id] } }
      });
      expect(assignedProducts.every(p => p.taxRateId === testTaxRateId)).toBe(true);
    });

    it('should allow stock manager to assign products', async () => {
      const response = await request(app)
        .post(`/api/taxrates/${testTaxRateId}/assign-products`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`)
        .send({
          productIds: [product1Id]
        });

      expect(response.status).toBe(200);
    });

    it('should deny cashier from assigning products', async () => {
      const response = await request(app)
        .post(`/api/taxrates/${testTaxRateId}/assign-products`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          productIds: [product1Id]
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /taxrates/:id/analytics', () => {
    let testTaxRateId;

    beforeEach(async () => {
      const taxRate = await prisma.taxRate.create({
        data: { name: `Analytics Tax ${Date.now()}`, rate: 25.00 }
      });
      testTaxRateId = taxRate.id;
      
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { 
            taxRateId: testTaxRateId,
            priceGross: 100.00,
            active: true
          }),
          createUniqueProduct(testBranchId, { 
            taxRateId: testTaxRateId,
            priceGross: 200.00,
            active: true
          }),
          createUniqueProduct(testBranch2Id, { 
            taxRateId: testTaxRateId,
            priceGross: 300.00,
            active: true
          })
        ]
      });
    });

    it('should return analytics for admin/manager', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('taxRate');
      expect(response.body).toHaveProperty('overview');
      expect(response.body.taxRate.rate).toBe(25);
      expect(response.body.overview.totalProducts).toBe(3);
      expect(response.body.overview.activeProducts).toBe(3);
    });

    it('should deny analytics access for cashier', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /taxrates/:id', () => {
    let testTaxRateId;

    beforeEach(async () => {
      const taxRate = await prisma.taxRate.create({
        data: { name: `Update Tax ${Date.now()}`, rate: 15.00 }
      });
      testTaxRateId = taxRate.id;
    });

    it('should allow admin to update tax rate', async () => {
      const response = await request(app)
        .put(`/api/taxrates/${testTaxRateId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({
          name: 'Updated Tax Rate',
          rate: 18.00
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Tax Rate');
      expect(parseFloat(response.body.rate)).toBe(18.00);
    });

    it('should deny manager from updating tax rate', async () => {
      const response = await request(app)
        .put(`/api/taxrates/${testTaxRateId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({
          rate: 18.00
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /taxrates/:id', () => {
    let testTaxRateId;

    beforeEach(async () => {
      const taxRate = await prisma.taxRate.create({
        data: { name: `Delete Tax ${Date.now()}`, rate: 10.00 }
      });
      testTaxRateId = taxRate.id;
    });

    it('should allow admin to delete tax rate', async () => {
      const response = await request(app)
        .delete(`/api/taxrates/${testTaxRateId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should deny non-admin from deleting', async () => {
      const response = await request(app)
        .delete(`/api/taxrates/${testTaxRateId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(403);
    });
  });
});