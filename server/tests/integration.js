import { spawn } from 'child_process';
import http from 'http';
import WebSocket from 'ws';

// Configuración
const SERVER_PORT = 3002; // Usar puerto diferente para tests
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const WS_URL = `ws://localhost:${SERVER_PORT}`;

let serverProcess = null;

// Función auxiliar para hacer peticiones HTTP
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: SERVER_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Función auxiliar para esperar
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Iniciar servidor
async function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Iniciando servidor de prueba...');
    
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: SERVER_PORT },
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let started = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[servidor] ${output.trim()}`);
      
      if (output.includes('ejecutándose') && !started) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[servidor error] ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Error al iniciar servidor:', error);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      if (!started) {
        reject(new Error(`Servidor terminó con código ${code}`));
      }
    });

    // Timeout si no arranca en 5 segundos
    setTimeout(() => {
      if (!started) {
        reject(new Error('Timeout esperando inicio del servidor'));
      }
    }, 5000);
  });
}

// Detener servidor
function stopServer() {
  return new Promise((resolve) => {
    if (serverProcess) {
      console.log('Deteniendo servidor...');
      serverProcess.on('exit', () => {
        serverProcess = null;
        resolve();
      });
      serverProcess.kill();
      
      // Forzar después de 2 segundos
      setTimeout(() => {
        if (serverProcess) {
          serverProcess.kill('SIGKILL');
          serverProcess = null;
        }
        resolve();
      }, 2000);
    } else {
      resolve();
    }
  });
}

// Tests
async function runTests() {
  let exitCode = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Iniciar servidor
    await startServer();
    await wait(1000); // Esperar a que el servidor esté completamente listo

    console.log('\n=== Ejecutando Tests de Integración ===\n');

    // Test 1: Health check
    console.log('Test 1: Health check');
    try {
      const res = await makeRequest('GET', '/health');
      if (res.status === 200 && res.data.status === 'ok') {
        console.log('✓ Health check OK');
        testsPassed++;
      } else {
        throw new Error('Health check falló');
      }
    } catch (error) {
      console.error('✗ Test 1 falló:', error.message);
      testsFailed++;
    }

    // Test 2: Obtener todos vacío
    console.log('\nTest 2: GET /todos (vacío)');
    try {
      const res = await makeRequest('GET', '/todos');
      if (res.status === 200 && Array.isArray(res.data)) {
        console.log('✓ GET /todos retorna array');
        testsPassed++;
      } else {
        throw new Error('GET /todos no retorna array');
      }
    } catch (error) {
      console.error('✗ Test 2 falló:', error.message);
      testsFailed++;
    }

    // Test 3: Crear todo y recibir evento WS 'created'
    console.log('\nTest 3: POST /todos y evento WebSocket "created"');
    try {
      const wsReceived = [];
      const ws = new WebSocket(WS_URL);

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout conectando WS')), 3000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        ws.on('error', reject);
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        wsReceived.push(message);
      });

      // Esperar mensaje de conexión
      await wait(500);

      // Crear todo
      const createRes = await makeRequest('POST', '/todos', {
        text: 'Test todo',
        completed: false
      });

      if (createRes.status !== 201) {
        throw new Error(`POST /todos retornó ${createRes.status}`);
      }

      // Esperar evento WS
      await wait(500);

      // Verificar evento 'created'
      const createdEvent = wsReceived.find(m => m.type === 'created');
      if (!createdEvent) {
        throw new Error('No se recibió evento "created"');
      }

      if (createdEvent.payload.text !== 'Test todo') {
        throw new Error('Payload del evento no coincide');
      }

      ws.close();
      console.log('✓ POST /todos crea y emite evento "created"');
      testsPassed++;

      // Test 4: Actualizar todo y recibir evento 'updated'
      console.log('\nTest 4: PUT /todos/:id y evento WebSocket "updated"');
      
      const ws2 = new WebSocket(WS_URL);
      const ws2Received = [];

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout conectando WS')), 3000);
        ws2.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        ws2.on('error', reject);
      });

      ws2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        ws2Received.push(message);
      });

      await wait(500);

      // Actualizar el todo creado
      const todoId = createRes.data.id;
      const updateRes = await makeRequest('PUT', `/todos/${todoId}`, {
        text: 'Test todo actualizado',
        completed: true
      });

      if (updateRes.status !== 200) {
        throw new Error(`PUT /todos/:id retornó ${updateRes.status}`);
      }

      await wait(500);

      // Verificar evento 'updated'
      const updatedEvent = ws2Received.find(m => m.type === 'updated');
      if (!updatedEvent) {
        throw new Error('No se recibió evento "updated"');
      }

      if (updatedEvent.payload.completed !== true) {
        throw new Error('Payload del evento no refleja la actualización');
      }

      ws2.close();
      console.log('✓ PUT /todos/:id actualiza y emite evento "updated"');
      testsPassed++;

      // Test 5: Eliminar todo y recibir evento 'deleted'
      console.log('\nTest 5: DELETE /todos/:id y evento WebSocket "deleted"');
      
      const ws3 = new WebSocket(WS_URL);
      const ws3Received = [];

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout conectando WS')), 3000);
        ws3.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        ws3.on('error', reject);
      });

      ws3.on('message', (data) => {
        const message = JSON.parse(data.toString());
        ws3Received.push(message);
      });

      await wait(500);

      // Eliminar el todo
      const deleteRes = await makeRequest('DELETE', `/todos/${todoId}`);

      if (deleteRes.status !== 200) {
        throw new Error(`DELETE /todos/:id retornó ${deleteRes.status}`);
      }

      await wait(500);

      // Verificar evento 'deleted'
      const deletedEvent = ws3Received.find(m => m.type === 'deleted');
      if (!deletedEvent) {
        throw new Error('No se recibió evento "deleted"');
      }

      if (deletedEvent.payload.id !== todoId) {
        throw new Error('ID del evento no coincide');
      }

      ws3.close();
      console.log('✓ DELETE /todos/:id elimina y emite evento "deleted"');
      testsPassed++;

    } catch (error) {
      console.error('✗ Tests de integración fallaron:', error.message);
      testsFailed++;
    }

    // Resumen
    console.log('\n=== Resumen de Tests ===');
    console.log(`✓ Tests exitosos: ${testsPassed}`);
    console.log(`✗ Tests fallidos: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);

    if (testsFailed > 0) {
      exitCode = 1;
    }

  } catch (error) {
    console.error('Error fatal en tests:', error);
    exitCode = 1;
  } finally {
    // Detener servidor
    await stopServer();
  }

  process.exit(exitCode);
}

// Ejecutar tests
runTests().catch(error => {
  console.error('Error ejecutando tests:', error);
  stopServer().then(() => process.exit(1));
});
