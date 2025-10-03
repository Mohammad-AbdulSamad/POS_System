// tests/auth.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../server.js'; // Your Express app

const prisma = new PrismaClient();

describe('Authentication System', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  // Setup: Create a test user before all tests
  beforeAll(async () => {
    // Clean up existing test data
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'CASHIER'
      }
    });
  });

  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.tokenBlacklist.deleteMany();
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('password');

      // Store tokens for later tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'TestPassword123'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Email and password are required');
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body.message).toBe('Email and password are required');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
      expect(response.body.name).toBe('Test User');
      expect(response.body).not.toHaveProperty('password');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Authentication failed');
    });

    test('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.message).toBe('Token refreshed successfully');

      // Update tokens
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    test('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Refresh token is required');
    });

    test('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired refresh token');
    });
  });

  describe('POST /api/auth/verify', () => {
    test('should verify valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('should fail to verify without token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('POST /api/auth/change-password', () => {
    test('should change password with valid current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'TestPassword123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.message).toContain('Password changed successfully');

      // Verify old token is invalidated (refresh tokens deleted)
      const oldTokenResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      // Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        })
        .expect(200);

      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    test('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword456'
        })
        .expect(401);

      expect(response.body.message).toBe('Current password is incorrect');
    });

    test('should fail with weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'weak'
        })
        .expect(400);

      expect(response.body.message).toContain('must be at least 8 characters');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'NewPassword123',
          newPassword: 'AnotherPassword123'
        })
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/auth/sessions', () => {
    test('should get active sessions', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('DELETE /api/auth/sessions/:sessionId', () => {
    let sessionId;

    beforeAll(async () => {
      // Get a session ID
      const sessions = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`);
      
      sessionId = sessions.body.sessions[0]?.id;
    });

    test('should revoke a specific session', async () => {
      if (!sessionId) {
        console.log('No session to revoke, skipping test');
        return;
      }

      const response = await request(app)
        .delete(`/api/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Session revoked successfully');

      // Login again to get new tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        });

      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    test('should fail to revoke non-existent session', async () => {
      const response = await request(app)
        .delete('/api/auth/sessions/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.message).toBe('Session not found');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.message).toBe('Logout successful');

      // Verify token is blacklisted
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(meResponse.body.message).toBe('Token has been revoked');

      // Login again for next tests
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        });

      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('POST /api/auth/logout-all', () => {
    test('should logout from all devices', async () => {
      // Add a small delay to ensure unique token generation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get a fresh token specifically for this test
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        })
        .expect(200);

      const freshAccessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${freshAccessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out from all devices successfully');

      // Verify all refresh tokens are deleted
      const sessions = await prisma.refreshToken.findMany({
        where: { userId: testUser.id }
      });

      expect(sessions.length).toBe(0);

      // Verify current token is blacklisted
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${freshAccessToken}`)
        .expect(401);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });
});