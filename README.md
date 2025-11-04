# Tokyo Predictor Roulette

Proyecto de análisis predictivo para casino privado Android con módulo de IA, backend REST/WebSocket y dashboard web en tiempo real.

## 🎯 Características Principales

- ✅ **Backend REST + WebSocket**: Servidor Node.js con Express y WebSocket para comunicación en tiempo real
- ✅ **TokioAI - Módulo de IA**: Análisis predictivo con detección de patrones y tendencias
- ✅ **Web Dashboard**: Interfaz React para visualización y control en tiempo real
- ✅ **Docker Ready**: Imagen de producción optimizada con Node.js Alpine
- ✅ **CI/CD Automatizado**: Workflows de GitHub Actions para backend y Flutter
- ✅ **APK Analysis**: Script de análisis de APK Android
- ✅ **Encriptación**: Seguridad con AES-256-GCM
- ✅ **Generación de PDF**: Reportes detallados de análisis

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Backend Server](#backend-server)
- [Web Dashboard](#web-dashboard)
- [TokioAI Module](#tokioai-module)
- [Docker](#docker)
- [Testing](#testing)
- [APK Analysis](#apk-analysis)
- [CI/CD](#cicd)
- [Configuración](#configuración)
- [Deployment](#deployment)

## 🚀 Instalación

### Prerequisitos

- Node.js 18+ y npm
- Docker (opcional, para containerización)
- Android SDK Build Tools (opcional, para análisis de APK)

### Instalación Básica

```bash
# Clonar repositorio
git clone https://github.com/Melampe001/Tokyo-Predictor-Roulette.-
cd Tokyo-Predictor-Roulette.-

# Instalar dependencias del backend
npm install

# Instalar dependencias del dashboard (opcional)
cd web-dashboard
npm install
cd ..
```

## 🖥️ Backend Server

El servidor backend proporciona REST API y WebSocket para comunicación en tiempo real con clientes.

### Iniciar el Servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

El servidor estará disponible en `http://localhost:8080`

### Variables de Entorno

Crear un archivo `.env` en la raíz:

```env
# Server Configuration
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

# TokioAI Configuration
BATCH_SIZE=10
ENABLE_ENCRYPTION=true
AUTO_ANALYZE=true
```

### REST API Endpoints

#### Health Check
```bash
GET /health
```

#### Submit Result
```bash
POST /api/result
Content-Type: application/json

{
  "value": 12
}
```

#### Get Analysis
```bash
GET /api/analysis?count=10
```

#### Get Recent Results
```bash
GET /api/results?limit=50
```

#### Get Statistics
```bash
GET /api/statistics
```

### WebSocket Endpoint

Conectar a: `ws://localhost:8080/ws`

**Mensajes de Cliente → Servidor:**

```javascript
// Enviar resultado
{ type: 'result', value: 12 }

// Solicitar análisis
{ type: 'request-analysis', count: 10 }

// Solicitar resultados recientes
{ type: 'request-results', limit: 50 }

// Solicitar estadísticas
{ type: 'request-statistics' }
```

**Mensajes de Servidor → Cliente:**

```javascript
// Conexión establecida
{ type: 'connected', data: { timestamp, statistics } }

// Actualización de resultado
{ type: 'result-update', data: { resultado, fecha, hora } }

// Análisis completo
{ type: 'analysis', data: { batchSize, frequencies, trends, ... } }

// Actualización de análisis
{ type: 'analysis-update', data: { ... } }

// Error
{ type: 'error', message: '...' }
```

## 📊 Web Dashboard

Dashboard web interactivo construido con React y Vite.

### Ejecutar Dashboard en Desarrollo

```bash
cd web-dashboard
npm install
npm run dev
```

El dashboard estará disponible en `http://localhost:3000`

### Build para Producción

```bash
cd web-dashboard
npm run build
```

Los archivos estáticos se generarán en `web-dashboard/dist/`

### Características del Dashboard

- Conexión WebSocket en tiempo real
- Envío manual de resultados
- Visualización de análisis y tendencias
- Historial de resultados recientes
- Estadísticas en vivo
- Diseño responsive

Ver [web-dashboard/README.md](./web-dashboard/README.md) para más detalles.

## 🧠 TokioAI Module

Módulo de análisis predictivo con IA.

### Uso del Módulo

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
console.log(analysis.trends);
console.log(analysis.frequencies);

// Generar PDF
await tokio.generatePDF('./reporte.pdf');

// Guardar datos encriptados
tokio.saveEncrypted('./data.enc');
```

Ver [TOKIOAI_README.md](./TOKIOAI_README.md) para documentación completa del módulo.

## 🐳 Docker

### Construir Imagen Docker

```bash
docker build -t tokyo-predictor-roulette .
```

### Ejecutar con Docker

```bash
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e BATCH_SIZE=10 \
  tokyo-predictor-roulette
```

### Docker Compose

```bash
# Iniciar backend en producción
docker-compose up -d

# Iniciar backend + dashboard en desarrollo
docker-compose --profile dev up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

El archivo `docker-compose.yml` incluye:
- **backend**: Servidor Node.js en producción (puerto 8080)
- **dashboard-dev**: Dashboard en modo desarrollo (puerto 3000, perfil dev)

## 🧪 Testing

### Ejecutar Todos los Tests

```bash
npm test
```

### Ejecutar Tests Unitarios (TokioAI)

```bash
npm run test:unit
```

### Ejecutar Tests del Backend

```bash
npm run test:backend
```

### Tests Incluidos

- **test/test.js**: Suite completa de tests para TokioAI (20 tests)
- **test/backend.test.js**: Tests REST API y flujos de integración (Jest + Supertest)

Los tests del backend incluyen:
- Health check endpoint
- REST API endpoints (result, analysis, results, statistics)
- Validación de entrada
- Flujo completo de análisis
- Mock de TokioAI adapter

## 📱 APK Analysis

Script bash para análisis de APK Android.

### Uso

```bash
# Analizar APK
./scripts/analyze_apk.sh path/to/app-release.apk
```

### Análisis Incluido

El script extrae y analiza:
- Contenido del APK y conteo de archivos
- Metadata del paquete (nombre, versión)
- Verificación de firma digital
- Archivos DEX (Dalvik Executable)
- Librerías nativas y arquitecturas soportadas
- Análisis de tamaño por componente
- Reporte resumen

Los resultados se guardan en `output/apk-analysis-<timestamp>/`

### Herramientas Requeridas (opcionales)

- `unzip`: Extracción básica
- `aapt`: Metadata del APK (Android SDK Build Tools)
- `apksigner`: Verificación de firma (Android SDK Build Tools)
- `jarsigner`: Verificación alternativa de firma (JDK)

## ⚙️ Configuración

### Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | 8080 | Puerto del servidor |
| `NODE_ENV` | development | Entorno (development/production) |
| `LOG_LEVEL` | info | Nivel de logging (error/warn/info/debug) |
| `BATCH_SIZE` | 10 | Tamaño de lote para análisis |
| `ENABLE_ENCRYPTION` | true | Habilitar encriptación |
| `AUTO_ANALYZE` | true | Auto-análisis al completar lote |

### Archivos de Configuración

- **package.json**: Dependencias y scripts
- **Dockerfile**: Imagen de producción
- **docker-compose.yml**: Orquestación de servicios
- **.env**: Variables de entorno (crear localmente, no commitear)

## 🚢 Deployment

### Deployment en Servidor

1. Clonar repositorio en servidor
2. Configurar variables de entorno
3. Instalar dependencias: `npm ci --omit=dev`
4. Construir dashboard: `cd web-dashboard && npm run build`
5. Servir archivos estáticos del dashboard con nginx
6. Iniciar servidor: `npm start`
7. Configurar proceso manager (PM2, systemd)

### Deployment con Docker

```bash
# En servidor
docker pull <tu-imagen>
docker run -d -p 8080:8080 --name tokyo-predictor <tu-imagen>
```

### Deployment en Cloud

Compatible con:
- **Heroku**: Usar Procfile con `npm start`
- **AWS ECS/Fargate**: Usar Dockerfile
- **Google Cloud Run**: Usar Dockerfile
- **Azure Container Instances**: Usar Dockerfile
- **DigitalOcean App Platform**: Usar Dockerfile o buildpack

## 🔄 CI/CD

### Backend CI Workflow

Archivo: `.github/workflows/backend-ci.yml`

**Triggers:**
- Push a `main` (archivos backend)
- Pull requests a `main`

**Jobs:**
1. **Test**: Ejecuta en Node 18.x y 20.x
   - Checkout código
   - Setup Node.js con cache
   - Instalar dependencias
   - Ejecutar linter (si está configurado)
   - Ejecutar tests
   - Upload artifacts (logs, coverage)

2. **Docker**: Construir imagen Docker
   - Setup Docker Buildx
   - Construir imagen
   - Test imagen

### Flutter Build Workflow

Archivo: `.github/workflows/main.yml`

Construye APK de Android para la app móvil.

### Configurar Secrets en CI

Para deployment automático y firma de APK, configurar estos secrets en GitHub:

**Repository Settings → Secrets and variables → Actions:**

- `ANDROID_KEYSTORE_BASE64`: Keystore codificado en base64
- `ANDROID_KEYSTORE_PASSWORD`: Contraseña del keystore
- `ANDROID_KEY_ALIAS`: Alias de la clave
- `ANDROID_KEY_PASSWORD`: Contraseña de la clave

**Generar keystore:**

```bash
keytool -genkey -v -keystore signing-key.jks \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Codificar en base64:**

```bash
base64 signing-key.jks | tr -d '\n' > keystore.base64
```

**IMPORTANTE:** Nunca commitear archivos de keystore (.jks, .keystore) al repositorio.

## 📁 Estructura del Proyecto

```
Tokyo-Predictor-Roulette.-/
├── src/                          # Código fuente TokioAI
│   ├── tokioai.js               # Módulo principal
│   ├── tokioai-adapter.js       # Adapter con fallback a stubs
│   ├── crypto-utils.js          # Utilidades de encriptación
│   └── pdf-generator.js         # Generador de PDFs
├── test/                         # Tests
│   ├── test.js                  # Tests unitarios TokioAI
│   └── backend.test.js          # Tests backend (Jest)
├── web-dashboard/                # Dashboard web React
│   ├── src/
│   │   ├── App.jsx              # Componente principal
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
├── scripts/
│   └── analyze_apk.sh           # Script análisis APK
├── .github/workflows/
│   ├── backend-ci.yml           # CI backend
│   └── main.yml                 # CI Flutter
├── examples/                     # Ejemplos de uso
├── output/                       # Salida de reportes/análisis (gitignored)
├── server.js                     # Servidor Express + WebSocket
├── Dockerfile                    # Imagen Docker producción
├── docker-compose.yml            # Orquestación servicios
├── package.json                  # Dependencies y scripts
├── .env                          # Variables entorno (gitignored)
├── .gitignore
├── README.md                     # Este archivo
├── TOKIOAI_README.md            # Documentación TokioAI
└── LICENSE
```

## 🛠️ Scripts Disponibles

```bash
npm start           # Iniciar servidor en producción
npm run dev         # Iniciar servidor en desarrollo con auto-reload
npm test            # Ejecutar todos los tests
npm run test:unit   # Tests unitarios TokioAI
npm run test:backend # Tests backend (Jest)
npm run example     # Ejecutar ejemplo de uso
npm run lint        # Linter (placeholder)
npm run build       # Build placeholder (Node.js no requiere build)
```

## 📚 Documentación Adicional

- [TOKIOAI_README.md](./TOKIOAI_README.md) - Documentación completa del módulo TokioAI
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumen de implementación
- [web-dashboard/README.md](./web-dashboard/README.md) - Documentación del dashboard

## 🔒 Seguridad

- **Nunca commitear** archivos de keystore o keys privadas
- Usar variables de entorno para secrets
- El servidor usa usuario no-root en Docker
- Encriptación AES-256-GCM para datos sensibles
- CORS configurado para desarrollo/producción

## 🐛 Troubleshooting

### El servidor no inicia

- Verificar que el puerto 8080 esté disponible
- Revisar logs: `tail -f combined.log error.log`
- Verificar variables de entorno en `.env`

### WebSocket no conecta desde dashboard

- Verificar que el backend esté ejecutándose
- En desarrollo, asegurar proxy en `vite.config.js`
- Revisar URL de WebSocket en `App.jsx`

### Tests fallan

- Instalar todas las dependencias: `npm install`
- Limpiar node_modules: `rm -rf node_modules && npm install`

### Docker build falla

- Verificar que `package-lock.json` exista
- Limpiar cache de Docker: `docker builder prune`

## 🤝 Contribuciones

Este proyecto está en desarrollo activo. Para contribuir:

1. Fork el repositorio
2. Crear branch de feature
3. Commit cambios
4. Push al branch
5. Abrir Pull Request

## 📝 TODOs y Issues Pendientes

Ver Issues en GitHub para tareas pendientes:

1. **Integrar real TokioAI implementation** - Reemplazar adapter stub con implementación completa
2. **Flutter client integration** - Ejemplo de integración WebSocket en Dart
3. **Automated Play Store deployment** - Setup Fastlane para deployment automático

## 📄 Licencia

Ver [LICENSE](./LICENSE) para más detalles. 
