# Tokyo Predictor Roulette

Proyecto de análisis predictivo para casino privado Android con módulo de IA.

> **🆘 ¿Necesitas ayuda?** Consulta la [Guía de Ayuda Completa (HELP.md)](./HELP.md) para inicio rápido, solución de problemas y ejemplos.

## 🎰 TokioAI - Módulo de Análisis Predictivo

TokioAI es un módulo de agente IA diseñado para análisis predictivo, integración dinámica de RNG y seguridad reforzada.

### Características Principales

- ✅ **Captura y Sincronización**: Resultados manuales o vía WebSocket
- ✅ **Análisis por Lotes**: Procesa grupos de 10 resultados con cálculo de tendencias
- ✅ **Sugerencias Optimizadas**: Recomendaciones basadas en patrones y frecuencias
- ✅ **Encriptación Local**: Seguridad con AES-256-GCM
- ✅ **Generación de PDF**: Reportes con columnas: Resultado, Probabilidad, Fecha, Hora
- ✅ **Backend REST + WebSocket**: Servidor de producción con Express
- ✅ **Web Dashboard**: Interfaz web en tiempo real con React
- ✅ **Docker Ready**: Contenedores para desarrollo y producción

## 📦 Instalación

### Requisitos Previos

- Node.js 18+ (recomendado 20)
- npm 9+
- Docker (opcional, para contenedores)

### Instalación de Dependencias

```bash
# Clonar el repositorio
git clone https://github.com/Melampe001/Tokyo-Predictor-Roulette.-.git
cd Tokyo-Predictor-Roulette.-

# Instalar dependencias del backend
npm install
```

## 🚀 Ejecución Local

### Backend Server

El servidor backend expone una API REST y WebSocket para análisis en tiempo real.

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en:
- HTTP: `http://localhost:8080`
- WebSocket: `ws://localhost:8080`
- Health check: `http://localhost:8080/health`

### Web Dashboard

Dashboard web interactivo para monitorear y enviar resultados en tiempo real.

```bash
cd web-dashboard
npm install
npm run dev
```

Dashboard disponible en: `http://localhost:3000`

### Docker (Recomendado para Producción)

```bash
# Ejecutar backend y dashboard juntos
docker-compose up -d

# Solo backend
docker build -t tokioai-backend -f docker/Dockerfile .
docker run -p 8080:8080 tokioai-backend

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

Servicios disponibles:
- Backend: `http://localhost:8080`
- Dashboard: `http://localhost:3000`

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Server Configuration
PORT=8080
NODE_ENV=production

# TokioAI Configuration
BATCH_SIZE=10
ENABLE_ENCRYPTION=true
AUTO_ANALYZE=true

# Logging
LOG_LEVEL=info
```

### Opciones de TokioAI

```javascript
const tokio = new TokioAI({
  batchSize: 10,           // Número de resultados por lote
  encryption: true,        // Habilitar encriptación AES-256-GCM
  autoAnalyze: true,       // Análisis automático al completar lote
  wsPort: 8080            // Puerto WebSocket (si se usa servidor integrado)
});
```

## 🔌 API REST

### Endpoints Disponibles

#### Health Check
```bash
GET /health
# Respuesta: { status: "healthy", timestamp: "...", uptime: 123 }
```

#### Enviar Resultado
```bash
POST /api/result
Content-Type: application/json

{
  "value": 12
}

# Respuesta: { success: true, data: { resultado: 12, fecha: "...", hora: "..." } }
```

#### Obtener Análisis
```bash
GET /api/analysis?count=10

# Respuesta: { success: true, data: { batchSize: 10, suggestion: "...", ... } }
```

#### Obtener Resultados Recientes
```bash
GET /api/results?limit=50

# Respuesta: { success: true, data: [...], total: 100 }
```

#### Obtener Estadísticas
```bash
GET /api/statistics

# Respuesta: { success: true, data: { currentResults: 50, uptime: 3600000 } }
```

#### Limpiar Resultados
```bash
POST /api/clear

