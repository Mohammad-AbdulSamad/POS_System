// // tests/payments.test.js
// import request from 'supertest';
// import { PrismaClient } from '@prisma/client';
// import app from '../server.js';

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

// const createUniqueProduct = (branchId, overrides = {}) => ({
//   branchId,
//   sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
//   name: `Test Product ${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
//   description: 'Test product description',
//   priceGross: 10.99,
//   cost: 5.50,
//   unit: 'pcs',
//   stock: 100,
//   active: true,
//   ...overrides
// });

// describe('Payments API - Production Ready', () => {
//   let testBranchId;
//   let testUserId;
//   let testProductId;
//   let testTransactionId;
//   let testTransaction2Id;

//   beforeEach(async () => {
//     // Clean database
//     await prisma.loyaltyTransaction.deleteMany();
//     await prisma.return.deleteMany();
//     await prisma.payment.deleteMany();
//     await prisma.transactionLine.deleteMany();
//     await prisma.transaction.deleteMany();
//     await prisma.stockMovement.deleteMany();
//     await prisma.product.deleteMany();
//     await prisma.category.deleteMany();
//     await prisma.customer.deleteMany();
//     await prisma.user.deleteMany();
//     await prisma.supplier.deleteMany();
//     await prisma.taxRate.deleteMany();
//     await prisma.promotion.deleteMany();
//     await prisma.branch.deleteMany();

//     // Create test data
//     const branch = await prisma.branch.create({
//       data: createUniqueBranch()
//     });
//     testBranchId = branch.id;

//     const user = await prisma.user.create({
//       data: createUniqueUser(testBranchId)
//     });
//     testUserId = user.id;

//     const product = await prisma.product.create({
//       data: createUniqueProduct(testBranchId)
//     });
//     testProductId = product.id;

//     // Create test transactions (pending status for payment testing)
//     const transaction1 = await prisma.transaction.create({
//       data: {
//         branchId: testBranchId,
//         cashierId: testUserId,
//         receiptNumber: `REC-${Date.now()}-1`,
//         totalGross: 100.00,
//         totalTax: 10.00,
//         totalNet: 90.00,
//         status: 'PENDING'
//       }
//     });
//     testTransactionId = transaction1.id;

//     const transaction2 = await prisma.transaction.create({
//       data: {
//         branchId: testBranchId,
//         cashierId: testUserId,
//         receiptNumber: `REC-${Date.now()}-2`,
//         totalGross: 75.50,
//         totalTax: 7.55,
//         totalNet: 67.95,
//         status: 'PENDING'
//       }
//     });
//     testTransaction2Id = transaction2.id;
//   });

//   describe('POST /payments', () => {
//     it('should create a single payment', async () => {
//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'CASH',
//         amount: 100.00
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(201);
//       expect(response.body).toHaveProperty('id');
//       expect(response.body.method).toBe('CASH');
//       expect(parseFloat(response.body.amount)).toBe(100.00);
//       expect(response.body.transactionId).toBe(testTransactionId);
//       expect(response.body).toHaveProperty('transaction');
//     });

//     it('should handle partial payment', async () => {
//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'CASH',
//         amount: 50.00
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(201);
//       expect(parseFloat(response.body.amount)).toBe(50.00);
      
//       // Transaction should still be pending
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('PENDING');
//     });

//     it('should complete transaction when fully paid', async () => {
//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'CARD',
//         amount: 100.00
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(201);
      
//       // Transaction should be completed
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should validate required fields', async () => {
//       const response = await request(app)
//         .post('/api/payments')
//         .send({ method: 'CASH' });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Required fields');
//     });

//     it('should validate payment method', async () => {
//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'INVALID',
//         amount: 50.00
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Payment method must be');
//     });

//     it('should validate positive amount', async () => {
//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'CASH',
//         amount: -10.00
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('must be greater than 0');
//     });

//     it('should validate zero amount', async () => {
//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'CASH',
//         amount: 0
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('must be greater than 0');
//     });

//     it('should prevent overpayment', async () => {
//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'CASH',
//         amount: 150.00 // More than transaction total
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('exceeds remaining balance');
//     });

//     it('should prevent payment to completed transaction', async () => {
//       // Complete the transaction first
//       await prisma.transaction.update({
//         where: { id: testTransactionId },
//         data: { status: 'COMPLETED' }
//       });

//       const paymentData = {
//         transactionId: testTransactionId,
//         method: 'CASH',
//         amount: 50.00
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Cannot add payments to completed');
//     });

//     it('should validate transaction exists', async () => {
//       const paymentData = {
//         transactionId: '550e8400-e29b-41d4-a716-446655440000',
//         method: 'CASH',
//         amount: 50.00
//       };
      
//       const response = await request(app)
//         .post('/api/payments')
//         .send(paymentData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Transaction not found');
//     });

//     it('should handle payments that exactly complete transaction', async () => {
//       // Add partial payment first
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 60.00
//         });

//       // Add remaining payment
//       const response = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 40.00
//         });

//       expect(response.status).toBe(201);
      
//       // Transaction should be completed
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should prevent overpayment when partial payments exist', async () => {
//       // Add partial payment
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 60.00
//         });

//       // Try to overpay
//       const response = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 50.00 // Would total 110, exceeding 100
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('exceeds remaining balance');
//     });
//   });

//   describe('Mixed Payment Scenarios', () => {
//     it('should handle cash + card payment', async () => {
//       // Pay $60 cash
//       const cashPayment = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 60.00
//         });

