import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = './db.json';

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos en memoria (sincronizada con archivo)
let db = { todos: [] };

// Cargar datos desde archivo
async function loadData() {
  try {
    if (existsSync(DB_FILE)) {
      const data = await readFile(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log('Datos cargados desde db.json');
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
    db = { todos: [] };
  }
}

// Guardar datos en archivo
async function saveData() {
  try {
    await writeFile(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error guardando datos:', error);
  }
}

// Función helper para broadcast a todos los clientes WS
function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
    }
  });
}

// REST API Endpoints

// GET /todos - Obtener todos los todos
app.get('/todos', (req, res) => {
  res.json(db.todos);
});

// POST /todos - Crear un nuevo todo
app.post('/todos', async (req, res) => {
  try {
    const { text, completed = false } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Campo "text" requerido' });
    }

    const newTodo = {
      id: Date.now().toString(),
      text,
      completed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.todos.push(newTodo);
    await saveData();

    // Emitir evento WebSocket
    broadcast({
      type: 'created',
      payload: newTodo,
      ts: Date.now()
    });

    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error en POST /todos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /todos/:id - Actualizar un todo
app.put('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    const todoIndex = db.todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo no encontrado' });
    }

    const updatedTodo = {
      ...db.todos[todoIndex],
      ...(text !== undefined && { text }),
      ...(completed !== undefined && { completed }),
      updatedAt: new Date().toISOString()
    };

    db.todos[todoIndex] = updatedTodo;
    await saveData();

    // Emitir evento WebSocket
    broadcast({
      type: 'updated',
      payload: updatedTodo,
      ts: Date.now()
    });

    res.json(updatedTodo);
  } catch (error) {
    console.error('Error en PUT /todos/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /todos/:id - Eliminar un todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const todoIndex = db.todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo no encontrado' });
    }

    const deletedTodo = db.todos[todoIndex];
    db.todos.splice(todoIndex, 1);
    await saveData();

    // Emitir evento WebSocket
    broadcast({
      type: 'deleted',
      payload: { id: deletedTodo.id },
      ts: Date.now()
    });

    res.json({ message: 'Todo eliminado', todo: deletedTodo });
  } catch (error) {
    console.error('Error en DELETE /todos/:id:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Crear servidor HTTP
const server = createServer(app);

// Configurar WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');

  // Enviar estado inicial al conectar
  ws.send(JSON.stringify({
    type: 'connected',
    payload: { message: 'Conectado al servidor WS' },
    ts: Date.now()
  }));

  // Heartbeat/ping cada 30 segundos
  const pingInterval = setInterval(() => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.ping();
    }
  }, 30000);

  ws.on('pong', () => {
    // Cliente respondió al ping
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Mensaje recibido:', data);
      
      // Responder a pings del cliente
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          ts: Date.now()
        }));
      }
    } catch (error) {
      console.error('Error procesando mensaje WS:', error);
    }
  });

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
    clearInterval(pingInterval);
  });

  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
    clearInterval(pingInterval);
  });
});

// Iniciar servidor
await loadData();

server.listen(PORT, () => {
  console.log(`Servidor REST+WS ejecutándose en puerto ${PORT}`);
  console.log(`HTTP: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

export { app, server, wss };
