// tests/categories.test.js - Updated with Authentication & Authorization
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

const createUniqueCategory = (branchId, overrides = {}) => ({
  branchId,
  name: `Test Category ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

describe('Categories API - With Authentication', () => {
  let testBranchId;
  let testBranch2Id;
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

  // Cleanup auth after all tests
  afterAll(async () => {
    const userIds = Object.values(authUsers).map(u => u.id);
    await cleanupTestAuth(userIds);
    await prisma.$disconnect();
  });

  describe('POST /categories', () => {
    it('should create a new category with admin token', async () => {
      const categoryData = createUniqueCategory(testBranchId);
      
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(categoryData.name);
      expect(response.body.branchId).toBe(testBranchId);
      expect(response.body._count.products).toBe(0);
      expect(response.body.branch).toHaveProperty('name');
    });

    it('should allow stock manager to create category', async () => {
      const categoryData = createUniqueCategory(testBranchId);
      
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.stockManager}`)
        .send(categoryData);

      expect(response.status).toBe(201);
    });

    it('should deny creation without authentication', async () => {
      const categoryData = createUniqueCategory(testBranchId);
      
      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should deny creation for cashier', async () => {
      const categoryData = createUniqueCategory(testBranchId);
      
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(categoryData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    it('should trim whitespace from name', async () => {
      const categoryData = {
        branchId: testBranchId,
        name: `  Whitespace Category ${Date.now()}  `
      };
      
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(categoryData.name.trim());
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ branchId: testBranchId });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should fail when branchId is missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: 'Test Category' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Branch ID is required');
    });

    it('should fail when branch does not exist', async () => {
      const categoryData = createUniqueCategory('550e8400-e29b-41d4-a716-446655440000');
      
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(categoryData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Branch not found');
    });

    it('should prevent duplicate category names in same branch', async () => {
      const categoryName = `Duplicate Category ${Date.now()}`;
      
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ branchId: testBranchId, name: categoryName });

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ branchId: testBranchId, name: categoryName });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should allow same category name in different branches', async () => {
      const categoryName = `Same Name Category ${Date.now()}`;
      
      const response1 = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ branchId: testBranchId, name: categoryName });

      const response2 = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({ branchId: testBranch2Id, name: categoryName });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });

  describe('GET /categories', () => {
    beforeEach(async () => {
      await prisma.category.createMany({
        data: [
          createUniqueCategory(testBranchId, { name: 'Electronics' }),
          createUniqueCategory(testBranchId, { name: 'Books' }),
          createUniqueCategory(testBranch2Id, { name: 'Clothing' })
        ]
      });
    });

    it('should get all categories with authentication', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.categories).toHaveLength(3);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(401);
    });

    it('should filter categories by branch', async () => {
      const response = await request(app)
        .get(`/api/categories?branchId=${testBranchId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(2);
      expect(response.body.categories.every(c => c.branchId === testBranchId)).toBe(true);
    });

    it('should search categories by name', async () => {
      const response = await request(app)
        .get('/api/categories?search=Electronics')
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
      expect(response.body.categories.length).toBeGreaterThan(0);
      expect(response.body.categories[0].name).toContain('Electronics');
    });
  });

  describe('GET /categories/:id', () => {
    let testCategoryId;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Single Category' })
      });
      testCategoryId = category.id;
    });

    it('should get category by ID with authentication', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testCategoryId);
      expect(response.body.name).toBe('Single Category');
      expect(response.body).toHaveProperty('branch');
      expect(response.body).toHaveProperty('_count');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}`);

      expect(response.status).toBe(401);
    });

    it('should get category with products when requested', async () => {
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { categoryId: testCategoryId })
      });
      
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}?include_relations=true`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products).toHaveLength(1);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /categories/:id', () => {
    let testCategoryId;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Update Category' })
      });
      testCategoryId = category.id;
    });

    it('should allow admin to update category', async () => {
      const updateData = { name: `Updated Category ${Date.now()}` };
      
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
    });

    it('should allow stock manager to update category', async () => {
      const updateData = { name: `Stock Manager Update ${Date.now()}` };
      
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`)
        .send(updateData);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from updating category', async () => {
      const updateData = { name: `Denied Update ${Date.now()}` };
      
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it('should prevent duplicate names in same branch', async () => {
      const existingName = `Existing Category ${Date.now()}`;
      await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: existingName })
      });

      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: existingName });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should allow admin to delete empty category', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');
      
      const deletedCategory = await prisma.category.findUnique({
        where: { id: category.id }
      });
      expect(deletedCategory).toBeNull();
    });

    it('should allow manager to delete category', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
    });

    it('should deny stock manager from deleting category', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(403);
    });

    it('should deny deletion without authentication', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/categories/${category.id}`);

      expect(response.status).toBe(401);
    });

    it('should prevent deletion of category with products', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Category with Product' })
      });
      
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { categoryId: category.id })
      });
      
      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing products');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /categories/branch/:branchId', () => {
    beforeEach(async () => {
      await prisma.category.createMany({
        data: [
          createUniqueCategory(testBranchId, { name: 'Branch 1 Cat 1' }),
          createUniqueCategory(testBranchId, { name: 'Branch 1 Cat 2' }),
          createUniqueCategory(testBranch2Id, { name: 'Branch 2 Cat 1' })
        ]
      });
    });

    it('should get categories by branch with authentication', async () => {
      const response = await request(app)
        .get(`/api/categories/branch/${testBranchId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every(c => c.branchId === testBranchId)).toBe(true);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/categories/branch/${testBranchId}`);

      expect(response.status).toBe(401);
    });

    it('should include products when requested', async () => {
      const categories = await prisma.category.findMany({
        where: { branchId: testBranchId }
      });
      
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { categoryId: categories[0].id })
      });

      const response = await request(app)
        .get(`/api/categories/branch/${testBranchId}?include_products=true`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('products');
      expect(response.body[0].products).toHaveLength(1);
    });
  });

  describe('GET /categories/:id/products', () => {
    let testCategoryId;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Products Category' })
      });
      testCategoryId = category.id;
      
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { 
            categoryId: testCategoryId,
            name: 'Product A',
            stock: 100,
            active: true,
            priceGross: 10.00
          }),
          createUniqueProduct(testBranchId, { 
            categoryId: testCategoryId,
            name: 'Product B',
            stock: 5,
            active: true,
            priceGross: 25.00
          }),
          createUniqueProduct(testBranchId, { 
            categoryId: testCategoryId,
            name: 'Inactive Product',
            stock: 50,
            active: false,
            priceGross: 15.00
          })
        ]
      });
    });

    it('should get category products with authentication', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(3);
    });

    it('should filter active products', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products?active=true`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.every(p => p.active)).toBe(true);
    });

    it('should filter low stock products', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products?lowStock=true`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].stock).toBeLessThanOrEqual(10);
    });

    it('should sort products by price', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products?sortBy=priceGross&sortOrder=desc&active=true`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(parseFloat(response.body.products[0].priceGross)).toBeGreaterThan(
        parseFloat(response.body.products[1].priceGross)
      );
    });
  });

  describe('GET /categories/:id/analytics', () => {
    let testCategoryId;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Analytics Category' })
      });
      testCategoryId = category.id;
      
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { 
            categoryId: testCategoryId,
            priceGross: 5.99,
            stock: 5,
            active: true
          }),
          createUniqueProduct(testBranchId, { 
            categoryId: testCategoryId,
            priceGross: 15.99,
            stock: 0,
            active: true
          }),
          createUniqueProduct(testBranchId, { 
            categoryId: testCategoryId,
            priceGross: 25.99,
            stock: 100,
            active: false
          })
        ]
      });
    });

    it('should return analytics for admin', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('pricing');
      expect(response.body).toHaveProperty('topProducts');
    });

    it('should return analytics for stock manager', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`);

      expect(response.status).toBe(200);
    });

    it('should deny analytics for cashier', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/analytics`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /categories/:id/move-products', () => {
    let sourceCategoryId, targetCategoryId, productIds;

    beforeEach(async () => {
      const sourceCategory = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Source Category' })
      });
      sourceCategoryId = sourceCategory.id;

      const targetCategory = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Target Category' })
      });
      targetCategoryId = targetCategory.id;

      const products = await Promise.all([
        prisma.product.create({
          data: createUniqueProduct(testBranchId, { categoryId: sourceCategoryId })
        }),
        prisma.product.create({
          data: createUniqueProduct(testBranchId, { categoryId: sourceCategoryId })
        })
      ]);
      productIds = products.map(p => p.id);
    });

    it('should allow admin to move products', async () => {
      const response = await request(app)
        .post(`/api/categories/${sourceCategoryId}/move-products`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ productIds, targetCategoryId });

      expect(response.status).toBe(200);
      expect(response.body.movedCount).toBe(2);
    });

    it('should allow stock manager to move products', async () => {
      const response = await request(app)
        .post(`/api/categories/${sourceCategoryId}/move-products`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`)
        .send({ productIds, targetCategoryId });

      expect(response.status).toBe(200);
    });

    it('should deny cashier from moving products', async () => {
      const response = await request(app)
        .post(`/api/categories/${sourceCategoryId}/move-products`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ productIds, targetCategoryId });

      expect(response.status).toBe(403);
    });

    it('should fail when target category in different branch', async () => {
      const differentBranchCategory = await prisma.category.create({
        data: createUniqueCategory(testBranch2Id, { name: 'Different Branch Category' })
      });

      const response = await request(app)
        .post(`/api/categories/${sourceCategoryId}/move-products`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ productIds, targetCategoryId: differentBranchCategory.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('different branch');
    });
  });

  describe('POST /categories/:id/duplicate', () => {
    let testCategoryId;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Original Category' })
      });
      testCategoryId = category.id;

      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { categoryId: testCategoryId }),
          createUniqueProduct(testBranchId, { categoryId: testCategoryId })
        ]
      });
    });

    it('should allow admin to duplicate category', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ newName: 'Duplicated Category', includeProducts: false });

      expect(response.status).toBe(201);
      expect(response.body.category.name).toBe('Duplicated Category');
    });

    it('should allow manager to duplicate category', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({ newName: 'Manager Duplicated', includeProducts: false });

      expect(response.status).toBe(201);
    });

    it('should deny stock manager from duplicating', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .set('Authorization', `Bearer ${authTokens.stockManager}`)
        .send({ newName: 'Denied Duplicate', includeProducts: false });

      expect(response.status).toBe(403);
    });

    it('should duplicate category with products', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ newName: 'Duplicated with Products', includeProducts: true });

      expect(response.status).toBe(201);
      expect(response.body.duplicatedProductsCount).toBe(2);
    });

    it('should prevent duplicate names', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ newName: 'Original Category' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });
});