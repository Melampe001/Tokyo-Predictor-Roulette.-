# Servidor To-Do con REST + WebSocket

Servidor Node.js con Express que expone endpoints REST para operaciones CRUD de to-dos, y emite eventos en tiempo real vía WebSocket cuando se crean, actualizan o eliminan tareas.

## Características

- **REST API**: Endpoints para GET, POST, PUT, DELETE
- **WebSocket**: Push automático de eventos a clientes conectados
- **File-backed**: Persistencia en `db.json`
- **Heartbeat/Ping**: Mantiene conexiones WS activas
- **Broadcast**: Notifica a todos los clientes conectados

## Instalación

```bash
cd server
npm install
```

## Ejecución Local

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor estará disponible en:
- HTTP: `http://localhost:3001`
- WebSocket: `ws://localhost:3001`

## Endpoints REST

### GET /todos
Obtiene todos los to-dos.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "text": "Comprar leche",
      "completed": false,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

### POST /todos
Crea un nuevo to-do.

**Body:**
```json
{
  "text": "Nueva tarea"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "text": "Nueva tarea",
    "completed": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Evento WS emitido:**
```json
{
  "type": "created",
  "data": { "id": "...", "text": "...", ... }
}
```

### PUT /todos/:id
Actualiza un to-do existente.

**Body:**
```json
{
  "text": "Texto actualizado",
  "completed": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": { "id": "...", "text": "...", "completed": true, ... }
}
```

**Evento WS emitido:**
```json
{
  "type": "updated",
  "data": { "id": "...", ... }
}
```

### DELETE /todos/:id
Elimina un to-do.

**Respuesta:**
```json
{
  "success": true,
  "data": { "id": "...", ... }
}
```

**Evento WS emitido:**
```json
{
  "type": "deleted",
  "data": { "id": "..." }
}
```

### GET /health
Health check del servidor.

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "wsClients": 2
}
```

## WebSocket

### Conexión
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Conectado');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Evento recibido:', message);
  // message.type puede ser: 'connected', 'created', 'updated', 'deleted', 'pong'
};
```

### Mensajes del servidor

**Conexión establecida:**
```json
{
  "type": "connected",
  "message": "Conectado al servidor To-Do",
  "timestamp": "..."
}
```

**To-do creado:**
```json
{
  "type": "created",
  "data": { "id": "...", "text": "...", ... }
}
```

**To-do actualizado:**
```json
{
  "type": "updated",
  "data": { "id": "...", "text": "...", ... }
}
```

**To-do eliminado:**
```json
{
  "type": "deleted",
  "data": { "id": "..." }
}
```

### Ping/Pong
El servidor envía ping cada 30 segundos. Clientes pueden enviar:
```json
{ "type": "ping" }
```

Y recibirán:
```json
{ "type": "pong", "timestamp": "..." }
```

## Tests

Ejecutar tests de integración:

```bash
npm test
```

Este comando ejecuta `tests/integration.js` que:
1. Inicia el servidor
2. Crea una conexión WebSocket
3. Realiza un POST /todos vía REST
4. Verifica que el cliente WS recibe el evento 'created'
5. Cierra el servidor

## Docker

### Build
```bash
docker build -t todo-ws-server .
```

### Run
```bash
docker run -p 3001:3001 todo-ws-server
```

## Habilitar WebSocket en el Cliente

Para que el cliente (app.js en la raíz) use WebSocket:

1. El cliente debe conectarse a `ws://localhost:3001`
2. Escuchar eventos: `created`, `updated`, `deleted`
3. Hacer merge con localStorage usando `last-write-wins` (comparar `updatedAt`)
4. Implementar reconexión con backoff exponencial
5. Mantener funcionamiento offline usando localStorage

Ver `../app.js` para la implementación del cliente.

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3001)

Ejemplo:
```bash
PORT=4000 npm start
```

## Estructura de Archivos

```
server/
├── server.js           # Servidor Express + WebSocket
├── package.json        # Dependencias y scripts
├── db.json            # Base de datos JSON
├── Dockerfile         # Imagen Docker
├── README.md          # Esta documentación
└── tests/
    └── integration.js  # Test de integración
```

## Notas

- La base de datos es un archivo JSON (`db.json`) que se lee/escribe en cada operación
- Los eventos WebSocket se emiten solo tras operaciones REST exitosas
- El servidor mantiene conexiones WS activas con heartbeat/ping cada 30 segundos
- No requiere base de datos externa
