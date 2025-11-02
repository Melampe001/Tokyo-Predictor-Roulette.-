import TokioAI from '../src/tokioai.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ejemplo de uso del módulo TokioAI
 */
async function main() {
  console.log('=== TokioAI - Ejemplo de Uso ===\n');

  // 1. Crear instancia de TokioAI
  console.log('1. Inicializando TokioAI...');
  const tokio = new TokioAI({
    batchSize: 10,
    encryption: true,
    autoAnalyze: true
  });

  // Escuchar eventos
  tokio.on('result-captured', (result) => {
    console.log(`   ✓ Resultado capturado: ${result.resultado} (${result.hora})`);
  });

  tokio.on('analysis-complete', (analysis) => {
    console.log(`   ✓ Análisis completado: ${analysis.batchSize} resultados analizados`);
  });

  // 2. Captura manual de resultados
  console.log('\n2. Capturando resultados manualmente...');
  const sampleResults = [12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25];
  
  sampleResults.forEach(result => {
    tokio.captureResult(result);
  });

  // 3. Análisis de lote
  console.log('\n3. Ejecutando análisis de lote...');
  const analysis = tokio.analyzeBatch();
  
  console.log('\n   Resultados del análisis:');
  console.log(`   - Total resultados: ${analysis.batchSize}`);
  console.log(`   - Número más frecuente: ${analysis.trends.mostFrequent} (${analysis.trends.maxFrequency} veces)`);
  console.log(`   - Tendencia dominante: ${analysis.trends.dominant}`);
  console.log(`   - Promedio: ${analysis.trends.average}`);
  console.log(`   - Sugerencia: ${analysis.suggestion}`);

  // 4. Probabilidades
  console.log('\n   Probabilidades calculadas:');
  const topProbabilities = Object.entries(analysis.probabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  topProbabilities.forEach(([value, prob]) => {
    console.log(`   - ${value}: ${(prob * 100).toFixed(2)}%`);
  });

  // 5. Generación de PDF
  console.log('\n4. Generando reporte PDF...');
  try {
    const outputPath = path.join(__dirname, '../output/reporte.pdf');
    
    // Crear directorio de salida si no existe
    const fs = await import('fs');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await tokio.generatePDF(outputPath, false);
    console.log(`   ✓ PDF generado: ${outputPath}`);

    // Generar también reporte con estadísticas
    const summaryPath = path.join(__dirname, '../output/reporte-estadistico.pdf');
    await tokio.generatePDF(summaryPath, true);
    console.log(`   ✓ PDF estadístico generado: ${summaryPath}`);
  } catch (error) {
    console.error(`   ✗ Error al generar PDF: ${error.message}`);
  }

  // 6. Encriptación de datos
  console.log('\n5. Guardando datos encriptados...');
  try {
    const encryptedPath = path.join(__dirname, '../output/data.encrypted');
    const encrypted = tokio.saveEncrypted(encryptedPath);
    console.log(`   ✓ Datos encriptados guardados: ${encryptedPath}`);
    console.log(`   - IV: ${encrypted.iv.substring(0, 16)}...`);
    console.log(`   - AuthTag: ${encrypted.authTag.substring(0, 16)}...`);
  } catch (error) {
    console.error(`   ✗ Error al encriptar: ${error.message}`);
  }

  // 7. Estadísticas generales
  console.log('\n6. Estadísticas del sistema:');
  const stats = tokio.getStatistics();
  console.log(`   - Total de resultados: ${stats.currentResults}`);
  console.log(`   - Total de análisis: ${stats.totalAnalyses}`);
  console.log(`   - Tiempo activo: ${(stats.uptime / 1000).toFixed(2)}s`);

  // 8. Demostración de WebSocket (comentado por defecto)
  console.log('\n7. WebSocket (servidor/cliente):');
  console.log('   Para usar WebSocket, descomente la sección correspondiente en el código.');
  console.log('   Servidor: tokio.startWebSocketServer(8080)');
  console.log('   Cliente: tokio.connectWebSocket("ws://localhost:8080")');

  /*
  // Ejemplo de servidor WebSocket
  const port = tokio.startWebSocketServer(8080);
  console.log(`   ✓ Servidor WebSocket iniciado en puerto ${port}`);
  
  // Ejemplo de cliente WebSocket (en otra instancia)
  const tokioClient = new TokioAI();
  tokioClient.connectWebSocket('ws://localhost:8080');
  */

  console.log('\n=== Ejemplo completado ===\n');

  // Limpiar
  tokio.close();
}

// Ejecutar ejemplo
main().catch(console.error);
