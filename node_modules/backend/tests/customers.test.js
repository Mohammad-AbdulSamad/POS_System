// tests/customers.test.js - Updated with Authentication & Authorization
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

const createUniqueCustomer = (overrides = {}) => ({
  name: `Test Customer ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  phone: `+12345${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`,
  email: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
  loyaltyNumber: `LOYAL${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
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

describe('Customers API - With Authentication', () => {
  let testBranchId;
  let testProductId;
  let authTokens;
  let authUsers;

  // Setup authentication
  beforeAll(async () => {
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
    // Don't delete auth users
    await prisma.user.deleteMany({
      where: {
        id: { notIn: Object.values(authUsers).map(u => u.id) }
      }
    });

    // Create test data
    const branch = await prisma.branch.create({
      data: createUniqueBranch()
    });
    testBranchId = branch.id;

    const product = await prisma.product.create({
      data: createUniqueProduct(testBranchId)
    });
    testProductId = product.id;
  });

  // Cleanup auth after all tests
  afterAll(async () => {
    const userIds = Object.values(authUsers).map(u => u.id);
    await cleanupTestAuth(userIds);
    await prisma.$disconnect();
  });

  describe('POST /customers', () => {
    it('should allow cashier to create a customer', async () => {
      const customerData = createUniqueCustomer();
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(customerData.name);
      expect(response.body.phone).toBe(customerData.phone);
      expect(response.body.email).toBe(customerData.email);
      expect(response.body.loyaltyPoints).toBe(0);
      expect(response.body.loyaltyTier).toBe('BRONZE');
    });

    it('should allow admin to create a customer', async () => {
      const customerData = createUniqueCustomer();
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(customerData);

      expect(response.status).toBe(201);
    });

    it('should deny creation without authentication', async () => {
      const customerData = createUniqueCustomer();
      
      const response = await request(app)
        .post('/api/customers')
        .send(customerData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should create customer with minimal required data', async () => {
      const customerData = {
        name: `Minimal Customer ${Date.now()}`
      };
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(customerData.name);
      expect(response.body.phone).toBeNull();
      expect(response.body.email).toBeNull();
      expect(response.body).toHaveProperty('loyaltyNumber');
      expect(response.body.loyaltyTier).toBe('BRONZE');
    });

    it('should auto-generate loyalty number if not provided', async () => {
      const customerData = {
        name: `Auto Loyalty Customer ${Date.now()}`,
        phone: '+1234567890'
      };
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.loyaltyNumber).toMatch(/^LOYAL/);
    });

    it('should validate email format', async () => {
      const customerData = {
        name: 'Test Customer',
        email: 'invalid-email'
      };
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(customerData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('should validate phone format', async () => {
      const customerData = {
        name: 'Test Customer',
        phone: 'invalid-phone'
      };
      
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(customerData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid phone format');
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should prevent duplicate phone numbers', async () => {
      const phone = '+1234567890';
      
      // Create first customer
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ name: 'Customer 1', phone });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ name: 'Customer 2', phone });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Phone number already exists');
    });

    it('should prevent duplicate emails', async () => {
      const email = 'test@example.com';
      
      // Create first customer
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: 'Customer 1', email });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: 'Customer 2', email });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Email already exists');
    });
  });

  describe('GET /customers', () => {
    beforeEach(async () => {
      await prisma.customer.create({
        data: createUniqueCustomer({ 
          name: 'Bronze Customer',
          loyaltyTier: 'BRONZE',
          loyaltyPoints: 50
        })
      });

      await prisma.customer.create({
        data: createUniqueCustomer({ 
          name: 'Silver Customer',
          loyaltyTier: 'SILVER',
          loyaltyPoints: 500
        })
      });

      await prisma.customer.create({
        data: createUniqueCustomer({ 
          name: 'Gold Customer',
          loyaltyTier: 'GOLD',
          loyaltyPoints: 1500
        })
      });
    });

    it('should allow admin to get all customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.customers).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should allow manager to get all customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.customers).toHaveLength(3);
    });

    it('should deny cashier from getting all customers', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(401);
    });

    it('should filter customers by loyalty tier', async () => {
      const response = await request(app)
        .get('/api/customers?loyaltyTier=SILVER')
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.customers).toHaveLength(1);
      expect(response.body.customers[0].loyaltyTier).toBe('SILVER');
    });

    it('should filter customers by minimum loyalty points', async () => {
      const response = await request(app)
        .get('/api/customers?minLoyaltyPoints=500')
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.customers).toHaveLength(2);
      expect(response.body.customers.every(c => c.loyaltyPoints >= 500)).toBe(true);
    });

    it('should search customers', async () => {
      const response = await request(app)
        .get('/api/customers?search=Bronze')
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.customers.length).toBeGreaterThan(0);
      expect(response.body.customers[0].name).toContain('Bronze');
    });
  });

  describe('GET /customers/search', () => {
    beforeEach(async () => {
      await prisma.customer.create({
        data: createUniqueCustomer({ 
          name: 'John Doe',
          phone: '+1234567890',
          loyaltyNumber: 'LOYAL123'
        })
      });

      await prisma.customer.create({
        data: createUniqueCustomer({ 
          name: 'Jane Smith',
          email: 'jane@example.com',
          loyaltyNumber: 'LOYAL456',
          phone: null
        })
      });
    });

    it('should allow all authenticated users to search customers', async () => {
      const response = await request(app)
        .get('/api/customers/search?q=John')
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('John');
    });

    it('should deny search without authentication', async () => {
      const response = await request(app)
        .get('/api/customers/search?q=John');

      expect(response.status).toBe(401);
    });

    it('should search customers by phone', async () => {
      const response = await request(app)
        .get('/api/customers/search?q=1234567890')
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].phone).toContain('1234567890');
    });

    it('should search customers by loyalty number', async () => {
      const response = await request(app)
        .get('/api/customers/search?q=LOYAL123')
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].loyaltyNumber).toContain('LOYAL123');
    });

    it('should require minimum search length', async () => {
      const response = await request(app)
        .get('/api/customers/search?q=a')
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 2 characters');
    });
  });

  describe('GET /customers/:id', () => {
    let testCustomerId;

    beforeEach(async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Single Customer' })
      });
      testCustomerId = customer.id;
    });

    it('should allow all authenticated users to get customer by ID', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testCustomerId);
      expect(response.body.name).toBe('Single Customer');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}`);

      expect(response.status).toBe(401);
    });

    it('should get customer with full relations', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}?include_relations=true`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('loyaltyTransactions');
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/customers/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /customers/:id', () => {
    let testCustomerId;

    beforeEach(async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Update Customer' })
      });
      testCustomerId = customer.id;
    });

    it('should allow cashier to update customer', async () => {
      const updateData = {
        name: `Updated Customer ${Date.now()}`,
        preferredStore: 'Store A'
      };
      
      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.preferredStore).toBe('Store A');
    });

    it('should allow admin to update customer tier', async () => {
      const updateData = {
        loyaltyTier: 'SILVER'
      };
      
      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.loyaltyTier).toBe('SILVER');
    });

    it('should deny update without authentication', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(401);
    });

    it('should validate email format on update', async () => {
      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('should prevent duplicate phone on update', async () => {
      const otherCustomer = await prisma.customer.create({
        data: createUniqueCustomer({ phone: '+9876543210' })
      });

      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ phone: '+9876543210' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Phone number already exists');
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should allow admin to delete customer without transactions', async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Customer deleted successfully');
    });

    it('should allow manager to delete customer', async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from deleting customer', async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });

    it('should deny deletion without authentication', async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/customers/${customer.id}`);

      expect(response.status).toBe(401);
    });

    it('should prevent deletion of customer with transactions', async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Customer with Transactions' })
      });
      
      await prisma.transaction.create({
        data: {
          branchId: testBranchId,
          customerId: customer.id,
          cashierId: authUsers.cashier.id,
          receiptNumber: `REC-${Date.now()}`,
          totalGross: 100.00,
          totalTax: 10.00,
          totalNet: 90.00
        }
      });
      
      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('transaction history');
    });
  });

  describe('GET /customers/:id/transactions', () => {
    let testCustomerId;

    beforeEach(async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Transaction Customer' })
      });
      testCustomerId = customer.id;
      
      await prisma.transaction.createMany({
        data: [
          {
            branchId: testBranchId,
            customerId: testCustomerId,
            cashierId: authUsers.cashier.id,
            receiptNumber: `REC-${Date.now()}-1`,
            totalGross: 50.00,
            totalTax: 5.00,
            totalNet: 45.00,
            status: 'COMPLETED'
          },
          {
            branchId: testBranchId,
            customerId: testCustomerId,
            cashierId: authUsers.cashier.id,
            receiptNumber: `REC-${Date.now()}-2`,
            totalGross: 75.00,
            totalTax: 7.50,
            totalNet: 67.50,
            status: 'COMPLETED'
          }
        ]
      });
    });

    it('should allow all authenticated users to get customer transactions', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/transactions`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.transactions).toHaveLength(2);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/transactions`);

      expect(response.status).toBe(401);
    });

    it('should filter transactions by status', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/transactions?status=COMPLETED`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.transactions.every(t => t.status === 'COMPLETED')).toBe(true);
    });
  });

  describe('GET /customers/:id/loyalty-history', () => {
    let testCustomerId;

    beforeEach(async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Loyalty Customer', loyaltyPoints: 100 })
      });
      testCustomerId = customer.id;
      
      await prisma.loyaltyTransaction.createMany({
        data: [
          {
            customerId: testCustomerId,
            points: 50,
            type: 'EARNED',
            reason: 'PURCHASE'
          },
          {
            customerId: testCustomerId,
            points: 25,
            type: 'REDEEMED',
            reason: 'PURCHASE'
          }
        ]
      });
    });

    it('should allow all authenticated users to get loyalty history', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/loyalty-history`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('loyaltyTransactions');
      expect(response.body).toHaveProperty('currentPoints');
      expect(response.body).toHaveProperty('currentTier');
      expect(response.body.loyaltyTransactions).toHaveLength(2);
      expect(response.body.currentPoints).toBe(100);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/loyalty-history`);

      expect(response.status).toBe(401);
    });

    it('should filter loyalty history by type', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/loyalty-history?type=EARNED`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.loyaltyTransactions).toHaveLength(1);
      expect(response.body.loyaltyTransactions[0].type).toBe('EARNED');
    });
  });

  describe('POST /customers/:id/loyalty-points', () => {
    let testCustomerId;

    beforeEach(async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Points Customer', loyaltyPoints: 100 })
      });
      testCustomerId = customer.id;
    });

    it('should allow cashier to add loyalty points', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomerId}/loyalty-points`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          points: 50,
          reason: 'Bonus points'
        });

      expect(response.status).toBe(200);
      expect(response.body.customer.loyaltyPoints).toBe(150);
      expect(response.body.loyaltyTransaction.type).toBe('EARNED');
    });

    it('should allow admin to deduct loyalty points', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomerId}/loyalty-points`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({
          points: -30,
          reason: 'Point redemption'
        });

      expect(response.status).toBe(200);
      expect(response.body.customer.loyaltyPoints).toBe(70);
      expect(response.body.loyaltyTransaction.type).toBe('REDEEMED');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomerId}/loyalty-points`)
        .send({
          points: 50,
          reason: 'Bonus'
        });

      expect(response.status).toBe(401);
    });

    it('should prevent negative loyalty points', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomerId}/loyalty-points`)
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({
          points: -200,
          reason: 'Over redemption'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient loyalty points');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/customers/${testCustomerId}/loyalty-points`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ points: 50 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Points and reason are required');
    });
  });

  describe('GET /customers/:id/analytics', () => {
    let testCustomerId;

    beforeEach(async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ name: 'Analytics Customer', loyaltyPoints: 200 })
      });
      testCustomerId = customer.id;
      
      const transaction = await prisma.transaction.create({
        data: {
          branchId: testBranchId,
          customerId: testCustomerId,
          cashierId: authUsers.cashier.id,
          receiptNumber: `REC-${Date.now()}`,
          totalGross: 100.00,
          totalTax: 10.00,
          totalNet: 90.00,
          status: 'COMPLETED'
        }
      });

      await prisma.transactionLine.create({
        data: {
          transactionId: transaction.id,
          productId: testProductId,
          unitPrice: 10.99,
          qty: 5,
          lineTotal: 54.95
        }
      });

      await prisma.loyaltyTransaction.createMany({
        data: [
          {
            customerId: testCustomerId,
            points: 100,
            type: 'EARNED',
            reason: 'PURCHASE'
          },
          {
            customerId: testCustomerId,
            points: 50,
            type: 'REDEEMED',
            reason: 'PURCHASE'
          }
        ]
      });
    });

    it('should allow admin to get customer analytics', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customer');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('favoriteProducts');
      expect(response.body).toHaveProperty('recentActivity');
      
      expect(response.body.summary).toMatchObject({
        totalTransactions: 1,
        totalSpent: 100.00,
        loyaltyPointsEarned: 100,
        loyaltyPointsRedeemed: 50
      });
    });

    it('should allow manager to get customer analytics', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from getting analytics', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/analytics`);

      expect(response.status).toBe(401);
    });

    it('should handle different period filters', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}/analytics?period=30`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.period).toBe(30);
    });
  });

  describe('Complex Production Scenarios', () => {
    it('should handle complete customer lifecycle', async () => {
      // Create customer
      const createResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          name: 'Lifecycle Customer',
          phone: '+1111111111',
          email: 'lifecycle@example.com'
        });

      const customerId = createResponse.body.id;

      // Add loyalty points
      await request(app)
        .post(`/api/customers/${customerId}/loyalty-points`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          points: 100,
          reason: 'Welcome bonus'
        });

      // Create transaction
      await prisma.transaction.create({
        data: {
          branchId: testBranchId,
          customerId,
          cashierId: authUsers.cashier.id,
          receiptNumber: `REC-${Date.now()}`,
          totalGross: 50.00,
          totalTax: 5.00,
          totalNet: 45.00,
          loyaltyPointsEarned: 25,
          status: 'COMPLETED'
        }
      });

      // Check analytics (admin only)
      const analyticsResponse = await request(app)
        .get(`/api/customers/${customerId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(analyticsResponse.body.summary.totalTransactions).toBe(1);
      expect(analyticsResponse.body.summary.loyaltyPointsEarned).toBe(100);
    });

    it('should maintain data consistency during operations', async () => {
      const customer = await prisma.customer.create({
        data: createUniqueCustomer({ loyaltyPoints: 50 })
      });

      // Try to deduct more points than available
      const response = await request(app)
        .post(`/api/customers/${customer.id}/loyalty-points`)
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({
          points: -100,
          reason: 'Over redemption attempt'
        });

      expect(response.status).toBe(400);

      // Verify points unchanged
      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: customer.id }
      });
      expect(updatedCustomer.loyaltyPoints).toBe(50);
    });
  });
});