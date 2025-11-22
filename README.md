# Tokyo Predictor Roulette

Proyecto de análisis predictivo para casino privado Android con módulo de IA.

> **✅ Estado:** TokioAI implementación real **completamente integrada y verificada**. Sistema de autenticación y seguridad implementado.

> **🔐 Seguridad:** Consulta la [Guía de Seguridad (SECURITY.md)](./SECURITY.md) para autenticación, encriptación y mejores prácticas.

> **🆘 ¿Necesitas ayuda?** Consulta la [Guía de Ayuda Completa (HELP.md)](./HELP.md) para inicio rápido, solución de problemas y ejemplos.

## 🎰 TokioAI - Módulo de Análisis Predictivo

TokioAI es un módulo de agente IA diseñado para análisis predictivo, integración dinámica de RNG y seguridad reforzada.

### Características Principales

- ✅ **Autenticación JWT**: Sistema de login seguro con tokens
- ✅ **Encriptación AES-256-GCM**: Datos de usuario protegidos
- ✅ **Aislamiento de Datos**: Cada usuario solo accede a sus propios datos
- ✅ **Captura y Sincronización**: Resultados manuales o vía WebSocket autenticado
- ✅ **Análisis por Lotes**: Procesa grupos de 10 resultados con cálculo de tendencias
- ✅ **Sugerencias Optimizadas**: Recomendaciones basadas en patrones y frecuencias
- ✅ **Generación de PDF**: Reportes con columnas: Resultado, Probabilidad, Fecha, Hora
- ✅ **Backend REST + WebSocket**: Servidor de producción con Express
- ✅ **Web Dashboard**: Interfaz web en tiempo real con React
- ✅ **Docker Ready**: Contenedores para desarrollo y producción
- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta

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

# Authentication & Security
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_64_caracteres_minimo
JWT_EXPIRATION=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=cambiar_esta_contraseña_en_produccion

# Logging
LOG_LEVEL=info
```

**⚠️ IMPORTANTE**: En producción, cambiar `ADMIN_PASSWORD` y `JWT_SECRET` por valores seguros.

Generar un JWT secret seguro:
```bash
openssl rand -hex 64
# o
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
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

### 🔐 Autenticación

**Todos los endpoints de datos requieren autenticación.** Ver [SECURITY.md](./SECURITY.md) para detalles completos.

#### Registro de Usuario
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "miusuario",
  "password": "MiPassword123!"
}

# Respuesta: { success: true, user: { username: "...", role: "user", createdAt: "..." } }
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "miusuario",
  "password": "MiPassword123!"
}

# Respuesta: { success: true, token: "eyJhbG...", user: { username: "...", role: "user" } }
```

#### Verificar Token
```bash
GET /api/auth/verify
Authorization: Bearer YOUR_TOKEN

# Respuesta: { success: true, user: { username: "...", role: "user" } }
```

### Endpoints de Datos (Requieren Autenticación)

**Nota**: Incluir el token en el header `Authorization: Bearer TOKEN` en todas las peticiones.

#### Health Check (Público)
```bash
GET /health
# Respuesta: { status: "healthy", timestamp: "...", uptime: 123 }
```

#### Enviar Resultado
```bash
POST /api/result
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "value": 12
}

# Respuesta: { success: true, data: { resultado: 12, fecha: "...", hora: "..." } }
```

#### Obtener Análisis
```bash
GET /api/analysis?count=10
Authorization: Bearer YOUR_TOKEN

# Respuesta: { success: true, data: { batchSize: 10, suggestion: "...", ... } }
```

#### Obtener Resultados Recientes (Usuario-Específico)
```bash
GET /api/results?limit=50
Authorization: Bearer YOUR_TOKEN

# Respuesta: { success: true, data: [...], total: 100 }
```

#### Obtener Estadísticas (Usuario-Específico)
```bash
GET /api/statistics
Authorization: Bearer YOUR_TOKEN

# Respuesta: { success: true, data: { totalResults: 50, frequencies: {...}, ... } }
```

#### Obtener Historial (Usuario-Específico)
```bash
GET /api/history?limit=100
Authorization: Bearer YOUR_TOKEN

# Respuesta: { success: true, data: [...] }
```

#### Exportar Datos (Usuario-Específico)
```bash
GET /api/export
Authorization: Bearer YOUR_TOKEN

# Respuesta: { success: true, data: { username: "...", exportDate: "...", results: [...], ... } }
```

#### Limpiar Resultados (Usuario-Específico)
```bash
POST /api/clear
Authorization: Bearer YOUR_TOKEN

# Respuesta: { success: true, message: "All results cleared" }
```

### Endpoints de Administrador

Solo disponibles para usuarios con rol `admin`:

#### Listar Usuarios
```bash
GET /api/auth/users
Authorization: Bearer ADMIN_TOKEN

# Respuesta: { success: true, users: [...] }
```

#### Eliminar Usuario
```bash
DELETE /api/auth/users/:username
Authorization: Bearer ADMIN_TOKEN

