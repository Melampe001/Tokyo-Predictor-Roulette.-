import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_FILE = join(__dirname, 'db.json');
const PORT = process.env.PORT || 3001;

// Helper: cargar base de datos
function loadDB() {
  try {
    const data = readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { todos: [] };
  }
}

// Helper: guardar base de datos
function saveDB(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// HTTP Server
const server = createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });

// Broadcast a todos los clientes conectados
function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');
  
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Conectado al servidor To-Do',
    timestamp: new Date().toISOString()
  }));

  // Heartbeat/ping
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (err) {
      console.error('Error procesando mensaje WS:', err);
    }
  });

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
  });
});

// Ping interval para mantener conexiones vivas
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(pingInterval);
});

// REST Endpoints

// GET /todos - Obtener todos los to-dos
app.get('/todos', (req, res) => {
  const db = loadDB();
  res.json({ success: true, data: db.todos });
});

// POST /todos - Crear nuevo to-do
app.post('/todos', (req, res) => {
  const db = loadDB();
  const { text } = req.body;
  
  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'El texto es requerido' });
  }

  const newTodo = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.todos.push(newTodo);
  saveDB(db);

  // Broadcast evento 'created' a todos los clientes WS
  broadcast({
    type: 'created',
    data: newTodo
  });

  res.status(201).json({ success: true, data: newTodo });
});

// PUT /todos/:id - Actualizar to-do existente
app.put('/todos/:id', (req, res) => {
  const db = loadDB();
  const { id } = req.params;
  const { text, completed } = req.body;

  const todoIndex = db.todos.findIndex(t => t.id === id);
  if (todoIndex === -1) {
    return res.status(404).json({ success: false, error: 'To-do no encontrado' });
  }

  // Actualizar campos
  if (text !== undefined) {
    db.todos[todoIndex].text = text.trim();
  }
  if (completed !== undefined) {
    db.todos[todoIndex].completed = completed;
  }
  db.todos[todoIndex].updatedAt = new Date().toISOString();

  saveDB(db);

  // Broadcast evento 'updated' a todos los clientes WS
  broadcast({
    type: 'updated',
    data: db.todos[todoIndex]
  });

  res.json({ success: true, data: db.todos[todoIndex] });
});

// DELETE /todos/:id - Eliminar to-do
app.delete('/todos/:id', (req, res) => {
  const db = loadDB();
  const { id } = req.params;

  const todoIndex = db.todos.findIndex(t => t.id === id);
  if (todoIndex === -1) {
    return res.status(404).json({ success: false, error: 'To-do no encontrado' });
  }

  const deletedTodo = db.todos[todoIndex];
  db.todos.splice(todoIndex, 1);
  saveDB(db);

  // Broadcast evento 'deleted' a todos los clientes WS
  broadcast({
    type: 'deleted',
    data: { id: deletedTodo.id }
  });

  res.json({ success: true, data: deletedTodo });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    wsClients: wss.clients.size
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  console.log(`HTTP: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

// Exportar para tests
export { app, server, wss };
