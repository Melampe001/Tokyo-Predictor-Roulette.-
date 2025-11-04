/**
 * TokioAI Adapter - Loads existing TokioAI or provides stub fallbacks
 * 
 * This adapter ensures the server can run even if the TokioAI implementation
 * needs finishing. Replace stubs with real TokioAI implementation when ready.
 */

let TokioAI;
let isStubMode = false;

try {
  // Try to import the real TokioAI implementation
  const module = await import('./tokioai.js');
  TokioAI = module.default || module.TokioAI;
  console.log('✓ TokioAI implementation loaded successfully');
} catch (error) {
  console.warn('⚠ TokioAI implementation not found, using stub mode');
  console.warn('  Error:', error.message);
  isStubMode = true;
  
  // Stub implementation
  TokioAI = class TokioAIStub {
    constructor(config = {}) {
      this.config = config;
      this.results = [];
      this.analysis = null;
      console.log('TokioAI Stub initialized with config:', config);
    }

    captureResult(result) {
      const timestamp = new Date();
      const entry = {
        resultado: result,
        fecha: timestamp.toLocaleDateString('es-ES'),
        hora: timestamp.toLocaleTimeString('es-ES'),
        timestamp: timestamp.getTime()
      };
      this.results.push(entry);
      console.log('Stub: Result captured:', result);
      return entry;
    }

    captureMultiple(results) {
      return results.map(r => this.captureResult(r));
    }

    analyzeBatch(count = null) {
      const batchSize = count || this.config.batchSize || 10;
      const batch = this.results.slice(-batchSize);
      
      if (batch.length === 0) {
        return {
          error: 'No hay resultados para analizar',
          batch: []
        };
      }

      // Simple frequency calculation
      const frequencies = {};
      batch.forEach(entry => {
        const val = entry.resultado;
        frequencies[val] = (frequencies[val] || 0) + 1;
      });

      // Basic analysis
      this.analysis = {
        timestamp: new Date().toISOString(),
        batchSize: batch.length,
        results: batch,
        frequencies,
        patterns: { sequences: [], repetitions: [], gaps: [] },
        trends: { 
          mostFrequent: Object.keys(frequencies)[0],
          maxFrequency: Object.values(frequencies)[0] || 0,
          dominant: 'neutral'
        },
        probabilities: {},
        suggestion: 'Stub mode: Replace with real TokioAI implementation for accurate analysis.',
        statistics: {
          totalResults: this.results.length,
          lastUpdate: new Date().toLocaleString('es-ES')
        }
      };

      console.log('Stub: Analysis completed for', batch.length, 'results');
      return this.analysis;
    }

    async generatePDF(outputPath, includeStats = false) {
      console.log('Stub: PDF generation requested for:', outputPath);
      // TODO: Implement real PDF generation
      return outputPath;
    }

    saveEncrypted(filepath = null) {
      console.log('Stub: Save encrypted requested:', filepath);
      // TODO: Implement real encryption
      const encrypted = {
        encrypted: 'stub_encrypted_data',
        iv: 'stub_iv',
        authTag: 'stub_auth_tag'
      };
      return encrypted;
    }

    loadEncrypted(source) {
      console.log('Stub: Load encrypted requested');
      // TODO: Implement real decryption
    }

    startWebSocketServer(port = null) {
      console.log('Stub: WebSocket server start requested on port:', port);
      // TODO: Implement real WebSocket server
      return port || this.config.wsPort || 8080;
    }

    getStatistics() {
      return {
        currentResults: this.results.length,
        totalResults: this.results.length,
        totalAnalyses: 0,
        uptime: 0,
        lastAnalysis: this.analysis ? this.analysis.timestamp : null
      };
    }

    clearResults() {
      this.results = [];
      this.analysis = null;
      console.log('Stub: Results cleared');
    }

    close() {
      console.log('Stub: Close requested');
    }

    on() {} // Event emitter stub
    emit() {} // Event emitter stub
  };
}

export { TokioAI, isStubMode };
export default TokioAI;
