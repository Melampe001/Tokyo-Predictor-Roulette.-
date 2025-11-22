/**
 * Integration tests for REST API and WebSocket broadcasts
 * Tests the REST-write + WS-push model
 */

import { jest } from '@jest/globals';
import WebSocket from 'ws';

// We'll test against a running server or start our own
const SERVER_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// Helper to wait for a condition
const waitFor = (condition, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 100);
  });
};

describe('Server Integration Tests', () => {
  let server;
  let serverModule;
  
  beforeAll(async () => {
    // Import and start the server
    try {
      serverModule = await import('../server.js');
      // Wait for server to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Close server
    if (serverModule && serverModule.server) {
      await new Promise((resolve) => {
        serverModule.server.close(() => {
          console.log('Test server closed');
          resolve();
        });
      });
    }
  });

  describe('REST API', () => {
    test('GET /health should return healthy status', async () => {
      const response = await fetch(`${SERVER_URL}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('clients');
    });

    test('GET /todos should return todos array', async () => {
      const response = await fetch(`${SERVER_URL}/todos`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    test('POST /todos should create a new todo', async () => {
      const newTodo = {
        text: 'Test todo',
        completed: false
      };

      const response = await fetch(`${SERVER_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTodo)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.text).toBe(newTodo.text);
      expect(data.completed).toBe(newTodo.completed);
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    test('POST /todos should reject invalid data', async () => {
      const response = await fetch(`${SERVER_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('PUT /todos/:id should update a todo', async () => {
      // First create a todo
      const createResponse = await fetch(`${SERVER_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: 'Todo to update', completed: false })
      });
      const createdTodo = await createResponse.json();

      // Update it
      const updateResponse = await fetch(`${SERVER_URL}/todos/${createdTodo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: 'Updated todo', completed: true })
      });

      const updatedTodo = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updatedTodo.id).toBe(createdTodo.id);
      expect(updatedTodo.text).toBe('Updated todo');
      expect(updatedTodo.completed).toBe(true);
      expect(updatedTodo.updatedAt).not.toBe(createdTodo.updatedAt);
    });

    test('PUT /todos/:id should return 404 for non-existent todo', async () => {
      const response = await fetch(`${SERVER_URL}/todos/nonexistent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: 'Updated' })
      });

      expect(response.status).toBe(404);
    });

    test('DELETE /todos/:id should delete a todo', async () => {
      // First create a todo
      const createResponse = await fetch(`${SERVER_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: 'Todo to delete', completed: false })
      });
      const createdTodo = await createResponse.json();

      // Delete it
      const deleteResponse = await fetch(`${SERVER_URL}/todos/${createdTodo.id}`, {
        method: 'DELETE'
      });

      expect(deleteResponse.status).toBe(200);
      const data = await deleteResponse.json();
      expect(data).toHaveProperty('message');
      expect(data.todo.id).toBe(createdTodo.id);
    });

    test('DELETE /todos/:id should return 404 for non-existent todo', async () => {
      const response = await fetch(`${SERVER_URL}/todos/nonexistent`, {
        method: 'DELETE'
      });

      expect(response.status).toBe(404);
    });
  });

  describe('WebSocket Broadcasts', () => {
    test('should broadcast created event when todo is created', (done) => {
      const ws = new WebSocket(WS_URL);
      let receivedMessages = [];

      ws.on('open', async () => {
        // Wait for connection message
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create a todo via REST
        await fetch(`${SERVER_URL}/todos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: 'Broadcast test todo', completed: false })
        });
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        receivedMessages.push(message);

        // Check for created event
        if (message.type === 'created') {
          expect(message.data).toHaveProperty('id');
          expect(message.data.text).toBe('Broadcast test todo');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        ws.close();
        done(error);
      });

      // Timeout
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          done(new Error('Timeout waiting for broadcast'));
        }
      }, 5000);
    });

    test('should broadcast updated event when todo is updated', (done) => {
      const ws = new WebSocket(WS_URL);
      let todoId;

      ws.on('open', async () => {
        // Wait for connection message
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create a todo
        const createResponse = await fetch(`${SERVER_URL}/todos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: 'Todo to update via WS', completed: false })
        });
        const createdTodo = await createResponse.json();
        todoId = createdTodo.id;

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update the todo
        await fetch(`${SERVER_URL}/todos/${todoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ completed: true })
        });
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        // Check for updated event
        if (message.type === 'updated') {
          expect(message.data.id).toBe(todoId);
          expect(message.data.completed).toBe(true);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        ws.close();
        done(error);
      });

      // Timeout
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          done(new Error('Timeout waiting for broadcast'));
        }
      }, 5000);
    });

    test('should broadcast deleted event when todo is deleted', (done) => {
      const ws = new WebSocket(WS_URL);
      let todoId;

      ws.on('open', async () => {
        // Wait for connection message
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create a todo
        const createResponse = await fetch(`${SERVER_URL}/todos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: 'Todo to delete via WS', completed: false })
        });
        const createdTodo = await createResponse.json();
        todoId = createdTodo.id;

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));

        // Delete the todo
        await fetch(`${SERVER_URL}/todos/${todoId}`, {
          method: 'DELETE'
        });
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        // Check for deleted event
        if (message.type === 'deleted') {
          expect(message.data.id).toBe(todoId);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        ws.close();
        done(error);
      });

      // Timeout
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          done(new Error('Timeout waiting for broadcast'));
        }
      }, 5000);
    });

    test('should handle ping-pong', (done) => {
      const ws = new WebSocket(WS_URL);

      ws.on('open', () => {
        // Send ping
        ws.send(JSON.stringify({ type: 'ping' }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'pong') {
          expect(message).toHaveProperty('timestamp');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        ws.close();
        done(error);
      });

      // Timeout
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          done(new Error('Timeout waiting for pong'));
        }
      }, 5000);
    });
  });
});
