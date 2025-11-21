/**
 * Tokyo WS-Sync Server
 * Servidor REST + WebSocket con modo REST-write + WS-push
 * 
 * - REST endpoints para writes (POST, PUT, DELETE)
 * - WebSocket broadcast de eventos JSON (created, updated, deleted)
 * - Heartbeat/ping automático
 * - File-backed database (db.json)
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuración
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'db.json');

// Inicializar Express
const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket Server
const wss = new WebSocketServer({ server });

// Base de datos en memoria (sincronizada con archivo)
let db = { todos: [] };

// Cargar base de datos desde archivo
function loadDB() {
  try {
    const data = readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(data);
    console.log('✓ Base de datos cargada:', db.todos.length, 'todos');
  } catch (error) {
    console.log('⚠ No se pudo cargar db.json, usando base de datos vacía');
    db = { todos: [] };
  }
}

// Guardar base de datos a archivo
function saveDB() {
  try {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('✗ Error guardando db.json:', error.message);
  }
}

// Helper: Broadcast a todos los clientes WebSocket conectados
function broadcast(event) {
  const message = JSON.stringify(event);
  let sent = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
      sent++;
    }
  });
  console.log(`📡 Broadcast "${event.type}" a ${sent} cliente(s)`);
}

// Cargar DB al iniciar
loadDB();

// REST Endpoints

/**
 * GET /todos - Obtener todos los todos
 */
app.get('/todos', (req, res) => {
  res.json({ success: true, data: db.todos });
});

/**
 * GET /todos/:id - Obtener un todo por ID
 */
app.get('/todos/:id', (req, res) => {
  const todo = db.todos.find(t => t.id === req.params.id);
  if (!todo) {
    return res.status(404).json({ success: false, error: 'Todo no encontrado' });
  }
  res.json({ success: true, data: todo });
});

/**
 * POST /todos - Crear un nuevo todo
 */
app.post('/todos', (req, res) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'El campo "text" es requerido' });
  }

  const newTodo = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.todos.push(newTodo);
  saveDB();

  // Broadcast después de guardar exitosamente
  broadcast({
    type: 'created',
    data: newTodo
  });

  res.status(201).json({ success: true, data: newTodo });
});

/**
 * PUT /todos/:id - Actualizar un todo
 */
app.put('/todos/:id', (req, res) => {
  const { text, completed } = req.body;
  const index = db.todos.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Todo no encontrado' });
  }

  // Actualizar campos
  if (text !== undefined) {
    if (typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ success: false, error: 'El campo "text" debe ser un string no vacío' });
    }
    db.todos[index].text = text.trim();
  }
  
  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, error: 'El campo "completed" debe ser booleano' });
    }
    db.todos[index].completed = completed;
  }

  db.todos[index].updatedAt = new Date().toISOString();
  saveDB();

  // Broadcast después de guardar exitosamente
  broadcast({
    type: 'updated',
    data: db.todos[index]
  });

  res.json({ success: true, data: db.todos[index] });
});

/**
 * DELETE /todos/:id - Eliminar un todo
 */
app.delete('/todos/:id', (req, res) => {
  const index = db.todos.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Todo no encontrado' });
  }

  const deletedTodo = db.todos[index];
  db.todos.splice(index, 1);
  saveDB();

  // Broadcast después de eliminar exitosamente
  broadcast({
    type: 'deleted',
    data: { id: deletedTodo.id }
  });

  res.json({ success: true, data: deletedTodo });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    todos: db.todos.length,
    clients: wss.clients.size
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 Cliente WebSocket conectado');

  // Enviar mensaje de bienvenida
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Conectado al servidor WS-Sync',
    timestamp: new Date().toISOString()
  }));

  // Heartbeat/ping cada 30 segundos
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      }));
    }
  }, 30000);

  // Manejar mensajes del cliente
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Responder a pong
      if (message.type === 'pong') {
        console.log('📡 Pong recibido del cliente');
      }
    } catch (error) {
      console.error('✗ Error procesando mensaje WS:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Cliente WebSocket desconectado');
    clearInterval(pingInterval);
  });

  ws.on('error', (error) => {
    console.error('✗ Error en WebSocket:', error.message);
    clearInterval(pingInterval);
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log('');
  console.log('🚀 Tokyo WS-Sync Server iniciado');
  console.log(`📍 HTTP: http://localhost:${PORT}`);
  console.log(`📍 WebSocket: ws://localhost:${PORT}`);
  console.log(`📊 Todos cargados: ${db.todos.length}`);
  console.log('');
});

// Manejo de señales para shutdown graceful
process.on('SIGTERM', () => {
  console.log('Cerrando servidor...');
  saveDB();
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  saveDB();
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
