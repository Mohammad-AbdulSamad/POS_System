// tests/suppliers.test.js
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

const createUniqueSupplier = (overrides = {}) => ({
  name: `Test Supplier ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  phone: `+12345${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 100)}`,
  address: `${Math.floor(Math.random() * 9999)} Supply Street, Business City`,
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

describe('Suppliers API - Production Ready', () => {
  let testBranchId;

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
  });

  describe('POST /suppliers', () => {
    it('should create a new supplier with valid data', async () => {
      const supplierData = createUniqueSupplier();
      
      const response = await request(app)
        .post('/api/suppliers')
        .send(supplierData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(supplierData.name);
      expect(response.body.phone).toBe(supplierData.phone);
      expect(response.body.address).toBe(supplierData.address);
      expect(response.body._count.products).toBe(0);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should create supplier with minimal required data', async () => {
      const supplierData = {
        name: `Minimal Supplier ${Date.now()}`
      };
      
      const response = await request(app)
        .post('/api/suppliers')
        .send(supplierData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(supplierData.name);
      expect(response.body.phone).toBeNull();
      expect(response.body.address).toBeNull();
    });

    it('should trim whitespace from inputs', async () => {
      const supplierData = {
        name: `  Whitespace Supplier ${Date.now()}  `,
        phone: '  +1234567890  ',
        address: '  123 Trimmed Street  '
      };
      
      const response = await request(app)
        .post('/api/suppliers')
        .send(supplierData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(supplierData.name.trim());
      expect(response.body.phone).toBe('+1234567890');
      expect(response.body.address).toBe('123 Trimmed Street');
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .send({ phone: '+1234567890' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should fail when name is empty string', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should validate phone format', async () => {
      const response = await request(app)
        .post('/api/suppliers')
        .send({
          name: 'Test Supplier',
          phone: 'invalid-phone'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid phone format');
    });

    it('should prevent duplicate supplier names', async () => {
      const supplierName = `Duplicate Supplier ${Date.now()}`;
      
      // Create first supplier
      await request(app)
        .post('/api/suppliers')
        .send({ name: supplierName });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/suppliers')
        .send({ name: supplierName });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /suppliers', () => {
    beforeEach(async () => {
      // Create test suppliers individually
      const supplier1 = await prisma.supplier.create({
        data: createUniqueSupplier({ name: 'ABC Supplies' })
      });

      const supplier2 = await prisma.supplier.create({
        data: createUniqueSupplier({ name: 'XYZ Distribution' })
      });

      const supplier3 = await prisma.supplier.create({
        data: createUniqueSupplier({ name: 'Global Wholesale' })
      });

      // Add products to one supplier
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { supplierId: supplier1.id })
      });
    });

    it('should get all suppliers with pagination', async () => {
      const response = await request(app)
        .get('/api/suppliers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suppliers');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.suppliers).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.suppliers[0]).toHaveProperty('_count');
    });

    it('should filter suppliers with products', async () => {
      const response = await request(app)
        .get('/api/suppliers?hasProducts=true');

      expect(response.status).toBe(200);
      expect(response.body.suppliers).toHaveLength(1);
      expect(response.body.suppliers[0]._count.products).toBeGreaterThan(0);
    });

    it('should search suppliers by name', async () => {
      const response = await request(app)
        .get('/api/suppliers?search=ABC');

      expect(response.status).toBe(200);
      expect(response.body.suppliers.length).toBeGreaterThan(0);
      expect(response.body.suppliers[0].name).toContain('ABC');
    });

    it('should include relations when requested', async () => {
      const response = await request(app)
        .get('/api/suppliers?include_relations=true');

      expect(response.status).toBe(200);
      expect(response.body.suppliers[0]).toHaveProperty('products');
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/suppliers?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.suppliers).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });
    });
  });

    describe('GET /suppliers/:id', () => {
    let testSupplierId;

    beforeEach(async () => {
      const supplier = await prisma.supplier.create({
        data: createUniqueSupplier({ name: 'Single Supplier' })
      });
      testSupplierId = supplier.id;
    });

    it('should get supplier by ID', async () => {
      const response = await request(app)
        .get(`/api/suppliers/${testSupplierId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testSupplierId);
      expect(response.body.name).toBe('Single Supplier');
      expect(response.body).toHaveProperty('_count');
    });

    it('should return 404 for non-existing supplier', async () => {
      const response = await request(app)
        .get('/api/suppliers/non-existing-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /suppliers/:id', () => {
    let supplier;

    beforeEach(async () => {
      supplier = await prisma.supplier.create({
        data: createUniqueSupplier({ name: 'Updatable Supplier' })
      });
    });

    it('should update supplier name', async () => {
      const newName = `Updated Supplier ${Date.now()}`;
      const response = await request(app)
        .put(`/api/suppliers/${supplier.id}`)
        .send({ name: newName });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(newName);
    });

    it('should validate phone format', async () => {
      const response = await request(app)
        .put(`/api/suppliers/${supplier.id}`)
        .send({ phone: 'bad-phone' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid phone format');
    });

    it('should prevent duplicate names', async () => {
      const other = await prisma.supplier.create({
        data: createUniqueSupplier({ name: 'Existing Supplier' })
      });

      const response = await request(app)
        .put(`/api/suppliers/${supplier.id}`)
        .send({ name: other.name });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 404 if supplier not found', async () => {
      const response = await request(app)
        .put('/api/suppliers/non-existing-id')
        .send({ name: 'Does not matter' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /suppliers/:id', () => {
    let supplier;

    beforeEach(async () => {
      supplier = await prisma.supplier.create({
        data: createUniqueSupplier({ name: 'Deletable Supplier' })
      });
    });

    it('should delete supplier with no products', async () => {
      const response = await request(app)
        .delete(`/api/suppliers/${supplier.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');
    });

    it('should not delete supplier with products', async () => {
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { supplierId: supplier.id })
      });

      const response = await request(app)
        .delete(`/api/suppliers/${supplier.id}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot delete supplier with existing products');
    });

    it('should return 404 for non-existing supplier', async () => {
      const response = await request(app)
        .delete('/api/suppliers/non-existing-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });
});
