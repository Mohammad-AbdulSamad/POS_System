// // tests/transactions.test.js
// // Authenticated + role-aware version of your original transactions tests
// import request from 'supertest';
// import { PrismaClient } from '@prisma/client';
// import app from '../server.js';
// import { setupTestAuth, cleanupTestAuth } from './helpers/auth.helper.js';

// const prisma = new PrismaClient();

// const createUniqueBranch = (overrides = {}) => ({
//   name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
//   address: '123 Test Street',
//   phone: '+1234567890',
//   ...overrides
// });

// const createUniqueUser = (branchId, overrides = {}) => ({
//   branchId,
//   email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
//   name: 'Test User',
//   password: 'hashedpassword',
//   role: 'CASHIER',
//   ...overrides
// });

// const createUniqueCustomer = (overrides = {}) => ({
//   name: `Test Customer ${Date.now()}`,
//   phone: `+123456${Date.now().toString().slice(-4)}`,
//   email: `customer-${Date.now()}@example.com`,
//   ...overrides
// });

// const createUniqueProduct = (branchId, overrides = {}) => ({
//   branchId,
//   sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
//   name: `Test Product ${Date.now()}`,
//   description: 'Test product description',
//   priceGross: 10.99,
//   cost: 5.50,
//   unit: 'pcs',
//   stock: 100,
//   active: true,
//   ...overrides
// });

// const createTransactionData = (branchId, productId, cashierId = null, customerId = null) => ({
//   branchId,
//   cashierId,
//   customerId,
//   lines: [
//     {
//       productId,
//       unitPrice: 10.99,
//       qty: 2,
//       discount: 0,
//       taxAmount: 1.50
//     }
//   ],
//   payments: [
//     {
//       method: 'CASH',
//       amount: 23.48
//     }
//   ]
// });

// describe('Transactions API - Authenticated & Role-aware', () => {
//   let authTokens;
//   let authUsers;

//   let testBranchId;
//   let testProductId;
//   let testCashierId;
//   let testCustomerId;

//   // Create test auth users and tokens
//   beforeAll(async () => {
//     const auth = await setupTestAuth(app);
//     authTokens = auth.tokens;
//     authUsers = auth.users;
//   });

//   // Clean DB before each test but keep the auth users
//   beforeEach(async () => {
//     await prisma.loyaltyTransaction.deleteMany();
//     await prisma.return.deleteMany();
//     await prisma.payment.deleteMany();
//     await prisma.transactionLine.deleteMany();
//     await prisma.transaction.deleteMany();
//     await prisma.stockMovement.deleteMany();
//     await prisma.product.deleteMany();
//     await prisma.category.deleteMany();
//     await prisma.customer.deleteMany();
//     await prisma.supplier.deleteMany();
//     await prisma.taxRate.deleteMany();
//     await prisma.promotion.deleteMany();
//     await prisma.branch.deleteMany();

//     // Keep auth users intact; delete all other users
//     await prisma.user.deleteMany({
//       where: {
//         id: { notIn: Object.values(authUsers).map(u => u.id) }
//       }
//     });

//     // Create test branch
//     const branch = await prisma.branch.create({
//       data: createUniqueBranch()
//     });
//     testBranchId = branch.id;

//     // Create test product
//     const product = await prisma.product.create({
//       data: createUniqueProduct(testBranchId, { stock: 50 })
//     });
//     testProductId = product.id;

//     // Create test cashier (separate from auth.helper cashier)
//     const cashier = await prisma.user.create({
//       data: createUniqueUser(testBranchId)
//     });
//     testCashierId = cashier.id;

//     // Create test customer
//     const customer = await prisma.customer.create({
//       data: createUniqueCustomer()
//     });
//     testCustomerId = customer.id;
//   });

//   // Cleanup auth users + disconnect Prisma
//   afterAll(async () => {
//     const userIds = Object.values(authUsers).map(u => u.id);
//     await cleanupTestAuth(userIds);
//     await prisma.$disconnect();
//   });

//   // ---------------------------
//   // POST /transactions
//   // All authenticated users can create transactions (CASHIER included)
//   // ---------------------------
//   describe('POST /transactions', () => {
//     it('should create a new transaction with valid data (cashier auth)', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      
//       const response = await request(app)
//         .post("/api/transactions")
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       // compute expected totals from the test payload
//       const expectedTax = transactionData.lines.reduce((sum, l) => sum + (l.taxAmount || 0), 0);
//       const expectedLinesTotal = transactionData.lines.reduce((sum, l) => sum + (l.unitPrice * l.qty - (l.discount || 0)), 0);
//       const expectedGross = expectedLinesTotal + expectedTax;

