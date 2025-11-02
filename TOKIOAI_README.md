# TokioAI

Módulo de agente IA para análisis predictivo, integración dinámica de RNG y seguridad reforzada, adaptable para casino privado Android.

## Características

- ✅ **Captura y Sincronización**: Resultados manuales o vía WebSocket
- ✅ **Análisis por Lotes**: Procesa grupos de 10 resultados con cálculo de tendencias
- ✅ **Sugerencias Optimizadas**: Recomendaciones basadas en patrones y frecuencias
- ✅ **Encriptación Local**: Seguridad con AES-256-GCM
- ✅ **Acceso Seguro**: Compatible con autenticación biométrica (implementación en cliente)
- ✅ **Generación de PDF**: Reportes instantáneos con columnas: Resultado, Probabilidad, Fecha, Hora

## Instalación

```bash
npm install
```

## Uso en JavaScript

### Ejemplo Básico

```javascript
import TokioAI from './src/tokioai.js';

// Crear instancia
const tokio = new TokioAI({
  batchSize: 10,        // Tamaño del lote para análisis
  encryption: true,     // Habilitar encriptación
  autoAnalyze: true,    // Análisis automático al completar lote
  wsPort: 8080         // Puerto para servidor WebSocket
});

// Capturar resultados manualmente
tokio.captureResult(12);
tokio.captureResult(35);
tokio.captureResult(3);

// O capturar múltiples
tokio.captureMultiple([26, 0, 32, 15, 19, 4, 21]);

// Análisis manual
const analysis = tokio.analyzeBatch();
console.log(analysis.suggestion); // Sugerencia optimizada
console.log(analysis.probabilities); // Probabilidades calculadas

// Generar PDF
await tokio.generatePDF('./reporte.pdf');
```

### Eventos

TokioAI emite eventos para notificar cambios:

```javascript
// Resultado capturado
tokio.on('result-captured', (result) => {
  console.log(`Nuevo resultado: ${result.resultado}`);
});

// Análisis completado
tokio.on('analysis-complete', (analysis) => {
  console.log(`Análisis: ${analysis.suggestion}`);
});

// Datos cargados
tokio.on('data-loaded', (info) => {
  console.log(`${info.resultCount} resultados cargados`);
});
```

### Sincronización WebSocket

#### Servidor

```javascript
// Iniciar servidor WebSocket
tokio.startWebSocketServer(8080);

tokio.on('ws-client-connected', () => {
  console.log('Cliente conectado');
});

tokio.on('ws-client-disconnected', () => {
  console.log('Cliente desconectado');
});
```

#### Cliente

```javascript
// Conectar a servidor WebSocket
tokio.connectWebSocket('ws://servidor:8080');

tokio.on('ws-connected', () => {
  console.log('Conectado al servidor');
  
  // Enviar resultado
  tokio.sendWebSocketMessage({
    type: 'result',
    value: 25
  });
  
  // Solicitar análisis
  tokio.sendWebSocketMessage({
    type: 'request-analysis'
  });
});

tokio.on('ws-message', (message) => {
  if (message.type === 'analysis') {
    console.log('Análisis recibido:', message.data);
  }
});
```

### Encriptación y Seguridad

```javascript
// Guardar datos encriptados
tokio.saveEncrypted('./data.encrypted');

// Cargar datos encriptados
tokio.loadEncrypted('./data.encrypted');

// Usar clave maestra personalizada
const tokioSecure = new TokioAI({
  encryption: true,
  masterKey: Buffer.from('tu-clave-de-32-bytes-aqui-segura!', 'utf8')
});
```

### Generación de PDF

```javascript
// PDF con resultados básicos
await tokio.generatePDF('./reporte.pdf', false);

// PDF con estadísticas completas
await tokio.generatePDF('./reporte-estadistico.pdf', true);
```

## Estructura del Análisis

El método `analyzeBatch()` retorna un objeto con la siguiente estructura:

```javascript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  batchSize: 10,
  results: [
    {
      resultado: 12,
      fecha: "15/1/2024",
      hora: "10:25:30",
      timestamp: 1705315530000
    },
    // ... más resultados
  ],
  frequencies: {
    "12": 2,
    "35": 1,
    "3": 1,
    // ... más frecuencias
  },
  patterns: {
    sequences: [[3, 4], [19, 20]],  // Secuencias consecutivas
    repetitions: [12],               // Repeticiones inmediatas
    gaps: []
  },
  trends: {
    mostFrequent: "12",
    maxFrequency: 2,
    average: "18.50",
    median: 17,
    dominant: "neutral"  // "altos", "bajos", o "neutral"
  },
  probabilities: {
    "12": 0.2,   // 20%
    "35": 0.1,   // 10%
    // ... más probabilidades
  },
  suggestion: "El número 12 ha aparecido 2 veces (mayor frecuencia)...",
  statistics: {
    totalResults: 12,
    dominantTrend: "neutral",
    mostFrequent: "12",
    accuracy: 0.65,
    lastUpdate: "15/1/2024, 10:30:00"
  }
}
```

