/**
 * Backend Server Tests
 * 
 * Tests for the Express + WebSocket server
 * Uses Jest and Supertest for HTTP endpoint testing
 * Mocks TokioAI adapter for predictable behavior
 */

import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the TokioAI adapter before importing the server
const mockTokioAI = {
  captureResult: jest.fn(),
  analyzeBatch: jest.fn(),
  results: [],
  getStatistics: jest.fn(),
  clearResults: jest.fn(),
  close: jest.fn()
};

jest.unstable_mockModule('../src/tokioai-adapter.js', () => ({
  default: jest.fn(() => mockTokioAI),
  TokioAIAdapter: jest.fn(() => mockTokioAI),
  useStubs: false
}));

// Import server after mocking
const { default: app } = await import('../server.js');

describe('Tokyo Predictor Backend Server', () => {
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockTokioAI.results = [];
  });

  describe('Health Check Endpoint', () => {
    test('GET /health returns healthy status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Check Endpoint', () => {
    test('GET /check returns ready status', async () => {
      const response = await request(app).get('/check');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('ready', true);
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Status Endpoint', () => {
    test('GET /status returns comprehensive system information', async () => {
      mockTokioAI.getStatistics.mockReturnValue({
        totalResults: 100,
        totalAnalyses: 10,
        currentResults: 50,
        lastAnalysis: new Date().toISOString(),
        uptime: 60000
      });

      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('system');
      expect(response.body.system).toHaveProperty('uptime');
      expect(response.body.system).toHaveProperty('environment');
      expect(response.body.system).toHaveProperty('nodeVersion');
      expect(response.body.system).toHaveProperty('platform');
      expect(response.body).toHaveProperty('memory');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('unit', 'MB');
      expect(response.body).toHaveProperty('tokioai');
      expect(response.body.tokioai).toHaveProperty('resultsCount', 50);
      expect(response.body.tokioai).toHaveProperty('totalResults', 100);
      expect(response.body).toHaveProperty('websocket');
      expect(mockTokioAI.getStatistics).toHaveBeenCalled();
    });

    test('GET /status handles errors gracefully', async () => {
      mockTokioAI.getStatistics.mockImplementation(() => {
        throw new Error('Statistics error');
      });

      const response = await request(app).get('/status');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Result Submission Endpoint', () => {
    test('POST /api/result with valid value succeeds', async () => {
      const mockResult = {
        resultado: 12,
        fecha: '01/01/2024',
        hora: '12:00:00',
        timestamp: Date.now()
      };
      
      mockTokioAI.captureResult.mockReturnValue(mockResult);

      const response = await request(app)
        .post('/api/result')
        .send({ value: 12 })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual(mockResult);
      expect(mockTokioAI.captureResult).toHaveBeenCalledWith(12);
    });

    test('POST /api/result without value returns 400', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({})
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(mockTokioAI.captureResult).not.toHaveBeenCalled();
    });

    test('POST /api/result with value 0 succeeds', async () => {
      const mockResult = {
        resultado: 0,
        fecha: '01/01/2024',
        hora: '12:00:00',
        timestamp: Date.now()
      };
      
      mockTokioAI.captureResult.mockReturnValue(mockResult);

      const response = await request(app)
        .post('/api/result')
        .send({ value: 0 })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(mockTokioAI.captureResult).toHaveBeenCalledWith(0);
    });
  });

  describe('Analysis Endpoint', () => {
    test('GET /api/analysis returns analysis data', async () => {
      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: 10,
        results: [],
        suggestion: 'Test suggestion',
        statistics: {
          totalResults: 0,
          mostFrequent: null
        }
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const response = await request(app).get('/api/analysis');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual(mockAnalysis);
      expect(mockTokioAI.analyzeBatch).toHaveBeenCalledWith(null);
    });

    test('GET /api/analysis with count parameter', async () => {
      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: 5,
        results: [],
        suggestion: 'Test suggestion'
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const response = await request(app).get('/api/analysis?count=5');

      expect(response.status).toBe(200);
      expect(mockTokioAI.analyzeBatch).toHaveBeenCalledWith(5);
    });
  });

  describe('Results Endpoint', () => {
    test('GET /api/results returns results list', async () => {
      const mockResults = [
        { resultado: 1, fecha: '01/01/2024', hora: '12:00:00' },
        { resultado: 2, fecha: '01/01/2024', hora: '12:01:00' }
      ];

      mockTokioAI.results = mockResults;

      const response = await request(app).get('/api/results');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual(mockResults);
      expect(response.body.total).toBe(2);
    });

    test('GET /api/results with limit parameter', async () => {
      const mockResults = Array.from({ length: 100 }, (_, i) => ({
        resultado: i,
        fecha: '01/01/2024',
        hora: '12:00:00'
      }));

      mockTokioAI.results = mockResults;

      const response = await request(app).get('/api/results?limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      // Should return last 10 results
      expect(response.body.data[0].resultado).toBe(90);
    });
  });

  describe('Statistics Endpoint', () => {
    test('GET /api/statistics returns statistics', async () => {
      const mockStats = {
        currentResults: 50,
        totalResults: 100,
        uptime: 3600000,
        lastAnalysis: new Date().toISOString()
      };

      mockTokioAI.getStatistics.mockReturnValue(mockStats);

      const response = await request(app).get('/api/statistics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toEqual(mockStats);
      expect(mockTokioAI.getStatistics).toHaveBeenCalled();
    });
  });

  describe('Clear Results Endpoint', () => {
    test('POST /api/clear clears all results', async () => {
      mockTokioAI.clearResults.mockImplementation(() => {
        mockTokioAI.results = [];
      });

      const response = await request(app).post('/api/clear');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(mockTokioAI.clearResults).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent returns 404', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });

    test('POST /api/result handles TokioAI errors', async () => {
      mockTokioAI.captureResult.mockImplementation(() => {
        throw new Error('TokioAI error');
      });

      const response = await request(app)
        .post('/api/result')
        .send({ value: 12 })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/analysis handles TokioAI errors', async () => {
      mockTokioAI.analyzeBatch.mockImplementation(() => {
        throw new Error('Analysis error');
      });

      const response = await request(app).get('/api/analysis');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS Headers', () => {
    test('API endpoints include CORS headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('OPTIONS requests return 200', async () => {
      const response = await request(app).options('/api/result');

      expect(response.status).toBe(200);
    });
  });
});

// Integration test with multiple operations
describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokioAI.results = [];
  });

  test('Submit results and request analysis flow', async () => {
    // Submit multiple results
    const results = [1, 5, 3, 7, 5, 2];
    
    for (const value of results) {
      const mockResult = {
        resultado: value,
        fecha: '01/01/2024',
        hora: '12:00:00',
        timestamp: Date.now()
      };
      
      mockTokioAI.captureResult.mockReturnValue(mockResult);
      mockTokioAI.results.push(mockResult);

      const response = await request(app)
        .post('/api/result')
        .send({ value });

      expect(response.status).toBe(201);
    }

    expect(mockTokioAI.captureResult).toHaveBeenCalledTimes(results.length);

    // Request analysis
    const mockAnalysis = {
      timestamp: new Date().toISOString(),
      batchSize: results.length,
      results: mockTokioAI.results,
      frequencies: { '1': 1, '5': 2, '3': 1, '7': 1, '2': 1 },
      suggestion: 'Number 5 appears most frequently'
    };

    mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

    const analysisResponse = await request(app).get('/api/analysis');

    expect(analysisResponse.status).toBe(200);
    expect(analysisResponse.body.data.batchSize).toBe(results.length);
  });
});
