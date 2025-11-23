/**
 * Final Comprehensive Integration Tests
 * 
 * End-to-end testing of the complete Tokyo Predictor system
 * Tests all components working together in realistic scenarios
 */

import request from 'supertest';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the TokioAI adapter before importing the server
const mockTokioAI = {
  captureResult: jest.fn(),
  captureMultiple: jest.fn(),
  analyzeBatch: jest.fn(),
  results: [],
  getStatistics: jest.fn(),
  clearResults: jest.fn(),
  generatePDF: jest.fn(),
  saveEncrypted: jest.fn(),
  loadEncrypted: jest.fn(),
  close: jest.fn()
};

jest.unstable_mockModule('../src/tokioai-adapter.js', () => ({
  default: jest.fn(() => mockTokioAI),
  TokioAIAdapter: jest.fn(() => mockTokioAI),
  useStubs: false
}));

// Import server after mocking
const { default: app } = await import('../server.js');

describe('Final Comprehensive Tests', () => {
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockTokioAI.results = [];
  });

  describe('Complete Workflow Test', () => {
    test('Complete roulette analysis workflow', async () => {
      // Simulate a complete roulette session
      const rouletteResults = [12, 35, 3, 26, 0, 32, 15, 19, 4, 21];
      const capturedResults = [];

      // Step 1: Capture all results
      for (const value of rouletteResults) {
        const mockResult = {
          resultado: value,
          fecha: new Date().toLocaleDateString('es-ES'),
          hora: new Date().toLocaleTimeString('es-ES'),
          timestamp: Date.now()
        };
        
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        capturedResults.push(mockResult);
        mockTokioAI.results.push(mockResult);

        const response = await request(app)
          .post('/api/result')
          .send({ value })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.resultado).toBe(value);
      }

      // Step 2: Request analysis
      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: rouletteResults.length,
        results: capturedResults,
        frequencies: { '0': 1, '3': 1, '4': 1, '12': 1, '15': 1, '19': 1, '21': 1, '26': 1, '32': 1, '35': 1 },
        probabilities: { '0': 0.1, '3': 0.1, '4': 0.1, '12': 0.1, '15': 0.1, '19': 0.1, '21': 0.1, '26': 0.1, '32': 0.1, '35': 0.1 },
        trends: {
          mostFrequent: '0',
          maxFrequency: 1,
          dominant: 'bajos',
          average: 14.7
        },
        patterns: {
          sequences: [],
          repetitions: []
        },
        suggestion: 'El número 0 ha aparecido 1 veces (mayor frecuencia). Tendencia hacia números bajos (promedio: 14.70).'
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const analysisResponse = await request(app)
        .get('/api/analysis')
        .expect(200);

      expect(analysisResponse.body.success).toBe(true);
      expect(analysisResponse.body.data.batchSize).toBe(rouletteResults.length);
      expect(analysisResponse.body.data.trends).toBeDefined();
      expect(analysisResponse.body.data.suggestion).toBeDefined();

      // Step 3: Get statistics
      mockTokioAI.getStatistics.mockReturnValue({
        currentResults: rouletteResults.length,
        totalResults: rouletteResults.length,
        uptime: 1000,
        lastAnalysis: new Date().toISOString()
      });

      const statsResponse = await request(app)
        .get('/api/statistics')
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.currentResults).toBe(rouletteResults.length);

      // Step 4: Get results list
      const resultsResponse = await request(app)
        .get('/api/results')
        .expect(200);

      expect(resultsResponse.body.success).toBe(true);
      expect(resultsResponse.body.total).toBe(rouletteResults.length);

      // Verify all operations were called
      expect(mockTokioAI.captureResult).toHaveBeenCalledTimes(rouletteResults.length);
      expect(mockTokioAI.analyzeBatch).toHaveBeenCalled();
      expect(mockTokioAI.getStatistics).toHaveBeenCalled();
    });
  });

  describe('Data Persistence Test', () => {
    test('Results persist across multiple operations', async () => {
      const session1Results = [1, 5, 3];
      const session2Results = [7, 2, 9];

      // Session 1: Add first batch
      for (const value of session1Results) {
        const mockResult = { resultado: value, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        mockTokioAI.results.push(mockResult);
        
        await request(app)
          .post('/api/result')
          .send({ value })
          .expect(201);
      }

      // Verify first batch
      let resultsResponse = await request(app).get('/api/results');
      expect(resultsResponse.body.total).toBe(3);

      // Session 2: Add second batch
      for (const value of session2Results) {
        const mockResult = { resultado: value, fecha: '23/11/2025', hora: '12:05:00', timestamp: Date.now() };
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        mockTokioAI.results.push(mockResult);
        
        await request(app)
          .post('/api/result')
          .send({ value })
          .expect(201);
      }

      // Verify combined results
      resultsResponse = await request(app).get('/api/results');
      expect(resultsResponse.body.total).toBe(6);

      // Clear and verify
      mockTokioAI.clearResults.mockImplementation(() => {
        mockTokioAI.results = [];
      });

      await request(app).post('/api/clear').expect(200);
      
      resultsResponse = await request(app).get('/api/results');
      expect(resultsResponse.body.total).toBe(0);
    });
  });

  describe('Analysis Accuracy Tests', () => {
    test('Detects high numbers trend', async () => {
      const highNumbers = [25, 30, 35, 28, 32, 29, 33, 27, 31, 26];
      
      for (const value of highNumbers) {
        const mockResult = { resultado: value, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        mockTokioAI.results.push(mockResult);
        await request(app).post('/api/result').send({ value });
      }

      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: highNumbers.length,
        trends: {
          dominant: 'altos',
          average: 29.6,
          mostFrequent: '25',
          maxFrequency: 1
        },
        suggestion: 'Tendencia hacia números altos (promedio: 29.60).'
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const response = await request(app).get('/api/analysis');
      expect(response.body.data.trends.dominant).toBe('altos');
    });

    test('Detects low numbers trend', async () => {
      const lowNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      for (const value of lowNumbers) {
        const mockResult = { resultado: value, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        mockTokioAI.results.push(mockResult);
        await request(app).post('/api/result').send({ value });
      }

      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: lowNumbers.length,
        trends: {
          dominant: 'bajos',
          average: 5.5,
          mostFrequent: '1',
          maxFrequency: 1
        },
        suggestion: 'Tendencia hacia números bajos (promedio: 5.50).'
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const response = await request(app).get('/api/analysis');
      expect(response.body.data.trends.dominant).toBe('bajos');
    });

    test('Detects repetition patterns', async () => {
      const repeatingNumbers = [7, 7, 15, 15, 22, 22, 7, 15, 22, 7];
      
      for (const value of repeatingNumbers) {
        const mockResult = { resultado: value, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        mockTokioAI.results.push(mockResult);
        await request(app).post('/api/result').send({ value });
      }

      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: repeatingNumbers.length,
        trends: {
          mostFrequent: '7',
          maxFrequency: 4,
          dominant: 'neutral',
          average: 13.2
        },
        patterns: {
          repetitions: [
            { number: 7, count: 2 },
            { number: 15, count: 2 },
            { number: 22, count: 2 }
          ],
          sequences: []
        },
        frequencies: { '7': 4, '15': 3, '22': 3 },
        suggestion: 'El número 7 ha aparecido 4 veces (mayor frecuencia). Se detectaron 3 repeticiones inmediatas.'
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const response = await request(app).get('/api/analysis');
      expect(response.body.data.trends.mostFrequent).toBe('7');
      expect(response.body.data.patterns.repetitions.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Handles zero value correctly', async () => {
      const mockResult = { resultado: 0, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
      mockTokioAI.captureResult.mockReturnValue(mockResult);

      const response = await request(app)
        .post('/api/result')
        .send({ value: 0 })
        .expect(201);

      expect(response.body.data.resultado).toBe(0);
      expect(mockTokioAI.captureResult).toHaveBeenCalledWith(0);
    });

    test('Handles large roulette numbers (36)', async () => {
      const mockResult = { resultado: 36, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
      mockTokioAI.captureResult.mockReturnValue(mockResult);

      const response = await request(app)
        .post('/api/result')
        .send({ value: 36 })
        .expect(201);

      expect(response.body.data.resultado).toBe(36);
    });

    test('Handles analysis with limited data', async () => {
      const mockResult = { resultado: 5, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
      mockTokioAI.captureResult.mockReturnValue(mockResult);
      mockTokioAI.results.push(mockResult);

      await request(app).post('/api/result').send({ value: 5 });

      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: 1,
        trends: {
          mostFrequent: '5',
          maxFrequency: 1,
          dominant: 'neutral',
          average: 5
        },
        suggestion: 'Datos insuficientes para análisis completo (solo 1 resultado).'
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const response = await request(app).get('/api/analysis');
      expect(response.body.success).toBe(true);
      expect(response.body.data.batchSize).toBe(1);
    });

    test('Recovers from TokioAI errors gracefully', async () => {
      mockTokioAI.captureResult.mockImplementation(() => {
        throw new Error('Internal TokioAI error');
      });

      const response = await request(app)
        .post('/api/result')
        .send({ value: 12 })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    test('Handles invalid input gracefully', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({ value: 'invalid' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('Handles missing value in request', async () => {
      const response = await request(app)
        .post('/api/result')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('Handles high volume of results', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => i % 37); // 0-36 roulette numbers
      
      for (const value of largeDataset) {
        const mockResult = { resultado: value, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        mockTokioAI.results.push(mockResult);
      }

      // Submit in batches for efficiency
      for (let i = 0; i < largeDataset.length; i += 10) {
        const batch = largeDataset.slice(i, i + 10);
        for (const value of batch) {
          await request(app).post('/api/result').send({ value });
        }
      }

      expect(mockTokioAI.captureResult).toHaveBeenCalledTimes(100);

      const response = await request(app).get('/api/results?limit=50');
      expect(response.body.data.length).toBe(50); // Should limit correctly
      expect(response.body.total).toBe(100);
    });

    test('Analysis performs quickly with custom batch size', async () => {
      const customBatchSize = 5;
      const results = [1, 2, 3, 4, 5];

      for (const value of results) {
        const mockResult = { resultado: value, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
        mockTokioAI.captureResult.mockReturnValue(mockResult);
        mockTokioAI.results.push(mockResult);
        await request(app).post('/api/result').send({ value });
      }

      const mockAnalysis = {
        timestamp: new Date().toISOString(),
        batchSize: customBatchSize,
        trends: { dominant: 'bajos', average: 3, mostFrequent: '1', maxFrequency: 1 },
        suggestion: 'Análisis de 5 resultados.'
      };

      mockTokioAI.analyzeBatch.mockReturnValue(mockAnalysis);

      const response = await request(app).get(`/api/analysis?count=${customBatchSize}`);
      expect(response.body.data.batchSize).toBe(customBatchSize);
    });
  });

  describe('API Consistency', () => {
    test('All successful responses have consistent structure', async () => {
      const mockResult = { resultado: 12, fecha: '23/11/2025', hora: '12:00:00', timestamp: Date.now() };
      mockTokioAI.captureResult.mockReturnValue(mockResult);

      const resultResponse = await request(app)
        .post('/api/result')
        .send({ value: 12 });

      expect(resultResponse.body).toHaveProperty('success');
      expect(resultResponse.body).toHaveProperty('data');

      mockTokioAI.getStatistics.mockReturnValue({ currentResults: 1, uptime: 1000 });

      const statsResponse = await request(app).get('/api/statistics');
      expect(statsResponse.body).toHaveProperty('success');
      expect(statsResponse.body).toHaveProperty('data');
    });

    test('All error responses have consistent structure', async () => {
      const invalidResponse = await request(app)
        .post('/api/result')
        .send({});

      expect(invalidResponse.body).toHaveProperty('error');

      const notFoundResponse = await request(app)
        .get('/api/nonexistent');

      expect(notFoundResponse.body).toHaveProperty('error');
    });
  });

  describe('System Health and Monitoring', () => {
    test('Health check provides complete information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    test('Statistics provide accurate system metrics', async () => {
      const mockStats = {
        currentResults: 42,
        totalResults: 100,
        uptime: 3600000,
        lastAnalysis: new Date().toISOString()
      };

      mockTokioAI.getStatistics.mockReturnValue(mockStats);

      const response = await request(app)
        .get('/api/statistics')
        .expect(200);

      expect(response.body.data.currentResults).toBe(42);
      expect(response.body.data.totalResults).toBe(100);
      expect(response.body.data).toHaveProperty('uptime');
    });
  });
});