# Respuesta: { success: true, message: "All results cleared" }
```

## 🌐 WebSocket

### Conexión

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Conectado');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensaje recibido:', message);
};
```

### Mensajes Salientes (Cliente → Servidor)

```javascript
// Enviar resultado
ws.send(JSON.stringify({
  type: 'result',
  value: 12
}));

// Solicitar análisis
ws.send(JSON.stringify({
  type: 'request-analysis',
  count: 10  // opcional
}));

// Solicitar resultados
ws.send(JSON.stringify({
  type: 'request-results',
  limit: 50  // opcional
}));

// Solicitar estadísticas
ws.send(JSON.stringify({
  type: 'request-statistics'
}));

// Ping
ws.send(JSON.stringify({
  type: 'ping'
}));
```

### Mensajes Entrantes (Servidor → Cliente)

```javascript
// Conexión establecida
{ type: 'connected', message: '...', timestamp: '...' }

// Actualización de resultado
{ type: 'result-update', data: { resultado: 12, ... } }

// Resultado capturado
{ type: 'result-captured', data: { resultado: 12, ... } }

// Análisis
{ type: 'analysis', data: { batchSize: 10, suggestion: '...', ... } }

// Resultados
{ type: 'results', data: [...], total: 100 }

// Estadísticas
{ type: 'statistics', data: { currentResults: 50, ... } }

// Resultados limpiados
{ type: 'results-cleared' }

// Error
{ type: 'error', message: '...' }

// Pong
{ type: 'pong', timestamp: '...' }
```

## 🧪 Pruebas

```bash
# Ejecutar tests del módulo TokioAI
npm run test:legacy

# Ejecutar tests del backend (Jest)
npm test

# Ejecutar con cobertura
npm test -- --coverage
```

## 🏗️ Build

```bash
# Backend (no requiere build, Node.js interpreta directamente)
npm run build

# Docker image
docker build -t tokioai-backend -f docker/Dockerfile .

# Web dashboard
cd web-dashboard
npm run build
# Output en web-dashboard/dist/
```

## 🔍 Análisis de APK

Utiliza el script incluido para analizar APKs de Android:

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x scripts/analyze_apk.sh

# Ejecutar análisis
./scripts/analyze_apk.sh path/to/your-app.apk
```

El script proporciona:
- Información del paquete
- Permisos requeridos
- Actividades y servicios
- Estructura de archivos
- Verificación de certificados
- Checks básicos de seguridad

**Requisitos**: `aapt` (Android SDK build-tools), `unzip`, `openssl`

## 🔐 CI/CD y Secretos

### GitHub Actions

Este proyecto incluye workflows de CI/CD en `.github/workflows/`:

- **backend-ci.yml**: Tests, lint, y build de Docker para el backend

### Configurar Secretos en GitHub

Para despliegues automáticos y firma de APKs, configura los siguientes secretos en GitHub:

1. Ve a Settings → Secrets and variables → Actions
2. Agrega los siguientes secretos:

```
KEYSTORE_BASE64          # Keystore codificado en base64
KEYSTORE_PASSWORD        # Password del keystore
KEY_ALIAS                # Alias de la clave
KEY_PASSWORD             # Password de la clave
```

Para codificar el keystore:
```bash
base64 -i android/app/signing-key.jks | pbcopy  # macOS
base64 -w 0 android/app/signing-key.jks          # Linux
```

### Workflows Existentes

- **Flutter Build**: Construcción de APK para Android
- **Node.js Testing**: Tests en múltiples versiones de Node.js
- **Backend CI/CD**: Tests y build de contenedor Docker

## 📱 Web Dashboard

El dashboard web ofrece:

- 🔄 Conexión WebSocket en tiempo real
- 📝 Envío de nuevos resultados
- 📊 Visualización de análisis
- 📈 Estadísticas del sistema
- 🎲 Lista de resultados recientes

Ver documentación completa en [web-dashboard/README.md](./web-dashboard/README.md)

## 📖 Uso del Módulo TokioAI

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

// Guardar datos encriptados
tokio.saveEncrypted('./datos.enc');

// Cargar datos
tokio.loadEncrypted('./datos.enc');
```

