# Tokyo Predictor Roulette

Proyecto de análisis predictivo para casino privado Android con módulo de IA.

## TokioAI - Módulo de Análisis Predictivo

TokioAI es un módulo de agente IA diseñado para análisis predictivo, integración dinámica de RNG y seguridad reforzada.

### Características Principales

- ✅ **Captura y Sincronización**: Resultados manuales o vía WebSocket
- ✅ **Análisis por Lotes**: Procesa grupos de 10 resultados con cálculo de tendencias
- ✅ **Sugerencias Optimizadas**: Recomendaciones basadas en patrones y frecuencias
- ✅ **Encriptación Local**: Seguridad con AES-256-GCM
- ✅ **Generación de PDF**: Reportes con columnas: Resultado, Probabilidad, Fecha, Hora

### Instalación

```bash
npm install
```

### Uso Rápido

```javascript
import TokioAI from './src/tokioai.js';

// Crear instancia
const tokio = new TokioAI({
  batchSize: 10,
  encryption: true,
  autoAnalyze: true
});

// Capturar resultados
tokio.captureResult(12);
tokio.captureResult(35);

// Análisis
const analysis = tokio.analyzeBatch();
console.log(analysis.suggestion);

// Generar PDF
await tokio.generatePDF('./reporte.pdf');
```

### Pruebas y Ejemplos

```bash
# Ejecutar tests
npm test

# Ejecutar ejemplo
npm run example
```

### Documentación Completa

Para documentación completa, ver [TOKIOAI_README.md](./TOKIOAI_README.md)

## Workflows CI/CD

Este proyecto incluye workflows para:
- Flutter Build (Android APK)
- Node.js Testing (múltiples versiones y sistemas operativos)

## Licencia

Ver [LICENSE](./LICENSE) para más detalles. 
