/**
 * TokioAI Adapter
 * 
 * This adapter provides a safe interface to the TokioAI module.
 * If the actual TokioAI implementation is not available or fails to load,
 * it falls back to stub implementations to ensure the server can run.
 * 
 * TODO: Once TokioAI implementation is fully integrated and tested,
 * remove the fallback stubs and import directly from tokioai.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let TokioAI = null;
let useStubs = false;

// Try to load the actual TokioAI implementation
try {
  const tokioPath = join(__dirname, 'tokioai.js');
  if (fs.existsSync(tokioPath)) {
    const module = await import('./tokioai.js');
    TokioAI = module.default || module.TokioAI;
    console.log('✓ TokioAI module loaded successfully');
  } else {
    console.warn('⚠ TokioAI module not found, using stub implementation');
    useStubs = true;
  }
} catch (error) {
  console.warn('⚠ Failed to load TokioAI module:', error.message);
  console.warn('⚠ Using stub implementation');
  useStubs = true;
}

/**
 * Stub implementation of TokioAI for fallback
 */
class TokioAIStub {
  constructor(config = {}) {
    this.config = config;
    this.results = [];
    this.analysis = null;
    console.warn('⚠ Using TokioAI stub - functionality is limited');
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
    const batchSize = count || this.config.batchSize || 10;
    const batch = this.results.slice(-batchSize);

    if (batch.length === 0) {
      return {
        error: 'No hay resultados para analizar',
        batch: [],
        stub: true
      };
    }

    // Simple frequency calculation
    const frequencies = {};
    batch.forEach(entry => {
      const val = entry.resultado;
      frequencies[val] = (frequencies[val] || 0) + 1;
    });

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
      suggestion: `Análisis básico: ${mostFrequent} aparece ${maxFreq} veces (stub)`,
      stub: true,
      statistics: {
        totalResults: this.results.length,
        mostFrequent,
        lastUpdate: new Date().toLocaleString('es-ES')
      }
    };

    return this.analysis;
  }

  async generatePDF(outputPath, includeStats = false) {
    // Stub: create a simple text file instead of PDF
    console.warn('⚠ generatePDF stub - creating text file instead');
    const content = `TokioAI Report (Stub)\nGenerated: ${new Date().toISOString()}\nResults: ${this.results.length}\n`;
    fs.writeFileSync(outputPath.replace('.pdf', '.txt'), content);
    return outputPath.replace('.pdf', '.txt');
  }

  saveEncrypted(filepath = null) {
    const data = {
      results: this.results,
      analysis: this.analysis,
      timestamp: Date.now(),
      stub: true
    };
    
    if (filepath) {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    }
    
    return data;
  }

  loadEncrypted(source) {
    let data;
    if (typeof source === 'string') {
      data = JSON.parse(fs.readFileSync(source, 'utf8'));
    } else {
      data = source;
    }
    
    this.results = data.results || [];
    this.analysis = data.analysis || null;
  }

  getStatistics() {
    return {
      currentResults: this.results.length,
      lastAnalysis: this.analysis ? this.analysis.timestamp : null,
      stub: true
    };
  }

  clearResults() {
    this.results = [];
    this.analysis = null;
  }

  close() {
    // Stub: nothing to close
  }
}

// Export the appropriate implementation
const TokioAIAdapter = useStubs ? TokioAIStub : TokioAI;

export default TokioAIAdapter;
export { TokioAIAdapter, useStubs };