//       expect(response.status).toBe(201);
//       expect(response.body).toHaveProperty('id');
//       expect(response.body).toHaveProperty('receiptNumber');
//       expect(parseFloat(response.body.totalGross)).toBeCloseTo(expectedGross, 2);
//       expect(parseFloat(response.body.totalTax)).toBeCloseTo(expectedTax, 2);
//       expect(response.body.branchId).toBe(testBranchId);
//       expect(response.body.lines).toHaveLength(1);
//       expect(response.body.payments).toHaveLength(1);
//     });

//     it('should deny creation without authentication', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .send(transactionData);

//       expect(response.status).toBe(401);
//       expect(response.body.message).toBe('Authentication required');
//     });

//     it('should create transaction without cashier or customer (cashier token)', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId);
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       expect(response.status).toBe(201);
//       expect(response.body.cashierId).toBeNull();
//       expect(response.body.customerId).toBeNull();
//     });

//     it('should update product stock correctly', async () => {
//       const initialProduct = await prisma.product.findUnique({
//         where: { id: testProductId }
//       });
      
//       const transactionData = createTransactionData(testBranchId, testProductId);
//       transactionData.lines[0].qty = 5;
      
//       await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       const updatedProduct = await prisma.product.findUnique({
//         where: { id: testProductId }
//       });

//       expect(updatedProduct.stock).toBe(initialProduct.stock - 5);
//     });

//     it('should create stock movement records', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId);
      
//       await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       const stockMovements = await prisma.stockMovement.findMany({
//         where: { productId: testProductId, reason: 'sale' }
//       });

//       expect(stockMovements).toHaveLength(1);
//       expect(stockMovements[0].change).toBe(-2);
//     });

//     it('should handle loyalty points correctly', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
//       transactionData.loyaltyPointsEarned = 10;
//       transactionData.loyaltyPointsUsed = 5;
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       expect(response.status).toBe(201);
//       expect(response.body.loyaltyPointsEarned).toBe(10);
//       expect(response.body.loyaltyPointsUsed).toBe(5);

//       // Check customer points updated
//       const customer = await prisma.customer.findUnique({
//         where: { id: testCustomerId }
//       });
//       expect(customer.loyaltyPoints).toBe(5); // 0 + 10 - 5

//       // Check loyalty transactions created
//       const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
//         where: { customerId: testCustomerId }
//       });
//       expect(loyaltyTransactions).toHaveLength(2);
//     });

//     it('should fail when required fields are missing (cashier)', async () => {
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send({ branchId: testBranchId });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Required fields');
//     });

//     it('should fail when branch does not exist (cashier)', async () => {
//       const transactionData = createTransactionData('550e8400-e29b-41d4-a716-446655440000', testProductId);
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Branch not found');
//     });

//     it('should fail when product has insufficient stock', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId);
//       transactionData.lines[0].qty = 100; // More than available stock (50)
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Insufficient stock');
//     });

//     it('should validate line items correctly (qty > 0)', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId);
//       transactionData.lines[0].qty = 0; // Invalid qty
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('qty (> 0)');
//     });
//   });

//   // ---------------------------
//   // GET /transactions (Admin & Manager only)
//   // ---------------------------
//   describe('GET /transactions', () => {
//     beforeEach(async () => {
//       // Create test transactions (by cashier token)
//       const transaction1Data = createTransactionData(testBranchId, testProductId, testCashierId);
//       await request(app).post('/api/transactions').set('Authorization', `Bearer ${authTokens.cashier}`).send(transaction1Data);
      
//       const transaction2Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
//       await request(app).post('/api/transactions').set('Authorization', `Bearer ${authTokens.cashier}`).send(transaction2Data);
//     });

//     it('should get all transactions with authentication (manager)', async () => {
//       const response = await request(app)
//         .get('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.manager}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('transactions');
//       expect(response.body).toHaveProperty('pagination');
//       expect(response.body.transactions).toHaveLength(2);
//       expect(response.body.pagination.total).toBe(2);
//     });

