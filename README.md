# Tokyo Predictor Roulette

**Proyecto de análisis predictivo para aplicaciones de casino privado Android con módulo de IA integrado.**

Este sistema proporciona un backend completo con capacidades de análisis en tiempo real para aplicaciones de ruleta Android, permitiendo a los desarrolladores integrar predicciones basadas en IA, análisis de patrones y sugerencias optimizadas directamente en sus aplicaciones móviles.

> **✅ Estado:** TokioAI implementación real **completamente integrada y verificada**. Todos los tests pasan (36/36).

> **🆘 ¿Necesitas ayuda?** Consulta la [Guía de Ayuda Completa (HELP.md)](./HELP.md) para inicio rápido, solución de problemas y ejemplos.

## 🎰 TokioAI - Módulo de Análisis Predictivo

TokioAI es un módulo de agente IA diseñado para análisis predictivo, integración dinámica de RNG y seguridad reforzada, optimizado para integración con aplicaciones de casino Android.

### Características Principales

- ✅ **Captura y Sincronización**: Resultados manuales o vía WebSocket
- ✅ **Análisis por Lotes**: Procesa grupos de 10 resultados con cálculo de tendencias
- ✅ **Sugerencias Optimizadas**: Recomendaciones basadas en patrones y frecuencias
- ✅ **Encriptación Local**: Seguridad con AES-256-GCM
- ✅ **Generación de PDF**: Reportes con columnas: Resultado, Probabilidad, Fecha, Hora
- ✅ **Backend REST + WebSocket**: Servidor de producción con Express
- ✅ **Web Dashboard**: Interfaz web en tiempo real con React
- ✅ **Docker Ready**: Contenedores para desarrollo y producción
- ✅ **Android Compatible**: API REST y WebSocket listos para integración móvil

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

## 📱 Integración con Android

El backend de Tokyo Predictor está diseñado para ser fácilmente integrable con aplicaciones Android nativas. A continuación se presentan ejemplos de integración.

### Conexión desde Android (Java)

```java
import okhttp3.*;
import org.json.*;

public class TokioAIClient {
    private static final String BASE_URL = "http://your-server:8080";
    private final OkHttpClient client = new OkHttpClient();
    
    // Enviar resultado de ruleta
    public void sendResult(int value) throws IOException {
        JSONObject json = new JSONObject();
        json.put("value", value);
        
        RequestBody body = RequestBody.create(
            json.toString(),
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
            .url(BASE_URL + "/api/result")
            .post(body)
            .build();
            
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            System.out.println("Resultado enviado: " + responseBody);
        }
    }
    
    // Obtener análisis
    public JSONObject getAnalysis(int count) throws IOException, JSONException {
        Request request = new Request.Builder()
            .url(BASE_URL + "/api/analysis?count=" + count)
            .get()
            .build();
            
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            return new JSONObject(responseBody);
        }
    }
    
    // Obtener resultados recientes
    public JSONArray getRecentResults(int limit) throws IOException, JSONException {
        Request request = new Request.Builder()
            .url(BASE_URL + "/api/results?limit=" + limit)
            .get()
            .build();
            
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            JSONObject jsonResponse = new JSONObject(responseBody);
            return jsonResponse.getJSONArray("data");
        }
    }
}
```

### Conexión desde Android (Kotlin)

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONArray

class TokioAIClient {
    private val baseUrl = "http://your-server:8080"
    private val client = OkHttpClient()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    
    // Enviar resultado de ruleta
    suspend fun sendResult(value: Int): String? {
        val json = JSONObject().apply {
            put("value", value)
        }
        
        val requestBody = json.toString().toRequestBody(jsonMediaType)
        val request = Request.Builder()
            .url("$baseUrl/api/result")
            .post(requestBody)
            .build()
            
        return client.newCall(request).execute().use { response ->
            response.body?.string()
        }
    }
    
    // Obtener análisis
    suspend fun getAnalysis(count: Int = 10): JSONObject? {
        val request = Request.Builder()
            .url("$baseUrl/api/analysis?count=$count")
            .get()
            .build()
            
        return client.newCall(request).execute().use { response ->
            response.body?.string()?.let { JSONObject(it) }
        }
    }
    
