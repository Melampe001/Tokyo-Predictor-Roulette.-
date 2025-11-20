import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_FILE = join(__dirname, '..', 'db.json');

// Test de integración
async function runIntegrationTest() {
  console.log('🧪 Iniciando test de integración...\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Helper: cargar/guardar DB
  function loadDB() {
    try {
      const data = readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return { todos: [] };
    }
  }

  function saveDB(db) {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }

  // Limpiar DB para el test
  saveDB({ todos: [] });

  // Setup servidor
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  function broadcast(message) {
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(data);
      }
    });
  }

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Conectado al servidor To-Do',
      timestamp: new Date().toISOString()
    }));
  });

  // REST Endpoints
  app.get('/todos', (req, res) => {
    const db = loadDB();
    res.json({ success: true, data: db.todos });
  });

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

    broadcast({
      type: 'created',
      data: newTodo
    });

    res.status(201).json({ success: true, data: newTodo });
  });

  app.put('/todos/:id', (req, res) => {
    const db = loadDB();
    const { id } = req.params;
    const { text, completed } = req.body;

    const todoIndex = db.todos.findIndex(t => t.id === id);
    if (todoIndex === -1) {
      return res.status(404).json({ success: false, error: 'To-do no encontrado' });
    }

    if (text !== undefined) {
      db.todos[todoIndex].text = text.trim();
    }
    if (completed !== undefined) {
      db.todos[todoIndex].completed = completed;
    }
    db.todos[todoIndex].updatedAt = new Date().toISOString();

    saveDB(db);

    broadcast({
      type: 'updated',
      data: db.todos[todoIndex]
    });

    res.json({ success: true, data: db.todos[todoIndex] });
  });

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

    broadcast({
      type: 'deleted',
      data: { id: deletedTodo.id }
    });

    res.json({ success: true, data: deletedTodo });
  });

  // Iniciar servidor en puerto aleatorio para tests
  const PORT = 3002;
  
  await new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`✅ Servidor de test iniciado en puerto ${PORT}\n`);
      resolve();
    });
  });

  // Test 1: Verificar que el servidor responde
  try {
    const response = await fetch(`http://localhost:${PORT}/todos`);
    const data = await response.json();
    
    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log('✅ Test 1 PASSED: GET /todos responde correctamente');
      testsPassed++;
    } else {
      console.log('❌ Test 1 FAILED: GET /todos no responde correctamente');
      testsFailed++;
    }
  } catch (err) {
    console.log('❌ Test 1 FAILED:', err.message);
    testsFailed++;
  }

  // Test 2: Crear conexión WebSocket y verificar evento 'created'
  try {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${PORT}`);
      let receivedConnected = false;
      let receivedCreated = false;
      let todoId = null;

      const timeout = setTimeout(() => {
        ws.close();
        if (!receivedCreated) {
          reject(new Error('Timeout: No se recibió evento created'));
        }
      }, 5000);

      ws.on('open', async () => {
        // Esperar mensaje de conexión
        await new Promise(r => setTimeout(r, 100));
        
        // Hacer POST /todos
        const response = await fetch(`http://localhost:${PORT}/todos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Test todo' })
        });
        
        const data = await response.json();
        todoId = data.data.id;
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connected') {
          receivedConnected = true;
        }
        
        if (message.type === 'created') {
          receivedCreated = true;
          clearTimeout(timeout);
          
          if (message.data && message.data.text === 'Test todo') {
            console.log('✅ Test 2 PASSED: Cliente WS recibió evento created con datos correctos');
            testsPassed++;
          } else {
            console.log('❌ Test 2 FAILED: Evento created con datos incorrectos');
            testsFailed++;
          }
          
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        ws.close();
        reject(err);
      });
    });
  } catch (err) {
    console.log('❌ Test 2 FAILED:', err.message);
    testsFailed++;
  }

  // Test 3: Verificar evento 'updated'
  try {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${PORT}`);
      let todoId = null;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout: No se recibió evento updated'));
      }, 5000);

      ws.on('open', async () => {
        await new Promise(r => setTimeout(r, 100));
        
        // Primero crear un todo
        const createResponse = await fetch(`http://localhost:${PORT}/todos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Todo to update' })
        });
        const createData = await createResponse.json();
        todoId = createData.data.id;

        // Luego actualizarlo
        await new Promise(r => setTimeout(r, 100));
        await fetch(`http://localhost:${PORT}/todos/${todoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true })
        });
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'updated') {
          clearTimeout(timeout);
          
          if (message.data && message.data.id === todoId && message.data.completed === true) {
            console.log('✅ Test 3 PASSED: Cliente WS recibió evento updated con datos correctos');
            testsPassed++;
          } else {
            console.log('❌ Test 3 FAILED: Evento updated con datos incorrectos');
            testsFailed++;
          }
          
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        ws.close();
        reject(err);
      });
    });
  } catch (err) {
    console.log('❌ Test 3 FAILED:', err.message);
    testsFailed++;
  }

  // Test 4: Verificar evento 'deleted'
  try {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${PORT}`);
      let todoId = null;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout: No se recibió evento deleted'));
      }, 5000);

      ws.on('open', async () => {
        await new Promise(r => setTimeout(r, 100));
        
        // Primero crear un todo
        const createResponse = await fetch(`http://localhost:${PORT}/todos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Todo to delete' })
        });
        const createData = await createResponse.json();
        todoId = createData.data.id;

        // Luego eliminarlo
        await new Promise(r => setTimeout(r, 100));
        await fetch(`http://localhost:${PORT}/todos/${todoId}`, {
          method: 'DELETE'
        });
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'deleted') {
          clearTimeout(timeout);
          
          if (message.data && message.data.id === todoId) {
            console.log('✅ Test 4 PASSED: Cliente WS recibió evento deleted con datos correctos');
            testsPassed++;
          } else {
            console.log('❌ Test 4 FAILED: Evento deleted con datos incorrectos');
            testsFailed++;
          }
          
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        ws.close();
        reject(err);
      });
    });
  } catch (err) {
    console.log('❌ Test 4 FAILED:', err.message);
    testsFailed++;
  }

  // Cerrar servidor
  await new Promise((resolve) => {
    server.close(() => {
      console.log('\n✅ Servidor de test cerrado');
      resolve();
    });
  });

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(50));
  console.log(`✅ Tests pasados: ${testsPassed}`);
  console.log(`❌ Tests fallados: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(50));

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 ¡Todos los tests pasaron!\n');
    process.exit(0);
  }
}

// Ejecutar tests
runIntegrationTest().catch((err) => {
  console.error('❌ Error ejecutando tests:', err);
  process.exit(1);
});
