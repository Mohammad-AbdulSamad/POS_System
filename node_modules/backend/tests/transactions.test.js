// tests/transactions.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';

const prisma = new PrismaClient();

const createUniqueBranch = (overrides = {}) => ({
  name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  address: '123 Test Street',
  phone: '+1234567890',
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

const createUniqueCustomer = (overrides = {}) => ({
  name: `Test Customer ${Date.now()}`,
  phone: `+123456${Date.now().toString().slice(-4)}`,
  email: `customer-${Date.now()}@example.com`,
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

const createTransactionData = (branchId, productId, cashierId = null, customerId = null) => ({
  branchId,
  cashierId,
  customerId,
  lines: [
    {
      productId,
      unitPrice: 10.99,
      qty: 2,
      discount: 0,
      taxAmount: 1.50
    }
  ],
  payments: [
    {
      method: 'CASH',
      amount: 23.48
    }
  ]
});

describe('Transactions API', () => {
  let testBranchId;
  let testProductId;
  let testCashierId;
  let testCustomerId;

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
    await prisma.user.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.taxRate.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.branch.deleteMany();

    // Create test branch
    const branch = await prisma.branch.create({
      data: createUniqueBranch()
    });
    testBranchId = branch.id;

    // Create test product
    const product = await prisma.product.create({
      data: createUniqueProduct(testBranchId, { stock: 50 })
    });
    testProductId = product.id;

    // Create test cashier
    const cashier = await prisma.user.create({
      data: createUniqueUser(testBranchId)
    });
    testCashierId = cashier.id;

    // Create test customer
    const customer = await prisma.customer.create({
      data: createUniqueCustomer()
    });
    testCustomerId = customer.id;
  });

  describe('POST /transactions', () => {
    it('should create a new transaction with valid data', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      
      const response = await request(app)
        .post("/api/transactions")
        .send(transactionData);

      // compute expected totals from the test payload (robust to formatting differences)
      const expectedTax = transactionData.lines.reduce((sum, l) => sum + (l.taxAmount || 0), 0);
      const expectedLinesTotal = transactionData.lines.reduce((sum, l) => sum + (l.unitPrice * l.qty - (l.discount || 0)), 0);
      const expectedGross = expectedLinesTotal + expectedTax;

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('receiptNumber');
      expect(parseFloat(response.body.totalGross)).toBeCloseTo(expectedGross, 2);
      expect(parseFloat(response.body.totalTax)).toBeCloseTo(expectedTax, 2);
      expect(response.body.branchId).toBe(testBranchId);
      expect(response.body.lines).toHaveLength(1);
      expect(response.body.payments).toHaveLength(1);
    });

    it('should create transaction without cashier or customer', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId);
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.cashierId).toBeNull();
      expect(response.body.customerId).toBeNull();
    });

    it('should update product stock correctly', async () => {
      const initialProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      
      const transactionData = createTransactionData(testBranchId, testProductId);
      transactionData.lines[0].qty = 5;
      
      await request(app)
        .post('/api/transactions')
        .send(transactionData);

      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });

      expect(updatedProduct.stock).toBe(initialProduct.stock - 5);
    });

    it('should create stock movement records', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId);
      
      await request(app)
        .post('/api/transactions')
        .send(transactionData);

      const stockMovements = await prisma.stockMovement.findMany({
        where: { productId: testProductId, reason: 'sale' }
      });

      expect(stockMovements).toHaveLength(1);
      expect(stockMovements[0].change).toBe(-2);
    });

    it('should handle loyalty points correctly', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      transactionData.loyaltyPointsEarned = 10;
      transactionData.loyaltyPointsUsed = 5;
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.loyaltyPointsEarned).toBe(10);
      expect(response.body.loyaltyPointsUsed).toBe(5);

      // Check customer points updated
      const customer = await prisma.customer.findUnique({
        where: { id: testCustomerId }
      });
      expect(customer.loyaltyPoints).toBe(5); // 0 + 10 - 5

      // Check loyalty transactions created
      const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
        where: { customerId: testCustomerId }
      });
      expect(loyaltyTransactions).toHaveLength(2);
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({ branchId: testBranchId });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Required fields');
    });

    it('should fail when branch does not exist', async () => {
      const transactionData = createTransactionData('550e8400-e29b-41d4-a716-446655440000', testProductId);
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Branch not found');
    });

    it('should fail when product has insufficient stock', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId);
      transactionData.lines[0].qty = 100; // More than available stock (50)
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should validate line items correctly', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId);
      transactionData.lines[0].qty = 0; // Invalid qty
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('qty (> 0)');
    });
  });

  describe('GET /transactions', () => {
    beforeEach(async () => {
      // Create test transactions
      const transaction1Data = createTransactionData(testBranchId, testProductId, testCashierId);
      await request(app).post('/api/transactions').send(transaction1Data);
      
      const transaction2Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      await request(app).post('/api/transactions').send(transaction2Data);
    });

    it('should get all transactions with pagination', async () => {
      const response = await request(app)
        .get('/api/transactions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter transactions by branch', async () => {
      const response = await request(app)
        .get(`/api/transactions?branchId=${testBranchId}`);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.transactions[0].branchId).toBe(testBranchId);
    });

    it('should filter transactions by status', async () => {
      const response = await request(app)
        .get('/api/transactions?status=COMPLETED');

      expect(response.status).toBe(200);
      expect(response.body.transactions.every(t => t.status === 'COMPLETED')).toBe(true);
    });

    it('should filter transactions by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/transactions?startDate=${today}&endDate=${tomorrow}`);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toHaveLength(2);
    });

    it('should include full relations when requested', async () => {
      const response = await request(app)
        .get('/api/transactions?include_relations=true');

      expect(response.status).toBe(200);
      expect(response.body.transactions[0]).toHaveProperty('lines');
      expect(response.body.transactions[0]).toHaveProperty('payments');
      expect(response.body.transactions[0].lines[0]).toHaveProperty('product');
    });
  });

  describe('GET /transactions/:id', () => {
    let testTransactionId;

    beforeEach(async () => {
      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);
      testTransactionId = response.body.id;
    });

    it('should get transaction by ID', async () => {
      const response = await request(app)
        .get(`/api/transactions/${testTransactionId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testTransactionId);
      expect(response.body).toHaveProperty('branch');
      expect(response.body).toHaveProperty('_count');
    });

    it('should get transaction with full relations', async () => {
      const response = await request(app)
        .get(`/api/transactions/${testTransactionId}?include_relations=true`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lines');
      expect(response.body).toHaveProperty('payments');
      expect(response.body.lines[0]).toHaveProperty('product');
    });

    it('should return 404 for non-existent transaction', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/transactions/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /transactions/:id', () => {
    let testTransactionId;

    beforeEach(async () => {
      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      transactionData.status = 'PENDING';
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);
      testTransactionId = response.body.id;

      // Manually update to pending for testing
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'PENDING' }
      });
    });

    it('should update transaction status', async () => {
      const updateData = {
        status: 'COMPLETED'
      };
      
      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
    });

    it('should update transaction metadata', async () => {
      const updateData = {
        metadata: { note: 'Special transaction' }
      };
      
      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.metadata.note).toBe('Special transaction');
    });

    it('should prevent changing completed transaction to pending', async () => {
      // First complete the transaction
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'COMPLETED' }
      });

      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .send({ status: 'PENDING' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot change completed transaction');
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('should delete pending transaction and restore stock', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      
      const createResponse = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      // Manually set to pending for deletion test
      await prisma.transaction.update({
        where: { id: createResponse.body.id },
        data: { status: 'PENDING' }
      });

      const initialStock = await prisma.product.findUnique({
        where: { id: testProductId },
        select: { stock: true }
      });
      
      const response = await request(app)
        .delete(`/api/transactions/${createResponse.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Transaction deleted successfully');

      // Verify stock restored
      const finalStock = await prisma.product.findUnique({
        where: { id: testProductId },
        select: { stock: true }
      });

      expect(finalStock.stock).toBe(initialStock.stock + 2); // Qty was 2

      // Verify transaction deleted
      const deletedTransaction = await prisma.transaction.findUnique({
        where: { id: createResponse.body.id }
      });
      expect(deletedTransaction).toBeNull();
    });

    it('should prevent deletion of completed transaction', async () => {
      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      
      const createResponse = await request(app)
        .post('/api/transactions')
        .send(transactionData);
      
      const response = await request(app)
        .delete(`/api/transactions/${createResponse.body.id}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot delete completed transaction');
    });
  });

  describe('GET /transactions/branch/:branchId', () => {
    beforeEach(async () => {
      const transaction1Data = createTransactionData(testBranchId, testProductId, testCashierId);
      const transaction2Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      
      await request(app).post('/api/transactions').send(transaction1Data);
      await request(app).post('/api/transactions').send(transaction2Data);
    });

    it('should get transactions by branch', async () => {
      const response = await request(app)
        .get(`/api/transactions/branch/${testBranchId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.transactions.every(t => t.branchId === testBranchId)).toBe(true);
    });

    it('should filter branch transactions by status', async () => {
      const response = await request(app)
        .get(`/api/transactions/branch/${testBranchId}?status=COMPLETED`);

      expect(response.status).toBe(200);
      expect(response.body.transactions.every(t => t.status === 'COMPLETED')).toBe(true);
    });
  });

  describe('GET /transactions/customer/:customerId', () => {
    beforeEach(async () => {
      const transaction1Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      const transaction2Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      
      await request(app).post('/api/transactions').send(transaction1Data);
      await request(app).post('/api/transactions').send(transaction2Data);
    });

    it('should get transactions by customer', async () => {
      const response = await request(app)
        .get(`/api/transactions/customer/${testCustomerId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.transactions.every(t => t.customerId === testCustomerId)).toBe(true);
    });
  });

  describe('GET /transactions/:id/receipt', () => {
    let testTransactionId;

    beforeEach(async () => {
      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);
      testTransactionId = response.body.id;
    });

    it('should get formatted receipt data', async () => {
      const response = await request(app)
        .get(`/api/transactions/${testTransactionId}/receipt`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('receiptNumber');
      expect(response.body).toHaveProperty('branch');
      expect(response.body).toHaveProperty('lines');
      expect(response.body).toHaveProperty('payments');
      expect(response.body.lines[0]).toHaveProperty('product');
    });

    it('should return 404 for non-existent transaction', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/transactions/${fakeId}/receipt`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple products in one transaction', async () => {
      // Create second product
      const product2 = await prisma.product.create({
        data: createUniqueProduct(testBranchId, { stock: 30 })
      });

      const transactionData = {
        branchId: testBranchId,
        cashierId: testCashierId,
        lines: [
          {
            productId: testProductId,
            unitPrice: 10.99,
            qty: 2,
            discount: 1.00,
            taxAmount: 1.50
          },
          {
            productId: product2.id,
            unitPrice: 15.50,
            qty: 1,
            discount: 0,
            taxAmount: 2.00
          }
        ],
        payments: [
          { method: 'CASH', amount: 20.00 },
          { method: 'CARD', amount: 16.98 }
        ]
      };
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      // compute expected totals
      const expectedTaxComplex = transactionData.lines.reduce((s, l) => s + (l.taxAmount || 0), 0);
      const expectedLinesTotalComplex = transactionData.lines.reduce((s, l) => s + (l.unitPrice * l.qty - (l.discount || 0)), 0);
      const expectedGrossComplex = expectedLinesTotalComplex + expectedTaxComplex;

      expect(response.status).toBe(201);
      expect(response.body.lines).toHaveLength(2);
      expect(response.body.payments).toHaveLength(2);
      expect(parseFloat(response.body.totalGross)).toBeCloseTo(expectedGrossComplex, 2);
    });

    it('should handle transaction with loyalty customer', async () => {
      // Update customer with loyalty points
      await prisma.customer.update({
        where: { id: testCustomerId },
        data: { 
          loyaltyPoints: 50,
          loyaltyNumber: 'LOYALTY123'
        }
      });

      const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      transactionData.loyaltyPointsEarned = 15;
      transactionData.loyaltyPointsUsed = 10;
      
      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(201);

      // Check customer loyalty points updated correctly
      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: testCustomerId }
      });
      expect(updatedCustomer.loyaltyPoints).toBe(55); // 50 + 15 - 10

      // Check loyalty transaction records
      const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
        where: { customerId: testCustomerId }
      });
      expect(loyaltyTransactions).toHaveLength(2);
    });
  });
});