# Respuesta: { success: true, message: "User deleted successfully" }
```

### Endpoints Disponibles

## 🌐 WebSocket

### Conexión Autenticada

**Método 1**: Token en URL (recomendado)

```javascript
const token = "YOUR_JWT_TOKEN";
const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

ws.onopen = () => {
  console.log('Conectado y autenticado');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensaje recibido:', message);
};
```

**Método 2**: Autenticación posterior

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Autenticar con token
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'YOUR_JWT_TOKEN'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'authenticated') {
    console.log('Autenticación exitosa');
  }
};
```

### Mensajes Salientes (Cliente → Servidor)

**Nota**: La conexión debe estar autenticada antes de enviar mensajes de datos.

```javascript
// Autenticarse (si no se hizo en la URL)
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'YOUR_JWT_TOKEN'
}));

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

// Solicitar resultados (del usuario autenticado)
ws.send(JSON.stringify({
  type: 'request-results',
  limit: 50  // opcional
}));

// Solicitar estadísticas (del usuario autenticado)
ws.send(JSON.stringify({
  type: 'request-statistics'
}));

// Solicitar historial (del usuario autenticado)
ws.send(JSON.stringify({
  type: 'request-history',
  limit: 100  // opcional
}));

// Ping
ws.send(JSON.stringify({
  type: 'ping'
}));
```

### Mensajes Entrantes (Servidor → Cliente)

```javascript
// Conexión establecida (sin autenticación)
{ type: 'auth-required', message: 'Authentication required...', timestamp: '...' }

// Conexión establecida (con autenticación en URL)
{ type: 'connected', message: '...', authenticated: true, username: '...', timestamp: '...' }

// Autenticación exitosa (después de enviar token)
{ type: 'authenticated', message: 'Authentication successful', username: '...', timestamp: '...' }

// Actualización de resultado
{ type: 'result-update', data: { resultado: 12, ... } }

// Resultado capturado
{ type: 'result-captured', data: { resultado: 12, ... } }

// Análisis
{ type: 'analysis', data: { batchSize: 10, suggestion: '...', ... } }

// Resultados (del usuario autenticado)
{ type: 'results', data: [...], total: 100 }

// Estadísticas (del usuario autenticado)
{ type: 'statistics', data: { totalResults: 50, ... } }

// Historial (del usuario autenticado)
{ type: 'history', data: [...] }

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
npm test                           # Ejecutar tests
curl http://localhost:8080/health  # Debe retornar status: healthy
```

**¿Necesitas ejemplos de código?**  
Ver [HELP.md - Sección Ejemplos](./HELP.md#-ejemplos-de-uso)

**¿Problemas con Docker?**  
Ver [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md)

**¿Dudas sobre TokioAI?**  
Ver [TOKIOAI_README.md](./TOKIOAI_README.md)

**¿Información sobre seguridad?**  
Ver [SECURITY.md](./SECURITY.md) - Guía completa de autenticación y encriptación

## 🔐 Seguridad

### Características de Seguridad Implementadas

- ✅ **Autenticación JWT**: Sistema seguro de login con tokens
- ✅ **Encriptación AES-256-GCM**: Datos de usuario encriptados en reposo
- ✅ **Hash de contraseñas**: Bcrypt con 10 rounds
- ✅ **Aislamiento de datos**: Cada usuario solo accede a sus propios datos
- ✅ **Rate limiting**: Protección contra ataques de fuerza bruta
- ✅ **WebSocket autenticado**: Conexiones en tiempo real seguras
- ✅ **Roles de usuario**: Admin y usuario regular

### Credenciales por Defecto

**Usuario Administrador**:
- Username: `admin`
- Password: `Tokyo2024!`

**⚠️ IMPORTANTE**: Cambiar la contraseña en producción:
```bash
export ADMIN_PASSWORD="tu_contraseña_segura"
```

### Guía de Seguridad Completa

Ver [SECURITY.md](./SECURITY.md) para:
- Cómo autenticarse
- Uso de endpoints protegidos
- WebSocket con autenticación
- Funciones de administrador
- Mejores prácticas de seguridad
- Solución de problemas

## 📝 Issues Conocidos y TODOs

Ver los issues abiertos en GitHub para:

- [x] ~~Integrar implementación real de TokioAI~~ ✅ **COMPLETADO**
- [x] ~~Añadir autenticación y autorización~~ ✅ **COMPLETADO**
- [x] ~~Implementar encriptación de datos~~ ✅ **COMPLETADO**
- [x] ~~Proteger endpoints con autenticación~~ ✅ **COMPLETADO**
- [x] ~~WebSocket con autenticación~~ ✅ **COMPLETADO**
- [ ] Añadir ejemplo de integración con cliente Flutter
- [ ] Configurar despliegue automatizado a Play Store con Fastlane
- [ ] Mejorar cobertura de tests
- [ ] Añadir documentación de API con OpenAPI/Swagger
- [ ] Implementar recuperación de contraseña
- [ ] Añadir autenticación de dos factores (2FA)

## 📄 Licencia

Ver [LICENSE](./LICENSE) para más detalles.

## 🙏 Agradecimientos

- TokioAI Core Module
- Express.js y WebSocket (ws)
- React y Vite
- Docker y Node.js community 