//     it('should deny access without authentication', async () => {
//       const response = await request(app)
//         .get('/api/transactions');

//       expect(response.status).toBe(401);
//     });

//     it('should deny cashier from viewing all transactions', async () => {
//       const response = await request(app)
//         .get('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`);

//       expect(response.status).toBe(403);
//     });

//     it('should filter transactions by branch (admin)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions?branchId=${testBranchId}`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(response.status).toBe(200);
//       expect(response.body.transactions).toHaveLength(2);
//       expect(response.body.transactions[0].branchId).toBe(testBranchId);
//     });

//     it('should filter transactions by status (manager)', async () => {
//       const response = await request(app)
//         .get('/api/transactions?status=COMPLETED')
//         .set('Authorization', `Bearer ${authTokens.manager}`);

//       expect(response.status).toBe(200);
//       expect(response.body.transactions.every(t => t.status === 'COMPLETED')).toBe(true);
//     });

//     it('should filter transactions by date range (admin)', async () => {
//       const today = new Date().toISOString().split('T')[0];
//       const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
//       const response = await request(app)
//         .get(`/api/transactions?startDate=${today}&endDate=${tomorrow}`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(response.status).toBe(200);
//       expect(response.body.transactions).toHaveLength(2);
//     });

//     it('should include full relations when requested (manager)', async () => {
//       const response = await request(app)
//         .get('/api/transactions?include_relations=true')
//         .set('Authorization', `Bearer ${authTokens.manager}`);

//       expect(response.status).toBe(200);
//       expect(response.body.transactions[0]).toHaveProperty('lines');
//       expect(response.body.transactions[0]).toHaveProperty('payments');
//       expect(response.body.transactions[0].lines[0]).toHaveProperty('product');
//     });
//   });

//   // ---------------------------
//   // GET /transactions/:id (All authenticated)
//   // ---------------------------
//   describe('GET /transactions/:id', () => {
//     let testTransactionId;

//     beforeEach(async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);
//       testTransactionId = response.body.id;
//     });

//     it('should get transaction by ID (manager)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/${testTransactionId}`)
//         .set('Authorization', `Bearer ${authTokens.manager}`);

//       expect(response.status).toBe(200);
//       expect(response.body.id).toBe(testTransactionId);
//       expect(response.body).toHaveProperty('branch');
//       expect(response.body).toHaveProperty('_count');
//     });

//     it('should deny access without authentication', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/${testTransactionId}`);

//       expect(response.status).toBe(401);
//     });

//     it('should get transaction with full relations (admin)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/${testTransactionId}?include_relations=true`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('lines');
//       expect(response.body).toHaveProperty('payments');
//       expect(response.body.lines[0]).toHaveProperty('product');
//     });

//     it('should return 404 for non-existent transaction (admin)', async () => {
//       const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
//       const response = await request(app)
//         .get(`/api/transactions/${fakeId}`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(response.status).toBe(404);
//       expect(response.body.message).toContain('not found');
//     });
//   });

//   // ---------------------------
//   // PUT /transactions/:id (Admin & Manager only)
//   // ---------------------------
//   describe('PUT /transactions/:id', () => {
//     let testTransactionId;

//     beforeEach(async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);
      
//       testTransactionId = response.body.id;

//       // Manually update to pending for testing
//       await prisma.transaction.update({
//         where: { id: testTransactionId },
//         data: { status: 'PENDING' }
//       });
//     });

//     it('should allow manager to update transaction status', async () => {
//       const updateData = { status: 'COMPLETED' };
      
//       const response = await request(app)
//         .put(`/api/transactions/${testTransactionId}`)
//         .set('Authorization', `Bearer ${authTokens.manager}`)
//         .send(updateData);

//       expect(response.status).toBe(200);
//       expect(response.body.status).toBe('COMPLETED');
//     });

//     it('should deny cashier from updating transaction', async () => {
//       const updateData = { status: 'COMPLETED' };
      
//       const response = await request(app)
//         .put(`/api/transactions/${testTransactionId}`)
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(updateData);

//       expect(response.status).toBe(403);
//     });

//     it('should allow admin to update transaction metadata', async () => {
//       const updateData = { metadata: { note: 'Special transaction' } };
      
//       const response = await request(app)
//         .put(`/api/transactions/${testTransactionId}`)
//         .set('Authorization', `Bearer ${authTokens.admin}`)
//         .send(updateData);

