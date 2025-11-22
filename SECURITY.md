# 🔐 Guía de Seguridad - Tokyo Predictor Roulette

## Descripción General

Tokyo Predictor Roulette incluye un sistema de autenticación y seguridad completo que protege los datos de los usuarios mediante:

- **Autenticación JWT**: Tokens seguros para acceso a la API
- **Encriptación AES-256-GCM**: Todos los datos de usuario encriptados en reposo
- **Aislamiento de datos**: Cada usuario solo puede acceder a sus propios datos
- **Rate limiting**: Protección contra ataques de fuerza bruta
- **WebSocket seguro**: Autenticación para conexiones en tiempo real

## 🔑 Autenticación

### Usuario Administrador por Defecto

El sistema crea automáticamente un usuario administrador:

```
Username: admin
Password: Tokyo2024! (configurable via ADMIN_PASSWORD env)
```

**⚠️ IMPORTANTE**: Cambiar la contraseña del administrador en producción mediante variables de entorno:

```bash
export ADMIN_PASSWORD="tu_contraseña_segura_aquí"
```

### Registro de Nuevos Usuarios

**Endpoint**: `POST /api/auth/register`

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "miusuario",
    "password": "MiContraseñaSegura123!"
  }'
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "user": {
    "username": "miusuario",
    "role": "user",
    "createdAt": "2025-11-20T22:00:00.000Z"
  }
}
```

**Requisitos**:
- Username: único, no puede estar vacío
- Password: mínimo 8 caracteres

### Inicio de Sesión

**Endpoint**: `POST /api/auth/login`

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "miusuario",
    "password": "MiContraseñaSegura123!"
  }'
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "miusuario",
    "role": "user"
  }
}
```

**El token expira en**: 24 horas (configurable via JWT_EXPIRATION env)

### Verificación de Token

**Endpoint**: `GET /api/auth/verify`

```bash
curl -X GET http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Rate Limiting

Los endpoints de autenticación tienen límite de intentos:
- **Límite**: 5 intentos por IP
- **Ventana**: 15 minutos
- **Protege**: `/api/auth/login` y `/api/auth/register`

## 🛡️ Uso de Endpoints Protegidos

### Autenticación en Requests REST

Todas las operaciones de datos requieren autenticación. Incluye el token en el header:

```bash
# Método 1: Authorization header (recomendado)
curl -X GET http://localhost:8080/api/results \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Método 2: Query parameter (alternativo)
curl -X GET "http://localhost:8080/api/results?token=TU_TOKEN_AQUI"
```

### Endpoints Protegidos

#### Gestión de Resultados

```bash
# Enviar resultado
curl -X POST http://localhost:8080/api/result \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": 12}'

# Obtener resultados (solo del usuario autenticado)
curl -X GET http://localhost:8080/api/results?limit=50 \
  -H "Authorization: Bearer TOKEN"

# Limpiar resultados (solo del usuario autenticado)
curl -X POST http://localhost:8080/api/clear \
  -H "Authorization: Bearer TOKEN"
```

#### Estadísticas y Análisis

```bash
# Obtener estadísticas (solo del usuario autenticado)
curl -X GET http://localhost:8080/api/statistics \
  -H "Authorization: Bearer TOKEN"

# Obtener análisis
curl -X GET http://localhost:8080/api/analysis?count=10 \
  -H "Authorization: Bearer TOKEN"

# Obtener historial (solo del usuario autenticado)
curl -X GET http://localhost:8080/api/history?limit=100 \
  -H "Authorization: Bearer TOKEN"
```

#### Exportación de Datos

```bash
# Exportar todos los datos del usuario
curl -X GET http://localhost:8080/api/export \
  -H "Authorization: Bearer TOKEN" \
  > mis_datos.json
```

## 🔌 WebSocket con Autenticación

### Conexión Autenticada

**Método 1**: Token en URL (recomendado para navegadores)

```javascript
const token = "TU_TOKEN_AQUI";
const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

ws.onopen = () => {
  console.log('Conectado y autenticado');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensaje:', message);
};
```

**Método 2**: Autenticación posterior

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Enviar token para autenticación
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'TU_TOKEN_AQUI'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'authenticated') {
    console.log('Autenticación exitosa');
  } else if (message.type === 'auth-required') {
    console.log('Se requiere autenticación');
  }
};
```

### Mensajes WebSocket Autenticados

Una vez autenticado, puedes usar todos los mensajes WebSocket:

```javascript
// Enviar resultado
ws.send(JSON.stringify({
  type: 'result',
  value: 12
}));

// Solicitar análisis
ws.send(JSON.stringify({
  type: 'request-analysis',
  count: 10
}));

// Solicitar resultados (solo del usuario)
ws.send(JSON.stringify({
  type: 'request-results',
  limit: 50
}));

// Solicitar estadísticas (solo del usuario)
ws.send(JSON.stringify({
  type: 'request-statistics'
}));

// Solicitar historial (solo del usuario)
ws.send(JSON.stringify({
  type: 'request-history',
  limit: 100
}));
```

## 👑 Funciones de Administrador

### Listar Todos los Usuarios

