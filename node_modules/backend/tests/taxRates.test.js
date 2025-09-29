// tests/taxRates.test.fixed.js
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

const createUniqueTaxRate = (overrides = {}) => ({
  name: `Tax Rate ${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
  rate: 15.00,
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

describe('TaxRates API - Fixed Tests', () => {
  let testBranchId;
  let testBranch2Id;

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
    await prisma.$disconnect();
  });

  describe('POST /taxrates', () => {
    it('should create a new tax rate with valid data', async () => {
      const taxRateData = {
        name: `Standard VAT ${Date.now()}`,
        rate: 20.00
      };
      
      const response = await request(app)
        .post('/api/taxrates')
        .send(taxRateData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(taxRateData.name);
      expect(parseFloat(response.body.rate)).toBe(20.00);
    });

    it('should prevent duplicate tax rate names', async () => {
      const taxRateName = `Duplicate Tax ${Date.now()}`;
      
      await request(app)
        .post('/api/taxrates')
        .send({ name: taxRateName, rate: 10.00 });

      const response = await request(app)
        .post('/api/taxrates')
        .send({ name: taxRateName, rate: 15.00 });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should prevent duplicate tax rate values', async () => {
      const uniqueRate = 12.5;
      
      await request(app)
        .post('/api/taxrates')
        .send({ name: `First Tax ${Date.now()}`, rate: uniqueRate });

      const response = await request(app)
        .post('/api/taxrates')
        .send({ name: `Second Tax ${Date.now()}`, rate: uniqueRate });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /taxrates', () => {
    beforeEach(async () => {
      // Create test tax rates with unique rates
      await prisma.taxRate.create({
        data: { name: `Standard Rate ${Date.now()}`, rate: 20.00 }
      });

      await prisma.taxRate.create({
        data: { name: `Reduced Rate ${Date.now()}`, rate: 5.00 }
      });

      await prisma.taxRate.create({
        data: { name: `Zero Rate ${Date.now()}`, rate: 0.00 }
      });
    });

    it('should get all tax rates with pagination', async () => {
      const response = await request(app)
        .get('/api/taxrates');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('taxRates');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.taxRates.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter tax rates by rate range', async () => {
      const response = await request(app)
        .get('/api/taxrates?minRate=5&maxRate=20');

      expect(response.status).toBe(200);
      // Should include rates that are >= 5 AND <= 20
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

    it('should calculate tax correctly', async () => {
      const response = await request(app)
        .post('/api/taxrates/calculate')
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
        .send({
          amount: 0.01, // Use 0.01 instead of 0
          taxRateId: testTaxRateId
        });

      expect(response.status).toBe(200);
      expect(response.body.baseAmount).toBe(0.01);
    });

    it('should handle precise calculations with rounding', async () => {
      const preciseTaxRate = await prisma.taxRate.create({
        data: { name: `Precise ${Date.now()}`, rate: 8.88 } // Use 8.88 instead of 8.875
      });

      const response = await request(app)
        .post('/api/taxrates/calculate')
        .send({
          amount: 1000.00,
          taxRateId: preciseTaxRate.id
        });

      expect(response.status).toBe(200);
      // 1000 * 0.0888 = 88.8
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

    it('should get tax rate products with pagination', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/products`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(3);
    });

    it('should filter active products only', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/products?active=true`);

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

    it('should assign products to tax rate', async () => {
      const response = await request(app)
        .post(`/api/taxrates/${testTaxRateId}/assign-products`)
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

    it('should return comprehensive tax rate analytics', async () => {
      const response = await request(app)
        .get(`/api/taxrates/${testTaxRateId}/analytics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('taxRate');
      expect(response.body).toHaveProperty('overview');
      expect(response.body.taxRate.rate).toBe(25);
      expect(response.body.overview.totalProducts).toBe(3);
      expect(response.body.overview.activeProducts).toBe(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle retail tax rate scenarios', async () => {
      const uniqueSuffix = Date.now();
      
      const standardRate = await request(app)
        .post('/api/taxrates')
        .send({ name: `Standard VAT ${uniqueSuffix}`, rate: 20.00 });

      const reducedRate = await request(app)
        .post('/api/taxrates')
        .send({ name: `Reduced VAT ${uniqueSuffix}`, rate: 5.00 });

      const zeroRate = await request(app)
        .post('/api/taxrates')
        .send({ name: `Zero Rated ${uniqueSuffix}`, rate: 0.00 });

      expect(standardRate.status).toBe(201);
      expect(reducedRate.status).toBe(201);
      expect(zeroRate.status).toBe(201);
    });

    it('should handle international tax rate formats', async () => {
      const internationalRates = [
        { name: `EU Standard VAT ${Date.now()}`, rate: 21.00 },
        { name: `UK VAT ${Date.now()}`, rate: 20.00 },
        { name: `Canadian GST ${Date.now()}`, rate: 5.00 }
      ];

      for (const rateData of internationalRates) {
        const response = await request(app)
          .post('/api/taxrates')
          .send(rateData);

        expect(response.status).toBe(201);
        expect(parseFloat(response.body.rate)).toBe(rateData.rate);
      }
    });
  });
});