//       expect(cashPayment.status).toBe(201);

//       // Pay remaining $40 by card
//       const cardPayment = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 40.00
//         });

//       expect(cardPayment.status).toBe(201);

//       // Transaction should be completed
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');

//       // Verify all payments exist
//       const payments = await prisma.payment.findMany({
//         where: { transactionId: testTransactionId }
//       });
//       expect(payments).toHaveLength(2);
//       expect(payments.find(p => p.method === 'CASH').amount.toString()).toBe('60.00');
//       expect(payments.find(p => p.method === 'CARD').amount.toString()).toBe('40.00');
//     });

//     it('should handle three-way split payment', async () => {
//       // Pay $30 cash
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 30.00
//         });

//       // Pay $40 card
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 40.00
//         });

//       // Pay remaining $30 mobile
//       const mobilePayment = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'MOBILE',
//           amount: 30.00
//         });

//       expect(mobilePayment.status).toBe(201);

//       // Verify all payments exist
//       const allPayments = await prisma.payment.findMany({
//         where: { transactionId: testTransactionId }
//       });

//       expect(allPayments).toHaveLength(3);
//       expect(allPayments.map(p => p.method)).toEqual(
//         expect.arrayContaining(['CASH', 'CARD', 'MOBILE'])
//       );

//       // Transaction should be completed
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should handle uneven split payments', async () => {
//       // Customer pays $12.50 cash, $87.50 card for $100 total
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 12.50
//         });

//       const cardResponse = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 87.50
//         });

//       expect(cardResponse.status).toBe(201);

//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should handle multiple payments of same method', async () => {
//       // Customer pays with two different cards
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 35.00
//         });

//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 25.00
//         });

//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 40.00
//         });

//       const payments = await prisma.payment.findMany({
//         where: { transactionId: testTransactionId }
//       });
      
//       expect(payments).toHaveLength(3);
//       const cardPayments = payments.filter(p => p.method === 'CARD');
//       expect(cardPayments).toHaveLength(2);
//     });
//   });

//   describe('POST /payments/multiple', () => {
//     it('should process multiple payments at once', async () => {
//       const paymentsData = {
//         transactionId: testTransactionId,
//         payments: [
//           { method: 'CASH', amount: 50.00 },
//           { method: 'CARD', amount: 30.00 },
//           { method: 'MOBILE', amount: 20.00 }
//         ]
//       };
      
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send(paymentsData);

//       expect(response.status).toBe(201);
//       expect(response.body.payments).toHaveLength(3);
//       expect(response.body.summary.totalProcessed).toBe(100);
//       expect(response.body.summary.transactionStatus).toBe('COMPLETED');

//       // Verify payments created
//       const createdPayments = await prisma.payment.findMany({
//         where: { transactionId: testTransactionId }
//       });
//       expect(createdPayments).toHaveLength(3);
//     });

//     it('should handle partial multiple payments', async () => {
//       const paymentsData = {
//         transactionId: testTransactionId,
//         payments: [
//           { method: 'CASH', amount: 30.00 },
//           { method: 'CARD', amount: 20.00 }
//         ]
//       };
      
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send(paymentsData);

//       expect(response.status).toBe(201);
//       expect(response.body.summary.totalProcessed).toBe(50);
//       expect(response.body.summary.transactionStatus).toBe('PENDING');

//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('PENDING');
//     });