Solo disponible para usuarios con rol `admin`:

```bash
curl -X GET http://localhost:8080/api/auth/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Eliminar Usuario

Solo disponible para administradores. No se puede eliminar el usuario admin:

```bash
curl -X DELETE http://localhost:8080/api/auth/users/username \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 🔒 Almacenamiento Encriptado

### Encriptación de Datos

Todos los datos de usuario se almacenan encriptados:

- **Algoritmo**: AES-256-GCM
- **Ubicación**: `./data/username.enc`
- **Contenido encriptado**:
  - Resultados de ruleta
  - Estadísticas personales
  - Historial de acciones

### Estructura de Datos

Cada usuario tiene su propio archivo encriptado con:

```json
{
  "results": [
    {
      "resultado": 12,
      "fecha": "2025-11-20",
      "hora": "14:30:45",
      "timestamp": 1732123845000
    }
  ],
  "statistics": {
    "totalResults": 100,
    "frequencies": {
      "12": 5,
      "7": 3
    },
    "lastUpdated": "2025-11-20T22:00:00.000Z"
  },
  "history": [
    {
      "timestamp": 1732123845000,
      "action": "result_added",
      "value": 12
    }
  ]
}
```

## ⚙️ Configuración de Seguridad

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# JWT Configuration
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_64_caracteres_minimo
JWT_EXPIRATION=24h

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=cambiar_esta_contraseña_en_produccion

# Server
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

# Security
ENABLE_ENCRYPTION=true
```

### Generar JWT Secret Seguro

```bash
# Linux/Mac
openssl rand -hex 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚨 Mejores Prácticas de Seguridad

### En Desarrollo

1. **No usar credenciales por defecto**
2. **No compartir tokens en el código**
3. **Usar HTTPS en producción**
4. **Rotar tokens regularmente**

### En Producción

1. **Cambiar contraseña del admin**:
   ```bash
   export ADMIN_PASSWORD="ContraseñaMuySegura123!"
   ```

2. **Usar JWT secret fuerte**:
   ```bash
   export JWT_SECRET=$(openssl rand -hex 64)
   ```

3. **Habilitar HTTPS**:
   - Usar un proxy reverso (nginx, Apache)
   - Configurar certificados SSL/TLS
   - Forzar conexiones seguras

4. **Configurar firewall**:
   - Limitar acceso solo a IPs autorizadas
   - Usar VPN si es necesario

5. **Backup encriptado**:
   ```bash
   # Los datos ya están encriptados en ./data/
   tar -czf backup-$(date +%Y%m%d).tar.gz data/
   ```

6. **Monitoreo de logs**:
   ```bash
   tail -f logs/error.log
   tail -f logs/combined.log
   ```

## 🛠️ Solución de Problemas

### Error: "Authentication required"

**Causa**: No se proporcionó token o el token es inválido

**Solución**:
```bash
# 1. Verificar que el token está en el header
curl -v http://localhost:8080/api/results \
  -H "Authorization: Bearer TOKEN"

# 2. Verificar que el token es válido
curl http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer TOKEN"

# 3. Si expiró, hacer login nuevamente
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

### Error: "Forbidden - Admin access required"

**Causa**: Intentando acceder a endpoint de admin con usuario regular

**Solución**: Usar el token del usuario admin

### Error: "Too many authentication attempts"

**Causa**: Excediste el límite de intentos de login

**Solución**: Esperar 15 minutos o reiniciar el servidor en desarrollo

### WebSocket: "Authentication failed"

**Causa**: Token inválido en conexión WebSocket

**Solución**:
```javascript
// Verificar que el token es correcto
const token = "TOKEN_VALIDO";
const ws = new WebSocket(`ws://localhost:8080?token=${token}`);
```

## 📊 Ejemplo Completo de Flujo

```javascript
// 1. Registro
const registerResponse = await fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'jugador1',
    password: 'MiPassword123!'
  })
});

// 2. Login
const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'jugador1',
    password: 'MiPassword123!'
  })
});

const { token } = await loginResponse.json();

// 3. Enviar resultado
await fetch('http://localhost:8080/api/result', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ value: 12 })
});

// 4. Obtener estadísticas
const statsResponse = await fetch('http://localhost:8080/api/statistics', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await statsResponse.json();
console.log('Mis estadísticas:', stats.data);

// 5. Conectar WebSocket
const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Actualización en tiempo real:', message);
};
```

## 📝 Notas Importantes

1. **Datos aislados por usuario**: Cada usuario solo ve sus propios resultados, estadísticas e historial
2. **Encriptación automática**: No requiere configuración adicional
3. **Tokens con expiración**: Los tokens JWT expiran después de 24 horas
4. **Persistencia**: Los datos se guardan automáticamente en archivos encriptados
5. **Recuperación**: No hay forma de recuperar contraseñas olvidadas (crear nuevo usuario o contactar admin)

## 🔗 Enlaces Relacionados

- [README.md](./README.md) - Documentación principal
- [HELP.md](./HELP.md) - Guía de ayuda general
- [QUICKSTART.md](./QUICKSTART.md) - Inicio rápido

---

**Última actualización**: 2025-11-20
