// app.js - Cliente To-Do con REST-write + WS-push
// Mantiene REST para escribir (POST/PUT/DELETE) y WebSocket para recibir pushes

(function() {
  'use strict';

  // Configuración
  const SERVER_URL = 'http://localhost:3001';
  const WS_URL = 'ws://localhost:3001';
  const STORAGE_KEY = 'todos';
  const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Backoff exponencial

  // Estado de la aplicación
  let todos = [];
  let ws = null;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let isOnline = true;

  // Elementos del DOM
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const statusIndicator = document.getElementById('status-indicator');

  // ========== LocalStorage ==========

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        todos = JSON.parse(stored);
      }
    } catch (err) {
      console.error('Error cargando desde localStorage:', err);
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }
  }

  // ========== Merge Logic (Last-Write-Wins) ==========

  function mergeTodo(incomingTodo) {
    const existingIndex = todos.findIndex(t => t.id === incomingTodo.id);
    
    if (existingIndex === -1) {
      // Nuevo todo, añadirlo
      todos.push(incomingTodo);
    } else {
      // Todo existente, comparar updatedAt
      const existing = todos[existingIndex];
      const incomingDate = new Date(incomingTodo.updatedAt);
      const existingDate = new Date(existing.updatedAt);
      
      if (incomingDate >= existingDate) {
        // Incoming es más reciente o igual, actualizarlo
        todos[existingIndex] = incomingTodo;
      }
      // Si existing es más reciente, no hacer nada (conservar local)
    }
  }

  function removeTodo(id) {
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos.splice(index, 1);
    }
  }

  // ========== REST API ==========

  async function fetchTodos() {
    try {
      const response = await fetch(`${SERVER_URL}/todos`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Merge cada todo con last-write-wins
        data.data.forEach(mergeTodo);
        saveToLocalStorage();
        renderTodos();
      }
    } catch (err) {
      console.error('Error fetching todos:', err);
      // En modo offline, usar localStorage
      updateStatus('offline');
    }
  }

  async function createTodo(text) {
    try {
      const response = await fetch(`${SERVER_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        // No añadir aquí, llegará vía WebSocket
        // Si WS está desconectado, añadir localmente
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          mergeTodo(data.data);
          saveToLocalStorage();
          renderTodos();
        }
      }
    } catch (err) {
      console.error('Error creating todo:', err);
      // Modo offline: crear localmente
      const offlineTodo = {
        id: 'offline-' + Date.now() + Math.random().toString(36).substring(2, 11),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      todos.push(offlineTodo);
      saveToLocalStorage();
      renderTodos();
      updateStatus('offline');
    }
  }

  async function updateTodo(id, updates) {
    try {
      const response = await fetch(`${SERVER_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.success) {
        // No actualizar aquí, llegará vía WebSocket
        // Si WS está desconectado, actualizar localmente
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          mergeTodo(data.data);
          saveToLocalStorage();
          renderTodos();
        }
      }
    } catch (err) {
      console.error('Error updating todo:', err);
      // Modo offline: actualizar localmente
      const index = todos.findIndex(t => t.id === id);
      if (index !== -1) {
        todos[index] = {
          ...todos[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        saveToLocalStorage();
        renderTodos();
      }
      updateStatus('offline');
    }
  }

  async function deleteTodo(id) {
    try {
      const response = await fetch(`${SERVER_URL}/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      // No eliminar aquí, llegará vía WebSocket
      // Si WS está desconectado, eliminar localmente
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        removeTodo(id);
        saveToLocalStorage();
        renderTodos();
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
      // Modo offline: eliminar localmente
      removeTodo(id);
      saveToLocalStorage();
      renderTodos();
      updateStatus('offline');
    }
  }

  // ========== WebSocket ==========

  function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return; // Ya conectado o conectando
    }

    console.log('Conectando a WebSocket...');
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket conectado');
      reconnectAttempt = 0;
      updateStatus('connected');
      
      // Al reconectar, sincronizar todos desde el servidor
      fetchTodos();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (err) {
        console.error('Error procesando mensaje WS:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado');
      updateStatus('disconnected');
      scheduleReconnect();
    };
  }

  function handleWebSocketMessage(message) {
    console.log('WS mensaje:', message.type, message);

    switch (message.type) {
      case 'connected':
        console.log('Servidor confirmó conexión');
        break;

      case 'created':
        if (message.data) {
          mergeTodo(message.data);
          saveToLocalStorage();
          renderTodos();
        }
        break;

      case 'updated':
        if (message.data) {
          mergeTodo(message.data);
          saveToLocalStorage();
          renderTodos();
        }
        break;

      case 'deleted':
        if (message.data && message.data.id) {
          removeTodo(message.data.id);
          saveToLocalStorage();
          renderTodos();
        }
        break;

      case 'pong':
        // Respuesta a ping
        break;

      default:
        console.log('Tipo de mensaje WS desconocido:', message.type);
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    console.log(`Reintentando conexión en ${delay}ms...`);

    reconnectTimer = setTimeout(() => {
      reconnectAttempt++;
      connectWebSocket();
    }, delay);
  }

  // ========== UI ==========

  function updateStatus(status) {
    if (!statusIndicator) return;

    const statusMap = {
      connected: { text: 'Conectado', color: 'green' },
      disconnected: { text: 'Desconectado (reintentando...)', color: 'orange' },
      offline: { text: 'Modo Offline', color: 'red' }
    };

    const statusInfo = statusMap[status] || statusMap.offline;
    statusIndicator.textContent = statusInfo.text;
    statusIndicator.style.color = statusInfo.color;
  }

  function renderTodos() {
    if (!todoList) return;

    todoList.innerHTML = '';

    if (todos.length === 0) {
      const emptyMsg = document.createElement('li');
      emptyMsg.textContent = 'No hay tareas. ¡Añade una!';
      emptyMsg.style.fontStyle = 'italic';
      emptyMsg.style.color = '#999';
      todoList.appendChild(emptyMsg);
      return;
    }

    // Ordenar por fecha de creación (más reciente primero)
    const sortedTodos = [...todos].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    sortedTodos.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      if (todo.completed) {
        li.classList.add('completed');
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.addEventListener('change', () => {
        updateTodo(todo.id, { completed: checkbox.checked });
      });

      const text = document.createElement('span');
      text.textContent = todo.text;
      text.className = 'todo-text';

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '✕';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => {
        deleteTodo(todo.id);
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });
  }

  // ========== Event Handlers ==========

  function handleFormSubmit(e) {
    e.preventDefault();
    
    const text = todoInput.value.trim();
    if (!text) return;

    createTodo(text);
    todoInput.value = '';
  }

  // ========== Inicialización ==========

  function init() {
    // Cargar desde localStorage
    loadFromLocalStorage();
    renderTodos();

    // Conectar WebSocket
    connectWebSocket();

    // Sincronizar con servidor
    fetchTodos();

    // Event listeners
    if (todoForm) {
      todoForm.addEventListener('submit', handleFormSubmit);
    }

    // Detectar online/offline
    window.addEventListener('online', () => {
      console.log('Conexión restaurada');
      isOnline = true;
      fetchTodos();
      connectWebSocket();
    });

    window.addEventListener('offline', () => {
      console.log('Conexión perdida');
      isOnline = false;
      updateStatus('offline');
    });

    console.log('App To-Do inicializada');
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
