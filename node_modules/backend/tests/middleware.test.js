// tests/middleware.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../server.js';

const prisma = new PrismaClient();

describe('Authentication Middleware', () => {
  let adminUser, managerUser, cashierUser;
  let adminToken, managerToken, cashierToken;
  let testBranch;

  beforeAll(async () => {
    // Create test branch
    testBranch = await prisma.branch.create({
      data: {
        name: 'Test Branch',
        address: '123 Test St'
      }
    });

    // Create test users with different roles
    const hashedPassword = await bcrypt.hash('TestPassword123', 10);

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        branchId: testBranch.id
      }
    });

    managerUser = await prisma.user.create({
      data: {
        email: 'manager@test.com',
        name: 'Manager User',
        password: hashedPassword,
        role: 'MANAGER',
        branchId: testBranch.id
      }
    });

    cashierUser = await prisma.user.create({
      data: {
        email: 'cashier@test.com',
        name: 'Cashier User',
        password: hashedPassword,
        role: 'CASHIER',
        branchId: testBranch.id
      }
    });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'TestPassword123' });
    adminToken = adminLogin.body.accessToken;

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@test.com', password: 'TestPassword123' });
    managerToken = managerLogin.body.accessToken;

    const cashierLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cashier@test.com', password: 'TestPassword123' });
    cashierToken = cashierLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: {
          in: [adminUser.id, managerUser.id, cashierUser.id]
        }
      }
    });
    await prisma.tokenBlacklist.deleteMany();
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [adminUser.id, managerUser.id, cashierUser.id]
        }
      }
    });
    await prisma.branch.delete({
      where: { id: testBranch.id }
    });
    await prisma.$disconnect();
  });

  describe('authenticate middleware', () => {
    test('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.email).toBe('admin@test.com');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.message).toBe('Authentication failed');
    });

    test('should reject request with expired token', async () => {
      // This would need a helper to generate an expired token
      // For now, we test with an invalid token format
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid')
        .expect(401);

      expect(response.body.message).toBe('Authentication failed');
    });
  });

  describe('requireRole middleware', () => {
    test('should allow admin to access admin-only route', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    test('should allow manager to access manager route', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    test('should deny cashier from accessing admin route', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'Password123',
          role: 'CASHIER'
        })
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });

    test('should allow admin to create users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'testuser@test.com',
          password: 'Password123',
          name: 'Test User',
          role: 'CASHIER',
          branchId: testBranch.id
        })
        .expect(201);

      expect(response.body.email).toBe('testuser@test.com');

      // Cleanup
      await prisma.user.delete({
        where: { id: response.body.id }
      });
    });
  });

  describe('requireOwnership middleware', () => {
    test('should allow user to change their own password', async () => {
      const response = await request(app)
        .post(`/api/users/${cashierUser.id}/change-password`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          currentPassword: 'TestPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.message).toContain('Password changed successfully');

      // Change it back
      await bcrypt.hash('TestPassword123', 10).then(async (hash) => {
        await prisma.user.update({
          where: { id: cashierUser.id },
          data: { password: hash }
        });
      });
    });

    test('should deny user from changing another user password', async () => {
      const response = await request(app)
        .post(`/api/users/${adminUser.id}/change-password`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          currentPassword: 'TestPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });

    test('should allow admin to change any user password', async () => {
      const response = await request(app)
        .post(`/api/users/${cashierUser.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newPassword: 'ResetPassword123'
        })
        .expect(200);

      expect(response.body.message).toContain('Password reset successfully');

      // Reset it back
      await bcrypt.hash('TestPassword123', 10).then(async (hash) => {
        await prisma.user.update({
          where: { id: cashierUser.id },
          data: { password: hash }
        });
      });
    });
  });

  describe('Role hierarchy and permissions', () => {
    test('admin should have access to all endpoints', async () => {
      // Test various endpoints
      const endpoints = [
        { method: 'get', path: '/api/users' },
        { method: 'get', path: '/api/users/analytics/summary' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).not.toBe(403);
      }
    });

    test('manager should have limited access', async () => {
      // Manager can view users
      const viewResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(viewResponse.body).toHaveProperty('users');

      // But cannot create users (admin only)
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'Password123'
        })
        .expect(403);

      expect(createResponse.body.message).toBe('Access denied');
    });

    test('cashier should have minimal access', async () => {
      // Cashier cannot view all users
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access denied');
    });

    test('cashier can view their own profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(response.body.email).toBe('cashier@test.com');
      expect(response.body.role).toBe('CASHIER');
    });
  });

  describe('Branch-level access control', () => {
    let otherBranch, otherBranchUser, otherBranchToken;

    beforeAll(async () => {
      // Create another branch and user
      otherBranch = await prisma.branch.create({
        data: {
          name: 'Other Branch',
          address: '456 Other St'
        }
      });

      const hashedPassword = await bcrypt.hash('TestPassword123', 10);
      otherBranchUser = await prisma.user.create({
        data: {
          email: 'otherbranch@test.com',
          name: 'Other Branch User',
          password: hashedPassword,
          role: 'CASHIER',
          branchId: otherBranch.id
        }
      });

      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'otherbranch@test.com', password: 'TestPassword123' });
      
      otherBranchToken = login.body.accessToken;
    });

    afterAll(async () => {
      await prisma.refreshToken.deleteMany({
        where: { userId: otherBranchUser.id }
      });
      await prisma.user.delete({
        where: { id: otherBranchUser.id }
      });
      await prisma.branch.delete({
        where: { id: otherBranch.id }
      });
    });

    test('admin can access any branch data', async () => {
      const response = await request(app)
        .get(`/api/users/branch/${testBranch.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    test('manager can access any branch data', async () => {
      const response = await request(app)
        .get(`/api/users/branch/${otherBranch.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    test('user should access their own branch', async () => {
      const response = await request(app)
        .get(`/api/users/branch/${testBranch.id}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });
  });
});