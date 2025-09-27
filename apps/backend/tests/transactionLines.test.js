// tests/transactionLines.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';

const prisma = new PrismaClient();

// Helper function to calculate line total
const calculateTotal = (unitPrice, qty, discount = 0, taxAmount = 0) => {
const subtotal = unitPrice * qty;
const afterDiscount = subtotal - discount;
return afterDiscount + taxAmount;
};

// Helper functions with unique data
const createUniqueTransactionLine = (transactionId, productId, overrides = {}) => {
  const base = {
    unitPrice: 10.99,
    qty: 2,
    discount: 0,
    taxAmount: 1.65,
    ...overrides
  };

  return {
    transactionId,
    productId,
    ...base,
    lineTotal: (base.unitPrice * base.qty) - base.discount + base.taxAmount
  };
};

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

const createTestTransaction = (branchId) => ({
  branchId,
  receiptNumber: `RCP-${Date.now()}`,
  totalGross: 0,
  totalTax: 0,
  totalNet: 0,
  status: 'PENDING'
});

describe('Transaction Lines API', () => {
  let testBranchId, testProductId, testTransactionId;

  // Clean database and create test data before each test
  beforeEach(async () => {
    // Clean database
    await prisma.transactionLine.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.taxRate.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.branch.deleteMany();

    // Create test data
    const branch = await prisma.branch.create({ data: createTestBranch() });
    testBranchId = branch.id;

    const product = await prisma.product.create({ data: createTestProduct(testBranchId) });
    testProductId = product.id;

    const transaction = await prisma.transaction.create({ data: createTestTransaction(testBranchId) });
    testTransactionId = transaction.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /transaction-lines', () => {
    it('should create a new transaction line with valid data', async () => {
      const lineData = createUniqueTransactionLine(testTransactionId, testProductId);
      
      const response = await request(app)
        .post('/api/transaction-lines')
        .send(lineData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.transactionId).toBe(testTransactionId);
      expect(response.body.productId).toBe(testProductId);
      expect(parseFloat(response.body.lineTotal)).toBe(23.63); // (10.99 * 2) + 1.65 = 23.63
      expect(response.body).toHaveProperty('transaction');
      expect(response.body).toHaveProperty('product');
    });

    it('should calculate line total correctly', async () => {
      const lineData = {
        transactionId: testTransactionId,
        productId: testProductId,
        unitPrice: 15.00,
        qty: 3,
        discount: 5.00,
        taxAmount: 2.50
      };
      
      const response = await request(app)
        .post('/api/transaction-lines')
        .send(lineData);

      expect(response.status).toBe(201);
      // Expected: (15.00 * 3) - 5.00 + 2.50 = 42.50
      expect(parseFloat(response.body.lineTotal)).toBe(42.50);
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/transaction-lines')
        .send({ unitPrice: 10.99, qty: 2 }); // missing transactionId and productId

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should fail when transaction does not exist', async () => {
      const fakeTransactionId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post('/api/transaction-lines')
        .send(createUniqueTransactionLine(fakeTransactionId, testProductId));

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Transaction not found');
    });

    it('should fail when product does not exist', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post('/api/transaction-lines')
        .send(createUniqueTransactionLine(testTransactionId, fakeProductId));

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Product not found');
    });

    it('should handle default values for optional fields', async () => {
      const lineData = {
        transactionId: testTransactionId,
        productId: testProductId,
        unitPrice: 10.00,
        qty: 1
        // discount and taxAmount should default to 0
      };
      
      const response = await request(app)
        .post('/api/transaction-lines')
        .send(lineData);

      expect(response.status).toBe(201);
      expect(parseFloat(response.body.discount)).toBe(0);
      expect(parseFloat(response.body.taxAmount)).toBe(0);
      expect(parseFloat(response.body.lineTotal)).toBe(10.00);
    });
  });

  describe('GET /transaction-lines', () => {
    beforeEach(async () => {
      // Create multiple test lines
      await prisma.transactionLine.createMany({
        data: [
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 10, qty: 1 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 20, qty: 2 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 30, qty: 1 })
        ]
      });
    });

    it('should get all transaction lines with pagination', async () => {
      const response = await request(app)
        .get('/api/transaction-lines');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lines');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.lines).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter by transactionId', async () => {
      const response = await request(app)
        .get(`/api/transaction-lines?transactionId=${testTransactionId}`);

      expect(response.status).toBe(200);
      expect(response.body.lines).toHaveLength(3);
      expect(response.body.lines.every(line => line.transactionId === testTransactionId)).toBe(true);
    });

    it('should filter by productId', async () => {
      const response = await request(app)
        .get(`/api/transaction-lines?productId=${testProductId}`);

      expect(response.status).toBe(200);
      expect(response.body.lines).toHaveLength(3);
      expect(response.body.lines.every(line => line.productId === testProductId)).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/transaction-lines?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.lines).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });
  });


  describe('GET /transaction-lines/:id', () => {
    let testLineId;

    beforeEach(async () => {
      const line = await prisma.transactionLine.create({
        data: createUniqueTransactionLine(testTransactionId, testProductId)
      });
      testLineId = line.id;
    });

    it('should get transaction line by ID with relations', async () => {
      const response = await request(app)
        .get(`/api/transaction-lines/${testLineId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testLineId);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body).toHaveProperty('product');
      expect(response.body.transaction).toHaveProperty('receiptNumber');
      expect(response.body.product).toHaveProperty('name');
    });

    it('should return 404 for non-existent line', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/transaction-lines/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /transaction-lines/:id', () => {
    let testLineId;

    beforeEach(async () => {
      const line = await prisma.transactionLine.create({
        data: createUniqueTransactionLine(testTransactionId, testProductId, {
          unitPrice: 10, qty: 2, discount: 0, taxAmount: 0
        })
      });
      testLineId = line.id;
    });

    it('should update transaction line and recalculate total', async () => {
      const updateData = {
        unitPrice: 15.00,
        qty: 3,
        discount: 2.00,
        taxAmount: 1.50
      };
      
      const response = await request(app)
        .put(`/api/transaction-lines/${testLineId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(parseFloat(response.body.unitPrice)).toBe(15.00);
      expect(parseFloat(response.body.qty)).toBe(3);
      expect(parseFloat(response.body.discount)).toBe(2.00);
      expect(parseFloat(response.body.taxAmount)).toBe(1.50);
      // Expected: (15 * 3) - 2 + 1.5 = 44.5
      expect(parseFloat(response.body.lineTotal)).toBe(44.5);
    });

    it('should update only provided fields', async () => {
      const response = await request(app)
        .put(`/api/transaction-lines/${testLineId}`)
        .send({ qty: 5 });

      expect(response.status).toBe(200);
      expect(parseFloat(response.body.qty)).toBe(5);
      expect(parseFloat(response.body.unitPrice)).toBe(10); // unchanged
      // Expected: 10 * 5 = 50
      console.log("Updated lineTotal:", response.body);
      expect(parseFloat(response.body.lineTotal)).toBe(50);
      // The problem is with string to number conversion in qty field
    });

    it('should return 404 for non-existent line', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/api/transaction-lines/${fakeId}`)
        .send({ qty: 3 });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /transaction-lines/:id', () => {
    let testLineId;

    beforeEach(async () => {
      const line = await prisma.transactionLine.create({
        data: createUniqueTransactionLine(testTransactionId, testProductId)
      });
      testLineId = line.id;
    });

    it('should delete transaction line successfully', async () => {
      const response = await request(app)
        .delete(`/api/transaction-lines/${testLineId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Transaction line deleted successfully');

      // Verify deletion
      const deletedLine = await prisma.transactionLine.findUnique({
        where: { id: testLineId }
      });
      expect(deletedLine).toBeNull();
    });

    it('should return 404 for non-existent line', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/transaction-lines/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /transaction-lines/transaction/:transactionId', () => {
    beforeEach(async () => {
      // Create multiple lines for the transaction
      await prisma.transactionLine.createMany({
        data: [
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 10, qty: 2, taxAmount: 1 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 15, qty: 1, discount: 2 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 20, qty: 3, taxAmount: 3 })
        ]
      });
    });

    it('should get all lines for a transaction with summary', async () => {
      const response = await request(app)
        .get(`/api/transaction-lines/transaction/${testTransactionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lines');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.lines).toHaveLength(3);
      
      // Verify summary calculations
      expect(parseFloat(response.body.summary.totalLines)).toBe(3);
      expect(parseFloat(response.body.summary.totalQuantity)).toBe(6); // 2 + 1 + 3
      expect(parseFloat(response.body.summary.subtotal)).toBe(93); // (10*2) + (15*1) + (20*3)
      expect(parseFloat(response.body.summary.totalDiscount)).toBe(2);
      expect(parseFloat(response.body.summary.totalTax)).toBe(4); // 1 + 3
    });
  });

  describe('POST /transaction-lines/transaction/:transactionId/lines', () => {
    it('should add new line to transaction', async () => {
      const lineData = {
        productId: testProductId,
        unitPrice: 25.00,
        qty: 2,
        discount: 5.00,
        taxAmount: 2.00
      };
      
      const response = await request(app)
        .post(`/api/transaction-lines/transaction/${testTransactionId}/lines`)
        .send(lineData);

      expect(response.status).toBe(201);
      expect(response.body.action).toBe('created');
      expect(response.body.line.transactionId).toBe(testTransactionId);
      expect(response.body.line.productId).toBe(testProductId);
      // Expected: (25 * 2) - 5 + 2 = 47
      expect(parseFloat(response.body.line.lineTotal)).toBe(47);
    });

    it('should update existing line quantity when same product added', async () => {
      // Create initial line
      await prisma.transactionLine.create({
        data: createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 10, qty: 2 })
      });

      const lineData = {
        productId: testProductId,
        unitPrice: 10.00,
        qty: 3 // This should be added to existing qty
      };
      
      const response = await request(app)
        .post(`/api/transaction-lines/transaction/${testTransactionId}/lines`)
        .send(lineData);

      expect(response.status).toBe(200);
      expect(response.body.action).toBe('updated');
      expect(response.body.line.qty).toBe(5); // 2 + 3
    });

    it('should fail for completed transaction', async () => {
      // Update transaction to completed
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'COMPLETED' }
      });

      const lineData = {
        productId: testProductId,
        unitPrice: 10.00,
        qty: 1
      };
      
      const response = await request(app)
        .post(`/api/transaction-lines/transaction/${testTransactionId}/lines`)
        .send(lineData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('completed transaction');
    });
  });

  describe('POST /transaction-lines/bulk', () => {
    it('should create multiple lines successfully', async () => {
      const linesData = {
        lines: [
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 10, qty: 1 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 20, qty: 2 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 30, qty: 1 })
        ]
      };
      
      const response = await request(app)
        .post('/api/transaction-lines/bulk')
        .send(linesData);

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(3);
      expect(response.body.message).toContain('3 transaction lines created');
    });

    it('should fail with empty lines array', async () => {
      const response = await request(app)
        .post('/api/transaction-lines/bulk')
        .send({ lines: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot be empty');
    });

    it('should fail with invalid line data', async () => {
      const linesData = {
        lines: [
          { transactionId: testTransactionId } // missing required fields
        ]
      };
      
      const response = await request(app)
        .post('/api/transaction-lines/bulk')
        .send(linesData);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('must have');
    });
  });

  describe('GET /transaction-lines/product/:productId/sales-stats', () => {
    beforeEach(async () => {
      // Create completed transaction for stats
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'COMPLETED' }
      });

      // Create transaction lines
      await prisma.transactionLine.createMany({
        data: [
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 10, qty: 5, taxAmount: 2 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 12, qty: 3, discount: 1 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { unitPrice: 15, qty: 2, taxAmount: 1 })
        ]
      });
    });

    it('should return product sales statistics', async () => {
      const response = await request(app)
        .get(`/api/transaction-lines/product/${testProductId}/sales-stats`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('stats');
      
      const stats = response.body.stats;
      expect(stats.totalSales).toBe(3);
      expect(stats.totalQuantitySold).toBe(10); // 5 + 3 + 2
      expect(stats.averageQuantityPerSale).toBeCloseTo(3.33, 2);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/transaction-lines/product/${fakeId}/sales-stats`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('POST /transaction-lines/validate-line', () => {
    it('should validate correct line data', async () => {
      const lineData = {
        transactionId: testTransactionId,
        productId: testProductId,
        unitPrice: 10.00,
        qty: 2,
        discount: 1.00,
        taxAmount: 1.50
      };
      
      const response = await request(app)
        .post('/api/transaction-lines/validate-line')
        .send(lineData);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.errors).toHaveLength(0);
      expect(response.body.calculatedTotal).toBe(20.5); // (10*2) - 1 + 1.5
    });

    it('should return validation errors for invalid data', async () => {
      const lineData = {
        transactionId: testTransactionId,
        // missing productId
        unitPrice: -5, // negative price
        qty: 0, // zero quantity
        discount: 'invalid', // invalid number
        taxAmount: -2 // negative tax
      };
      
      const response = await request(app)
        .post('/api/transaction-lines/validate-line')
        .send(lineData);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.warnings.length).toBeGreaterThan(0);
    });

    it('should validate transaction and product existence', async () => {
      const lineData = {
        transactionId: '550e8400-e29b-41d4-a716-446655440000', // non-existent
        productId: '550e8400-e29b-41d4-a716-446655440001', // non-existent
        unitPrice: 10.00,
        qty: 1
      };
      
      const response = await request(app)
        .post('/api/transaction-lines/validate-line')
        .send(lineData);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toContain('Transaction not found');
      expect(response.body.errors).toContain('Product not found');
    });
  });

  describe('GET /transaction-lines/analytics/top-products', () => {
    beforeEach(async () => {
      // Create second product
      const product2 = await prisma.product.create({
        data: createTestProduct(testBranchId)
      });

      // Mark transaction as completed
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'COMPLETED' }
      });

      // Create sales data
      await prisma.transactionLine.createMany({
        data: [
          createUniqueTransactionLine(testTransactionId, testProductId, { qty: 10 }),
          createUniqueTransactionLine(testTransactionId, testProductId, { qty: 5 }),
          createUniqueTransactionLine(testTransactionId, product2.id, { qty: 3 })
        ]
      });
    });

    it('should return top selling products', async () => {
      const response = await request(app)
        .get('/api/transaction-lines/analytics/top-products');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('product');
      expect(response.body[0]).toHaveProperty('totalQuantitySold');
      expect(response.body[0]).toHaveProperty('totalRevenue');
      expect(response.body[0]).toHaveProperty('totalTransactions');
      
      // First product should have highest quantity (10 + 5 = 15)
      expect(response.body[0].totalQuantitySold).toBe(15);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/transaction-lines/analytics/top-products?limit=1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    }); 
    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const response = await request(app)
          .get(`/api/transaction-lines/analytics/top-products?startDate=${startDate}&endDate=${endDate}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
  });
});