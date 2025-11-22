# Servidor REST + WebSocket para Tokyo Predictor

Este servidor proporciona una API REST para operaciones CRUD de todos y un servidor WebSocket para notificaciones en tiempo real.

## Arquitectura

- **Modelo REST-write + WS-push**: Las escrituras (crear/actualizar/eliminar) se realizan mediante REST, y las notificaciones de cambios se envían a todos los clientes conectados vía WebSocket.
- **Backend file-based**: Los datos se almacenan en `db.json` (sin base de datos externa).
- **Heartbeat/Ping**: Detecta y limpia clientes muertos automáticamente cada 30 segundos.

## Instalación

```bash
cd server
npm install
```

## Ejecución Local

### Desarrollo (con hot-reload)
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en:
- REST API: `http://localhost:3001`
- WebSocket: `ws://localhost:3001`
- Health check: `http://localhost:3001/health`

## Endpoints REST

### GET /todos
Obtiene todos los todos.

```bash
curl http://localhost:3001/todos
```

Respuesta:
```json
[
  {
    "id": "1234567890",
    "text": "Mi tarea",
    "completed": false,
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:00:00.000Z"
  }
]
```

### POST /todos
Crea un nuevo todo.

```bash
curl -X POST http://localhost:3001/todos \
  -H "Content-Type: application/json" \
  -d '{"text": "Nueva tarea", "completed": false}'
```

Respuesta:
```json
{
  "id": "1234567890",
  "text": "Nueva tarea",
  "completed": false,
  "createdAt": "2025-11-20T10:00:00.000Z",
  "updatedAt": "2025-11-20T10:00:00.000Z"
}
```

**Broadcast WebSocket**: Se envía un evento `created` a todos los clientes conectados.

### PUT /todos/:id
Actualiza un todo existente.

```bash
curl -X PUT http://localhost:3001/todos/1234567890 \
  -H "Content-Type: application/json" \
  -d '{"text": "Tarea actualizada", "completed": true}'
```

Respuesta:
```json
{
  "id": "1234567890",
  "text": "Tarea actualizada",
  "completed": true,
  "createdAt": "2025-11-20T10:00:00.000Z",
  "updatedAt": "2025-11-20T10:05:00.000Z"
}
```

**Broadcast WebSocket**: Se envía un evento `updated` a todos los clientes conectados.

### DELETE /todos/:id
Elimina un todo.

```bash
curl -X DELETE http://localhost:3001/todos/1234567890
```

Respuesta:
```json
{
  "message": "Todo deleted",
  "todo": {
    "id": "1234567890",
    "text": "Tarea actualizada",
    "completed": true,
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:05:00.000Z"
  }
}
```

**Broadcast WebSocket**: Se envía un evento `deleted` a todos los clientes conectados.

### GET /health
Health check del servidor.

```bash
curl http://localhost:3001/health
```

Respuesta:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T10:00:00.000Z",
  "clients": 2
}
```

## WebSocket

### Conexión

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Conectado al servidor WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensaje recibido:', message);
  
  // Manejar diferentes tipos de eventos
  switch (message.type) {
    case 'connected':
      console.log('Conexión establecida:', message.message);
      break;
    case 'created':
      console.log('Nuevo todo creado:', message.data);
      break;
    case 'updated':
      console.log('Todo actualizado:', message.data);
      break;
    case 'deleted':
      console.log('Todo eliminado:', message.data);
      break;
    case 'pong':
      console.log('Pong recibido:', message.timestamp);
      break;
  }
};

ws.onerror = (error) => {
  console.error('Error WebSocket:', error);
};

ws.onclose = () => {
  console.log('Desconectado del servidor WebSocket');
};
```

### Eventos del Servidor

#### connected
Enviado cuando un cliente se conecta.
```json
{
  "type": "connected",
  "message": "Connected to Tokyo Predictor WebSocket server",
  "timestamp": "2025-11-20T10:00:00.000Z"
}
```

#### created
Enviado cuando se crea un nuevo todo vía REST.
```json
{
  "type": "created",
  "data": {
    "id": "1234567890",
    "text": "Nueva tarea",
    "completed": false,
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:00:00.000Z"
  }
}
```

#### updated
Enviado cuando se actualiza un todo vía REST.
```json
{
  "type": "updated",
  "data": {
    "id": "1234567890",
    "text": "Tarea actualizada",
    "completed": true,
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:05:00.000Z"
  }
}
```

#### deleted
Enviado cuando se elimina un todo vía REST.
```json
{
  "type": "deleted",
  "data": {
    "id": "1234567890"
  }
}
```

#### pong
Respuesta a un mensaje ping del cliente.
```json
{
  "type": "pong",
  "timestamp": "2025-11-20T10:00:00.000Z"
}
```

### Heartbeat/Ping

El servidor envía pings automáticos cada 30 segundos para detectar clientes muertos. Los clientes deben responder con pongs automáticamente (la mayoría de los navegadores lo hacen).

Para enviar un ping manual desde el cliente:
```javascript
ws.send(JSON.stringify({ type: 'ping' }));
```

## Docker

### Build
```bash
docker build -t tokyo-predictor-server .
```

### Run
```bash
docker run -p 3001:3001 tokyo-predictor-server
```

### Con volumen para persistencia
```bash
docker run -p 3001:3001 -v $(pwd)/db.json:/app/db.json tokyo-predictor-server
```

## Habilitar WebSocket en el Cliente

Para habilitar la sincronización WebSocket en el cliente (app.js en la raíz del repositorio):

1. Asegúrate de que el servidor esté ejecutándose (ver arriba).

2. Abre `index.html` en tu navegador.

3. El cliente se conectará automáticamente a `ws://localhost:3001` y recibirá actualizaciones en tiempo real.

4. Las operaciones de escritura (crear/actualizar/eliminar) se realizan vía REST, y las notificaciones llegan vía WebSocket.

5. El cliente maneja reconexión automática con backoff exponencial si se pierde la conexión.

## Tests

Ejecutar los tests de integración:

```bash
npm test
```

Los tests verifican:
- Endpoints REST (GET, POST, PUT, DELETE)
- Broadcasts de WebSocket en operaciones exitosas
- Manejo de errores
- Persistencia en db.json

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3001)

Ejemplo:
```bash
PORT=4000 npm start
```

## Notas

- Los datos se almacenan en `db.json` en el mismo directorio del servidor.
- El archivo se crea automáticamente si no existe.
- Los broadcasts solo se envían en operaciones REST exitosas.
- El servidor mantiene heartbeats automáticos para limpiar conexiones muertas.
