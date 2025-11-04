/**
 * Backend Server Tests
 * Tests for Express REST endpoints and WebSocket functionality
 */

import request from 'supertest';
import { jest } from '@jest/globals';

// Mock TokioAI adapter before importing server
jest.unstable_mockModule('../src/tokioai-adapter.js', () => {
  const mockTokio = {
    config: { batchSize: 10 },
    results: [],
    analysis: null,
    
    captureResult: jest.fn((value) => {
      const entry = {
        resultado: value,
        fecha: new Date().toLocaleDateString('es-ES'),
        hora: new Date().toLocaleTimeString('es-ES'),
        timestamp: Date.now()
      };
      mockTokio.results.push(entry);
      return entry;
    }),
    
    analyzeBatch: jest.fn(() => {
      const analysis = {
        timestamp: new Date().toISOString(),
        batchSize: mockTokio.results.length,
        results: mockTokio.results,
        frequencies: { '12': 2, '35': 1 },
        patterns: { sequences: [], repetitions: [] },
        trends: {
          mostFrequent: '12',
          maxFrequency: 2,
          dominant: 'neutral'
        },
        probabilities: { '12': 0.66, '35': 0.33 },
        suggestion: 'Test suggestion',
        statistics: {
          totalResults: mockTokio.results.length,
          lastUpdate: new Date().toLocaleString('es-ES')
        }
      };
      mockTokio.analysis = analysis;
      return analysis;
    }),
    
    getStatistics: jest.fn(() => ({
      currentResults: mockTokio.results.length,
      totalResults: mockTokio.results.length,
      totalAnalyses: 0,
      uptime: 1000,
      lastAnalysis: null
    })),
    
    close: jest.fn(),
    on: jest.fn(),
    emit: jest.fn()
  };
  
  return {
    default: jest.fn(() => mockTokio),
    TokioAI: jest.fn(() => mockTokio),
    isStubMode: false
  };
});

// Import server after mocking
const { app, server } = await import('../server.js');

describe('Backend Server - REST API', () => {
  
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('tokioStats');
    });
  });

  describe('POST /api/result', () => {
    it('should accept a valid result', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({ value: 12 })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('resultado', 12);
    });

    it('should reject request without value', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should accept zero as a valid value', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({ value: 0 })
        .expect(200);
      
      expect(response.body.result).toHaveProperty('resultado', 0);
    });
  });

  describe('GET /api/analysis', () => {
    it('should return analysis results', async () => {
      // First, add some results
      await request(app).post('/api/result').send({ value: 12 });
      await request(app).post('/api/result').send({ value: 35 });
      
      const response = await request(app)
        .get('/api/analysis')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analysis');
      expect(response.body.analysis).toHaveProperty('batchSize');
      expect(response.body.analysis).toHaveProperty('frequencies');
      expect(response.body.analysis).toHaveProperty('trends');
    });

    it('should accept count query parameter', async () => {
      const response = await request(app)
        .get('/api/analysis?count=5')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/results', () => {
    it('should return recent results', async () => {
      const response = await request(app)
        .get('/api/results')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should respect limit query parameter', async () => {
      const response = await request(app)
        .get('/api/results?limit=10')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/statistics', () => {
    it('should return statistics', async () => {
      const response = await request(app)
        .get('/api/statistics')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('currentResults');
      expect(response.body.statistics).toHaveProperty('totalResults');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });
});

describe('Backend Server - Integration Flow', () => {
  
  afterAll((done) => {
    server.close(done);
  });

  it('should handle complete analysis workflow', async () => {
    // Submit results
    const results = [12, 35, 3, 26, 0, 32, 15, 19, 4, 21];
    
    for (const value of results) {
      await request(app)
        .post('/api/result')
        .send({ value })
        .expect(200);
    }
    
    // Get analysis
    const analysisResponse = await request(app)
      .get('/api/analysis')
      .expect(200);
    
    expect(analysisResponse.body.analysis).toHaveProperty('batchSize');
    expect(analysisResponse.body.analysis).toHaveProperty('suggestion');
    
    // Get statistics
    const statsResponse = await request(app)
      .get('/api/statistics')
      .expect(200);
    
    expect(statsResponse.body.statistics.currentResults).toBeGreaterThan(0);
  });
});

// Note: WebSocket tests would require a WebSocket client library like 'ws'
// For a minimal implementation, REST API tests are sufficient
// TODO: Add WebSocket tests when needed using 'ws' package:
// describe('Backend Server - WebSocket', () => {
//   it('should connect via WebSocket', (done) => {
//     const ws = new WebSocket('ws://localhost:8080/ws');
//     ws.on('open', () => {
//       ws.close();
//       done();
//     });
//   });
// });
