import TokioAI from '../src/tokioai.js';
import { CryptoUtils } from '../src/crypto-utils.js';
import assert from 'assert';

/**
 * Suite de pruebas para TokioAI
 */

console.log('=== TokioAI Test Suite ===\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failedTests++;
  }
}

// Test 1: Inicialización
test('Inicialización de TokioAI', () => {
  const tokio = new TokioAI();
  assert(tokio !== null, 'Instancia creada');
  assert(tokio.results.length === 0, 'Sin resultados iniciales');
  tokio.close();
});

// Test 2: Captura de resultados
test('Captura de resultados', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  const result = tokio.captureResult(12);
  
  assert(result.resultado === 12, 'Resultado correcto');
  assert(result.fecha !== undefined, 'Fecha registrada');
  assert(result.hora !== undefined, 'Hora registrada');
  assert(tokio.results.length === 1, 'Un resultado guardado');
  tokio.close();
});

// Test 3: Captura múltiple
test('Captura múltiple de resultados', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  const results = tokio.captureMultiple([1, 2, 3, 4, 5]);
  
  assert(results.length === 5, 'Cinco resultados capturados');
  assert(tokio.results.length === 5, 'Cinco resultados guardados');
  tokio.close();
});

// Test 4: Análisis de lote
test('Análisis de lote', () => {
  const tokio = new TokioAI({ autoAnalyze: false, batchSize: 10 });
  tokio.captureMultiple([12, 35, 3, 26, 0, 32, 15, 19, 4, 21]);
  
  const analysis = tokio.analyzeBatch();
  
  assert(analysis.batchSize === 10, 'Tamaño de lote correcto');
  assert(analysis.frequencies !== undefined, 'Frecuencias calculadas');
  assert(analysis.trends !== undefined, 'Tendencias calculadas');
  assert(analysis.probabilities !== undefined, 'Probabilidades calculadas');
  assert(analysis.suggestion !== undefined, 'Sugerencia generada');
  tokio.close();
});

// Test 5: Cálculo de frecuencias
test('Cálculo de frecuencias', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  tokio.captureMultiple([5, 5, 5, 10, 10, 15]);
  
  const analysis = tokio.analyzeBatch();
  
  assert(analysis.frequencies['5'] === 3, 'Frecuencia correcta para 5');
  assert(analysis.frequencies['10'] === 2, 'Frecuencia correcta para 10');
  assert(analysis.frequencies['15'] === 1, 'Frecuencia correcta para 15');
  tokio.close();
});

// Test 6: Tendencia dominante
test('Detección de tendencia dominante', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  tokio.captureMultiple([7, 7, 7, 7, 7]);
  
  const analysis = tokio.analyzeBatch();
  
  assert(analysis.trends.mostFrequent === '7', 'Número más frecuente correcto');
  assert(analysis.trends.maxFrequency === 5, 'Frecuencia máxima correcta');
  tokio.close();
});

// Test 7: Probabilidades
test('Cálculo de probabilidades', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  tokio.captureMultiple([1, 1, 2, 2, 2, 2, 3, 3, 3, 4]);
  
  const analysis = tokio.analyzeBatch();
  
  assert(analysis.probabilities['2'] === 0.4, 'Probabilidad correcta (40%)');
  assert(analysis.probabilities['3'] === 0.3, 'Probabilidad correcta (30%)');
  assert(analysis.probabilities['1'] === 0.2, 'Probabilidad correcta (20%)');
  tokio.close();
});

// Test 8: Detección de patrones
test('Detección de patrones - secuencias', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  tokio.captureMultiple([1, 2, 3, 4, 10, 11, 20]);
  
  const analysis = tokio.analyzeBatch();
  
  assert(analysis.patterns.sequences.length > 0, 'Secuencias detectadas');
  tokio.close();
});

// Test 9: Detección de repeticiones
test('Detección de patrones - repeticiones', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  tokio.captureMultiple([5, 5, 10, 10, 15]);
  
  const analysis = tokio.analyzeBatch();
  
  assert(analysis.patterns.repetitions.length > 0, 'Repeticiones detectadas');
  tokio.close();
});

// Test 10: Encriptación
test('Encriptación de datos', () => {
  const tokio = new TokioAI({ encryption: true, autoAnalyze: false });
  tokio.captureMultiple([1, 2, 3]);
  
  const encrypted = tokio.saveEncrypted();
  
  assert(encrypted.encrypted !== undefined, 'Datos encriptados');
  assert(encrypted.iv !== undefined, 'IV presente');
  assert(encrypted.authTag !== undefined, 'AuthTag presente');
  tokio.close();
});

// Test 11: Desencriptación
test('Desencriptación de datos', () => {
  const tokio = new TokioAI({ encryption: true, autoAnalyze: false });
  tokio.captureMultiple([10, 20, 30]);
  
  const encrypted = tokio.saveEncrypted();
  
  const tokio2 = new TokioAI({ 
    encryption: true, 
    autoAnalyze: false,
    masterKey: tokio.crypto.masterKey 
  });
  tokio2.loadEncrypted(encrypted);
  
  assert(tokio2.results.length === 3, 'Resultados restaurados');
  assert(tokio2.results[0].resultado === 10, 'Primer resultado correcto');
  
  tokio.close();
  tokio2.close();
});

