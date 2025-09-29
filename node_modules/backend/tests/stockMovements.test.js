// tests/stockMovements.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';

const prisma = new PrismaClient();

// Helper functions with unique data
const createTestBranch = () => ({
  name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  address: '123 Test Street'
});

const createTestProduct = (branchId, overrides = {}) => ({
  branchId,
  sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  name: `Test Product ${Date.now()}`,
  priceGross: 10.99,
  cost: 5.50,
  unit: 'pcs',
  stock: 100,
  active: true,
  ...overrides
});

const createTestStockMovement = (productId, branchId, overrides = {}) => ({
  productId,
  branchId,
  change: 10,
  reason: 'purchase',
  ...overrides
});

describe('Stock Movements API', () => {
  let testBranchId, testProductId;

  // Clean database and create test data before each test
  beforeEach(async () => {
    // Clean database
    await prisma.stockMovement.deleteMany();
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

    const product = await prisma.product.create({ 
      data: createTestProduct(testBranchId, { stock: 50 }) 
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /stock-movements', () => {
    it('should create a new stock movement and update product stock', async () => {
      const movementData = createTestStockMovement(testProductId, testBranchId, {
        change: 25,
        reason: 'purchase'
      });
      
      const response = await request(app)
        .post('/api/stock-movements')
        .send(movementData);

      expect(response.body.change).toBe(-10);
      expect(response.body.reason).toBe('sale');

      // Verify product stock was decreased
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      expect(updatedProduct.stock).toBe(40); // 50 - 10
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/stock-movements')
        .send({ change: 10, reason: 'purchase' }); // missing productId and branchId

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should fail with invalid reason', async () => {
      const movementData = createTestStockMovement(testProductId, testBranchId, {
        reason: 'invalid_reason'
      });
      
      const response = await request(app)
        .post('/api/stock-movements')
        .send(movementData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid reason');
    });

    it('should fail when trying to reduce stock below zero', async () => {
      const movementData = createTestStockMovement(testProductId, testBranchId, {
        change: -60, // Product has 50 stock
        reason: 'sale'
      });
      
      const response = await request(app)
        .post('/api/stock-movements')
        .send(movementData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should fail when product does not exist', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post('/api/stock-movements')
        .send(createTestStockMovement(fakeProductId, testBranchId));

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail when branch does not exist', async () => {
      const fakeBranchId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post('/api/stock-movements')
        .send(createTestStockMovement(testProductId, fakeBranchId));

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Branch not found');
    });
  });

  describe('GET /stock-movements', () => {
    beforeEach(async () => {
      // Create multiple test movements
      await prisma.stockMovement.createMany({
        data: [
          createTestStockMovement(testProductId, testBranchId, { change: 10, reason: 'purchase' }),
          createTestStockMovement(testProductId, testBranchId, { change: -5, reason: 'sale' }),
          createTestStockMovement(testProductId, testBranchId, { change: -2, reason: 'spoilage' })
        ]
      });
    });

    it('should get all stock movements with pagination', async () => {
      const response = await request(app)
        .get('/api/stock-movements');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movements');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.movements).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter by productId', async () => {
      const response = await request(app)
        .get(`/api/stock-movements?productId=${testProductId}`);

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(3);
      expect(response.body.movements.every(m => m.productId === testProductId)).toBe(true);
    });

    it('should filter by branchId', async () => {
      const response = await request(app)
        .get(`/api/stock-movements?branchId=${testBranchId}`);

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(3);
      expect(response.body.movements.every(m => m.branchId === testBranchId)).toBe(true);
    });

    it('should filter by reason', async () => {
      const response = await request(app)
        .get('/api/stock-movements?reason=sale');

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(1);
      expect(response.body.movements[0].reason).toBe('sale');
    });

    it('should filter by change type (positive)', async () => {
      const response = await request(app)
        .get('/api/stock-movements?changeType=positive');

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(1);
      expect(response.body.movements[0].change).toBeGreaterThan(0);
    });

    it('should filter by change type (negative)', async () => {
      const response = await request(app)
        .get('/api/stock-movements?changeType=negative');

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(2);
      expect(response.body.movements.every(m => m.change < 0)).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/stock-movements?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /stock-movements/:id', () => {
    let testMovementId;

    beforeEach(async () => {
      const movement = await prisma.stockMovement.create({
        data: createTestStockMovement(testProductId, testBranchId)
      });
      testMovementId = movement.id;
    });

    it('should get stock movement by ID with relations', async () => {
      const response = await request(app)
        .get(`/api/stock-movements/${testMovementId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testMovementId);
      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('branch');
      expect(response.body.product).toHaveProperty('name');
      expect(response.body.branch).toHaveProperty('name');
    });

    it('should return 404 for non-existent movement', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/stock-movements/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /stock-movements/:id', () => {
    let testMovementId;

    beforeEach(async () => {
      const movement = await prisma.stockMovement.create({
        data: createTestStockMovement(testProductId, testBranchId, { change: 10 })
      });
      testMovementId = movement.id;
    });

    it('should update stock movement and adjust product stock', async () => {
      const updateData = { change: 20, reason: 'adjustment' };
      
      const response = await request(app)
        .put(`/api/stock-movements/${testMovementId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.change).toBe(20);
      expect(response.body.reason).toBe('adjustment');

      // Verify product stock was adjusted (original +10, now +20, so +10 more)
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      expect(updatedProduct.stock).toBe(70); // 50 + 10 (original) + 10 (adjustment)
    });

    it('should update only provided fields', async () => {
      const response = await request(app)
        .put(`/api/stock-movements/${testMovementId}`)
        .send({ reason: 'adjustment' });

      expect(response.status).toBe(200);
      expect(response.body.reason).toBe('adjustment');
      expect(response.body.change).toBe(10); // unchanged
    });

    it('should fail with invalid reason', async () => {
      const response = await request(app)
        .put(`/api/stock-movements/${testMovementId}`)
        .send({ reason: 'invalid_reason' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid reason');
    });

    it('should return 404 for non-existent movement', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/api/stock-movements/${fakeId}`)
        .send({ change: 15 });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /stock-movements/:id', () => {
    let testMovementId;

    beforeEach(async () => {
      const movement = await prisma.stockMovement.create({
        data: createTestStockMovement(testProductId, testBranchId, { change: 10 })
      });
      testMovementId = movement.id;

      // Update product stock manually to simulate the creation
      await prisma.product.update({
        where: { id: testProductId },
        data: { stock: { increment: 10 } }
      });
    });

    it('should delete movement and reverse stock change', async () => {
      const response = await request(app)
        .delete(`/api/stock-movements/${testMovementId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Stock movement deleted successfully');

      // Verify movement was deleted
      const deletedMovement = await prisma.stockMovement.findUnique({
        where: { id: testMovementId }
      });
      expect(deletedMovement).toBeNull();

      // Verify stock was reversed
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      expect(updatedProduct.stock).toBe(50); // Back to original
    });

    it('should return 404 for non-existent movement', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/stock-movements/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /stock-movements/product/:productId', () => {
    beforeEach(async () => {
      // Create movements for the product
      await prisma.stockMovement.createMany({
        data: [
          createTestStockMovement(testProductId, testBranchId, { change: 20, reason: 'purchase' }),
          createTestStockMovement(testProductId, testBranchId, { change: -5, reason: 'sale' }),
          createTestStockMovement(testProductId, testBranchId, { change: -3, reason: 'spoilage' })
        ]
      });
    });

    it('should get all movements for a product', async () => {
      const response = await request(app)
        .get(`/api/stock-movements/product/${testProductId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movements');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.movements).toHaveLength(3);
      expect(response.body.movements.every(m => m.productId === testProductId)).toBe(true);
    });

    it('should filter by reason', async () => {
      const response = await request(app)
        .get(`/api/stock-movements/product/${testProductId}?reason=sale`);

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(1);
      expect(response.body.movements[0].reason).toBe('sale');
    });
  });

  describe('GET /stock-movements/product/:productId/history', () => {
    beforeEach(async () => {
      // Create chronological movements
      const movements = [
        { change: 50, reason: 'purchase' },
        { change: -10, reason: 'sale' },
        { change: -5, reason: 'spoilage' },
        { change: 20, reason: 'purchase' }
      ];

      // Create movements with slight time differences
      for (let i = 0; i < movements.length; i++) {
        await prisma.stockMovement.create({
          data: {
            ...createTestStockMovement(testProductId, testBranchId, movements[i]),
            createdAt: new Date(Date.now() + i * 1000) // 1 second apart
          }
        });
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }
    });

    it('should return product stock history with running balance', async () => {
      const response = await request(app)
        .get(`/api/stock-movements/product/${testProductId}/history`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('history');
      expect(response.body.history).toHaveLength(4);
      
      // Check running balance calculations
      const history = response.body.history;
      expect(history[0]).toHaveProperty('balanceBefore');
      expect(history[0]).toHaveProperty('balanceAfter');
    });
  });

  describe('GET /stock-movements/product/:productId/current-stock', () => {
    beforeEach(async () => {
      await prisma.stockMovement.createMany({
        data: [
          createTestStockMovement(testProductId, testBranchId, { change: 30, reason: 'purchase' }),
          createTestStockMovement(testProductId, testBranchId, { change: -10, reason: 'sale' }),
          createTestStockMovement(testProductId, testBranchId, { change: -5, reason: 'spoilage' })
        ]
      });
    });

    it('should return current stock status and movement summary', async () => {
      const response = await request(app)
        .get(`/api/stock-movements/product/${testProductId}/current-stock`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('stockStatus');
      expect(response.body).toHaveProperty('movementSummary');
      
      expect(response.body.stockStatus.current).toBe(50); // Initial stock
      expect(response.body.movementSummary).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/stock-movements/product/${fakeId}/current-stock`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Product not found');
    });
  });

  describe('POST /stock-movements/receive-stock', () => {
    it('should receive stock and create positive movement', async () => {
      const stockData = {
        productId: testProductId,
        branchId: testBranchId,
        quantity: 25,
        reason: 'purchase'
      };
      
      const response = await request(app)
        .post('/api/stock-movements/receive-stock')
        .send(stockData);

      expect(response.status).toBe(201);
      expect(response.body.change).toBe(25);
      expect(response.body.reason).toBe('purchase');

      // Verify product stock increased
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      expect(updatedProduct.stock).toBe(75); // 50 + 25
    });

    it('should fail with invalid quantity', async () => {
      const response = await request(app)
        .post('/api/stock-movements/receive-stock')
        .send({
          productId: testProductId,
          branchId: testBranchId,
          quantity: -5 // Negative quantity
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('positive quantity');
    });
  });

  describe('POST /stock-movements/adjust-stock', () => {
    it('should adjust stock with positive adjustment', async () => {
      const adjustmentData = {
        productId: testProductId,
        branchId: testBranchId,
        adjustment: 15
      };
      
      const response = await request(app)
        .post('/api/stock-movements/adjust-stock')
        .send(adjustmentData);

      expect(response.status).toBe(200);
      expect(response.body.movement.change).toBe(15);
      expect(response.body.newStock).toBe(65); // 50 + 15
    });

    it('should adjust stock with negative adjustment', async () => {
      const adjustmentData = {
        productId: testProductId,
        branchId: testBranchId,
        adjustment: -10
      };
      
      const response = await request(app)
        .post('/api/stock-movements/adjust-stock')
        .send(adjustmentData);

      expect(response.status).toBe(200);
      expect(response.body.movement.change).toBe(-10);
      expect(response.body.newStock).toBe(40); // 50 - 10
    });

    it('should fail with zero adjustment', async () => {
      const response = await request(app)
        .post('/api/stock-movements/adjust-stock')
        .send({
          productId: testProductId,
          branchId: testBranchId,
          adjustment: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot be zero');
    });
  });

  describe('POST /stock-movements/record-sale', () => {
    it('should record sale and decrease stock', async () => {
      const saleData = {
        productId: testProductId,
        branchId: testBranchId,
        quantity: 15
      };
      
      const response = await request(app)
        .post('/api/stock-movements/record-sale')
        .send(saleData);

      expect(response.status).toBe(201);
      expect(response.body.change).toBe(-15);
      expect(response.body.reason).toBe('sale');

      // Verify product stock decreased
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      expect(updatedProduct.stock).toBe(35); // 50 - 15
    });

    it('should fail when insufficient stock', async () => {
      const response = await request(app)
        .post('/api/stock-movements/record-sale')
        .send({
          productId: testProductId,
          branchId: testBranchId,
          quantity: 60 // More than available (50)
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Insufficient stock');
    });
  });

  describe('POST /stock-movements/record-spoilage', () => {
    it('should record spoilage and decrease stock', async () => {
      const spoilageData = {
        productId: testProductId,
        branchId: testBranchId,
        quantity: 8,
        reason: 'spoilage'
      };
      
      const response = await request(app)
        .post('/api/stock-movements/record-spoilage')
        .send(spoilageData);

      expect(response.status).toBe(201);
      expect(response.body.change).toBe(-8);
      expect(response.body.reason).toBe('spoilage');

      // Verify product stock decreased
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      expect(updatedProduct.stock).toBe(42); // 50 - 8
    });

    it('should accept different waste reasons', async () => {
      const spoilageData = {
        productId: testProductId,
        branchId: testBranchId,
        quantity: 5,
        reason: 'damaged'
      };
      
      const response = await request(app)
        .post('/api/stock-movements/record-spoilage')
        .send(spoilageData);

      expect(response.status).toBe(201);
      expect(response.body.reason).toBe('damaged');
    });

    it('should fail with invalid waste reason', async () => {
      const response = await request(app)
        .post('/api/stock-movements/record-spoilage')
        .send({
          productId: testProductId,
          branchId: testBranchId,
          quantity: 5,
          reason: 'invalid_waste_reason'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid reason');
    });
  });

  describe('POST /stock-movements/bulk', () => {
    it('should create multiple movements successfully', async () => {
      const movementsData = {
        movements: [
          createTestStockMovement(testProductId, testBranchId, { change: 10, reason: 'purchase' }),
          createTestStockMovement(testProductId, testBranchId, { change: -5, reason: 'sale' }),
          createTestStockMovement(testProductId, testBranchId, { change: 15, reason: 'purchase' })
        ]
      };
      
      const response = await request(app)
        .post('/api/stock-movements/bulk')
        .send(movementsData);

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(3);
      expect(response.body.message).toContain('3 stock movements created');

      // Verify movements were created
      const movements = await prisma.stockMovement.findMany({
        where: { productId: testProductId }
      });
      expect(movements).toHaveLength(3);
    });

    it('should fail with empty movements array', async () => {
      const response = await request(app)
        .post('/api/stock-movements/bulk')
        .send({ movements: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot be empty');
    });

    it('should validate all movements before creating', async () => {
      const movementsData = {
        movements: [
          createTestStockMovement(testProductId, testBranchId, { change: 10 }),
          { productId: testProductId, change: 5 } // missing branchId and reason
        ]
      };
      
      const response = await request(app)
        .post('/api/stock-movements/bulk')
        .send(movementsData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation errors');
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('POST /stock-movements/validate-stock', () => {
    it('should validate stock correctly when accurate', async () => {
      const validationData = {
        productId: testProductId,
        branchId: testBranchId,
        expectedStock: 50 // Matches current stock
      };
      
      const response = await request(app)
        .post('/api/stock-movements/validate-stock')
        .send(validationData);

      expect(response.status).toBe(200);
      expect(response.body.isAccurate).toBe(true);
      expect(response.body.discrepancy).toBe(0);
      expect(response.body.status).toBe('accurate');
    });

    it('should identify overstocked situation', async () => {
      const validationData = {
        productId: testProductId,
        expectedStock: 40 // Less than current stock (50)
      };
      
      const response = await request(app)
        .post('/api/stock-movements/validate-stock')
        .send(validationData);

      expect(response.status).toBe(200);
      expect(response.body.isAccurate).toBe(false);
      expect(response.body.discrepancy).toBe(10); // 50 - 40
      expect(response.body.status).toBe('overstocked');
    });

    it('should identify understocked situation', async () => {
      const validationData = {
        productId: testProductId,
        expectedStock: 60 // More than current stock (50)
      };
      
      const response = await request(app)
        .post('/api/stock-movements/validate-stock')
        .send(validationData);

      expect(response.status).toBe(200);
      expect(response.body.isAccurate).toBe(false);
      expect(response.body.discrepancy).toBe(-10); // 50 - 60
      expect(response.body.status).toBe('understocked');
    });
  });

  describe('POST /stock-movements/reconcile-stock', () => {
    it('should reconcile stock when there is a discrepancy', async () => {
      const reconciliationData = {
        productId: testProductId,
        branchId: testBranchId,
        actualStock: 45 // Different from current stock (50)
      };
      
      const response = await request(app)
        .post('/api/stock-movements/reconcile-stock')
        .send(reconciliationData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('reconciled successfully');
      expect(response.body.previousStock).toBe(50);
      expect(response.body.actualStock).toBe(45);
      expect(response.body.adjustment).toBe(-5);

      // Verify product stock was updated
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProductId }
      });
      expect(updatedProduct.stock).toBe(45);
    });

    it('should handle no adjustment needed', async () => {
      const reconciliationData = {
        productId: testProductId,
        branchId: testBranchId,
        actualStock: 50 // Same as current stock
      };
      
      const response = await request(app)
        .post('/api/stock-movements/reconcile-stock')
        .send(reconciliationData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('No adjustment needed');
      expect(response.body.adjustment).toBe(0);
    });
  });

  describe('GET /stock-movements/analytics/movement-trends', () => {
    beforeEach(async () => {
      // Create movements with different reasons over time
      const movements = [
        { change: 100, reason: 'purchase' },
        { change: -20, reason: 'sale' },
        { change: -5, reason: 'spoilage' },
        { change: 50, reason: 'purchase' },
        { change: -15, reason: 'sale' }
      ];

      for (const movement of movements) {
        await prisma.stockMovement.create({
          data: createTestStockMovement(testProductId, testBranchId, movement)
        });
      }
    });

    it('should return movement trends by period', async () => {
      const response = await request(app)
        .get('/api/stock-movements/analytics/movement-trends?period=day');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('trends');
      expect(response.body.period).toBe('day');
      expect(response.body.trends).toBeInstanceOf(Array);
    });

    it('should filter by branchId', async () => {
      const response = await request(app)
        .get(`/api/stock-movements/analytics/movement-trends?branchId=${testBranchId}`);

      expect(response.status).toBe(200);
      expect(response.body.trends).toBeInstanceOf(Array);
    });
  });
});

//   describe('GET /stock-movements/analytics/waste-report', () => {
//     beforeEach(async () => {
//       // Create waste movements
//       await prisma.stockMovement.createMany({
//         data: [
//           createTestStockMovement(testProductId, testBranchId, { change: -10, reason: 'spoilage' }),
//           createTestStockMovement(testProductId, testBranchId, { change: -5, reason: 'damaged' }),
//           createTestStockMovement(testProductId, testBranchId, { change: -3, reason: 'spoilage' })
//         ]
//       });
//     });

//     it('should return comprehensive waste report', async () => {
//       const response = await request(app)
//         .get('/api/stock-movements/analytics/waste-report');

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('summary');
//       expect(response.body).toHaveProperty('byReason');
//       expect(response.body).toHaveProperty('byProduct');
      
//       expect(response.body.summary.totalWasteEvents).toBe(3);
//       expect(response.body.summary.totalWastedQuantity).toBe(18); // 10 + 5 + 3
//     });
//   });
// });.status).toBe(201);
//       expect(response.body).toHaveProperty('id');
//       expect(response.body.change).toBe(25);
//       expect(response.body.reason).toBe('purchase');
//       expect(response.body).toHaveProperty('product');
//       expect(response.body).toHaveProperty('branch');

//       // Verify product stock was updated
//       const updatedProduct = await prisma.product.findUnique({
//         where: { id: testProductId }
//       });
//       expect(updatedProduct.stock).toBe(75); // 50 + 25
//     });

//     it('should create negative stock movement (sale)', async () => {
//       const movementData = createTestStockMovement(testProductId, testBranchId, {
//         change: -10,
//         reason: 'sale'
//       });
      
//       const response = await request(app)
//         .post('/api/stock-movements')
//         .send(movementData);

//       expect(response.status).toBe(201);
//       expect(response