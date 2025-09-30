// tests/users.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../server.js';

const prisma = new PrismaClient();

// Helper functions
const createTestBranch = () => ({
  name: `Test Branch ${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  address: '123 Test Street'
});

const createTestUser = (branchId, overrides = {}) => ({
  email: `user${Date.now()}${Math.random().toString(36).substr(2, 5)}@test.com`,
  name: `Test User ${Date.now()}`,
  password: 'Test@123',
  phone: '+1234567890',
  role: 'CASHIER',
  branchId: branchId || null,
  ...overrides
});

describe('Users API', () => {
  let testBranchId;

  beforeEach(async () => {
    // Clean database in correct order
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

    // Create test branch
    const branch = await prisma.branch.create({ data: createTestBranch() });
    testBranchId = branch.id;
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
  // POST /api/users - Create User
  // ========================================
  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const userData = createTestUser(testBranchId);

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(userData.email);
      expect(res.body.name).toBe(userData.name);
      expect(res.body.role).toBe(userData.role);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should hash password correctly', async () => {
      const userData = createTestUser(testBranchId);

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { id: res.body.id }
      });

      expect(user.password).not.toBe(userData.password);
      const isMatch = await bcrypt.compare(userData.password, user.password);
      expect(isMatch).toBe(true);
    });

    it('should create user with default CASHIER role', async () => {
      const userData = createTestUser(testBranchId);
      delete userData.role;

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(res.body.role).toBe('CASHIER');
    });

    it('should create user without branch', async () => {
      const userData = createTestUser(null);

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(res.body.branchId).toBeNull();
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Test' })
        .expect(400);

      expect(res.body.message).toContain('required');
    });

    it('should fail with invalid email format', async () => {
      const userData = createTestUser(testBranchId, { email: 'invalid-email' });

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(res.body.message).toContain('Invalid email format');
    });

    it('should fail with weak password', async () => {
      const userData = createTestUser(testBranchId, { password: 'weak' });

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(res.body.message).toContain('at least 8 characters');
    });

    it('should fail with invalid role', async () => {
      const userData = createTestUser(testBranchId, { role: 'INVALID_ROLE' });

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(res.body.message).toContain('Invalid role');
    });

    it('should fail with duplicate email', async () => {
      const userData = createTestUser(testBranchId);

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      expect(res.body.message).toContain('already registered');
    });

    it('should fail with non-existent branch', async () => {
      const userData = createTestUser('non-existent-branch-id');

      const res = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(404);

      expect(res.body.message).toContain('Branch not found');
    });

    it('should accept all valid roles', async () => {
      const roles = ['ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER'];

      for (const role of roles) {
        const userData = createTestUser(testBranchId, { role });

        const res = await request(app)
          .post('/api/users')
          .send(userData)
          .expect(201);

        expect(res.body.role).toBe(role);
      }
    });
  });

  // ========================================
  // GET /api/users - Get All Users
  // ========================================
  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create multiple test users
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await prisma.user.createMany({
        data: [
          {
            email: 'admin@test.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            branchId: testBranchId
          },
          {
            email: 'cashier@test.com',
            name: 'Cashier User',
            password: hashedPassword,
            role: 'CASHIER',
            branchId: testBranchId
          },
          {
            email: 'manager@test.com',
            name: 'Manager User',
            password: hashedPassword,
            role: 'MANAGER',
            branchId: null
          }
        ]
      });
    });

    it('should get all users with pagination', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.users.length).toBe(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should not return password field', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      res.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should filter users by branch', async () => {
      const res = await request(app)
        .get(`/api/users?branchId=${testBranchId}`)
        .expect(200);

      expect(res.body.users.length).toBe(2);
      res.body.users.forEach(user => {
        expect(user.branchId).toBe(testBranchId);
      });
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/users?role=ADMIN')
        .expect(200);

      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].role).toBe('ADMIN');
    });

    it('should search users by name, email, or phone', async () => {
      const res = await request(app)
        .get('/api/users?search=admin')
        .expect(200);

      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should paginate results correctly', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=2')
        .expect(200);

      expect(res.body.users.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.pages).toBe(2);
    });

    it('should include branch details', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      const userWithBranch = res.body.users.find(u => u.branchId);
      expect(userWithBranch.branch).toHaveProperty('name');
    });

    it('should include transaction count', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(200);

      res.body.users.forEach(user => {
        expect(user).toHaveProperty('_count');
        expect(user._count).toHaveProperty('transactions');
      });
    });
  });

  // ========================================
  // GET /api/users/:id - Get User by ID
  // ========================================
  describe('GET /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          name: 'Test User',
          password: hashedPassword,
          role: 'CASHIER',
          branchId: testBranchId
        }
      });
      userId = user.id;
    });

    it('should get user by ID with full details', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(res.body.id).toBe(userId);
      expect(res.body.email).toBe('testuser@test.com');
      expect(res.body).toHaveProperty('branch');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // PUT /api/users/:id - Update User
  // ========================================
  describe('PUT /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          name: 'Test User',
          password: hashedPassword,
          role: 'CASHIER',
          branchId: testBranchId
        }
      });
      userId = user.id;
    });

    it('should update user email', async () => {
      const newEmail = `updated${Date.now()}@test.com`;

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ email: newEmail })
        .expect(200);

      expect(res.body.email).toBe(newEmail);
    });

    it('should update user name', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
    });

    it('should update user phone', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ phone: '+9876543210' })
        .expect(200);

      expect(res.body.phone).toBe('+9876543210');
    });

    it('should update user role', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ role: 'MANAGER' })
        .expect(200);

      expect(res.body.role).toBe('MANAGER');
    });

    it('should update user branch', async () => {
      const newBranch = await prisma.branch.create({
        data: createTestBranch()
      });

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ branchId: newBranch.id })
        .expect(200);

      expect(res.body.branchId).toBe(newBranch.id);
    });

    it('should update password and hash it', async () => {
      const newPassword = 'NewPass@123';

      await request(app)
        .put(`/api/users/${userId}`)
        .send({ password: newPassword })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      const isMatch = await bcrypt.compare(newPassword, user.password);
      expect(isMatch).toBe(true);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(res.body.message).toContain('Invalid email format');
    });

    it('should fail with duplicate email', async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await prisma.user.create({
        data: {
          email: 'another@test.com',
          password: hashedPassword
        }
      });

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ email: 'another@test.com' })
        .expect(409);

      expect(res.body.message).toContain('already registered');
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ password: 'weak' })
        .expect(400);

      expect(res.body.message).toContain('at least 8 characters');
    });

    it('should fail with invalid role', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ role: 'INVALID_ROLE' })
        .expect(400);

      expect(res.body.message).toContain('Invalid role');
    });

    it('should fail with non-existent branch', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({ branchId: 'non-existent-branch' })
        .expect(404);

      expect(res.body.message).toContain('Branch not found');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id')
        .send({ name: 'Test' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });

    it('should update multiple fields at once', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .send({
          name: 'New Name',
          phone: '+1111111111',
          role: 'ADMIN'
        })
        .expect(200);

      expect(res.body.name).toBe('New Name');
      expect(res.body.phone).toBe('+1111111111');
      expect(res.body.role).toBe('ADMIN');
    });
  });

  // ========================================
  // DELETE /api/users/:id - Delete User
  // ========================================
  describe('DELETE /api/users/:id', () => {
    let userId;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          name: 'Test User',
          password: hashedPassword,
          role: 'CASHIER',
          branchId: testBranchId
        }
      });
      userId = user.id;
    });

    it('should delete user successfully', async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(res.body.message).toContain('deleted successfully');

      const deleted = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(deleted).toBeNull();
    });

    it('should fail to delete user with transactions', async () => {
      // Create a transaction for this user
      await prisma.transaction.create({
        data: {
          branchId: testBranchId,
          cashierId: userId,
          receiptNumber: `RCP-${Date.now()}`,
          totalGross: 100,
          totalTax: 15,
          totalNet: 85,
          status: 'COMPLETED'
        }
      });

      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(400);

      expect(res.body.message).toContain('Cannot delete user with existing transactions');
      expect(res.body.details).toHaveProperty('transactionCount');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/non-existent-id')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // GET /api/users/branch/:branchId
  // ========================================
  describe('GET /api/users/branch/:branchId', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await prisma.user.createMany({
        data: [
          {
            email: 'user1@test.com',
            password: hashedPassword,
            role: 'CASHIER',
            branchId: testBranchId
          },
          {
            email: 'user2@test.com',
            password: hashedPassword,
            role: 'MANAGER',
            branchId: testBranchId
          }
        ]
      });
    });

    it('should get all users for a branch', async () => {
      const res = await request(app)
        .get(`/api/users/branch/${testBranchId}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('count');
      expect(res.body.users.length).toBe(2);
    });

    it('should filter by role within branch', async () => {
      const res = await request(app)
        .get(`/api/users/branch/${testBranchId}?role=CASHIER`)
        .expect(200);

      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].role).toBe('CASHIER');
    });
  });

  // ========================================
  // GET /api/users/role/:role
  // ========================================
  describe('GET /api/users/role/:role', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await prisma.user.createMany({
        data: [
          { email: 'admin1@test.com', password: hashedPassword, role: 'ADMIN' },
          { email: 'admin2@test.com', password: hashedPassword, role: 'ADMIN' },
          { email: 'cashier1@test.com', password: hashedPassword, role: 'CASHIER' }
        ]
      });
    });

    it('should get all users by role', async () => {
      const res = await request(app)
        .get('/api/users/role/ADMIN')
        .expect(200);

      expect(res.body.role).toBe('ADMIN');
      expect(res.body.users.length).toBe(2);
      expect(res.body.count).toBe(2);
    });

    it('should fail with invalid role', async () => {
      const res = await request(app)
        .get('/api/users/role/INVALID_ROLE')
        .expect(400);

      expect(res.body.message).toContain('Invalid role');
    });
  });

  // ========================================
  // GET /api/users/:userId/stats
  // ========================================
  describe('GET /api/users/:userId/stats', () => {
    let userId;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'cashier@test.com',
          password: hashedPassword,
          role: 'CASHIER',
          branchId: testBranchId
        }
      });
      userId = user.id;

      // Create transactions
      await prisma.transaction.createMany({
        data: [
          {
            branchId: testBranchId,
            cashierId: userId,
            receiptNumber: 'RCP-001',
            totalGross: 100,
            totalTax: 15,
            totalNet: 85,
            status: 'COMPLETED'
          },
          {
            branchId: testBranchId,
            cashierId: userId,
            receiptNumber: 'RCP-002',
            totalGross: 200,
            totalTax: 30,
            totalNet: 170,
            status: 'COMPLETED'
          }
        ]
      });
    });

    it('should get user statistics', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/stats`)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats.totalTransactions).toBe(2);
      expect(parseFloat(res.body.stats.totalSalesAmount)).toBe(300);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/non-existent-id/stats')
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // POST /api/users/:id/change-password
  // ========================================
  describe('POST /api/users/:id/change-password', () => {
    let userId;
    const currentPassword = 'Test@123';

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(currentPassword, 10);
      const user = await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          password: hashedPassword,
          role: 'CASHIER'
        }
      });
      userId = user.id;
    });

    it('should change password successfully', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/change-password`)
        .send({
          currentPassword: currentPassword,
          newPassword: 'NewPass@456'
        })
        .expect(200);

      expect(res.body.message).toContain('changed successfully');

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isMatch = await bcrypt.compare('NewPass@456', user.password);
      expect(isMatch).toBe(true);
    });

    it('should fail with incorrect current password', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/change-password`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPass@456'
        })
        .expect(401);

      expect(res.body.message).toContain('incorrect');
    });

    it('should fail with weak new password', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/change-password`)
        .send({
          currentPassword: currentPassword,
          newPassword: 'weak'
        })
        .expect(400);

      expect(res.body.message).toContain('at least 8 characters');
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/change-password`)
        .send({ currentPassword: currentPassword })
        .expect(400);

      expect(res.body.message).toContain('required');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/non-existent-id/change-password')
        .send({
          currentPassword: currentPassword,
          newPassword: 'NewPass@456'
        })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // POST /api/users/:id/reset-password
  // ========================================
  describe('POST /api/users/:id/reset-password', () => {
    let userId;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          password: hashedPassword,
          role: 'CASHIER'
        }
      });
      userId = user.id;
    });

    it('should reset password successfully', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/reset-password`)
        .send({ newPassword: 'ResetPass@789' })
        .expect(200);

      expect(res.body.message).toContain('reset successfully');

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isMatch = await bcrypt.compare('ResetPass@789', user.password);
      expect(isMatch).toBe(true);
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/reset-password`)
        .send({ newPassword: 'weak' })
        .expect(400);

      expect(res.body.message).toContain('at least 8 characters');
    });

    it('should fail without new password', async () => {
      const res = await request(app)
        .post(`/api/users/${userId}/reset-password`)
        .send({})
        .expect(400);

      expect(res.body.message).toContain('required');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/non-existent-id/reset-password')
        .send({ newPassword: 'ResetPass@789' })
        .expect(404);

      expect(res.body.message).toContain('not found');
    });
  });

  // ========================================
  // GET /api/users/analytics/summary
  // ========================================
  describe('GET /api/users/analytics/summary', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await prisma.user.createMany({
        data: [
          { email: 'admin@test.com', password: hashedPassword, role: 'ADMIN', branchId: testBranchId },
          { email: 'cashier1@test.com', password: hashedPassword, role: 'CASHIER', branchId: testBranchId },
          { email: 'cashier2@test.com', password: hashedPassword, role: 'CASHIER', branchId: null },
          { email: 'manager@test.com', password: hashedPassword, role: 'MANAGER', branchId: testBranchId }
        ]
      });
    });

    it('should return users summary', async () => {
      const res = await request(app)
        .get('/api/users/analytics/summary')
        .expect(200);

      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('byRole');
      expect(res.body).toHaveProperty('byBranch');
      expect(res.body.summary.totalUsers).toBe(4);
    });

    it('should group users by role', async () => {
      const res = await request(app)
        .get('/api/users/analytics/summary')
        .expect(200);

      const cashiers = res.body.byRole.find(r => r.role === 'CASHIER');
      expect(cashiers.count).toBe(2);
    });

    it('should count users with and without branch', async () => {
      const res = await request(app)
        .get('/api/users/analytics/summary')
        .expect(200);

      expect(res.body.byBranch.withBranch).toBe(3);
      expect(res.body.byBranch.withoutBranch).toBe(1);
    });
  });

  // ========================================
  // POST /api/users/validate/email
  // ========================================
  describe('POST /api/users/validate/email', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          password: hashedPassword,
          role: 'CASHIER'
        }
      });
    });

    it('should validate existing email', async () => {
      const res = await request(app)
        .post('/api/users/validate/email')
        .send({ email: 'testuser@test.com' })
        .expect(200);

      expect(res.body.message).toContain('exists');
    });

    it('should validate non-existing email', async () => {
      const res = await request(app)
        .post('/api/users/validate/email')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      expect(res.body.message).toContain('available');
    });
  }); 
});