//       expect(response.status).toBe(200);
//       expect(response.body.metadata.note).toBe('Special transaction');
//     });

//     it('should prevent changing completed transaction to pending (manager)', async () => {
//       await prisma.transaction.update({
//         where: { id: testTransactionId },
//         data: { status: 'COMPLETED' }
//       });

//       const response = await request(app)
//         .put(`/api/transactions/${testTransactionId}`)
//         .set('Authorization', `Bearer ${authTokens.manager}`)
//         .send({ status: 'PENDING' });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Cannot change completed transaction');
//     });
//   });

//   // ---------------------------
//   // DELETE /transactions/:id (Admin only)
//   // ---------------------------
//   describe('DELETE /transactions/:id', () => {
//     it('should allow manager to delete pending transaction and restore stock', async () => {
//       // Route comment says Admin only for DELETE; but earlier behavior allowed Manager in branch tests.
//       // According to transactions.routes.js your DELETE route comment is "Admin only".
//       // We'll enforce Admin-only here and also include a manager-deny test.
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      
//       const createResponse = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       // Set to PENDING so deletion is permitted by role
//       await prisma.transaction.update({
//         where: { id: createResponse.body.id },
//         data: { status: 'PENDING' }
//       });

//       // Admin should be able to delete
//       const initialStock = await prisma.product.findUnique({
//         where: { id: testProductId },
//         select: { stock: true }
//       });
      
//       const responseAdmin = await request(app)
//         .delete(`/api/transactions/${createResponse.body.id}`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(responseAdmin.status).toBe(200);
//       expect(responseAdmin.body.message).toBe('Transaction deleted successfully');

//       const finalStock = await prisma.product.findUnique({
//         where: { id: testProductId },
//         select: { stock: true }
//       });

//       expect(finalStock.stock).toBe(initialStock.stock + 2);

//       const deletedTransaction = await prisma.transaction.findUnique({
//         where: { id: createResponse.body.id }
//       });
//       expect(deletedTransaction).toBeNull();
//     });

//     it('should deny manager from deleting transaction (admin-only)', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      
//       const createResponse = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       // Set to PENDING
//       await prisma.transaction.update({
//         where: { id: createResponse.body.id },
//         data: { status: 'PENDING' }
//       });
      
//       const responseManager = await request(app)
//         .delete(`/api/transactions/${createResponse.body.id}`)
//         .set('Authorization', `Bearer ${authTokens.manager}`);

//       expect(responseManager.status).toBe(403);
//     });

//     it('should prevent deletion of completed transaction (admin)', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      
//       const createResponse = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);
      
//       // default may be COMPLETED - attempt deletion as admin
//       const response = await request(app)
//         .delete(`/api/transactions/${createResponse.body.id}`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Cannot delete completed transaction');
//     });

//     it('should deny cashier from deleting transaction', async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId);
      
//       const createResponse = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       // Set to pending
//       await prisma.transaction.update({
//         where: { id: createResponse.body.id },
//         data: { status: 'PENDING' }
//       });

//       const response = await request(app)
//         .delete(`/api/transactions/${createResponse.body.id}`)
//         .set('Authorization', `Bearer ${authTokens.cashier}`);

//       expect(response.status).toBe(403);
//     });
//   });

//   // ---------------------------
//   // GET /transactions/branch/:branchId (Admin & Manager)
//   // ---------------------------
//   describe('GET /transactions/branch/:branchId', () => {
//     beforeEach(async () => {
//       const transaction1Data = createTransactionData(testBranchId, testProductId, testCashierId);
//       const transaction2Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      
//       await request(app).post('/api/transactions').set('Authorization', `Bearer ${authTokens.cashier}`).send(transaction1Data);
//       await request(app).post('/api/transactions').set('Authorization', `Bearer ${authTokens.cashier}`).send(transaction2Data);
//     });

//     it('should get transactions by branch (manager)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/branch/${testBranchId}`)
//         .set('Authorization', `Bearer ${authTokens.manager}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('transactions');
//       expect(response.body).toHaveProperty('pagination');
//       expect(response.body.transactions).toHaveLength(2);
//       expect(response.body.transactions.every(t => t.branchId === testBranchId)).toBe(true);
//     });

