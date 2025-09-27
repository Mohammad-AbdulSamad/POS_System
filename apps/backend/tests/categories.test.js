// tests/categories.test.js
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

describe('Categories API - Production Ready', () => {
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

  describe('POST /categories', () => {
    it('should create a new category with valid data', async () => {
      const categoryData = createUniqueCategory(testBranchId);
      
      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(categoryData.name);
      expect(response.body.branchId).toBe(testBranchId);
      expect(response.body._count.products).toBe(0);
      expect(response.body.branch).toHaveProperty('name');
    });

    it('should trim whitespace from name', async () => {
      const categoryData = {
        branchId: testBranchId,
        name: `  Whitespace Category ${Date.now()}  `
      };
      
      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(categoryData.name.trim());
    });

    it('should fail when name is missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ branchId: testBranchId });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should fail when name is empty string', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ branchId: testBranchId, name: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should fail when branchId is missing', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test Category' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Branch ID is required');
    });

    it('should fail when branch does not exist', async () => {
      const categoryData = createUniqueCategory('550e8400-e29b-41d4-a716-446655440000');
      
      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Branch not found');
    });

    it('should prevent duplicate category names in same branch', async () => {
      const categoryName = `Duplicate Category ${Date.now()}`;
      
      // Create first category
      await request(app)
        .post('/api/categories')
        .send({ branchId: testBranchId, name: categoryName });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/categories')
        .send({ branchId: testBranchId, name: categoryName });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should allow same category name in different branches', async () => {
      const categoryName = `Same Name Category ${Date.now()}`;
      
      // Create in first branch
      const response1 = await request(app)
        .post('/api/categories')
        .send({ branchId: testBranchId, name: categoryName });

      // Create in second branch
      const response2 = await request(app)
        .post('/api/categories')
        .send({ branchId: testBranch2Id, name: categoryName });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });

  describe('GET /categories', () => {
    beforeEach(async () => {
      // Create test categories in both branches
      await prisma.category.createMany({
        data: [
          createUniqueCategory(testBranchId, { name: 'Electronics' }),
          createUniqueCategory(testBranchId, { name: 'Books' }),
          createUniqueCategory(testBranch2Id, { name: 'Clothing' })
        ]
      });
    });

    it('should get all categories with pagination', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.categories).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.categories[0]).toHaveProperty('branch');
      expect(response.body.categories[0]).toHaveProperty('_count');
    });

    it('should filter categories by branch', async () => {
      const response = await request(app)
        .get(`/api/categories?branchId=${testBranchId}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(2);
      expect(response.body.categories.every(c => c.branchId === testBranchId)).toBe(true);
    });

    it('should search categories by name', async () => {
      const response = await request(app)
        .get('/api/categories?search=Electronics');

      expect(response.status).toBe(200);
      expect(response.body.categories.length).toBeGreaterThan(0);
      expect(response.body.categories[0].name).toContain('Electronics');
    });

    it('should include products when requested', async () => {
      const response = await request(app)
        .get('/api/categories?include_relations=true');

      expect(response.status).toBe(200);
      expect(response.body.categories[0]).toHaveProperty('products');
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/categories?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.categories).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });
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

    it('should get category by ID', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testCategoryId);
      expect(response.body.name).toBe('Single Category');
      expect(response.body).toHaveProperty('branch');
      expect(response.body).toHaveProperty('_count');
    });

    it('should get category with products when requested', async () => {
      // Add a product to the category
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { categoryId: testCategoryId })
      });
      
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}?include_relations=true`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0]).toHaveProperty('name');
      expect(response.body.products[0]).toHaveProperty('stock');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/categories/${fakeId}`);

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

    it('should update category name', async () => {
      const updateData = {
        name: `Updated Category ${Date.now()}`
      };
      
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
    });

    it('should trim whitespace when updating', async () => {
      const updateData = {
        name: `  Whitespace Updated ${Date.now()}  `
      };
      
      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name.trim());
    });

    it('should prevent duplicate names in same branch', async () => {
      // Create another category first
      const existingName = `Existing Category ${Date.now()}`;
      await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: existingName })
      });

      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .send({ name: existingName });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should allow updating to same name (no change)', async () => {
      const category = await prisma.category.findUnique({
        where: { id: testCategoryId }
      });

      const response = await request(app)
        .put(`/api/categories/${testCategoryId}`)
        .send({ name: category.name });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(category.name);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/api/categories/${fakeId}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete empty category successfully', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Delete Me' })
      });
      
      const response = await request(app)
        .delete(`/api/categories/${category.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');
      
      // Verify deletion
      const deletedCategory = await prisma.category.findUnique({
        where: { id: category.id }
      });
      expect(deletedCategory).toBeNull();
    });

    it('should prevent deletion of category with products', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Category with Product' })
      });
      
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { categoryId: category.id })
      });
      
      const response = await request(app)
        .delete(`/api/categories/${category.id}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existing products');
      expect(response.body.details.products).toBe(1);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/api/categories/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /categories/branch/:branchId', () => {
    beforeEach(async () => {
      // Create categories in both branches
      await prisma.category.createMany({
        data: [
          createUniqueCategory(testBranchId, { name: 'Branch 1 Cat 1' }),
          createUniqueCategory(testBranchId, { name: 'Branch 1 Cat 2' }),
          createUniqueCategory(testBranch2Id, { name: 'Branch 2 Cat 1' })
        ]
      });
    });

    it('should get categories by branch', async () => {
      const response = await request(app)
        .get(`/api/categories/branch/${testBranchId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every(c => c.branchId === testBranchId)).toBe(true);
      expect(response.body[0]).toHaveProperty('_count');
    });

    it('should include products when requested', async () => {
      const categories = await prisma.category.findMany({
        where: { branchId: testBranchId }
      });
      
      // Add a product to first category
      await prisma.product.create({
        data: createUniqueProduct(testBranchId, { categoryId: categories[0].id })
      });

      const response = await request(app)
        .get(`/api/categories/branch/${testBranchId}?include_products=true`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('products');
      expect(response.body[0].products).toHaveLength(1);
    });

    it('should filter active products only', async () => {
      const categories = await prisma.category.findMany({
        where: { branchId: testBranchId }
      });
      
      // Add active and inactive products
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { categoryId: categories[0].id, active: true }),
          createUniqueProduct(testBranchId, { categoryId: categories[0].id, active: false })
        ]
      });

      const response = await request(app)
        .get(`/api/categories/branch/${testBranchId}?include_products=true&active_only=true`);

      expect(response.status).toBe(200);
      expect(response.body[0].products.every(p => p.active)).toBe(true);
    });
  });

  describe('GET /categories/:id/products', () => {
    let testCategoryId;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Products Category' })
      });
      testCategoryId = category.id;
      
      // Create test products with different properties
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

    it('should get category products with pagination', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter active products', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products?active=true`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.every(p => p.active)).toBe(true);
    });

    it('should filter low stock products', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products?lowStock=true`);

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].stock).toBeLessThanOrEqual(10);
    });

    it('should search products', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products?search=Product A`);

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].name).toContain('Product A');
    });

    it('should sort products by price', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/products?sortBy=priceGross&sortOrder=desc&active=true`);

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
      
      // Create test products with varying properties
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

    it('should return comprehensive category analytics', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategoryId}/analytics`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('pricing');
      expect(response.body).toHaveProperty('topProducts');
      
      expect(response.body.overview).toMatchObject({
        totalProducts: 3,
        activeProducts: 2,
        outOfStockProducts: 1,
        lowStockProducts: 1
      });
      
      expect(response.body.pricing).toHaveProperty('averagePrice');
      expect(response.body.pricing).toHaveProperty('minPrice');
      expect(response.body.pricing).toHaveProperty('maxPrice');
      expect(response.body.topProducts).toBeInstanceOf(Array);
    });
  });

  describe('POST /categories/:id/move-products', () => {
    let sourceCategoryId, targetCategoryId, productIds;

    beforeEach(async () => {
      // Create source and target categories
      const sourceCategory = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Source Category' })
      });
      sourceCategoryId = sourceCategory.id;

      const targetCategory = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Target Category' })
      });
      targetCategoryId = targetCategory.id;

      // Create products in source category
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

    it('should move products to target category', async () => {
      const response = await request(app)
        .post(`/api/categories/${sourceCategoryId}/move-products`)
        .send({
          productIds,
          targetCategoryId
        });

      expect(response.status).toBe(200);
      expect(response.body.movedCount).toBe(2);
      expect(response.body.targetCategory.id).toBe(targetCategoryId);

      // Verify products moved
      const movedProducts = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      expect(movedProducts.every(p => p.categoryId === targetCategoryId)).toBe(true);
    });

    it('should fail when target category in different branch', async () => {
      const differentBranchCategory = await prisma.category.create({
        data: createUniqueCategory(testBranch2Id, { name: 'Different Branch Category' })
      });

      const response = await request(app)
        .post(`/api/categories/${sourceCategoryId}/move-products`)
        .send({
          productIds,
          targetCategoryId: differentBranchCategory.id
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('different branch');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/categories/${sourceCategoryId}/move-products`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Product IDs array is required');
    });
  });

  describe('POST /categories/:id/duplicate', () => {
    let testCategoryId;

    beforeEach(async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Original Category' })
      });
      testCategoryId = category.id;

      // Add products to original category
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { categoryId: testCategoryId }),
          createUniqueProduct(testBranchId, { categoryId: testCategoryId })
        ]
      });
    });

    it('should duplicate category without products', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .send({
          newName: 'Duplicated Category',
          includeProducts: false
        });

      expect(response.status).toBe(201);
      expect(response.body.category.name).toBe('Duplicated Category');
      expect(response.body.duplicatedProductsCount).toBe(0);
    });

    it('should duplicate category with products', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .send({
          newName: 'Duplicated with Products',
          includeProducts: true
        });

      expect(response.status).toBe(201);
      expect(response.body.category.name).toBe('Duplicated with Products');
      expect(response.body.duplicatedProductsCount).toBe(2);

      // Verify duplicated products exist
      const duplicatedProducts = await prisma.product.findMany({
        where: { categoryId: response.body.category.id }
      });
      expect(duplicatedProducts).toHaveLength(2);
      expect(duplicatedProducts.every(p => p.stock === 0)).toBe(true); // Should start with 0 stock
      expect(duplicatedProducts.every(p => !p.active)).toBe(true); // Should be inactive
    });

    it('should prevent duplicate names', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .send({
          newName: 'Original Category'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/categories/${testCategoryId}/duplicate`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('New category name is required');
    });
  });

  describe('Complex Production Scenarios', () => {
    it('should handle bulk category operations', async () => {
      // Create multiple categories and products
      const categories = await Promise.all([
        prisma.category.create({
          data: createUniqueCategory(testBranchId, { name: 'Electronics' })
        }),
        prisma.category.create({
          data: createUniqueCategory(testBranchId, { name: 'Books' })
        })
      ]);

      // Add products to each category
      await prisma.product.createMany({
        data: [
          createUniqueProduct(testBranchId, { 
            categoryId: categories[0].id, 
            name: 'Laptop',
            stock: 10,
            priceGross: 999.99
          }),
          createUniqueProduct(testBranchId, { 
            categoryId: categories[1].id, 
            name: 'Novel',
            stock: 50,
            priceGross: 19.99
          })
        ]
      });

      // Test filtering and analytics
      const electronicsResponse = await request(app)
        .get(`/api/categories/${categories[0].id}/analytics`);

      const booksResponse = await request(app)
        .get(`/api/categories/${categories[1].id}/products`);

      let temp = parseFloat(electronicsResponse.body.pricing.maxPrice);
      expect(electronicsResponse.status).toBe(200);
      expect(temp).toBeGreaterThan(500);
      expect(booksResponse.body.products[0].name).toBe('Novel');
    });

    it('should maintain data consistency during operations', async () => {
      const category = await prisma.category.create({
        data: createUniqueCategory(testBranchId, { name: 'Consistency Test' })
      });

      const product = await prisma.product.create({
        data: createUniqueProduct(testBranchId, { categoryId: category.id })
      });

      // Should prevent deletion with products
      const deleteResponse = await request(app)
        .delete(`/api/categories/${category.id}`);
      expect(deleteResponse.status).toBe(400);

      // Should allow deletion after removing products
      await prisma.product.delete({ where: { id: product.id } });
      
      const deleteResponse2 = await request(app)
        .delete(`/api/categories/${category.id}`);
      expect(deleteResponse2.status).toBe(200);
    });
  });
});