//     it('should validate total doesn\'t exceed transaction amount', async () => {
//       const paymentsData = {
//         transactionId: testTransactionId,
//         payments: [
//           { method: 'CASH', amount: 70.00 },
//           { method: 'CARD', amount: 50.00 } // Total 120, exceeds 100
//         ]
//       };
      
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send(paymentsData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('exceed transaction amount');
//     });

//     it('should validate each payment in the array', async () => {
//       const paymentsData = {
//         transactionId: testTransactionId,
//         payments: [
//           { method: 'CASH', amount: 50.00 },
//           { method: 'INVALID', amount: 30.00 } // Invalid method
//         ]
//       };
      
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send(paymentsData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('CASH, CARD, or MOBILE');
//     });

//     it('should validate required fields for multiple payments', async () => {
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send({
//           transactionId: testTransactionId
//           // Missing payments array
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Required fields');
//     });

//     it('should validate empty payments array', async () => {
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send({
//           transactionId: testTransactionId,
//           payments: []
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Required fields');
//     });

//     it('should validate each payment has required fields', async () => {
//       const paymentsData = {
//         transactionId: testTransactionId,
//         payments: [
//           { method: 'CASH', amount: 50.00 },
//           { method: 'CARD' } // Missing amount
//         ]
//       };
      
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send(paymentsData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('must have method and amount');
//     });

//     it('should validate positive amounts in multiple payments', async () => {
//       const paymentsData = {
//         transactionId: testTransactionId,
//         payments: [
//           { method: 'CASH', amount: 50.00 },
//           { method: 'CARD', amount: -20.00 } // Negative amount
//         ]
//       };
      
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send(paymentsData);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('must be greater than 0');
//     });

//     it('should handle existing payments plus multiple new payments', async () => {
//       // Add existing payment
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 25.00
//         });

//       // Add multiple payments for remaining amount
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send({
//           transactionId: testTransactionId,
//           payments: [
//             { method: 'CARD', amount: 40.00 },
//             { method: 'MOBILE', amount: 35.00 }
//           ]
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.summary.totalProcessed).toBe(75);
//       expect(response.body.summary.transactionStatus).toBe('COMPLETED');
//     });

//     it('should prevent multiple payments that exceed remaining balance', async () => {
//       // Add existing payment
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 60.00
//         });

//       // Try to add payments that exceed remaining $40
//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send({
//           transactionId: testTransactionId,
//           payments: [
//             { method: 'CARD', amount: 30.00 },
//             { method: 'MOBILE', amount: 20.00 } // Total would be 110
//           ]
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('exceed transaction amount');
//     });
//   });

//   describe('GET /payments', () => {
//     beforeEach(async () => {
//       // Create test payments across different transactions
//       await prisma.payment.createMany({
//         data: [
//           {
//             transactionId: testTransactionId,
//             method: 'CASH',
//             amount: 50.00
//           },
//           {
//             transactionId: testTransactionId,
//             method: 'CARD',
//             amount: 30.00
//           },
//           {
//             transactionId: testTransaction2Id,
//             method: 'MOBILE',
//             amount: 75.50
//           }
//         ]
//       });
//     });

//     it('should get all payments with pagination', async () => {
//       const response = await request(app)
//         .get('/api/payments');

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('payments');
//       expect(response.body).toHaveProperty('pagination');
//       expect(response.body.payments).toHaveLength(3);
//       expect(response.body.pagination.total).toBe(3);
//     });

//     it('should filter payments by method', async () => {
//       const response = await request(app)
//         .get('/api/payments?method=CASH');

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(1);
//       expect(response.body.payments[0].method).toBe('CASH');
//     });

//     it('should filter payments by amount range', async () => {
//       const response = await request(app)
//         .get('/api/payments?minAmount=30&maxAmount=60');

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(2); // 50.00 and 30.00
//       expect(response.body.payments.every(p => {
//         const amount = parseFloat(p.amount);
//         return amount >= 30 && amount <= 60;
//       })).toBe(true);
//     });

//     it('should filter payments by transaction', async () => {
//       const response = await request(app)
//         .get(`/api/payments?transactionId=${testTransactionId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(2);
//       expect(response.body.payments.every(p => p.transactionId === testTransactionId)).toBe(true);
//     });

//     it('should filter payments by branch', async () => {
//       const response = await request(app)
//         .get(`/api/payments?branchId=${testBranchId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(3);
//     });

//     it('should include relations when requested', async () => {
//       const response = await request(app)
//         .get('/api/payments?include_relations=true');

//       expect(response.status).toBe(200);
//       expect(response.body.payments[0]).toHaveProperty('transaction');
//       expect(response.body.payments[0].transaction).toHaveProperty('branch');
//       expect(response.body.payments[0].transaction).toHaveProperty('cashier');
//     });

//     it('should handle pagination correctly', async () => {
//       const response = await request(app)
//         .get('/api/payments?page=1&limit=2');

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(2);
//       expect(response.body.pagination).toMatchObject({
//         page: 1,
//         limit: 2,
//         total: 3,
//         pages: 2
//       });
//     });

//     it('should filter by date range', async () => {
//       const today = new Date().toISOString().split('T')[0];
//       const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
//       const response = await request(app)
//         .get(`/api/payments?startDate=${today}&endDate=${tomorrow}`);

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(3);
//     });

//     it('should combine multiple filters', async () => {
//       const response = await request(app)
//         .get(`/api/payments?method=CASH&minAmount=40&transactionId=${testTransactionId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(1);
//       expect(response.body.payments[0].method).toBe('CASH');
//       expect(parseFloat(response.body.payments[0].amount)).toBeGreaterThanOrEqual(40);
//     });
//   });

//   describe('GET /payments/:id', () => {
//     let testPaymentId;

//     beforeEach(async () => {
//       const payment = await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 75.00
//         }
//       });
//       testPaymentId = payment.id;
//     });

//     it('should get payment by ID', async () => {
//       const response = await request(app)
//         .get(`/api/payments/${testPaymentId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.id).toBe(testPaymentId);
//       expect(response.body.method).toBe('CASH');
//       expect(response.body.amount).toBe('75.00');
//       expect(response.body).toHaveProperty('transaction');
//     });

//     it('should get payment with full transaction details', async () => {
//       const response = await request(app)
//         .get(`/api/payments/${testPaymentId}?include_relations=true`);

//       expect(response.status).toBe(200);
//       expect(response.body.transaction).toHaveProperty('branch');
//       expect(response.body.transaction).toHaveProperty('lines');
//       expect(response.body.transaction).toHaveProperty('payments');
//       expect(response.body.transaction).toHaveProperty('cashier');
//     });

//     it('should return 404 for non-existent payment', async () => {
//       const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
//       const response = await request(app)
//         .get(`/api/payments/${fakeId}`);

//       expect(response.status).toBe(404);
//       expect(response.body.message).toContain('not found');
//     });
//   });

//   describe('PUT /payments/:id', () => {
//     let testPaymentId;

//     beforeEach(async () => {
//       const payment = await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 50.00
//         }
//       });
//       testPaymentId = payment.id;
//     });

//     it('should update payment amount', async () => {
//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: 60.00 });

//       expect(response.status).toBe(200);
//       expect(response.body.amount).toBe('60.00');
//     });

//     it('should prevent updating to negative amount', async () => {
//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: -10.00 });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('must be greater than 0');
//     });

//     it('should prevent updating to zero amount', async () => {
//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: 0 });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('must be greater than 0');
//     });

//     it('should prevent updating to amount that exceeds transaction total', async () => {
//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: 150.00 });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('exceeds transaction total');
//     });

//     it('should handle updates when other payments exist', async () => {
//       // Add another payment
//       await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 30.00
//         }
//       });

//       // Try to update first payment to amount that would exceed total
//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: 80.00 }); // Would total 110 with other payment

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('exceeds transaction total');
//     });

//     it('should allow valid update when other payments exist', async () => {
//       // Add another payment
//       await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 30.00
//         }
//       });

//       // Update to valid amount
//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: 70.00 }); // Total will be 100

//       expect(response.status).toBe(200);
//       expect(response.body.amount).toBe('70.00');
//     });

//     it('should prevent updating payments for completed transactions', async () => {
//       await prisma.transaction.update({
//         where: { id: testTransactionId },
//         data: { status: 'COMPLETED' }
//       });

//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: 60.00 });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Cannot update payments for completed');
//     });

//     it('should return 404 for non-existent payment', async () => {
//       const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
//       const response = await request(app)
//         .put(`/api/payments/${fakeId}`)
//         .send({ amount: 60.00 });

//       expect(response.status).toBe(404);
//       expect(response.body.message).toContain('not found');
//     });

//     it('should handle no-change updates', async () => {
//       const response = await request(app)
//         .put(`/api/payments/${testPaymentId}`)
//         .send({ amount: 50.00 }); // Same as current amount

//       expect(response.status).toBe(200);
//       expect(response.body.amount).toBe('50.00');
//     });
//   });

//   describe('DELETE /payments/:id', () => {
//     let testPaymentId;

//     beforeEach(async () => {
//       const payment = await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 50.00
//         }
//       });
//       testPaymentId = payment.id;
//     });

//     it('should delete payment from pending transaction', async () => {
//       const response = await request(app)
//         .delete(`/api/payments/${testPaymentId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Payment deleted successfully');

//       // Verify deletion
//       const deletedPayment = await prisma.payment.findUnique({
//         where: { id: testPaymentId }
//       });
//       expect(deletedPayment).toBeNull();
//     });

//     it('should prevent deleting payments from completed transactions', async () => {
//       await prisma.transaction.update({
//         where: { id: testTransactionId },
//         data: { status: 'COMPLETED' }
//       });

//       const response = await request(app)
//         .delete(`/api/payments/${testPaymentId}`);

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('Cannot delete payments from completed');
//     });

//     it('should return 404 for non-existent payment', async () => {
//       const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
//       const response = await request(app)
//         .delete(`/api/payments/${fakeId}`);

//       expect(response.status).toBe(404);
//       expect(response.body.message).toContain('not found');
//     });

//     it('should allow deleting one payment when multiple exist', async () => {
//       // Add another payment
//       const payment2 = await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 30.00
//         }
//       });

//       const response = await request(app)
//         .delete(`/api/payments/${testPaymentId}`);

//       expect(response.status).toBe(200);

//       // Verify only one payment remains
//       const remainingPayments = await prisma.payment.findMany({
//         where: { transactionId: testTransactionId }
//       });
//       expect(remainingPayments).toHaveLength(1);
//       expect(remainingPayments[0].id).toBe(payment2.id);
//     });
//   });

//   describe('GET /payments/transaction/:transactionId', () => {
//     beforeEach(async () => {
//       await prisma.payment.createMany({
//         data: [
//           {
//             transactionId: testTransactionId,
//             method: 'CASH',
//             amount: 60.00
//           },
//           {
//             transactionId: testTransactionId,
//             method: 'CARD',
//             amount: 40.00
//           }
//         ]
//       });
//     });

//     it('should get payments for a transaction with summary', async () => {
//       const response = await request(app)
//         .get(`/api/payments/transaction/${testTransactionId}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('payments');
//       expect(response.body).toHaveProperty('summary');
//       expect(response.body.payments).toHaveLength(2);
//       expect(response.body.summary.totalPaid).toBe(100);
//       expect(response.body.summary.paymentCount).toBe(2);
//       expect(response.body.summary.methods).toEqual(expect.arrayContaining(['CASH', 'CARD']));
//       expect(response.body.summary.methodBreakdown).toHaveProperty('CASH');
//       expect(response.body.summary.methodBreakdown).toHaveProperty('CARD');
//       expect(response.body.summary.methodBreakdown.CASH.total).toBe(60);
//       expect(response.body.summary.methodBreakdown.CARD.total).toBe(40);
//     });

//     it('should return empty for transaction with no payments', async () => {
//       const response = await request(app)
//         .get(`/api/payments/transaction/${testTransaction2Id}`);

//       expect(response.status).toBe(200);
//       expect(response.body.payments).toHaveLength(0);
//       expect(response.body.summary.totalPaid).toBe(0);
//       expect(response.body.summary.paymentCount).toBe(0);
//     });

//     it('should handle single payment method breakdown', async () => {
//       // Create transaction with only cash payments
//       const transaction3 = await prisma.transaction.create({
//         data: {
//           branchId: testBranchId,
//           receiptNumber: `REC-${Date.now()}-3`,
//           totalGross: 50.00,
//           totalTax: 5.00,
//           totalNet: 45.00,
//           status: 'PENDING'
//         }
//       });

//       await prisma.payment.create({
//         data: {
//           transactionId: transaction3.id,
//           method: 'CASH',
//           amount: 50.00
//         }
//       });

//       const response = await request(app)
//         .get(`/api/payments/transaction/${transaction3.id}`);

//       expect(response.status).toBe(200);
//       expect(response.body.summary.methods).toEqual(['CASH']);
//       expect(response.body.summary.methodBreakdown.CASH.count).toBe(1);
//       expect(response.body.summary.methodBreakdown.CASH.total).toBe(50);
//     });

//     it('should handle multiple payments of same method', async () => {
//       // Add another cash payment
//       await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 25.00
//         }
//       });

//       const response = await request(app)
//         .get(`/api/payments/transaction/${testTransactionId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.summary.totalPaid).toBe(125); // 60 + 40 + 25
//       expect(response.body.summary.methodBreakdown.CASH.count).toBe(2);
//       expect(response.body.summary.methodBreakdown.CASH.total).toBe(85); // 60 + 25
//     });
//   });

//   describe('GET /payments/analytics/overview', () => {
//     beforeEach(async () => {
//       // Create multiple transactions with payments
//       const transaction3 = await prisma.transaction.create({
//         data: {
//           branchId: testBranchId,
//           receiptNumber: `REC-${Date.now()}-3`,
//           totalGross: 50.00,
//           totalTax: 5.00,
//           totalNet: 45.00,
//           status: 'COMPLETED'
//         }
//       });

//       await prisma.payment.createMany({
//         data: [
//           { transactionId: testTransactionId, method: 'CASH', amount: 100.00 },
//           { transactionId: testTransaction2Id, method: 'CARD', amount: 50.00 },
//           { transactionId: testTransaction2Id, method: 'MOBILE', amount: 25.50 },
//           { transactionId: transaction3.id, method: 'CASH', amount: 30.00 },
//           { transactionId: transaction3.id, method: 'CARD', amount: 20.00 }
//         ]
//       });
//     });

//     it('should return payment analytics', async () => {
//       const response = await request(app)
//         .get('/api/payments/analytics/overview');

//       expect(response.status).toBe(200);
//       expect(response.body).toHaveProperty('period');
//       expect(response.body).toHaveProperty('overview');
//       expect(response.body).toHaveProperty('methodBreakdown');
//       expect(response.body).toHaveProperty('dailyVolume');
      
//       expect(response.body.overview.totalAmount).toBe(225.5);
//       expect(response.body.overview.totalCount).toBe(5);
//       expect(response.body.methodBreakdown).toHaveLength(3);
      
//       // Check method breakdown
//       const cashBreakdown = response.body.methodBreakdown.find(m => m.method === 'CASH');
//       expect(cashBreakdown.amount).toBe(130); // 100 + 30
//       expect(cashBreakdown.count).toBe(2);
//     });

//     it('should filter analytics by branch', async () => {
//       const response = await request(app)
//         .get(`/api/payments/analytics/overview?branchId=${testBranchId}`);

//       expect(response.status).toBe(200);
//       expect(response.body.overview.totalAmount).toBe(225.5);
//     });

//     it('should handle date range filtering', async () => {
//       const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
//       const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
//       const response = await request(app)
//         .get(`/api/payments/analytics/overview?startDate=${yesterday}&endDate=${tomorrow}`);

//       expect(response.status).toBe(200);
//       expect(response.body.overview.totalAmount).toBe(225.5);
//     });

//     it('should calculate percentages correctly', async () => {
//       const response = await request(app)
//         .get('/api/payments/analytics/overview');

//       expect(response.status).toBe(200);
      
//       const cashBreakdown = response.body.methodBreakdown.find(m => m.method === 'CASH');
//       const expectedPercentage = ((130 / 225.5) * 100).toFixed(2);
//       expect(cashBreakdown.percentage).toBe(expectedPercentage);
//     });

//     it('should handle empty analytics', async () => {
//       // Delete all payments
//       await prisma.payment.deleteMany();

//       const response = await request(app)
//         .get('/api/payments/analytics/overview');

//       expect(response.status).toBe(200);
//       expect(response.body.overview.totalAmount).toBe(0);
//       expect(response.body.overview.totalCount).toBe(0);
//       expect(response.body.methodBreakdown).toHaveLength(0);
//     });
//   });

//   describe('Edge Cases and Business Rules', () => {
//     it('should handle exact payment with small decimal precision', async () => {
//       // Update transaction to have decimal total
//       await prisma.transaction.update({
//         where: { id: testTransactionId },
//         data: { totalGross: 99.99 }
//       });

//       const response = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 99.99
//         });

//       expect(response.status).toBe(201);
      
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should handle overpayment within tolerance', async () => {
//       // Payment that's 1 cent over should be rejected
//       const response = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 100.02
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('exceeds remaining balance');
//     });

//     it('should handle payment exactly at tolerance limit', async () => {
//       // Payment that's exactly 1 cent over should be accepted due to tolerance
//       const response = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 100.01
//         });

//       expect(response.status).toBe(201);
      
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should handle complex mixed payment scenario', async () => {
//       // Customer wants to pay $100 transaction with:
//       // - $20 cash
//       // - $35 card  
//       // - $45 mobile
//       const payments = [
//         { method: 'CASH', amount: 20.00 },
//         { method: 'CARD', amount: 35.00 },
//         { method: 'MOBILE', amount: 45.00 }
//       ];

//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send({
//           transactionId: testTransactionId,
//           payments
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.summary.transactionStatus).toBe('COMPLETED');

//       // Verify payment breakdown
//       const transactionPayments = await request(app)
//         .get(`/api/payments/transaction/${testTransactionId}`);

//       const breakdown = transactionPayments.body.summary.methodBreakdown;
//       expect(breakdown.CASH.total).toBe(20);
//       expect(breakdown.CARD.total).toBe(35);
//       expect(breakdown.MOBILE.total).toBe(45);
//     });

//     it('should handle fractional amounts correctly', async () => {
//       await prisma.transaction.update({
//         where: { id: testTransactionId },
//         data: { totalGross: 33.33 }
//       });

//       const payments = [
//         { method: 'CASH', amount: 11.11 },
//         { method: 'CARD', amount: 11.11 },
//         { method: 'MOBILE', amount: 11.11 }
//       ];

//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send({
//           transactionId: testTransactionId,
//           payments
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.summary.transactionStatus).toBe('COMPLETED');
//     });

//     it('should handle large number of small payments', async () => {
//       // Create 10 payments of $10 each
//       const payments = Array.from({ length: 10 }, (_, i) => ({
//         method: i % 3 === 0 ? 'CASH' : i % 3 === 1 ? 'CARD' : 'MOBILE',
//         amount: 10.00
//       }));

//       const response = await request(app)
//         .post('/api/payments/multiple')
//         .send({
//           transactionId: testTransactionId,
//           payments
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.payments).toHaveLength(10);
//       expect(response.body.summary.totalProcessed).toBe(100);

//       // Verify all payments were created
//       const allPayments = await prisma.payment.findMany({
//         where: { transactionId: testTransactionId }
//       });
//       expect(allPayments).toHaveLength(10);
//     });

//     it('should handle concurrent payment attempts', async () => {
//       // This test simulates race conditions but in a single-threaded test environment
//       // In production, database constraints would prevent issues
      
//       const payment1Promise = request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 60.00
//         });

//       const payment2Promise = request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 40.00
//         });

//       const [response1, response2] = await Promise.all([payment1Promise, payment2Promise]);
      
//       // Both should succeed in test environment
//       expect(response1.status).toBe(201);
//       expect(response2.status).toBe(201);

//       // Transaction should be completed
//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should maintain referential integrity', async () => {
//       // Create payment
//       const payment = await prisma.payment.create({
//         data: {
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 100.00
//         }
//       });

//       // Verify payment is linked to transaction
//       const paymentWithTransaction = await prisma.payment.findUnique({
//         where: { id: payment.id },
//         include: { transaction: true }
//       });

//       expect(paymentWithTransaction.transaction.id).toBe(testTransactionId);
//     });

//     it('should handle string amounts correctly', async () => {
//       const response = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: "75.25" // String amount
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.amount).toBe('75.25');
//     });

//     it('should reject invalid amount formats', async () => {
//       const response = await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: "invalid"
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.message).toContain('must be greater than 0');
//     });
//   });

//   describe('Transaction Status Integration', () => {
//     it('should keep transaction pending with partial payments', async () => {
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 50.00
//         });

//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('PENDING');
//     });

//     it('should complete transaction with exact payment', async () => {
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 100.00
//         });

//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });

//     it('should complete transaction with multiple payments totaling exact amount', async () => {
//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CASH',
//           amount: 70.00
//         });

//       await request(app)
//         .post('/api/payments')
//         .send({
//           transactionId: testTransactionId,
//           method: 'CARD',
//           amount: 30.00
//         });

//       const transaction = await prisma.transaction.findUnique({
//         where: { id: testTransactionId }
//       });
//       expect(transaction.status).toBe('COMPLETED');
//     });
//   });
// });

// tests/payments.test.js - Updated with Authentication & Authorization
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

describe('Payments API - With Authentication', () => {
  let testBranchId;
  let testProductId;
  let testTransactionId;
  let testTransaction2Id;
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

    // Create test data
    const branch = await prisma.branch.create({
      data: createUniqueBranch()
    });
    testBranchId = branch.id;

    const product = await prisma.product.create({
      data: createUniqueProduct(testBranchId)
    });
    testProductId = product.id;

    // Create test transactions (pending status for payment testing)
    const transaction1 = await prisma.transaction.create({
      data: {
        branchId: testBranchId,
        cashierId: authUsers.cashier.id,
        receiptNumber: `REC-${Date.now()}-1`,
        totalGross: 100.00,
        totalTax: 10.00,
        totalNet: 90.00,
        status: 'PENDING'
      }
    });
    testTransactionId = transaction1.id;

    const transaction2 = await prisma.transaction.create({
      data: {
        branchId: testBranchId,
        cashierId: authUsers.cashier.id,
        receiptNumber: `REC-${Date.now()}-2`,
        totalGross: 75.50,
        totalTax: 7.55,
        totalNet: 67.95,
        status: 'PENDING'
      }
    });
    testTransaction2Id = transaction2.id;
  });

  // Cleanup auth after all tests
  afterAll(async () => {
    const userIds = Object.values(authUsers).map(u => u.id);
    await cleanupTestAuth(userIds);
    await prisma.$disconnect();
  });

  describe('POST /payments', () => {
    it('should allow cashier to create a single payment', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'CASH',
        amount: 100.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.method).toBe('CASH');
      expect(parseFloat(response.body.amount)).toBe(100.00);
      expect(response.body.transactionId).toBe(testTransactionId);
    });

    it('should allow admin to create payment', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'CARD',
        amount: 50.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(paymentData);

      expect(response.status).toBe(201);
    });

    it('should deny payment creation without authentication', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'CASH',
        amount: 100.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .send(paymentData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should handle partial payment', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'CASH',
        amount: 50.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(parseFloat(response.body.amount)).toBe(50.00);
      
      // Transaction should still be pending
      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });
      expect(transaction.status).toBe('PENDING');
    });

    it('should complete transaction when fully paid', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'CARD',
        amount: 100.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      
      // Transaction should be completed
      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });
      expect(transaction.status).toBe('COMPLETED');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ method: 'CASH' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Required fields');
    });

    it('should validate payment method', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'INVALID',
        amount: 50.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Payment method must be');
    });

    it('should validate positive amount', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'CASH',
        amount: -10.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('must be greater than 0');
    });

    it('should prevent overpayment', async () => {
      const paymentData = {
        transactionId: testTransactionId,
        method: 'CASH',
        amount: 150.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('exceeds remaining balance');
    });

    it('should prevent payment to completed transaction', async () => {
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'COMPLETED' }
      });

      const paymentData = {
        transactionId: testTransactionId,
        method: 'CASH',
        amount: 50.00
      };
      
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot add payments to completed');
    });
  });

  describe('POST /payments/multiple', () => {
    it('should allow cashier to process multiple payments', async () => {
      const paymentsData = {
        transactionId: testTransactionId,
        payments: [
          { method: 'CASH', amount: 50.00 },
          { method: 'CARD', amount: 30.00 },
          { method: 'MOBILE', amount: 20.00 }
        ]
      };
      
      const response = await request(app)
        .post('/api/payments/multiple')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(paymentsData);

      expect(response.status).toBe(201);
      expect(response.body.payments).toHaveLength(3);
      expect(response.body.summary.totalProcessed).toBe(100);
      expect(response.body.summary.transactionStatus).toBe('COMPLETED');
    });

    it('should allow manager to process multiple payments', async () => {
      const paymentsData = {
        transactionId: testTransactionId,
        payments: [
          { method: 'CASH', amount: 60.00 },
          { method: 'CARD', amount: 40.00 }
        ]
      };
      
      const response = await request(app)
        .post('/api/payments/multiple')
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send(paymentsData);

      expect(response.status).toBe(201);
    });

    it('should deny multiple payments without authentication', async () => {
      const paymentsData = {
        transactionId: testTransactionId,
        payments: [
          { method: 'CASH', amount: 50.00 }
        ]
      };
      
      const response = await request(app)
        .post('/api/payments/multiple')
        .send(paymentsData);

      expect(response.status).toBe(401);
    });

    it('should validate total doesn\'t exceed transaction amount', async () => {
      const paymentsData = {
        transactionId: testTransactionId,
        payments: [
          { method: 'CASH', amount: 70.00 },
          { method: 'CARD', amount: 50.00 }
        ]
      };
      
      const response = await request(app)
        .post('/api/payments/multiple')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send(paymentsData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('exceed transaction amount');
    });
  });

  describe('GET /payments', () => {
    beforeEach(async () => {
      await prisma.payment.createMany({
        data: [
          {
            transactionId: testTransactionId,
            method: 'CASH',
            amount: 50.00
          },
          {
            transactionId: testTransactionId,
            method: 'CARD',
            amount: 30.00
          },
          {
            transactionId: testTransaction2Id,
            method: 'MOBILE',
            amount: 75.50
          }
        ]
      });
    });

    it('should allow cashier to get all payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.payments).toHaveLength(3);
    });

    it('should allow manager to get all payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.payments).toHaveLength(3);
    });

    it('should allow admin to get all payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/payments');

      expect(response.status).toBe(401);
    });

    it('should filter payments by method', async () => {
      const response = await request(app)
        .get('/api/payments?method=CASH')
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body.payments).toHaveLength(1);
      expect(response.body.payments[0].method).toBe('CASH');
    });

    it('should filter payments by transaction', async () => {
      const response = await request(app)
        .get(`/api/payments?transactionId=${testTransactionId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.payments).toHaveLength(2);
    });
  });

  describe('GET /payments/:id', () => {
    let testPaymentId;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          transactionId: testTransactionId,
          method: 'CASH',
          amount: 75.00
        }
      });
      testPaymentId = payment.id;
    });

    it('should allow cashier to get payment by ID', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPaymentId);
      expect(response.body.method).toBe('CASH');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPaymentId}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/payments/${fakeId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /payments/:id', () => {
    let testPaymentId;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          transactionId: testTransactionId,
          method: 'CASH',
          amount: 50.00
        }
      });
      testPaymentId = payment.id;
    });

    it('should allow cashier to update payment amount', async () => {
      const response = await request(app)
        .put(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ amount: 60.00 });

      expect(response.status).toBe(200);
      expect(response.body.amount).toBe('60.00');
    });

    it('should allow manager to update payment', async () => {
      const response = await request(app)
        .put(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send({ amount: 55.00 });

      expect(response.status).toBe(200);
    });

    it('should deny update without authentication', async () => {
      const response = await request(app)
        .put(`/api/payments/${testPaymentId}`)
        .send({ amount: 60.00 });

      expect(response.status).toBe(401);
    });

    it('should prevent updating to negative amount', async () => {
      const response = await request(app)
        .put(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({ amount: -10.00 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('must be greater than 0');
    });

    it('should prevent updating payments for completed transactions', async () => {
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'COMPLETED' }
      });

      const response = await request(app)
        .put(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({ amount: 60.00 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot update payments for completed');
    });
  });

  describe('DELETE /payments/:id', () => {
    let testPaymentId;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          transactionId: testTransactionId,
          method: 'CASH',
          amount: 50.00
        }
      });
      testPaymentId = payment.id;
    });

    it('should allow manager to delete payment from pending transaction', async () => {
      const response = await request(app)
        .delete(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Payment deleted successfully');
    });

    it('should allow admin to delete payment', async () => {
      const response = await request(app)
        .delete(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from deleting payment', async () => {
      const response = await request(app)
        .delete(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });

    it('should deny deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/payments/${testPaymentId}`);

      expect(response.status).toBe(401);
    });

    it('should prevent deleting payments from completed transactions', async () => {
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { status: 'COMPLETED' }
      });

      const response = await request(app)
        .delete(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot delete payments from completed');
    });
  });

  describe('GET /payments/transaction/:transactionId', () => {
    beforeEach(async () => {
      await prisma.payment.createMany({
        data: [
          {
            transactionId: testTransactionId,
            method: 'CASH',
            amount: 60.00
          },
          {
            transactionId: testTransactionId,
            method: 'CARD',
            amount: 40.00
          }
        ]
      });
    });

    it('should allow cashier to get payments for a transaction', async () => {
      const response = await request(app)
        .get(`/api/payments/transaction/${testTransactionId}`)
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.payments).toHaveLength(2);
      expect(response.body.summary.totalPaid).toBe(100);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`/api/payments/transaction/${testTransactionId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /payments/analytics/overview', () => {
    beforeEach(async () => {
      const transaction3 = await prisma.transaction.create({
        data: {
          branchId: testBranchId,
          cashierId: authUsers.cashier.id,
          receiptNumber: `REC-${Date.now()}-3`,
          totalGross: 50.00,
          totalTax: 5.00,
          totalNet: 45.00,
          status: 'COMPLETED'
        }
      });

      await prisma.payment.createMany({
        data: [
          { transactionId: testTransactionId, method: 'CASH', amount: 100.00 },
          { transactionId: testTransaction2Id, method: 'CARD', amount: 50.00 },
          { transactionId: testTransaction2Id, method: 'MOBILE', amount: 25.50 },
          { transactionId: transaction3.id, method: 'CASH', amount: 30.00 },
          { transactionId: transaction3.id, method: 'CARD', amount: 20.00 }
        ]
      });
    });

    it('should allow admin to get payment analytics', async () => {
      const response = await request(app)
        .get('/api/payments/analytics/overview')
        .set('Authorization', `Bearer ${authTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('methodBreakdown');
      expect(response.body.overview.totalAmount).toBe(225.5);
    });

    it('should allow manager to get analytics', async () => {
      const response = await request(app)
        .get('/api/payments/analytics/overview')
        .set('Authorization', `Bearer ${authTokens.manager}`);

      expect(response.status).toBe(200);
    });

    it('should deny cashier from getting analytics', async () => {
      const response = await request(app)
        .get('/api/payments/analytics/overview')
        .set('Authorization', `Bearer ${authTokens.cashier}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/payments/analytics/overview');

      expect(response.status).toBe(401);
    });
  });

  describe('Mixed Payment Scenarios', () => {
    it('should handle cash + card payment with authentication', async () => {
      const cashPayment = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          transactionId: testTransactionId,
          method: 'CASH',
          amount: 60.00
        });

      expect(cashPayment.status).toBe(201);

      const cardPayment = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          transactionId: testTransactionId,
          method: 'CARD',
          amount: 40.00
        });

      expect(cardPayment.status).toBe(201);

      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });
      expect(transaction.status).toBe('COMPLETED');
    });

    it('should handle three-way split payment', async () => {
      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          transactionId: testTransactionId,
          method: 'CASH',
          amount: 30.00
        });

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          transactionId: testTransactionId,
          method: 'CARD',
          amount: 40.00
        });

      const mobilePayment = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          transactionId: testTransactionId,
          method: 'MOBILE',
          amount: 30.00
        });

      expect(mobilePayment.status).toBe(201);

      const allPayments = await prisma.payment.findMany({
        where: { transactionId: testTransactionId }
      });

      expect(allPayments).toHaveLength(3);
    });
  });

  describe('Edge Cases and Business Rules', () => {
    it('should handle exact payment with small decimal precision', async () => {
      await prisma.transaction.update({
        where: { id: testTransactionId },
        data: { totalGross: 99.99 }
      });

      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${authTokens.cashier}`)
        .send({
          transactionId: testTransactionId,
          method: 'CASH',
          amount: 99.99
        });

      expect(response.status).toBe(201);
      
      const transaction = await prisma.transaction.findUnique({
        where: { id: testTransactionId }
      });
      expect(transaction.status).toBe('COMPLETED');
    });

    it('should maintain referential integrity', async () => {
      const payment = await prisma.payment.create({
        data: {
          transactionId: testTransactionId,
          method: 'CASH',
          amount: 100.00
        }
      });

      const paymentWithTransaction = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { transaction: true }
      });

      expect(paymentWithTransaction.transaction.id).toBe(testTransactionId);
    });
  });
});