// Test 12: CryptoUtils
test('CryptoUtils - Encriptación/Desencriptación', () => {
  const crypto = new CryptoUtils();
  const data = { test: 'data', number: 123 };
  
  const encrypted = crypto.encrypt(data);
  const decrypted = crypto.decrypt(encrypted);
  
  assert(decrypted.test === 'data', 'Dato string correcto');
  assert(decrypted.number === 123, 'Dato numérico correcto');
});

// Test 13: CryptoUtils - Hash
test('CryptoUtils - Generación de hash', () => {
  const crypto = new CryptoUtils();
  const hash1 = crypto.generateHash('test data');
  const hash2 = crypto.generateHash('test data');
  const hash3 = crypto.generateHash('different data');
  
  assert(hash1 === hash2, 'Hashes iguales para mismos datos');
  assert(hash1 !== hash3, 'Hashes diferentes para datos diferentes');
});

// Test 14: CryptoUtils - Exportar/Importar clave
test('CryptoUtils - Exportar/Importar clave', () => {
  const crypto1 = new CryptoUtils();
  const key = crypto1.exportKey();
  
  const crypto2 = new CryptoUtils();
  crypto2.importKey(key);
  
  const data = { test: 'secret' };
  const encrypted = crypto1.encrypt(data);
  const decrypted = crypto2.decrypt(encrypted);
  
  assert(decrypted.test === 'secret', 'Clave importada correctamente');
});

// Test 15: Estadísticas
test('Obtención de estadísticas', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  tokio.captureMultiple([1, 2, 3, 4, 5]);
  
  const stats = tokio.getStatistics();
  
  assert(stats.currentResults === 5, 'Conteo de resultados correcto');
  assert(stats.totalResults === 5, 'Total de resultados correcto');
  assert(stats.uptime !== undefined, 'Uptime registrado');
  tokio.close();
});

// Test 16: Limpieza de resultados
test('Limpieza de resultados', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  tokio.captureMultiple([1, 2, 3]);
  
  assert(tokio.results.length === 3, 'Tres resultados antes de limpiar');
  
  tokio.clearResults();
  
  assert(tokio.results.length === 0, 'Sin resultados después de limpiar');
  assert(tokio.analysis === null, 'Análisis limpiado');
  tokio.close();
});

// Test 17: Eventos - result-captured
test('Eventos - result-captured', (done) => {
  const tokio = new TokioAI({ autoAnalyze: false });
  let eventFired = false;
  
  tokio.on('result-captured', (result) => {
    eventFired = true;
    assert(result.resultado === 25, 'Evento con datos correctos');
  });
  
  tokio.captureResult(25);
  
  assert(eventFired, 'Evento result-captured disparado');
  tokio.close();
});

// Test 18: Eventos - analysis-complete
test('Eventos - analysis-complete', () => {
  const tokio = new TokioAI({ autoAnalyze: false });
  let eventFired = false;
  
  tokio.on('analysis-complete', (analysis) => {
    eventFired = true;
    assert(analysis.batchSize > 0, 'Evento con análisis válido');
  });
  
  tokio.captureMultiple([1, 2, 3, 4, 5]);
  tokio.analyzeBatch();
  
  assert(eventFired, 'Evento analysis-complete disparado');
  tokio.close();
});

// Test 19: Auto-análisis
test('Auto-análisis al completar lote', () => {
  const tokio = new TokioAI({ autoAnalyze: true, batchSize: 5 });
  let analysisCount = 0;
  
  tokio.on('analysis-complete', () => {
    analysisCount++;
  });
  
  // Agregar exactamente batchSize resultados
  tokio.captureMultiple([1, 2, 3, 4, 5]);
  
  assert(analysisCount === 1, 'Auto-análisis ejecutado');
  assert(tokio.analysis !== null, 'Análisis guardado');
  tokio.close();
});

// Test 20: Configuración personalizada
test('Configuración personalizada', () => {
  const tokio = new TokioAI({
    batchSize: 15,
    encryption: false,
    autoAnalyze: false,
    wsPort: 9000
  });
  
  assert(tokio.config.batchSize === 15, 'Batch size personalizado');
  assert(tokio.config.encryption === false, 'Encriptación deshabilitada');
  assert(tokio.config.autoAnalyze === false, 'Auto-análisis deshabilitado');
  assert(tokio.config.wsPort === 9000, 'Puerto personalizado');
  tokio.close();
});

// Resumen
console.log('\n=== Resumen ===');
console.log(`Total: ${passedTests + failedTests} tests`);
console.log(`✓ Pasados: ${passedTests}`);
console.log(`✗ Fallados: ${failedTests}`);

if (failedTests === 0) {
  console.log('\n¡Todas las pruebas pasaron exitosamente! 🎉');
  process.exit(0);
} else {
  console.log(`\n${failedTests} prueba(s) fallaron.`);
  process.exit(1);
}
