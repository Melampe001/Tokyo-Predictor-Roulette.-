/**
 * TokioAI Adapter
 * 
 * This adapter provides a stable interface to the TokioAI module.
 * It attempts to import the real implementation and falls back to stub functions
 * if the module is not available or fails to load.
 * 
 * TODO: Maintainers should ensure the real TokioAI implementation is properly
 * integrated and remove stub fallbacks once verified.
 */

let TokioAI = null;
let usingStub = false;

try {
  // Try to import the real TokioAI implementation
  const module = await import('./tokioai.js');
  TokioAI = module.default || module.TokioAI;
  console.log('✓ TokioAI module loaded successfully');
} catch (error) {
  console.warn('⚠ TokioAI module not available, using stub implementation');
  console.warn('  Error:', error.message);
  usingStub = true;
}

/**
 * Stub TokioAI implementation
 * TODO: Replace with real TokioAI implementation
 */
class TokioAIStub {
  constructor(config = {}) {
    this.config = {
      batchSize: config.batchSize || 10,
      encryption: config.encryption !== false,
      ...config
    };
    this.results = [];
    this.analysis = null;
    console.log('⚠ Using TokioAI stub implementation');
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
    return entry;
  }

  captureMultiple(results) {
    return results.map(r => this.captureResult(r));
  }

  analyzeBatch(count = null) {
    const batchSize = count || this.config.batchSize;
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

    // Find most frequent
    let mostFrequent = null;
    let maxFreq = 0;
    for (const [value, freq] of Object.entries(frequencies)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostFrequent = value;
      }
    }

    this.analysis = {
      timestamp: new Date().toISOString(),
      batchSize: batch.length,
      results: batch,
      frequencies,
      patterns: { sequences: [], repetitions: [], gaps: [] },
      trends: {
        mostFrequent,
        maxFrequency: maxFreq,
        dominant: 'neutral'
      },
      probabilities: {},
      suggestion: `Análisis básico: ${mostFrequent} apareció ${maxFreq} veces.`,
      statistics: {
        totalResults: this.results.length,
        dominantTrend: 'neutral',
        mostFrequent,
        accuracy: 0.5,
        lastUpdate: new Date().toLocaleString('es-ES')
      }
    };

    return this.analysis;
  }

  async generatePDF(outputPath, includeStats = false) {
    // Stub implementation
    console.warn('⚠ generatePDF stub called - PDF generation not available');
    return outputPath;
  }

  saveEncrypted(filepath = null) {
    // Stub implementation
    const data = {
      results: this.results,
      analysis: this.analysis,
      timestamp: Date.now()
    };
    
    console.warn('⚠ saveEncrypted stub called - encryption not available');
    return {
      encrypted: Buffer.from(JSON.stringify(data)).toString('base64'),
      iv: 'stub-iv',
      authTag: 'stub-auth-tag'
    };
  }

  loadEncrypted(source) {
    console.warn('⚠ loadEncrypted stub called - encryption not available');
  }

  getStatistics() {
    return {
      totalResults: this.results.length,
      currentResults: this.results.length,
      lastAnalysis: this.analysis ? this.analysis.timestamp : null,
      uptime: 0
    };
  }

  clearResults() {
    this.results = [];
    this.analysis = null;
  }

  close() {
    // No-op for stub
  }
}

// Use real implementation if available, otherwise use stub
if (!TokioAI) {
  TokioAI = TokioAIStub;
}

/**
 * Adapter functions that wrap TokioAI functionality
 * These provide a stable API for the server to use
 */

export function createTokioAI(config = {}) {
  return new TokioAI(config);
}

export function captureResult(tokioInstance, result) {
  if (!tokioInstance) {
    throw new Error('TokioAI instance not provided');
  }
  return tokioInstance.captureResult(result);
}

export function analyzeBatch(tokioInstance, count = null) {
  if (!tokioInstance) {
    throw new Error('TokioAI instance not provided');
  }
  return tokioInstance.analyzeBatch(count);
}

export async function generatePDF(tokioInstance, outputPath, includeStats = false) {
  if (!tokioInstance) {
    throw new Error('TokioAI instance not provided');
  }
  return await tokioInstance.generatePDF(outputPath, includeStats);
}

export function saveEncrypted(tokioInstance, filepath = null) {
  if (!tokioInstance) {
    throw new Error('TokioAI instance not provided');
  }
  return tokioInstance.saveEncrypted(filepath);
}

export function isUsingStub() {
  return usingStub;
}

export default {
  createTokioAI,
  captureResult,
  analyzeBatch,
  generatePDF,
  saveEncrypted,
  isUsingStub
};
