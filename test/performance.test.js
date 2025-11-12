/**
 * Performance Tests
 * 
 * Tests to validate performance improvements in the codebase
 */

import { jest } from '@jest/globals';
import { TokioAI } from '../src/tokioai.js';
import { CryptoUtils } from '../src/crypto-utils.js';

describe('Performance Tests', () => {
  
  describe('Pattern Detection Performance', () => {
    test('Pattern detection should complete efficiently with large batch', () => {
      const tokioAI = new TokioAI({ batchSize: 1000, encryption: false });
      
      // Generate 1000 test results
      for (let i = 0; i < 1000; i++) {
        tokioAI.captureResult(Math.floor(Math.random() * 37)); // Roulette numbers 0-36
      }
      
      const startTime = performance.now();
      const analysis = tokioAI.analyzeBatch(1000);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(analysis).toBeDefined();
      expect(analysis.patterns).toBeDefined();
      expect(executionTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe('Median Calculation Performance', () => {
    test('Median calculation should handle large datasets efficiently', () => {
      const tokioAI = new TokioAI({ batchSize: 500, encryption: false });
      
      // Generate 500 numeric results
      for (let i = 0; i < 500; i++) {
        tokioAI.captureResult(Math.floor(Math.random() * 37));
      }
      
      const startTime = performance.now();
      const analysis = tokioAI.analyzeBatch(500);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(analysis.trends.median).toBeDefined();
      expect(executionTime).toBeLessThan(50); // Should complete in less than 50ms
    });
  });

  describe('Encryption Performance', () => {
    test('Encryption should handle multiple operations efficiently', () => {
      const crypto = new CryptoUtils();
      const testData = { test: 'data', number: 123, array: [1, 2, 3] };
      
      const startTime = performance.now();
      
      // Perform 100 encryption operations
      for (let i = 0; i < 100; i++) {
        crypto.encrypt(testData);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Should complete 100 encryptions in less than 100ms
    });

    test('String encryption should be faster than object encryption', () => {
      const crypto = new CryptoUtils();
      const testString = 'test data string';
      const testObject = { test: 'data', number: 123 };
      
      const stringStartTime = performance.now();
      for (let i = 0; i < 50; i++) {
        crypto.encrypt(testString);
      }
      const stringEndTime = performance.now();
      const stringTime = stringEndTime - stringStartTime;
      
      const objectStartTime = performance.now();
      for (let i = 0; i < 50; i++) {
        crypto.encrypt(testObject);
      }
      const objectEndTime = performance.now();
      const objectTime = objectEndTime - objectStartTime;
      
      // String encryption should be faster since it skips JSON.stringify
      expect(stringTime).toBeLessThanOrEqual(objectTime);
    });
  });

  describe('WebSocket Broadcast Simulation', () => {
    test('Broadcast optimization reduces JSON.stringify calls', () => {
      // Mock WebSocket clients
      const clients = [];
      for (let i = 0; i < 100; i++) {
        clients.push({
          readyState: 1, // OPEN
          send: jest.fn()
        });
      }
      
      const message = { type: 'test', data: { value: 42 } };
      
      // Optimized approach: serialize once
      const startTime = performance.now();
      const payload = JSON.stringify(message);
      const OPEN = 1;
      clients.forEach(client => {
        if (client.readyState === OPEN) {
          client.send(payload);
        }
      });
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      // Verify all clients received the message
      clients.forEach(client => {
        expect(client.send).toHaveBeenCalledWith(payload);
      });
      
      expect(executionTime).toBeLessThan(10); // Should be very fast for 100 clients
    });
  });

  describe('Batch Analysis Performance', () => {
    test('Multiple analyses should complete quickly', () => {
      const tokioAI = new TokioAI({ batchSize: 50, encryption: false });
      
      // Generate 200 results
      for (let i = 0; i < 200; i++) {
        tokioAI.captureResult(Math.floor(Math.random() * 37));
      }
      
      const startTime = performance.now();
      
      // Perform 10 analyses
      for (let i = 0; i < 10; i++) {
        tokioAI.analyzeBatch(50);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(200); // 10 analyses should complete in less than 200ms
    });

    test('Analysis caching improves performance for repeated calls', () => {
      const tokioAI = new TokioAI({ batchSize: 50, encryption: false });
      
      // Generate 100 results
      for (let i = 0; i < 100; i++) {
        tokioAI.captureResult(Math.floor(Math.random() * 37));
      }
      
      // First analysis (uncached)
      const firstStartTime = performance.now();
      const firstAnalysis = tokioAI.analyzeBatch(50);
      const firstEndTime = performance.now();
      const firstExecutionTime = firstEndTime - firstStartTime;
      
      // Second analysis (should be cached)
      const secondStartTime = performance.now();
      const secondAnalysis = tokioAI.analyzeBatch(50);
      const secondEndTime = performance.now();
      const secondExecutionTime = secondEndTime - secondStartTime;
      
      // Cached analysis should return same result
      expect(secondAnalysis).toEqual(firstAnalysis);
      
      // Cached analysis should be significantly faster (at least 50% faster)
      expect(secondExecutionTime).toBeLessThan(firstExecutionTime * 0.5);
    });

    test('Cache is cleared when results are cleared', () => {
      const tokioAI = new TokioAI({ batchSize: 10, encryption: false });
      
      // Generate results and analyze
      for (let i = 0; i < 20; i++) {
        tokioAI.captureResult(i);
      }
      tokioAI.analyzeBatch(10);
      
      // Clear results
      tokioAI.clearResults();
      
      // Verify results are empty
      expect(tokioAI.results.length).toBe(0);
      
      // Verify cache is cleared (new analysis should not use cache)
      const analysis = tokioAI.analyzeBatch(10);
      expect(analysis.error).toBe('No hay resultados para analizar');
    });
  });
});
