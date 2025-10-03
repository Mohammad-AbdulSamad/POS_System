// tests/helpers/auth.helper.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import request from 'supertest';

const prisma = new PrismaClient();

/**
 * Create test users and return their tokens
 */
export const setupTestAuth = async (app) => {
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);
  
  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: `admin-${Date.now()}@test.com`,
      name: 'Test Admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      email: `manager-${Date.now()}@test.com`,
      name: 'Test Manager',
      password: hashedPassword,
      role: 'MANAGER'
    }
  });

  const cashierUser = await prisma.user.create({
    data: {
      email: `cashier-${Date.now()}@test.com`,
      name: 'Test Cashier',
      password: hashedPassword,
      role: 'CASHIER'
    }
  });

  const stockManagerUser = await prisma.user.create({
    data: {
      email: `stock-${Date.now()}@test.com`,
      name: 'Test Stock Manager',
      password: hashedPassword,
      role: 'STOCK_MANAGER'
    }
  });

  // Login to get tokens
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: adminUser.email,
      password: 'TestPassword123'
    });

  const managerLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: managerUser.email,
      password: 'TestPassword123'
    });

  const cashierLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: cashierUser.email,
      password: 'TestPassword123'
    });

  const stockManagerLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: stockManagerUser.email,
      password: 'TestPassword123'
    });

  return {
    users: {
      admin: adminUser,
      manager: managerUser,
      cashier: cashierUser,
      stockManager: stockManagerUser
    },
    tokens: {
      admin: adminLogin.body.accessToken,
      manager: managerLogin.body.accessToken,
      cashier: cashierLogin.body.accessToken,
      stockManager: stockManagerLogin.body.accessToken
    }
  };
};

/**
 * Cleanup test auth data
 */
export const cleanupTestAuth = async (userIds) => {
  // Delete refresh tokens
  await prisma.refreshToken.deleteMany({
    where: {
      userId: { in: userIds }
    }
  });

  // Delete users
  await prisma.user.deleteMany({
    where: {
      id: { in: userIds }
    }
  });
};

/**
 * Create authenticated request helper
 */
export const authenticatedRequest = (app, method, url, token) => {
  return request(app)[method](url).set('Authorization', `Bearer ${token}`);
};