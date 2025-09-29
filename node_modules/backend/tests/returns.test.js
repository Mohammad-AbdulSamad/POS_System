// tests/returns.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';

const prisma = new PrismaClient();

// Helper functions
const createTestBranch = () => ({
  name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  address: '123 Test Street'
});

const createTestProduct = (branchId) => ({
  branchId,
  sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  name: `Test Product ${Date.now()}`,
  priceGross: 10.99,
  cost: 5.50,
  unit: 'pcs',
  stock: 100,
  active: true
});

const createTestTransaction = (branchId, overrides = {}) => ({
  branchId,
  receiptNumber: `RCP-${Date.now()}`,
  totalGross: 100.00,
  totalTax: 15.00,
  totalNet: 85.00,
  status: 'COMPLETED',
  refundedAmount: 0,
  ...overrides
});

const createTestReturn = (transactionId, overrides = {}) => ({
  originalTransactionId: transactionId,
  returnAmount: 25.00,
  reason: 'defective',
  processedBy: 'test-user',
  ...overrides
});

describe('Returns API', () => {
  let testBranchId, testTransactionId, testProductId;

  beforeEach(async () => {
    // Clean database in correct order (respecting foreign keys)
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
    await prisma.branch.deleteMany();

    // Create test data
    const branch = await prisma.branch.create({ data: createTestBranch() });
    testBranchId = branch.id;

    const product = await prisma.product.create({ 
      data: createTestProduct(testBranchId) 
    });
    testProductId = product.id;

    const transaction = await prisma.transaction.create({
      data: createTestTransaction(testBranchId)
    });
    testTransactionId = transaction.id;
  });

  afterAll(async () => {
    // Clean up and disconnect
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
    await prisma.branch.deleteMany();
    await prisma.$disconnect();
  });

  // ========================================
  // POST /api/returns - Create Return
  // ========================================
  describe('POST /api/returns', () => {
    it('should create a new return successfully', async () => {
      const returnData = createTestReturn(testTransactionId);

      const res = await request(app)
        .post('/api/returns')
        .send(returnData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(parseFloat(res.body.returnAmount)).toBe(returnData.returnAmount);
      expect(res.body.reason).toBe(returnData.reason);
      expect(res.body.processedBy).toBe(returnData.processedBy);
      expect(res.body.originalTransactionId).toBe(testTransactionId);
    });

    it('should update transaction status to PARTIALLY_REFUNDED', async () => {
      const returnData = createTestReturn(testTransactionId, { returnAmount: 30 });

      await request(app)
        .post('/api/returns')
        .send(returnData)
        .expect(201);

      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });

      expect(transaction.status).toBe('PARTIALLY_REFUNDED');
      expect(parseFloat(transaction.refundedAmount)).toBe(30);
    });

    it('should update transaction status to REFUNDED when fully returned', async () => {
      const returnData = createTestReturn(testTransactionId, { returnAmount: 100 });

      await request(app)
        .post('/api/returns')
        .send(returnData)
        .expect(201);

      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });

      expect(transaction.status).toBe('REFUNDED');
      expect(parseFloat(transaction.refundedAmount)).toBe(100);
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/returns')
        .send({})
        .expect(400);

      expect(res.body.message).toContain('required');
    });

    it('should fail with invalid return amount', async () => {
      const returnData = createTestReturn(testTransactionId, { returnAmount: -10 });

      const res = await request(app)
        .post('/api/returns')
        .send(returnData)
        .expect(400);

      expect(res.body.message).toContain('positive number');
    });

    it('should fail with invalid reason', async () => {
      const returnData = createTestReturn(testTransactionId, { 
        reason: 'invalid_reason' 
      });

      const res = await request(app)
        .post('/api/returns')
        .send(returnData)
        .expect(400);

      expect(res.body.message).toContain('Invalid reason');
    });

    it('should fail with non-existent transaction', async () => {
      const returnData = createTestReturn('non-existent-id');

      const res = await request(app)
        .post('/api/returns')
        .send(returnData)
        .expect(404);

      expect(res.body.message).toContain('Transaction not found');
    });

    it('should fail when return amount exceeds refundable amount', async () => {
      const returnData = createTestReturn(testTransactionId, { returnAmount: 150 });

      const res = await request(app)
        .post('/api/returns')
        .send(returnData)
        .expect(400);

      expect(res.body.message).toContain('exceeds remaining refundable amount');
      expect(res.body.details).toBeDefined();
    });

    it('should fail when transaction is already fully refunded', async () => {
      // First return - full amount
      await request(app)
        .post('/api/returns')
        .send(createTestReturn(testTransactionId, { returnAmount: 100 }))
        .expect(201);

      // Try to create another return
      const res = await request(app)
        .post('/api/returns')
        .send(createTestReturn(testTransactionId, { returnAmount: 10 }))
        .expect(400);

      expect(res.body.message).toContain('already been fully refunded');
    });

    it('should handle multiple partial returns correctly', async () => {
      // First partial return
      await request(app)
        .post('/api/returns')
        .send(createTestReturn(testTransactionId, { returnAmount: 30 }))
        .expect(201);

      // Second partial return
      await request(app)
        .post('/api/returns')
        .send(createTestReturn(testTransactionId, { returnAmount: 40 }))
        .expect(201);

      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });

      expect(transaction.status).toBe('PARTIALLY_REFUNDED');
      expect(parseFloat(transaction.refundedAmount)).toBe(70);
    });

    it('should create return without optional fields', async () => {
      const res = await request(app)
        .post('/api/returns')
        .send({
          originalTransactionId: testTransactionId,
          returnAmount: 25
        })
        .expect(201);

      expect(res.body.reason).toBeNull();
      expect(res.body.processedBy).toBeNull();
    });
  });

  // ========================================
  // GET /api/returns - Get All Returns
  // ========================================
  describe('GET /api/returns', () => {
    beforeEach(async () => {
      // Create multiple returns
      await prisma.return.createMany({
        data: [
          { originalTransactionId: testTransactionId, returnAmount: 25, reason: 'defective' },
          { originalTransactionId: testTransactionId, returnAmount: 15, reason: 'damaged' },
          { originalTransactionId: testTransactionId, returnAmount: 10, reason: 'wrong_item' }
        ]
      });
    });

    it('should get all returns with pagination', async () => {
      const res = await request(app)
        .get('/api/returns')
        .expect(200);

      expect(res.body).toHaveProperty('returns');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.returns.length).toBe(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should filter returns by transaction ID', async () => {
      const res = await request(app)
        .get(`/api/returns?transactionId=${testTransactionId}`)
        .expect(200);

      expect(res.body.returns.length).toBe(3);
      res.body.returns.forEach(ret => {
        expect(ret.originalTransactionId).toBe(testTransactionId);
      });
    });

    it('should filter returns by reason', async () => {
      const res = await request(app)
        .get('/api/returns?reason=defective')
        .expect(200);

      expect(res.body.returns.length).toBe(1);
      expect(res.body.returns[0].reason).toBe('defective');
    });

    it('should filter returns by amount range', async () => {
      const res = await request(app)
        .get('/api/returns?minAmount=15&maxAmount=25')
        .expect(200);

      expect(res.body.returns.length).toBe(2);
      res.body.returns.forEach(ret => {
        expect(parseFloat(ret.returnAmount)).toBeGreaterThanOrEqual(15);
        expect(parseFloat(ret.returnAmount)).toBeLessThanOrEqual(25);
      });
    });

    it('should paginate results correctly', async () => {
      const res = await request(app)
        .get('/api/returns?page=1&limit=2')
        .expect(200);

      expect(res.body.returns.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.pages).toBe(2);
    });

    it('should include transaction details', async () => {
      const res = await request(app)
        .get('/api/returns')
        .expect(200);

      expect(res.body.returns[0]).toHaveProperty('originalTransaction');
      expect(res.body.returns[0].originalTransaction).toHaveProperty('receiptNumber');
    });
  });

  // ========================================
  // GET /api/returns/:id - Get Return by ID
  // ========================================
  describe('GET /api/returns/:id', () => {
    let returnId;

    beforeEach(async () => {
      const returnRecord = await prisma.return.create({
        data: createTestReturn(testTransactionId)
      });
      returnId = returnRecord.id;
    });

    it('should get return by ID with full details', async () => {
      const res = await request(app)
        .get(`/api/returns/${returnId}`)
        .expect(200);

      expect(res.body.id).toBe(returnId);
      expect(res.body).toHaveProperty('originalTransaction');
      expect(res.body.originalTransaction).toHaveProperty('branch');
    });

    it('should return 404 for non-existent return', async () => {
      const res = await request(app)
        .get('/api/returns/non-existent-id')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // PUT /api/returns/:id - Update Return
  // ========================================
  describe('PUT /api/returns/:id', () => {
    let returnId;

    beforeEach(async () => {
      const returnRecord = await prisma.return.create({
        data: createTestReturn(testTransactionId, { returnAmount: 25 })
      });
      returnId = returnRecord.id;
    });

    it('should update return amount', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnId}`)
        .send({ returnAmount: 30 })
        .expect(200);

      expect(parseFloat(res.body.returnAmount)).toBe(30);
    });

    it('should update return reason', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnId}`)
        .send({ reason: 'damaged' })
        .expect(200);

      expect(res.body.reason).toBe('damaged');
    });

    it('should update processedBy', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnId}`)
        .send({ processedBy: 'new-user' })
        .expect(200);

      expect(res.body.processedBy).toBe('new-user');
    });

    it('should update transaction status when amount changes', async () => {
      await request(app)
        .put(`/api/returns/${returnId}`)
        .send({ returnAmount: 100 })
        .expect(200);

      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });

      expect(transaction.status).toBe('REFUNDED');
    });

    it('should fail with invalid reason', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnId}`)
        .send({ reason: 'invalid_reason' })
        .expect(400);

      expect(res.body.message).toContain('Invalid reason');
    });

    it('should fail when updated amount exceeds transaction total', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnId}`)
        .send({ returnAmount: 150 })
        .expect(400);

      expect(res.body.message).toContain('exceed transaction total');
    });

    it('should return 404 for non-existent return', async () => {
      const res = await request(app)
        .put('/api/returns/non-existent-id')
        .send({ returnAmount: 30 })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // DELETE /api/returns/:id - Delete Return
  // ========================================
  describe('DELETE /api/returns/:id', () => {
    let returnId;

    beforeEach(async () => {
      const returnRecord = await prisma.return.create({
        data: createTestReturn(testTransactionId, { returnAmount: 50 })
      });
      returnId = returnRecord.id;
    });

    it('should delete return successfully', async () => {
      const res = await request(app)
        .delete(`/api/returns/${returnId}`)
        .expect(200);

      expect(res.body.message).toContain('deleted successfully');

      const deleted = await prisma.return.findUnique({
        where: { id: returnId }
      });
      expect(deleted).toBeNull();
    });

    it('should update transaction status after deletion', async () => {
      await request(app)
        .delete(`/api/returns/${returnId}`)
        .expect(200);

      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });

      expect(transaction.status).toBe('COMPLETED');
      expect(parseFloat(transaction.refundedAmount)).toBe(0);
    });

    it('should recalculate status with remaining returns', async () => {
      // Create second return
      await prisma.return.create({
        data: createTestReturn(testTransactionId, { returnAmount: 30 })
      });

      // Delete first return
      await request(app)
        .delete(`/api/returns/${returnId}`)
        .expect(200);

      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });

      expect(transaction.status).toBe('PARTIALLY_REFUNDED');
      expect(parseFloat(transaction.refundedAmount)).toBe(30);
    });

    it('should return 404 for non-existent return', async () => {
      const res = await request(app)
        .delete('/api/returns/non-existent-id')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // GET /api/returns/transaction/:transactionId
  // ========================================
  describe('GET /api/returns/transaction/:transactionId', () => {
    beforeEach(async () => {
      await prisma.return.createMany({
        data: [
          { originalTransactionId: testTransactionId, returnAmount: 25 },
          { originalTransactionId: testTransactionId, returnAmount: 15 }
        ]
      });
    });

    it('should get all returns for a transaction', async () => {
      const res = await request(app)
        .get(`/api/returns/transaction/${testTransactionId}`)
        .expect(200);

      expect(res.body).toHaveProperty('transaction');
      expect(res.body).toHaveProperty('returns');
      expect(res.body).toHaveProperty('summary');
      expect(res.body.returns.length).toBe(2);
    });

    it('should calculate correct summary', async () => {
      const res = await request(app)
        .get(`/api/returns/transaction/${testTransactionId}`)
        .expect(200);

      expect(res.body.summary.totalReturns).toBe(2);
      expect(res.body.summary.totalReturnedAmount).toBe(40);
      expect(res.body.summary.remainingRefundable).toBe(60);
      expect(res.body.summary.canReturn).toBe(true);
    });

    it('should return 404 for non-existent transaction', async () => {
      const res = await request(app)
        .get('/api/returns/transaction/non-existent-id')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // POST /api/returns/transaction/:transactionId/process
  // ========================================
  describe('POST /api/returns/transaction/:transactionId/process', () => {
    it('should process return successfully', async () => {
      const res = await request(app)
        .post(`/api/returns/transaction/${testTransactionId}/process`)
        .send({
          returnAmount: 35,
          reason: 'defective',
          processedBy: 'cashier-1'
        })
        .expect(201);

      expect(res.body.message).toContain('processed successfully');
      expect(res.body).toHaveProperty('return');
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post(`/api/returns/transaction/${testTransactionId}/process`)
        .send({ returnAmount: 25 })
        .expect(400);

      expect(res.body.message).toContain('required');
    });

    it('should fail when amount exceeds refundable', async () => {
      const res = await request(app)
        .post(`/api/returns/transaction/${testTransactionId}/process`)
        .send({
          returnAmount: 150,
          processedBy: 'cashier-1'
        })
        .expect(400);

      expect(res.body.message).toContain('exceeds remaining refundable');
    });
  });

  // ========================================
  // GET /api/returns/analytics/summary
  // ========================================
  describe('GET /api/returns/analytics/summary', () => {
    beforeEach(async () => {
      await prisma.return.createMany({
        data: [
          { originalTransactionId: testTransactionId, returnAmount: 25, reason: 'defective' },
          { originalTransactionId: testTransactionId, returnAmount: 50, reason: 'damaged' },
          { originalTransactionId: testTransactionId, returnAmount: 15, reason: 'defective' }
        ]
      });
    });

    it('should return summary statistics', async () => {
      const res = await request(app)
        .get('/api/returns/analytics/summary')
        .expect(200);

      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary.totalReturns).toBe(3);
      expect(parseFloat(res.body.summary.totalReturnAmount)).toBe(90);
      expect(res.body.summary.averageReturnAmount).toBeGreaterThan(0);
    });

    it('should return breakdown by reason', async () => {
      const res = await request(app)
        .get('/api/returns/analytics/summary')
        .expect(200);

      expect(res.body).toHaveProperty('byReason');
      expect(res.body.byReason.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // GET /api/returns/analytics/by-reason
  // ========================================
  describe('GET /api/returns/analytics/by-reason', () => {
    beforeEach(async () => {
      await prisma.return.createMany({
        data: [
          { originalTransactionId: testTransactionId, returnAmount: 25, reason: 'defective' },
          { originalTransactionId: testTransactionId, returnAmount: 50, reason: 'defective' },
          { originalTransactionId: testTransactionId, returnAmount: 15, reason: 'damaged' }
        ]
      });
    });

    it('should group returns by reason', async () => {
      const res = await request(app)
        .get('/api/returns/analytics/by-reason')
        .expect(200);

      expect(res.body).toHaveProperty('byReason');
      expect(res.body).toHaveProperty('validReasons');
      expect(res.body.byReason.length).toBeGreaterThan(0);
    });

    it('should calculate percentages correctly', async () => {
      const res = await request(app)
        .get('/api/returns/analytics/by-reason')
        .expect(200);

      const totalPercentage = res.body.byReason.reduce(
        (sum, r) => sum + r.percentage, 0
      );
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  // ========================================
  // GET /api/returns/analytics/trends
  // ========================================
  describe('GET /api/returns/analytics/trends', () => {
    beforeEach(async () => {
      await prisma.return.create({
        data: createTestReturn(testTransactionId, { returnAmount: 30 })
      });
    });

    it('should return trend data', async () => {
      const res = await request(app)
        .get('/api/returns/analytics/trends')
        .expect(200);

      expect(res.body).toHaveProperty('period');
      expect(res.body).toHaveProperty('trends');
      expect(res.body.trends).toHaveProperty('returnRate');
      expect(res.body.trends).toHaveProperty('returnAmountRate');
    });

    it('should accept custom period', async () => {
      const res = await request(app)
        .get('/api/returns/analytics/trends?days=7')
        .expect(200);

      expect(res.body.period).toBe('7 days');
    });
  });

  // ========================================
  // POST /api/returns/validate
  // ========================================
  describe('POST /api/returns/validate', () => {
    it('should validate a valid return', async () => {
      const res = await request(app)
        .post('/api/returns/validate')
        .send({
          originalTransactionId: testTransactionId,
          returnAmount: 50,
          reason: 'defective'
        })
        .expect(200);

      expect(res.body.valid).toBe(true);
      expect(res.body.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      const res = await request(app)
        .post('/api/returns/validate')
        .send({ reason: 'defective' })
        .expect(200);

      expect(res.body.valid).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid return amount', async () => {
      const res = await request(app)
        .post('/api/returns/validate')
        .send({
          originalTransactionId: testTransactionId,
          returnAmount: 150
        })
        .expect(200);

      expect(res.body.valid).toBe(false);
      expect(res.body.errors.some(e => e.includes('exceeds'))).toBe(true);
    });

    it('should provide warnings for edge cases', async () => {
      const res = await request(app)
        .post('/api/returns/validate')
        .send({
          originalTransactionId: testTransactionId,
          returnAmount: 100
        })
        .expect(200);

      expect(res.body.warnings.length).toBeGreaterThan(0);
    });

    it('should detect invalid reason', async () => {
      const res = await request(app)
        .post('/api/returns/validate')
        .send({
          originalTransactionId: testTransactionId,
          returnAmount: 50,
          reason: 'invalid_reason'
        })
        .expect(200);

      expect(res.body.valid).toBe(false);
      expect(res.body.errors.some(e => e.includes('Invalid reason'))).toBe(true);
    });
  });
});