//     it('should deny cashier from viewing all branch transactions', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/branch/${testBranchId}`)
//         .set('Authorization', `Bearer ${authTokens.cashier}`);

//       expect(response.status).toBe(403);
//     });

//     it('should filter branch transactions by status (admin)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/branch/${testBranchId}?status=COMPLETED`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(response.status).toBe(200);
//       expect(response.body.transactions.every(t => t.status === 'COMPLETED')).toBe(true);
//     });

//     it('should deny access without authentication', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/branch/${testBranchId}`);

//       expect(response.status).toBe(401);
//     });
//   });

//   // ---------------------------
//   // GET /transactions/customer/:customerId (All authenticated but we enforce role where needed)
//   // ---------------------------
//   describe('GET /transactions/customer/:customerId', () => {
//     beforeEach(async () => {
//       const transaction1Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
//       const transaction2Data = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
      
//       await request(app).post('/api/transactions').set('Authorization', `Bearer ${authTokens.cashier}`).send(transaction1Data);
//       await request(app).post('/api/transactions').set('Authorization', `Bearer ${authTokens.cashier}`).send(transaction2Data);
//     });

//     it('should get transactions by customer (manager)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/customer/${testCustomerId}`)
//         .set('Authorization', `Bearer ${authTokens.manager}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('transactions');
//       expect(response.body).toHaveProperty('pagination');
//       expect(response.body.transactions).toHaveLength(2);
//       expect(response.body.transactions.every(t => t.customerId === testCustomerId)).toBe(true);
//     });

//     it('should deny cashier from viewing customer transactions (if role restricted)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/customer/${testCustomerId}`)
//         .set('Authorization', `Bearer ${authTokens.cashier}`);

//       // route comment said "All authenticated" but in many systems customer-level queries may be restricted.
//       // We assert manager allowed and cashier denied based on your previous branch tests pattern.
//       expect(response.status).toBe(403);
//     });

//     it('should deny access without auth', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/customer/${testCustomerId}`);

//       expect(response.status).toBe(401);
//     });
//   });

//   // ---------------------------
//   // GET /transactions/:id/receipt (All authenticated)
//   // ---------------------------
//   describe('GET /transactions/:id/receipt', () => {
//     let testTransactionId;

//     beforeEach(async () => {
//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);
//       testTransactionId = response.body.id;
//     });

//     it('should get formatted receipt data (cashier)', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/${testTransactionId}/receipt`)
//         .set('Authorization', `Bearer ${authTokens.cashier}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('receiptNumber');
//       expect(response.body).toHaveProperty('branch');
//       expect(response.body).toHaveProperty('lines');
//       expect(response.body).toHaveProperty('payments');
//       expect(response.body.lines[0]).toHaveProperty('product');
//     });

//     it('should deny access without authentication', async () => {
//       const response = await request(app)
//         .get(`/api/transactions/${testTransactionId}/receipt`);

//       expect(response.status).toBe(401);
//     });

//     it('should return 404 for non-existent transaction (admin)', async () => {
//       const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
//       const response = await request(app)
//         .get(`/api/transactions/${fakeId}/receipt`)
//         .set('Authorization', `Bearer ${authTokens.admin}`);

//       expect(response.status).toBe(404);
//       expect(response.body.message).toContain('not found');
//     });
//   });

//   // ---------------------------
//   // Complex scenarios (multi-products, loyalty) - require cashier auth to create
//   // ---------------------------
//   describe('Complex scenarios', () => {
//     it('should handle multiple products in one transaction (cashier)', async () => {
//       const product2 = await prisma.product.create({
//         data: createUniqueProduct(testBranchId, { stock: 30 })
//       });

//       const transactionData = {
//         branchId: testBranchId,
//         cashierId: testCashierId,
//         lines: [
//           {
//             productId: testProductId,
//             unitPrice: 10.99,
//             qty: 2,
//             discount: 1.00,
//             taxAmount: 1.50
//           },
//           {
//             productId: product2.id,
//             unitPrice: 15.50,
//             qty: 1,
//             discount: 0,
//             taxAmount: 2.00
//           }
//         ],
//         payments: [
//           { method: 'CASH', amount: 20.00 },
//           { method: 'CARD', amount: 16.98 }
//         ]
//       };
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       const expectedTaxComplex = transactionData.lines.reduce((s, l) => s + (l.taxAmount || 0), 0);
//       const expectedLinesTotalComplex = transactionData.lines.reduce((s, l) => s + (l.unitPrice * l.qty - (l.discount || 0)), 0);
//       const expectedGrossComplex = expectedLinesTotalComplex + expectedTaxComplex;