Para documentación completa del módulo TokioAI, ver [TOKIOAI_README.md](./TOKIOAI_README.md)

## 🐳 Despliegue en Producción

### Docker

```bash
# Build
docker build -t tokioai-backend:latest -f docker/Dockerfile .

# Run
docker run -d \
  --name tokioai-backend \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -v $(pwd)/logs:/app/logs \
  tokioai-backend:latest

# Con docker-compose
docker-compose up -d
```

### Variables de Entorno Recomendadas para Producción

```env
NODE_ENV=production
PORT=8080
BATCH_SIZE=10
ENABLE_ENCRYPTION=true
AUTO_ANALYZE=true
LOG_LEVEL=info
```

### Health Checks

El servidor incluye health checks automáticos:
- HTTP: `GET /health`
- Docker: Configurado en Dockerfile y docker-compose.yml

## 🛠️ Desarrollo

### Estructura del Proyecto

```
Tokyo-Predictor-Roulette.-/
├── server.js                    # Servidor Express + WebSocket
├── src/
│   ├── tokioai.js              # Módulo TokioAI principal
│   ├── tokioai-adapter.js      # Adapter con fallback a stubs
│   ├── crypto-utils.js         # Utilidades de encriptación
│   └── pdf-generator.js        # Generador de PDFs
├── test/
│   ├── test.js                 # Tests del módulo TokioAI
│   └── backend.test.js         # Tests del backend (Jest)
├── web-dashboard/              # Dashboard React
│   ├── src/
│   │   ├── App.jsx            # Componente principal
│   │   ├── main.jsx           # Entry point
│   │   └── App.css            # Estilos
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker/
│   └── Dockerfile              # Imagen de producción
├── scripts/
│   └── analyze_apk.sh          # Script de análisis de APK
├── .github/
│   └── workflows/
│       └── backend-ci.yml      # CI/CD workflow
├── docker-compose.yml          # Orquestación multi-container
├── package.json
└── README.md
```

### Modo Desarrollo

```bash
# Backend con hot-reload
npm run dev

# Dashboard con hot-reload
cd web-dashboard
npm run dev
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🆘 Ayuda y Soporte

### Guía Completa de Ayuda

**📖 [Ver HELP.md](./HELP.md)** - Guía completa con:
- Inicio rápido en 3 pasos
- Preguntas frecuentes (FAQ)
- Solución de problemas comunes
- Ejemplos de uso detallados
- Guía de desarrollo
- Arquitectura del sistema

### Ayuda Rápida

**¿Primer uso?**
```bash
npm install && npm start
# Servidor en http://localhost:8080
```

**¿Problemas al iniciar?**
```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

**¿Verificar que todo funciona?**
```bash
npm test                           # Debe pasar 36/36 tests
curl http://localhost:8080/health  # Debe retornar status: healthy
```

**¿Necesitas ejemplos de código?**  
Ver [HELP.md - Sección Ejemplos](./HELP.md#-ejemplos-de-uso)

**¿Problemas con Docker?**  
Ver [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md)

**¿Dudas sobre TokioAI?**  
Ver [TOKIOAI_README.md](./TOKIOAI_README.md)

## 📝 Issues Conocidos y TODOs

Ver los issues abiertos en GitHub para:

- [ ] ~~Integrar implementación real de TokioAI~~ ✅ **COMPLETADO** (ya usa implementación real)
- [ ] Añadir ejemplo de integración con cliente Flutter
- [ ] Configurar despliegue automatizado a Play Store con Fastlane
- [ ] Añadir autenticación y autorización
- [ ] Mejorar cobertura de tests
- [ ] Añadir documentación de API con OpenAPI/Swagger

## 📄 Licencia

Ver [LICENSE](./LICENSE) para más detalles.

## 🙏 Agradecimientos

- TokioAI Core Module
- Express.js y WebSocket (ws)
- React y Vite
- Docker y Node.js community 