## API Completa

### Constructor

```javascript
new TokioAI(config)
```

**Configuración:**
- `batchSize` (number): Tamaño del lote para análisis (default: 10)
- `encryption` (boolean): Habilitar encriptación (default: true)
- `autoAnalyze` (boolean): Análisis automático (default: true)
- `wsPort` (number): Puerto WebSocket (default: 8080)
- `masterKey` (Buffer): Clave maestra para encriptación (opcional)

### Métodos

#### Captura de Resultados

- `captureResult(result)`: Captura un resultado
- `captureMultiple(results)`: Captura múltiples resultados

#### Análisis

- `analyzeBatch(count)`: Analiza últimos N resultados
- `getStatistics()`: Obtiene estadísticas generales

#### Persistencia

- `saveEncrypted(filepath)`: Guarda datos encriptados
- `loadEncrypted(source)`: Carga datos encriptados
- `generatePDF(outputPath, includeStats)`: Genera reporte PDF

#### WebSocket

- `startWebSocketServer(port)`: Inicia servidor WebSocket
- `connectWebSocket(url)`: Conecta a servidor WebSocket
- `sendWebSocketMessage(message)`: Envía mensaje por WebSocket

#### Utilidades

- `clearResults()`: Limpia todos los resultados
- `close()`: Cierra conexiones y limpia recursos

### Eventos

- `result-captured`: Nuevo resultado capturado
- `analysis-complete`: Análisis completado
- `data-loaded`: Datos cargados desde archivo
- `results-cleared`: Resultados limpiados
- `ws-server-started`: Servidor WebSocket iniciado
- `ws-client-connected`: Cliente WebSocket conectado
- `ws-client-disconnected`: Cliente WebSocket desconectado
- `ws-connected`: Conectado a servidor WebSocket
- `ws-disconnected`: Desconectado de servidor WebSocket
- `ws-message`: Mensaje WebSocket recibido
- `ws-error`: Error en WebSocket
- `closed`: Módulo cerrado

## Mensajes WebSocket

### Del Cliente al Servidor

```javascript
// Enviar resultado
{ type: 'result', value: 25 }

// Solicitar análisis
{ type: 'request-analysis' }

// Solicitar últimos resultados
{ type: 'request-results', count: 50 }
```

### Del Servidor al Cliente

```javascript
// Actualización de resultado
{ type: 'result-update', data: { resultado, fecha, hora, timestamp } }

// Análisis
{ type: 'analysis', data: { /* objeto de análisis completo */ } }

// Resultados
{ type: 'results', data: [ /* array de resultados */ ] }

// Error
{ type: 'error', message: 'Descripción del error' }
```

## Ejemplo de Integración Android

Para integrar con una aplicación Android:

1. **Captura con Autenticación Biométrica:**

```javascript
// En el lado JavaScript
const tokio = new TokioAI({ encryption: true });

// En Android (Kotlin), llamar después de autenticación exitosa
webView.evaluateJavascript(
  "tokio.captureResult($resultado)",
  null
);
```

2. **WebSocket en Android:**

```kotlin
// Cliente WebSocket en Android
val client = OkHttpClient()
val request = Request.Builder()
    .url("ws://tu-servidor:8080")
    .build()
val ws = client.newWebSocket(request, listener)

// Enviar resultado
ws.send("""{"type":"result","value":25}""")
```

3. **Generar y Compartir PDF:**

```javascript
// Generar PDF y obtener ruta
const pdfPath = await tokio.generatePDF('./reporte.pdf');

// En Android, usar la ruta para compartir
// Intent para abrir/compartir el PDF
```

## Seguridad

- **Encriptación AES-256-GCM**: Datos protegidos con encriptación de grado militar
- **IV único**: Cada encriptación usa un vector de inicialización único
- **AuthTag**: Verificación de integridad para detectar manipulación
- **Claves seguras**: Soporte para claves maestras personalizadas
- **No almacena credenciales**: Compatible con sistemas biométricos externos

## Pruebas

```bash
# Ejecutar ejemplo de uso
npm run example

# Ejecutar pruebas (si están implementadas)
npm test
```

## Dependencias

- `ws`: ^8.14.2 - Cliente/Servidor WebSocket
- `pdfkit`: ^0.13.0 - Generación de PDF

## Licencia

ISC

## Contribución

Este es un módulo especializado para análisis predictivo. Para contribuciones o mejoras, por favor abre un issue o pull request.

## Soporte

Para preguntas o problemas, abre un issue en el repositorio.

---

**Desarrollado para Tokyo Predictor Roulette**