//       expect(response.status).toBe(201);
//       expect(response.body.lines).toHaveLength(2);
//       expect(response.body.payments).toHaveLength(2);
//       expect(parseFloat(response.body.totalGross)).toBeCloseTo(expectedGrossComplex, 2);
//     });

//     it('should handle transaction with loyalty customer (cashier)', async () => {
//       await prisma.customer.update({
//         where: { id: testCustomerId },
//         data: { 
//           loyaltyPoints: 50,
//           loyaltyNumber: 'LOYALTY123'
//         }
//       });

//       const transactionData = createTransactionData(testBranchId, testProductId, testCashierId, testCustomerId);
//       transactionData.loyaltyPointsEarned = 15;
//       transactionData.loyaltyPointsUsed = 10;
      
//       const response = await request(app)
//         .post('/api/transactions')
//         .set('Authorization', `Bearer ${authTokens.cashier}`)
//         .send(transactionData);

//       expect(response.status).toBe(201);

//       const updatedCustomer = await prisma.customer.findUnique({
//         where: { id: testCustomerId }
//       });
//       expect(updatedCustomer.loyaltyPoints).toBe(55); // 50 + 15 - 10

//       const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
//         where: { customerId: testCustomerId }
//       });
//       expect(loyaltyTransactions).toHaveLength(2);
//     });
//   });
// });
// tests/transactions.test.js
// tests/transactions.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { setupTestAuth, cleanupTestAuth, authenticatedRequest } from './helpers/auth.helper.js';

const prisma = new PrismaClient();

