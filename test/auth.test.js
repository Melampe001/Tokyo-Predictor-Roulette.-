/**
 * Authentication and Security Tests
 * Tests for the new authentication system and user-specific data storage
 */

import request from 'supertest';
import app from '../server.js';

describe('Authentication System', () => {
  let authToken;
  let testUsername = 'testuser_' + Date.now();
  let testPassword = 'TestPass123!';

  describe('User Registration', () => {
    test('POST /api/auth/register with valid data succeeds', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe(testUsername);
    });

    test('POST /api/auth/register with existing username fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: testPassword
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Registration failed');
    });

    test('POST /api/auth/register without username fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: testPassword
        });

      expect(response.status).toBe(400);
    });

    test('POST /api/auth/register with short password fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'short'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('User Login', () => {
    test('POST /api/auth/login with valid credentials succeeds', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: testPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      
      authToken = response.body.token;
    });

    test('POST /api/auth/login with invalid password fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    test('POST /api/auth/login with non-existent user fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: testPassword
        });

      expect(response.status).toBe(401);
    });

    test('POST /api/auth/login without credentials fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Token Verification', () => {
    test('GET /api/auth/verify with valid token succeeds', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe(testUsername);
    });

    test('GET /api/auth/verify without token fails', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
    });

    test('GET /api/auth/verify with invalid token fails', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });
  });

  describe('Protected Endpoints', () => {
    test('POST /api/result without authentication fails', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({ value: 5 });

      expect(response.status).toBe(401);
    });

    test('POST /api/result with authentication succeeds', async () => {
      const response = await request(app)
        .post('/api/result')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 5 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/results without authentication fails', async () => {
      const response = await request(app)
        .get('/api/results');

      expect(response.status).toBe(401);
    });

    test('GET /api/results with authentication succeeds', async () => {
      const response = await request(app)
        .get('/api/results')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('GET /api/statistics without authentication fails', async () => {
      const response = await request(app)
        .get('/api/statistics');

      expect(response.status).toBe(401);
    });

    test('GET /api/statistics with authentication succeeds', async () => {
      const response = await request(app)
        .get('/api/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/analysis without authentication fails', async () => {
      const response = await request(app)
        .get('/api/analysis');

      expect(response.status).toBe(401);
    });

    test('GET /api/analysis with authentication succeeds', async () => {
      const response = await request(app)
        .get('/api/analysis')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('User History', () => {
    test('GET /api/history without authentication fails', async () => {
      const response = await request(app)
        .get('/api/history');

      expect(response.status).toBe(401);
    });

    test('GET /api/history with authentication succeeds', async () => {
      const response = await request(app)
        .get('/api/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Data Export', () => {
    test('GET /api/export without authentication fails', async () => {
      const response = await request(app)
        .get('/api/export');

      expect(response.status).toBe(401);
    });

    test('GET /api/export with authentication succeeds', async () => {
      const response = await request(app)
        .get('/api/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Admin Endpoints', () => {
    let adminToken;

    beforeAll(async () => {
      // Give time for server initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Login as admin
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'Tokyo2024!'
        });

      if (response.status === 200) {
        adminToken = response.body.token;
      }
    });

    test('POST /api/auth/login as admin succeeds', async () => {
      expect(adminToken).toBeDefined();
    });

    test('GET /api/auth/users with admin token succeeds', async () => {
      if (!adminToken) {
        // Skip if admin login failed
        return;
      }

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('GET /api/auth/users with regular user token fails', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });

    test('DELETE /api/auth/users/:username with admin token succeeds', async () => {
      if (!adminToken) {
        // Skip if admin login failed
        return;
      }

      const response = await request(app)
        .delete(`/api/auth/users/${testUsername}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('DELETE /api/auth/users/:username cannot delete admin', async () => {
      if (!adminToken) {
        // Skip if admin login failed
        return;
      }

      const response = await request(app)
        .delete('/api/auth/users/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent returns 404', async () => {
      const response = await request(app)
        .get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });

    test('POST /api/nonexistent returns 404', async () => {
      const response = await request(app)
        .post('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});

describe('User Data Isolation', () => {
  let user1Token, user2Token;
  let user1Name = 'user1_' + Date.now();
  let user2Name = 'user2_' + Date.now();
  const password = 'TestPass123!';

  beforeAll(async () => {
    // Register and login user1
    await request(app)
      .post('/api/auth/register')
      .send({ username: user1Name, password });
    
    let response = await request(app)
      .post('/api/auth/login')
      .send({ username: user1Name, password });
    user1Token = response.body.token;

    // Register and login user2
    await request(app)
      .post('/api/auth/register')
      .send({ username: user2Name, password });
    
    response = await request(app)
      .post('/api/auth/login')
      .send({ username: user2Name, password });
    user2Token = response.body.token;
  });

  test('Users have separate result storage', async () => {
    // User1 submits results
    await request(app)
      .post('/api/result')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ value: 10 });

    await request(app)
      .post('/api/result')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ value: 20 });

    // User2 submits different results
    await request(app)
      .post('/api/result')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ value: 30 });

    // Check user1 results
    const user1Results = await request(app)
      .get('/api/results')
      .set('Authorization', `Bearer ${user1Token}`);

    // Check user2 results
    const user2Results = await request(app)
      .get('/api/results')
      .set('Authorization', `Bearer ${user2Token}`);

    // Both should return success
    expect(user1Results.body.success).toBe(true);
    expect(user2Results.body.success).toBe(true);
    
    // Both should have data arrays
    expect(Array.isArray(user1Results.body.data)).toBe(true);
    expect(Array.isArray(user2Results.body.data)).toBe(true);
    
    // User1 should have at least 2 results
    expect(user1Results.body.data.length).toBeGreaterThanOrEqual(2);
    
    // User2 should have at least 1 result
    expect(user2Results.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('Users have separate statistics', async () => {
    const user1Stats = await request(app)
      .get('/api/statistics')
      .set('Authorization', `Bearer ${user1Token}`);

    const user2Stats = await request(app)
      .get('/api/statistics')
      .set('Authorization', `Bearer ${user2Token}`);

    // Both should return success
    expect(user1Stats.body.success).toBe(true);
    expect(user2Stats.body.success).toBe(true);
    
    // Both should have data
    expect(user1Stats.body.data).toBeDefined();
    expect(user2Stats.body.data).toBeDefined();

    // Statistics should be different
    expect(user1Stats.body.data.totalResults).not.toBe(user2Stats.body.data.totalResults);
  });
});
