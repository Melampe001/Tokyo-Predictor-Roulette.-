/**
 * Backend Server Tests
 * Tests for the Express REST API using supertest
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// Mock the adapter before importing the server
jest.unstable_mockModule('../src/tokioai-adapter.js', () => {
  const mockTokioInstance = {
    results: [],
    analysis: null,
    captureResult: jest.fn((value) => {
      const entry = {
        resultado: value,
        fecha: new Date().toLocaleDateString('es-ES'),
        hora: new Date().toLocaleTimeString('es-ES'),
        timestamp: Date.now()
      };
      mockTokioInstance.results.push(entry);
      return entry;
    }),
    analyzeBatch: jest.fn(() => ({
      timestamp: new Date().toISOString(),
      batchSize: mockTokioInstance.results.length,
      results: mockTokioInstance.results,
      frequencies: {},
      patterns: { sequences: [], repetitions: [], gaps: [] },
      trends: { mostFrequent: null, maxFrequency: 0, dominant: 'neutral' },
      probabilities: {},
      suggestion: 'Test suggestion',
      statistics: {
        totalResults: mockTokioInstance.results.length,
        dominantTrend: 'neutral',
        mostFrequent: null,
        accuracy: 0.5,
        lastUpdate: new Date().toLocaleString('es-ES')
      }
    })),
    generatePDF: jest.fn((path) => Promise.resolve(path)),
    saveEncrypted: jest.fn(() => ({
      encrypted: 'test-encrypted',
      iv: 'test-iv',
      authTag: 'test-auth-tag'
    })),
    getStatistics: jest.fn(() => ({
      totalResults: mockTokioInstance.results.length,
      currentResults: mockTokioInstance.results.length,
      lastAnalysis: null,
      uptime: 0
    })),
    clearResults: jest.fn(() => {
      mockTokioInstance.results = [];
      mockTokioInstance.analysis = null;
    }),
    close: jest.fn()
  };

  return {
    createTokioAI: jest.fn(() => mockTokioInstance),
    captureResult: jest.fn((instance, value) => instance.captureResult(value)),
    analyzeBatch: jest.fn((instance) => instance.analyzeBatch()),
    generatePDF: jest.fn((instance, path) => instance.generatePDF(path)),
    saveEncrypted: jest.fn((instance) => instance.saveEncrypted()),
    isUsingStub: jest.fn(() => true)
  };
});

// Import server after mocking
const { default: app } = await import('../server.js');

describe('Backend Server REST API', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('tokioAI');
      expect(response.body.tokioAI).toHaveProperty('available');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('api');
    });
  });

  describe('POST /api/result', () => {
    it('should capture a result successfully', async () => {
      const resultValue = 25;
      
      const response = await request(app)
        .post('/api/result')
        .send({ value: resultValue })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('resultado', resultValue);
      expect(response.body.data).toHaveProperty('fecha');
      expect(response.body.data).toHaveProperty('hora');
    });

    it('should return 400 when value is missing', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    it('should accept string numbers', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({ value: '12' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/analysis', () => {
    it('should return analysis', async () => {
      // First add some results
      await request(app).post('/api/result').send({ value: 10 });
      await request(app).post('/api/result').send({ value: 20 });
      
      const response = await request(app)
        .get('/api/analysis')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('usingStub');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('batchSize');
      expect(response.body.data).toHaveProperty('suggestion');
      expect(response.body.data).toHaveProperty('statistics');
    });

    it('should accept count query parameter', async () => {
      const response = await request(app)
        .get('/api/analysis?count=5')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/results', () => {
    it('should return results list', async () => {
      const response = await request(app)
        .get('/api/results')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should accept count query parameter', async () => {
      const response = await request(app)
        .get('/api/results?count=10')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/statistics', () => {
    it('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('server');
      expect(response.body.server).toHaveProperty('uptime');
      expect(response.body.server).toHaveProperty('connectedClients');
      expect(response.body.server).toHaveProperty('nodeVersion');
      expect(response.body.server).toHaveProperty('environment');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
      expect(response.body).toHaveProperty('path');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
    });

    it('should handle OPTIONS requests', async () => {
      await request(app)
        .options('/api/result')
        .expect(200);
    });
  });
});
