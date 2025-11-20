# Tokyo WS-Sync Server

Servidor REST + WebSocket con modo **REST-write + WS-push** para sincronización en tiempo real.

## Características

- ✅ **REST API** para operaciones write (POST, PUT, DELETE)
- ✅ **WebSocket** para push de eventos en tiempo real
- ✅ **File-backed database** (`db.json`)
- ✅ **Broadcast automático** después de writes exitosos
- ✅ **Heartbeat/ping** cada 30 segundos
- ✅ **Eventos JSON** estructurados: `created`, `updated`, `deleted`

## Instalación

```bash
cd server
npm install
```

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en:
- HTTP: `http://localhost:3000`
- WebSocket: `ws://localhost:3000`

### Docker
```bash
# Build
docker build -t tokyo-ws-sync .

# Run
docker run -p 3000:3000 -v $(pwd)/db.json:/app/db.json tokyo-ws-sync
```

## API REST

### GET /todos
Obtiene todos los todos.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "text": "Mi tarea",
      "completed": false,
      "createdAt": "2025-11-20T...",
      "updatedAt": "2025-11-20T..."
    }
  ]
}
```

### POST /todos
Crea un nuevo todo.

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
    "createdAt": "2025-11-20T...",
    "updatedAt": "2025-11-20T..."
  }
}
```

**Evento WebSocket emitido:**
```json
{
  "type": "created",
  "data": { ... }
}
```

### PUT /todos/:id
Actualiza un todo existente.

**Body:**
```json
{
  "text": "Tarea actualizada",
  "completed": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Evento WebSocket emitido:**
```json
{
  "type": "updated",
  "data": { ... }
}
```

### DELETE /todos/:id
Elimina un todo.

**Respuesta:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Evento WebSocket emitido:**
```json
{
  "type": "deleted",
  "data": {
    "id": "..."
  }
}
```

### GET /health
Health check del servidor.

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T...",
  "todos": 5,
  "clients": 2
}
```

## WebSocket

### Conexión
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Conectado');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Evento recibido:', message);
};
```

### Eventos del servidor

#### connected
Se envía al establecer la conexión.
```json
{
  "type": "connected",
  "message": "Conectado al servidor WS-Sync",
  "timestamp": "2025-11-20T..."
}
```

#### ping
Heartbeat enviado cada 30 segundos.
```json
{
  "type": "ping",
  "timestamp": "2025-11-20T..."
}
```

Responder con:
```javascript
ws.send(JSON.stringify({ type: 'pong' }));
```

#### created
Se emite después de POST /todos exitoso.
```json
{
  "type": "created",
  "data": {
    "id": "...",
    "text": "Nueva tarea",
    "completed": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### updated
Se emite después de PUT /todos/:id exitoso.
```json
{
  "type": "updated",
  "data": { ... }
}
```

#### deleted
Se emite después de DELETE /todos/:id exitoso.
```json
{
  "type": "deleted",
  "data": {
    "id": "..."
  }
}
```

## Tests

### Ejecución
```bash
npm test
```

El test de integración:
1. Inicia el servidor
2. Crea una conexión WebSocket
3. Realiza POST /todos
4. Verifica que se recibe el evento 'created' via WebSocket
5. Limpia y cierra

## Base de Datos

La base de datos se almacena en `db.json`:

```json
{
  "todos": [
    {
      "id": "unique-id",
      "text": "Mi tarea",
      "completed": false,
      "createdAt": "2025-11-20T...",
      "updatedAt": "2025-11-20T..."
    }
  ]
}
```

### Persistencia

- Los datos se guardan automáticamente en `db.json` después de cada operación write
- Se cargan al iniciar el servidor
- El archivo se actualiza de forma síncrona para garantizar consistencia

## Arquitectura

### Flujo REST-write + WS-push

```
Cliente → REST POST /todos → Servidor
                              ↓ (guardar en db.json)
                              ↓ (broadcast via WS)
Cliente ← WS evento 'created' ← Servidor
```

### Beneficios

- **Writes vía REST**: Confiables, con respuestas HTTP estándar
- **Pushes vía WS**: Actualizaciones en tiempo real para todos los clientes
- **Merge por id/updatedAt**: Los clientes pueden resolver conflictos
- **Offline-first**: Los clientes pueden usar localStorage y sincronizar al reconectar

## Variables de Entorno

```bash
PORT=3000           # Puerto del servidor
NODE_ENV=production # Entorno (development/production)
```

## Limitaciones

- Base de datos file-backed (no apropiado para alto volumen de writes concurrentes)
- Sin autenticación/autorización (añadir según necesidades)
- Broadcast solo después de writes exitosos (no hay eventos para GET)

## Próximos Pasos

- [ ] Añadir autenticación con JWT
- [ ] Implementar rate limiting
- [ ] Migrar a base de datos real (PostgreSQL, MongoDB)
- [ ] Añadir compression para WebSocket
- [ ] Implementar rooms/channels para broadcast selectivo
