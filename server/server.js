import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Database helper functions
function readDB() {
  try {
    if (!existsSync(DB_PATH)) {
      writeFileSync(DB_PATH, JSON.stringify({ todos: [] }, null, 2));
    }
    const data = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { todos: [] };
  }
}

function writeDB(data) {
  try {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  // Send initial connection message
  ws.send(JSON.stringify({ 
    type: 'connected', 
    message: 'Connected to Tokyo Predictor WebSocket server',
    timestamp: new Date().toISOString()
  }));

  // Heartbeat/ping to detect dead clients
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle messages from client (if needed)
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Handle ping-pong
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ 
          type: 'pong', 
          timestamp: new Date().toISOString() 
        }));
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Heartbeat interval to detect dead clients
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminating dead client');
      clients.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Every 30 seconds

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Broadcast helper function
function broadcast(event) {
  const message = JSON.stringify(event);
  let sentCount = 0;
  
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
        sentCount++;
      } catch (error) {
        console.error('Error sending to client:', error);
        clients.delete(client);
      }
    }
  });
  
  console.log(`Broadcasted ${event.type} to ${sentCount} clients`);
  return sentCount;
}

// REST API Routes

// GET /todos - Get all todos
app.get('/todos', (req, res) => {
  try {
    const db = readDB();
    res.json(db.todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /todos - Create new todo
app.post('/todos', (req, res) => {
  try {
    const { text, completed = false } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    const db = readDB();
    const newTodo = {
      id: Date.now().toString(),
      text,
      completed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.todos.push(newTodo);
    
    if (writeDB(db)) {
      // Broadcast to all connected clients
      broadcast({
        type: 'created',
        data: newTodo
      });
      
      res.status(201).json(newTodo);
    } else {
      res.status(500).json({ error: 'Failed to save todo' });
    }
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /todos/:id - Update todo
app.put('/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = readDB();
    const todoIndex = db.todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Update todo
    const updatedTodo = {
      ...db.todos[todoIndex],
      ...updates,
      id, // Preserve original id
      updatedAt: new Date().toISOString()
    };

    db.todos[todoIndex] = updatedTodo;

    if (writeDB(db)) {
      // Broadcast to all connected clients
      broadcast({
        type: 'updated',
        data: updatedTodo
      });
      
      res.json(updatedTodo);
    } else {
      res.status(500).json({ error: 'Failed to update todo' });
    }
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /todos/:id - Delete todo
app.delete('/todos/:id', (req, res) => {
  try {
    const { id } = req.params;

    const db = readDB();
    const todoIndex = db.todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const deletedTodo = db.todos[todoIndex];
    db.todos.splice(todoIndex, 1);

    if (writeDB(db)) {
      // Broadcast to all connected clients
      broadcast({
        type: 'deleted',
        data: { id }
      });
      
      res.json({ message: 'Todo deleted', todo: deletedTodo });
    } else {
      res.status(500).json({ error: 'Failed to delete todo' });
    }
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    clients: clients.size
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  clearInterval(heartbeatInterval);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, broadcast };