    // Obtener resultados recientes
    suspend fun getRecentResults(limit: Int = 50): JSONArray? {
        val request = Request.Builder()
            .url("$baseUrl/api/results?limit=$limit")
            .get()
            .build()
            
        return client.newCall(request).execute().use { response ->
            response.body?.string()?.let { 
                JSONObject(it).getJSONArray("data")
            }
        }
    }
}
```

### WebSocket en Android (Java)

```java
import okhttp3.*;

public class TokioAIWebSocket {
    private WebSocket webSocket;
    private final OkHttpClient client = new OkHttpClient();
    
    public void connect(String serverUrl) {
        Request request = new Request.Builder()
            .url(serverUrl)
            .build();
            
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                System.out.println("WebSocket conectado");
            }
            
            @Override
            public void onMessage(WebSocket webSocket, String text) {
                try {
                    JSONObject message = new JSONObject(text);
                    String type = message.getString("type");
                    
                    switch (type) {
                        case "result-update":
                            handleResultUpdate(message.getJSONObject("data"));
                            break;
                        case "analysis":
                            handleAnalysis(message.getJSONObject("data"));
                            break;
                        case "connected":
                            System.out.println("Conexión establecida");
                            break;
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
            
            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                System.err.println("Error en WebSocket: " + t.getMessage());
            }
        });
    }
    
    public void sendResult(int value) {
        JSONObject message = new JSONObject();
        try {
            message.put("type", "result");
            message.put("value", value);
            webSocket.send(message.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
    
    public void requestAnalysis(int count) {
        JSONObject message = new JSONObject();
        try {
            message.put("type", "request-analysis");
            message.put("count", count);
            webSocket.send(message.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
    
    private void handleResultUpdate(JSONObject data) {
        // Actualizar UI con nuevo resultado
    }
    
    private void handleAnalysis(JSONObject data) {
        // Mostrar análisis en UI
    }
    
    public void disconnect() {
        if (webSocket != null) {
            webSocket.close(1000, "Cliente desconectado");
        }
    }
}
```

### Ejemplo de Uso en Activity (Android)

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var tokioClient: TokioAIClient
    private lateinit var tokioWebSocket: TokioAIWebSocket
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        tokioClient = TokioAIClient()
        tokioWebSocket = TokioAIWebSocket()
        
        // Conectar WebSocket
        tokioWebSocket.connect("ws://your-server:8080")
        
        // Ejemplo: Enviar resultado cuando se presiona un botón
        findViewById<Button>(R.id.btnSendResult).setOnClickListener {
            lifecycleScope.launch {
                val result = getRouletteResult() // Tu lógica de ruleta
                tokioClient.sendResult(result)
            }
        }
        
        // Ejemplo: Solicitar análisis
        findViewById<Button>(R.id.btnGetAnalysis).setOnClickListener {
            lifecycleScope.launch {
                val analysis = tokioClient.getAnalysis(10)
                updateUI(analysis)
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        tokioWebSocket.disconnect()
    }
}
```

### Dependencias Necesarias (build.gradle)

```gradle
dependencies {
    // OkHttp para conexiones HTTP y WebSocket
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    
    // Coroutines para operaciones asíncronas (Kotlin)
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    
    // Opcional: Retrofit para API REST más elegante
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
}
```

### Permisos Necesarios (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Consideraciones de Seguridad para Android

1. **HTTPS en Producción**: Usar siempre HTTPS en lugar de HTTP para producción
2. **Certificados SSL**: Configurar correctamente los certificados SSL en el servidor
3. **Ofuscación**: Usar ProGuard/R8 para ofuscar el código de la app
4. **Validación de Datos**: Validar siempre los datos recibidos del servidor
5. **Manejo de Errores**: Implementar reintentos y manejo robusto de errores de red

### Flujo de Integración Recomendado

```
┌─────────────────┐
│  App Android    │
│   (Cliente)     │
└────────┬────────┘
         │
         ├─── HTTP REST ────┐
         │                  │
         ├─── WebSocket ────┤
         │                  ▼
         │         ┌──────────────────┐
         │         │  TokioAI Backend │
         │         │  (Node.js/Express)│
         │         └──────────────────┘
         │                  │
         └─── Resultados ───┤
              Análisis ─────┤
              Sugerencias ──┘
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

El proyecto incluye un script avanzado para analizar APKs de aplicaciones Android, útil para desarrolladores que deseen inspeccionar sus aplicaciones de casino antes de la distribución.

### Características del Analizador

- **Información del Paquete**: Nombre, versión, SDK mínimo y target
- **Permisos**: Lista completa de permisos solicitados
- **Componentes**: Actividades, servicios, receivers y providers
- **Estructura de Archivos**: Organización interna del APK
- **Certificados**: Información de firma y validación
- **Seguridad**: Checks básicos de seguridad (debuggable, obfuscación, etc.)
- **Librerías Nativas**: Detección de bibliotecas .so incluidas
- **Recursos**: Análisis de recursos y assets

### Uso del Script

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x scripts/analyze_apk.sh

# Ejecutar análisis
./scripts/analyze_apk.sh path/to/your-app.apk
```

### Ejemplo de Salida

```
=== Tokyo Predictor APK Analysis ===

Analyzing: my-casino-app.apk

--- File Information ---
-rw-r--r-- 1 user user 25M Nov 20 10:30 my-casino-app.apk

--- Package Information ---
package: name='com.example.casino' versionCode='1' versionName='1.0'
sdkVersion:'21'
targetSdkVersion:'34'
application-label:'Casino Roulette'

--- Permissions ---
uses-permission: android.permission.INTERNET
uses-permission: android.permission.ACCESS_NETWORK_STATE
uses-permission: android.permission.VIBRATE

--- Activities ---
launchable-activity: name='com.example.casino.MainActivity'

✓ App is not debuggable
```

### Casos de Uso

1. **Pre-distribución**: Verificar la configuración antes de subir a Play Store
2. **Auditoría de Seguridad**: Identificar permisos innecesarios o configuraciones inseguras
3. **Debugging**: Analizar problemas de integración o configuración
4. **Documentación**: Generar documentación técnica del APK

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

### Desarrollo para Android

#### 1. Configurar el Backend Localmente

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# El servidor estará en http://localhost:8080
```

#### 2. Configurar la App Android

```kotlin
// En tu clase de configuración o Application
object ApiConfig {
    // Para emulador de Android
    const val BASE_URL = "http://10.0.2.2:8080"
    
    // Para dispositivo físico (usa tu IP local)
    // const val BASE_URL = "http://192.168.1.100:8080"
    
    // Para producción
    // const val BASE_URL = "https://your-domain.com"
}
```

#### 3. Probar la Integración

```bash
# Verificar que el backend esté funcionando
curl http://localhost:8080/health

# Enviar un resultado de prueba
curl -X POST http://localhost:8080/api/result \
  -H "Content-Type: application/json" \
  -d '{"value": 12}'

# Obtener análisis
curl http://localhost:8080/api/analysis?count=10
```

#### 4. Debugging

```bash
# Ver logs del backend en tiempo real
npm run dev

# Logs en producción (Docker)
docker-compose logs -f backend

# Test de conectividad desde Android
adb shell ping your-server-ip
```

### Workflow de Desarrollo Recomendado

```
1. Desarrollar Backend
   ├── Modificar endpoints en server.js
   ├── Actualizar lógica en src/
   └── Ejecutar tests: npm test

2. Probar con Web Dashboard
   ├── cd web-dashboard && npm run dev
   └── Verificar funcionalidad en navegador

3. Integrar con Android
   ├── Crear cliente HTTP/WebSocket
   ├── Implementar UI
   └── Probar en emulador/dispositivo

4. Desplegar
   ├── Backend: docker-compose up -d
   └── Android: Generar APK firmado
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
- [ ] Añadir ejemplo completo de aplicación Android con integración TokioAI
- [ ] Crear librería Android (AAR) para facilitar la integración
- [ ] Añadir ejemplo de integración con cliente Flutter
- [ ] Configurar despliegue automatizado a Play Store con Fastlane
- [ ] Implementar autenticación JWT para apps móviles
- [ ] Añadir autenticación y autorización al backend
- [ ] Mejorar cobertura de tests
- [ ] Añadir documentación de API con OpenAPI/Swagger
- [ ] Crear guía de integración Android paso a paso
- [ ] Añadir soporte para notificaciones push en Android

## 📄 Licencia

Ver [LICENSE](./LICENSE) para más detalles.

## 🙏 Agradecimientos

- TokioAI Core Module
- Express.js y WebSocket (ws)
- React y Vite
- Docker y Node.js community 
