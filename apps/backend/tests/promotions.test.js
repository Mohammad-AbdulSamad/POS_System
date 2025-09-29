// tests/promotions.test.js
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

const createUniquePromotion = (overrides = {}) => ({
  name: `Test Promotion ${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
  description: 'Test promotion description',
  type: 'PERCENTAGE',
  discountPct: 10.00,
  active: true,
  ...overrides
});

const createUniqueProduct = (branchId, overrides = {}) => ({
  branchId,
  sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  name: `Test Product ${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
  description: 'Test product description',
  priceGross: 100.00,
  cost: 50.00,
  unit: 'pcs',
  stock: 100,
  active: true,
  ...overrides
});

const createUniqueCategory = (branchId, overrides = {}) => ({
  branchId,
  name: `Test Category ${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
  ...overrides
});

describe('Promotions API - Production Ready', () => {
  let testBranchId;

  beforeEach(async () => {
    // Clean DB
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

    const branch = await prisma.branch.create({ data: createUniqueBranch() });
    testBranchId = branch.id;
  });

  // --- POST /promotions tests (already written in your stub) ---

  describe('GET /promotions/:id', () => {
    it('should get promotion by id', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });

      const response = await request(app).get(`/api/promotions/${promo.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(promo.id);
      expect(response.body.name).toBe(promo.name);
    });

    it('should return 404 for missing promotion', async () => {
      const response = await request(app).get('/api/promotions/nonexistent-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /promotions/:id', () => {
    it('should update promotion', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });

      const response = await request(app)
        .put(`/api/promotions/${promo.id}`)
        .send({ name: 'Updated Promo', discountPct: 20 });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Promo');
      expect(response.body.discountPct).toBe('20');
    });

    it('should validate invalid update', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });

      const response = await request(app)
        .put(`/api/promotions/${promo.id}`)
        .send({ discountPct: 200 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('between 0 and 100');
    });
  });

  describe('DELETE /promotions/:id', () => {
    it('should delete promotion', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });

      const response = await request(app).delete(`/api/promotions/${promo.id}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      const check = await prisma.promotion.findUnique({ where: { id: promo.id } });
      expect(check).toBeNull();
    });

    it('should return 404 if promotion not found', async () => {
      const response = await request(app).delete('/api/promotions/nonexistent-id');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /promotions/calculate', () => {
    let percentPromoId, fixedPromoId, buyXGetYPromoId;

    beforeEach(async () => {
      percentPromoId = (await prisma.promotion.create({
        data: { name: '20% Off', type: 'PERCENTAGE', discountPct: 20, active: true }
      })).id;

      fixedPromoId = (await prisma.promotion.create({
        data: { name: '$10 Off', type: 'FIXED_AMOUNT', discountAmt: 10, active: true }
      })).id;

      buyXGetYPromoId = (await prisma.promotion.create({
        data: { name: 'Buy 2 Get 1', type: 'BUY_X_GET_Y', buyQty: 2, getQty: 1, active: true }
      })).id;
    });

    it('should calculate percentage discount', async () => {
      const response = await request(app)
        .post('/api/promotions/calculate')
        .send({ promotionId: percentPromoId, originalPrice: 100, quantity: 1 });

      expect(response.status).toBe(200);
      expect(response.body.discountAmount).toBe(20);
      expect(response.body.finalPrice).toBe(80);
    });

    it('should calculate fixed discount', async () => {
      const response = await request(app)
        .post('/api/promotions/calculate')
        .send({ promotionId: fixedPromoId, originalPrice: 50, quantity: 2 });

      expect(response.status).toBe(200);
      expect(response.body.discountAmount).toBe(20);
      expect(response.body.finalPrice).toBe(80);
    });

    it('should calculate buy X get Y', async () => {
      const response = await request(app)
        .post('/api/promotions/calculate')
        .send({ promotionId: buyXGetYPromoId, originalPrice: 10, quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.finalPrice).toBe(20);
      expect(response.body.freeItems).toBe(1);
    });
  });

  describe('POST /promotions/:id/assign-products', () => {
    it('should assign products to promotion', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });
      const product = await prisma.product.create({ data: createUniqueProduct(testBranchId) });

      const response = await request(app)
        .post(`/api/promotions/${promo.id}/assign-products`)
        .send({ productIds: [product.id] });

      expect(response.status).toBe(200);
      expect(response.body.assignedCount).toBe(1);
    });

    it('should fail with invalid product', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });

      const response = await request(app)
        .post(`/api/promotions/${promo.id}/assign-products`)
        .send({ productIds: ['nonexistent'] });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /promotions/:id/assign-categories', () => {
    it('should assign categories to promotion', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });
      const category = await prisma.category.create({ data: createUniqueCategory(testBranchId) });

      const response = await request(app)
        .post(`/api/promotions/${promo.id}/assign-categories`)
        .send({ categoryIds: [category.id] });

      expect(response.status).toBe(200);
      expect(response.body.assignedCount).toBe(1);
    });
  });

  describe('GET /promotions/:id/products', () => {
    it('should get products for a promotion', async () => {
      const promo = await prisma.promotion.create({ data: createUniquePromotion() });
      const product = await prisma.product.create({ data: createUniqueProduct(testBranchId) });

      // Assign product
      await prisma.promotion.update({
        where: { id: promo.id },
        data: { products: { connect: { id: product.id } } }
      });

      const response = await request(app).get(`/api/promotions/${promo.id}/products`);

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].id).toBe(product.id);
    });
  });
});
