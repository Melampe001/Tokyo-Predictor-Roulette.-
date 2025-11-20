# Servidor REST + WebSocket para Sincronización de Todos

Servidor Node.js con Express que proporciona una API REST para operaciones de escritura y WebSocket para recibir actualizaciones en tiempo real.

## Características

- **API REST**: Endpoints para crear, leer, actualizar y eliminar todos
- **WebSocket**: Notificaciones push en tiempo real de cambios
- **Persistencia**: Almacenamiento en archivo `db.json`
- **Heartbeat**: Ping/pong automático cada 30 segundos
- **CORS**: Habilitado para peticiones cross-origin

## Instalación

```bash
cd server
npm install
```

## Ejecutar el Servidor

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3001` por defecto.

## API REST

### Obtener todos los todos
```bash
GET /todos
```

Respuesta:
```json
[
  {
    "id": "1234567890",
    "text": "Mi tarea",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Crear un nuevo todo
```bash
POST /todos
Content-Type: application/json

{
  "text": "Nueva tarea",
  "completed": false
}
```

Respuesta: 201 Created
```json
{
  "id": "1234567890",
  "text": "Nueva tarea",
  "completed": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Actualizar un todo
```bash
PUT /todos/:id
Content-Type: application/json

{
  "text": "Tarea actualizada",
  "completed": true
}
```

Respuesta: 200 OK
```json
{
  "id": "1234567890",
  "text": "Tarea actualizada",
  "completed": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:01.000Z"
}
```

### Eliminar un todo
```bash
DELETE /todos/:id
```

Respuesta: 200 OK
```json
{
  "message": "Todo eliminado",
  "todo": {
    "id": "1234567890",
    "text": "Tarea eliminada",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## WebSocket

### Conectar al WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Conectado al servidor WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensaje recibido:', message);
};
```

### Mensajes del Servidor

Todos los mensajes tienen la estructura:
```json
{
  "type": "created|updated|deleted|connected|pong",
  "payload": { /* datos del evento */ },
  "ts": 1234567890
}
```

#### Evento: created
Se emite cuando se crea un nuevo todo mediante POST /todos.
```json
{
  "type": "created",
  "payload": {
    "id": "1234567890",
    "text": "Nueva tarea",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "ts": 1234567890
}
```

#### Evento: updated
Se emite cuando se actualiza un todo mediante PUT /todos/:id.
```json
{
  "type": "updated",
  "payload": {
    "id": "1234567890",
    "text": "Tarea actualizada",
    "completed": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:01.000Z"
  },
  "ts": 1234567890
}
```

#### Evento: deleted
Se emite cuando se elimina un todo mediante DELETE /todos/:id.
```json
{
  "type": "deleted",
  "payload": {
    "id": "1234567890"
  },
  "ts": 1234567890
}
```

#### Evento: connected
Se envía al cliente al establecer la conexión.
```json
{
  "type": "connected",
  "payload": {
    "message": "Conectado al servidor WS"
  },
  "ts": 1234567890
}
```

### Heartbeat/Ping

El servidor envía pings automáticos cada 30 segundos. El cliente también puede enviar pings:

```javascript
ws.send(JSON.stringify({ type: 'ping' }));
```

Respuesta:
```json
{
  "type": "pong",
  "ts": 1234567890
}
```

## Habilitar WebSocket en el Cliente

Para integrar el cliente con WebSocket, ver el archivo `app.js` en la raíz del proyecto.

Ejemplo básico:
```javascript
// Conectar al WebSocket
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  
  switch (type) {
    case 'created':
      // Agregar nuevo todo a la UI
      addTodoToUI(payload);
      break;
    case 'updated':
      // Actualizar todo existente en la UI
      updateTodoInUI(payload);
      break;
    case 'deleted':
      // Eliminar todo de la UI
      removeTodoFromUI(payload.id);
      break;
  }
};
```

## Tests

Ejecutar tests de integración:

```bash
npm test
```

Los tests verifican:
- Creación de todos mediante POST
- Recepción de eventos WebSocket 'created'
- Actualización de todos mediante PUT
- Recepción de eventos WebSocket 'updated'
- Eliminación de todos mediante DELETE
- Recepción de eventos WebSocket 'deleted'

## Docker

### Build
```bash
docker build -t todo-ws-server .
```

### Run
```bash
docker run -p 3001:3001 todo-ws-server
```

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3001)

Ejemplo:
```bash
PORT=4000 npm start
```

## Persistencia

Los datos se guardan en `db.json` en el mismo directorio. El formato es:

```json
{
  "todos": [
    {
      "id": "1234567890",
      "text": "Tarea ejemplo",
      "completed": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Arquitectura

```
Cliente (app.js)
    |
    |-- REST (POST/PUT/DELETE) --> Servidor Express
    |                                    |
    |                                    v
    |                              Guardar en db.json
    |                                    |
    |                                    v
    |                              Broadcast WebSocket
    |
    <-- WebSocket (eventos) ----
```

## Resolución de Problemas

### El servidor no arranca
- Verificar que el puerto 3001 no esté en uso
- Ejecutar `npm install` para instalar dependencias

### WebSocket no se conecta
- Verificar que el servidor esté ejecutándose
- Verificar la URL del WebSocket (debe ser `ws://` no `http://`)

### Los cambios no se guardan
- Verificar permisos de escritura en el directorio
- Revisar logs del servidor para errores

## Licencia

ISC