const createUniqueBranch = (overrides = {}) => ({
  name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  address: '123 Test Street',
  phone: '+1234567890',
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

const createTransactionData = (branchId, productId, customerId = null) => ({
  branchId,
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

// ====================== AUTH SETUP ======================

let auth;
let adminToken, managerToken, cashierToken, stockToken;

let testBranchId, testProductId, testCustomerId;

beforeAll(async () => {
  auth = await setupTestAuth(app);
  adminToken = auth.tokens.admin;
  managerToken = auth.tokens.manager;
  cashierToken = auth.tokens.cashier;
  stockToken = auth.tokens.stockManager;
});

beforeEach(async () => {
  // Clean database in correct order
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

  // Keep auth users - delete only non-auth users
  const authUserIds = Object.values(auth.users).map(u => u.id);
  await prisma.user.deleteMany({
    where: {
      id: { notIn: authUserIds }
    }
  });

  // Create test data
  const branch = await prisma.branch.create({ data: createUniqueBranch() });
  testBranchId = branch.id;

  const product = await prisma.product.create({ 
    data: createUniqueProduct(testBranchId, { stock: 50 }) 
  });
  testProductId = product.id;

  const customer = await prisma.customer.create({ data: createUniqueCustomer() });
  testCustomerId = customer.id;
});

afterAll(async () => {
  await cleanupTestAuth(Object.values(auth.users).map(u => u.id));
  await prisma.$disconnect();
});

// ====================== ROUTE TESTS ======================

describe("POST /transactions", () => {
  it("cashier can create transaction", async () => {
    const data = createTransactionData(testBranchId, testProductId, testCustomerId);

    const res = await authenticatedRequest(app, "post", "/api/transactions", cashierToken).send(data);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('receiptNumber');
  });

  it("manager/admin can create", async () => {
    const data1 = createTransactionData(testBranchId, testProductId);
    const data2 = createTransactionData(testBranchId, testProductId);

    const res1 = await authenticatedRequest(app, "post", "/api/transactions", managerToken).send(data1);
    expect(res1.status).toBe(201);

    const res2 = await authenticatedRequest(app, "post", "/api/transactions", adminToken).send(data2);
    expect(res2.status).toBe(201);
  });

  it("stock manager CANNOT create", async () => {
    const data = createTransactionData(testBranchId, testProductId);
    const res = await authenticatedRequest(app, "post", "/api/transactions", stockToken).send(data);
    expect(res.status).toBe(403);
  });
});


// describe("GET /transactions (admin/manager only)", () => {
//   beforeEach(async () => {
//     await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId));
//   });

//   it("admin can get all", async () => {
//     const res = await authenticatedRequest(app, "get", "/api/transactions", adminToken);
//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty("transactions");
//   });

//   it("manager can get all", async () => {
//     const res = await authenticatedRequest(app, "get", "/api/transactions", managerToken);
//     expect(res.status).toBe(200);
//   });

//   it("cashier cannot get all", async () => {
//     const res = await authenticatedRequest(app, "get", "/api/transactions", cashierToken);
//     expect(res.status).toBe(403);
//   });
// });

// describe("GET /transactions/branch/:id", () => {
//   it("admin/manager can view branch", async () => {
//     await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId));

//     const res = await authenticatedRequest(app, "get", `/api/transactions/branch/${testBranchId}`, managerToken);
//     expect(res.status).toBe(200);
//   });

//   it("cashier forbidden", async () => {
//     const res = await authenticatedRequest(app, "get", `/api/transactions/branch/${testBranchId}`, cashierToken);
//     expect(res.status).toBe(403);
//   });
// });

// describe("GET /transactions/customer/:id", () => {
//   it("ANY authenticated user can access customer history", async () => {
//     await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId, testCustomerId));

//     const res = await authenticatedRequest(app, "get", `/api/transactions/customer/${testCustomerId}`, cashierToken);
//     expect(res.status).toBe(200);
//   });
// });

// describe("GET /transactions/:id", () => {
//   let id;

//   beforeEach(async () => {
//     const created = await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId, testCustomerId));
    
//     // Verify transaction was created
//     expect(created.status).toBe(201);
//     expect(created.body).toHaveProperty('id');
    
//     id = created.body.id;
//   });

//   it("any auth can fetch by id", async () => {
//     const res = await authenticatedRequest(app, "get", `/api/transactions/${id}`, cashierToken);
//     expect(res.status).toBe(200);
//     expect(res.body.id).toBe(id);
//   });
// });

// describe("PUT /transactions/:id", () => {
//   let id;

//   beforeEach(async () => {
//     const created = await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId));
    
//     // Verify transaction was created
//     expect(created.status).toBe(201);
//     expect(created.body).toHaveProperty('id');
    
//     id = created.body.id;

//     // Update to PENDING status
//     await prisma.transaction.update({ 
//       where: { id }, 
//       data: { status: "PENDING" } 
//     });
//   });

//   it("manager/admin can update", async () => {
//     const res = await authenticatedRequest(app, "put", `/api/transactions/${id}`, managerToken)
//       .send({ status: "COMPLETED" });
//     expect(res.status).toBe(200);
//   });

//   it("cashier cannot update", async () => {
//     const res = await authenticatedRequest(app, "put", `/api/transactions/${id}`, cashierToken)
//       .send({ status: "COMPLETED" });
//     expect(res.status).toBe(403);
//   });
// });

// describe("DELETE /transactions/:id", () => {
//   it("admin can delete pending only", async () => {
//     const created = await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId));

//     // Verify creation
//     expect(created.status).toBe(201);
//     expect(created.body).toHaveProperty('id');

//     // Update to PENDING
//     await prisma.transaction.update({ 
//       where: { id: created.body.id }, 
//       data: { status: "PENDING" } 
//     });

//     const res = await authenticatedRequest(app, "delete", `/api/transactions/${created.body.id}`, adminToken);
//     expect(res.status).toBe(200);
//   });

//   it("manager cannot delete", async () => {
//     const created = await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId));

//     // Verify creation
//     expect(created.status).toBe(201);

//     const res = await authenticatedRequest(app, "delete", `/api/transactions/${created.body.id}`, managerToken);
//     expect(res.status).toBe(403);
//   });
// });

// describe("GET /transactions/:id/receipt", () => {
//   it("any authenticated user can get receipt", async () => {
//     const created = await authenticatedRequest(app, "post", "/api/transactions", cashierToken)
//       .send(createTransactionData(testBranchId, testProductId));

//     // Verify creation
//     expect(created.status).toBe(201);
//     expect(created.body).toHaveProperty('id');

//     const res = await authenticatedRequest(app, "get", `/api/transactions/${created.body.id}/receipt`, cashierToken);
//     expect(res.status).toBe(200);
//   });
// });