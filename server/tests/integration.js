/**
 * Test de Integración para Tokyo WS-Sync Server
 * 
 * Este script:
 * 1. Inicia el servidor
 * 2. Crea una conexión WebSocket
 * 3. Realiza POST /todos
 * 4. Verifica que se recibe el evento 'created' via WebSocket
 * 5. Limpia y cierra
 */

import { spawn } from 'child_process';
import WebSocket from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_PATH = join(__dirname, '..', 'server.js');
const PORT = 3001; // Puerto de prueba diferente al de desarrollo

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Variables globales del test
let serverProcess;
let passed = 0;
let failed = 0;

// Helper para esperar
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper para hacer request HTTP
async function fetch(url, options = {}) {
  const lib = await import('http');
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = lib.default.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: () => Promise.resolve(data)
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Iniciar servidor
async function startServer() {
  return new Promise((resolve, reject) => {
    log('blue', '\n🚀 Iniciando servidor de prueba...');
    
    serverProcess = spawn('node', [SERVER_PATH], {
      env: { ...process.env, PORT: PORT.toString() },
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('iniciado')) {
        log('green', '✓ Servidor iniciado correctamente');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    serverProcess.on('error', (error) => {
      log('red', `✗ Error al iniciar servidor: ${error.message}`);
      reject(error);
    });

    // Timeout si el servidor no inicia en 5 segundos
    setTimeout(() => {
      reject(new Error('Timeout esperando inicio del servidor'));
    }, 5000);
  });
}

// Detener servidor
function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    log('blue', '🛑 Servidor detenido');
  }
}

// Tests
async function runTests() {
  log('blue', '\n📋 Ejecutando tests de integración...\n');

  try {
    // Test 1: Health check
    log('yellow', 'Test 1: Health check');
    const healthRes = await fetch(`http://localhost:${PORT}/health`);
    const healthData = await healthRes.json();
    
    if (healthData.status === 'healthy') {
      log('green', '✓ Health check exitoso');
      passed++;
    } else {
      log('red', '✗ Health check falló');
      failed++;
    }

    // Test 2: Conexión WebSocket
    log('yellow', '\nTest 2: Conexión WebSocket');
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    
    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        log('green', '✓ WebSocket conectado');
        passed++;
        resolve();
      });
      
      ws.on('error', (error) => {
        log('red', `✗ Error en WebSocket: ${error.message}`);
        failed++;
        reject(error);
      });

      setTimeout(() => reject(new Error('Timeout en conexión WS')), 3000);
    });

    // Test 3: Recibir mensaje de bienvenida
    log('yellow', '\nTest 3: Mensaje de bienvenida');
    const welcomeMessage = await new Promise((resolve, reject) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'connected') {
          resolve(msg);
        }
      });
      setTimeout(() => reject(new Error('Timeout esperando mensaje de bienvenida')), 3000);
    });

    if (welcomeMessage.type === 'connected') {
      log('green', '✓ Mensaje de bienvenida recibido');
      passed++;
    } else {
      log('red', '✗ Mensaje de bienvenida incorrecto');
      failed++;
    }

    // Test 4: POST /todos y verificar evento 'created'
    log('yellow', '\nTest 4: POST /todos y evento WebSocket');
    
    const eventPromise = new Promise((resolve, reject) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'created') {
          resolve(msg);
        }
      };
      ws.on('message', handler);
      setTimeout(() => reject(new Error('Timeout esperando evento created')), 5000);
    });

    // Crear un todo
    const postRes = await fetch(`http://localhost:${PORT}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test todo from integration test' })
    });

    const postData = await postRes.json();

    if (postRes.ok && postData.success) {
      log('green', '✓ POST /todos exitoso');
      passed++;
    } else {
      log('red', '✗ POST /todos falló');
      failed++;
    }

    // Verificar evento WebSocket
    const createdEvent = await eventPromise;

    if (createdEvent.type === 'created' && createdEvent.data.text === 'Test todo from integration test') {
      log('green', '✓ Evento "created" recibido via WebSocket');
      passed++;
    } else {
      log('red', '✗ Evento "created" incorrecto o no recibido');
      failed++;
    }

    // Test 5: GET /todos
    log('yellow', '\nTest 5: GET /todos');
    const getRes = await fetch(`http://localhost:${PORT}/todos`);
    const getData = await getRes.json();

    if (getRes.ok && getData.success && getData.data.length > 0) {
      log('green', '✓ GET /todos exitoso');
      passed++;
    } else {
      log('red', '✗ GET /todos falló');
      failed++;
    }

    // Test 6: PUT /todos/:id y evento 'updated'
    log('yellow', '\nTest 6: PUT /todos/:id y evento WebSocket');
    
    const updateEventPromise = new Promise((resolve, reject) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'updated') {
          resolve(msg);
        }
      };
      ws.on('message', handler);
      setTimeout(() => reject(new Error('Timeout esperando evento updated')), 5000);
    });

    const todoId = postData.data.id;
    const putRes = await fetch(`http://localhost:${PORT}/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });

    const putData = await putRes.json();

    if (putRes.ok && putData.success && putData.data.completed === true) {
      log('green', '✓ PUT /todos/:id exitoso');
      passed++;
    } else {
      log('red', '✗ PUT /todos/:id falló');
      failed++;
    }

    const updatedEvent = await updateEventPromise;

    if (updatedEvent.type === 'updated' && updatedEvent.data.completed === true) {
      log('green', '✓ Evento "updated" recibido via WebSocket');
      passed++;
    } else {
      log('red', '✗ Evento "updated" incorrecto o no recibido');
      failed++;
    }

    // Test 7: DELETE /todos/:id y evento 'deleted'
    log('yellow', '\nTest 7: DELETE /todos/:id y evento WebSocket');
    
    const deleteEventPromise = new Promise((resolve, reject) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'deleted') {
          resolve(msg);
        }
      };
      ws.on('message', handler);
      setTimeout(() => reject(new Error('Timeout esperando evento deleted')), 5000);
    });

    const deleteRes = await fetch(`http://localhost:${PORT}/todos/${todoId}`, {
      method: 'DELETE'
    });

    const deleteData = await deleteRes.json();

    if (deleteRes.ok && deleteData.success) {
      log('green', '✓ DELETE /todos/:id exitoso');
      passed++;
    } else {
      log('red', '✗ DELETE /todos/:id falló');
      failed++;
    }

    const deletedEvent = await deleteEventPromise;

    if (deletedEvent.type === 'deleted' && deletedEvent.data.id === todoId) {
      log('green', '✓ Evento "deleted" recibido via WebSocket');
      passed++;
    } else {
      log('red', '✗ Evento "deleted" incorrecto o no recibido');
      failed++;
    }

    // Cerrar WebSocket
    ws.close();

  } catch (error) {
    log('red', `\n✗ Error en tests: ${error.message}`);
    failed++;
  }
}

// Ejecución principal
async function main() {
  try {
    await startServer();
    await wait(1000); // Esperar a que el servidor esté listo
    await runTests();
  } catch (error) {
    log('red', `\n✗ Error fatal: ${error.message}`);
    process.exit(1);
  } finally {
    stopServer();
    
    // Resumen
    log('blue', '\n═══════════════════════════════════════');
    log('blue', '📊 Resumen de Tests');
    log('blue', '═══════════════════════════════════════');
    log('green', `✓ Pasados: ${passed}`);
    if (failed > 0) {
      log('red', `✗ Fallidos: ${failed}`);
    }
    log('blue', `Total: ${passed + failed}`);
    log('blue', '═══════════════════════════════════════\n');

    // Exit code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Ejecutar
main();
