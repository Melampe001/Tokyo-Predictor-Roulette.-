/**
 * Premium Subscription Backend Tests
 * 
 * Tests for authentication, subscription, and payment routes
 */

import request from 'supertest';
import { jest } from '@jest/globals';
import express from 'express';
import authRoutes from '../premium-subscription/backend/routes/auth.js';
import subscriptionRoutes from '../premium-subscription/backend/routes/subscription.js';
import paymentRoutes from '../premium-subscription/backend/routes/payment.js';
import { userStore } from '../premium-subscription/backend/models/User.js';
import { subscriptionStore } from '../premium-subscription/backend/models/Subscription.js';
import { paymentStore } from '../premium-subscription/backend/routes/payment.js';
import { tokenStore } from '../premium-subscription/backend/middleware/auth.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payment', paymentRoutes);

describe('Premium Subscription System', () => {
  
  beforeEach(() => {
    // Clear all stores before each test
    userStore.clear();
    subscriptionStore.clear();
    paymentStore.clear();
    tokenStore.clear();
  });

  describe('Authentication Routes', () => {
    
    describe('POST /api/auth/register', () => {
      test('should register a new user successfully', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
        expect(response.body.data.user).toHaveProperty('name', 'Test User');
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.user).not.toHaveProperty('passwordHash');
      });

      test('should fail with missing fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields');
      });

      test('should fail with duplicate email', async () => {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          });

        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password456',
            name: 'Another User'
          });

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Email already exists');
      });
    });

    describe('POST /api/auth/login', () => {
      test('should login successfully with correct credentials', async () => {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          });

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      });

      test('should fail with incorrect password', async () => {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          });

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid credentials');
      });

      test('should fail with non-existent email', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid credentials');
      });
    });

    describe('GET /api/auth/me', () => {
      test('should get current user profile with valid token', async () => {
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          });

        const token = registerResponse.body.data.token;

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('email', 'test@example.com');
      });

      test('should fail without token', async () => {
        const response = await request(app)
          .get('/api/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Authentication required');
      });

      test('should fail with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('POST /api/auth/logout', () => {
      test('should logout successfully', async () => {
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          });

        const token = registerResponse.body.data.token;

        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Token should be invalidated
        const meResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(meResponse.status).toBe(401);
      });
    });
  });

  describe('Subscription Routes', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      token = response.body.data.token;
      userId = response.body.data.user.id;
    });

    describe('GET /api/subscriptions/tiers', () => {
      test('should get subscription tiers', async () => {
        const response = await request(app)
          .get('/api/subscriptions/tiers');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('tier');
        expect(response.body.data[0]).toHaveProperty('pricing');
        expect(response.body.data[0]).toHaveProperty('features');
      });
    });

    describe('GET /api/subscriptions/me', () => {
      test('should get user subscription', async () => {
        const response = await request(app)
          .get('/api/subscriptions/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('tier');
        expect(response.body.data).toHaveProperty('status');
      });

      test('should create basic (free) subscription if none exists', async () => {
        const response = await request(app)
          .get('/api/subscriptions/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.body.data.tier).toBe('basic');
        expect(response.body.data.status).toBe('active');
      });
    });

    describe('POST /api/subscriptions/create', () => {
      test('should create advanced subscription', async () => {
        const response = await request(app)
          .post('/api/subscriptions/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'advanced',
            billingCycle: 'monthly'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.tier).toBe('advanced');
        expect(response.body.data.billingCycle).toBe('monthly');
        expect(response.body.data.status).toBe('pending');
      });

      test('should fail with invalid tier', async () => {
        const response = await request(app)
          .post('/api/subscriptions/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'invalid',
            billingCycle: 'monthly'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid tier');
      });

      test('should fail with invalid billing cycle', async () => {
        const response = await request(app)
          .post('/api/subscriptions/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'premium',
            billingCycle: 'invalid'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid billing cycle');
      });
    });

    describe('POST /api/subscriptions/activate', () => {
      test('should activate pending subscription', async () => {
        await request(app)
          .post('/api/subscriptions/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'premium',
            billingCycle: 'monthly'
          });

        const response = await request(app)
          .post('/api/subscriptions/activate')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('active');
        expect(response.body.data.isActive).toBe(true);
      });
    });

    describe('POST /api/subscriptions/cancel', () => {
      test('should cancel subscription', async () => {
        await request(app)
          .post('/api/subscriptions/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            tier: 'premium',
            billingCycle: 'monthly'
          });

        await request(app)
          .post('/api/subscriptions/activate')
          .set('Authorization', `Bearer ${token}`);

        const response = await request(app)
          .post('/api/subscriptions/cancel')
          .set('Authorization', `Bearer ${token}`)
          .send({
            immediate: false
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('cancelled');
        expect(response.body.data.autoRenew).toBe(false);
      });
    });
  });

  describe('Payment Routes', () => {
    let token;
    let subscriptionId;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      token = registerResponse.body.data.token;

      const subResponse = await request(app)
        .post('/api/subscriptions/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tier: 'premium',
          billingCycle: 'monthly'
        });

      subscriptionId = subResponse.body.data.id;
    });

    describe('GET /api/payment/methods', () => {
      test('should get payment methods', async () => {
        const response = await request(app)
          .get('/api/payment/methods');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/payment/initiate', () => {
      test('should initiate payment', async () => {
        const response = await request(app)
          .post('/api/payment/initiate')
          .set('Authorization', `Bearer ${token}`)
          .send({
            subscriptionId,
            method: 'credit_card'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('paymentId');
        expect(response.body.data).toHaveProperty('transactionId');
        expect(response.body.data.status).toBe('pending');
      });

      test('should fail with invalid payment method', async () => {
        const response = await request(app)
          .post('/api/payment/initiate')
          .set('Authorization', `Bearer ${token}`)
          .send({
            subscriptionId,
            method: 'invalid_method'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid payment method');
      });
    });

    describe('POST /api/payment/process', () => {
      test('should process payment successfully', async () => {
        const initiateResponse = await request(app)
          .post('/api/payment/initiate')
          .set('Authorization', `Bearer ${token}`)
          .send({
            subscriptionId,
            method: 'credit_card'
          });

        const paymentId = initiateResponse.body.data.paymentId;

        const response = await request(app)
          .post('/api/payment/process')
          .set('Authorization', `Bearer ${token}`)
          .send({
            paymentId,
            cardDetails: {
              cardNumber: '4111111111111111',
              expiryDate: '12/25',
              cvv: '123',
              cardholderName: 'Test User'
            }
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('completed');
      });
    });

    describe('GET /api/payment/history', () => {
      test('should get payment history', async () => {
        const response = await request(app)
          .get('/api/payment/history')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });
  });
});
