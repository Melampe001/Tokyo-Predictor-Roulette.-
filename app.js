/**
 * Cliente Todo con sincronización REST-write + WebSocket-push
 * 
 * - Escribe mediante REST (POST/PUT/DELETE)
 * - Recibe actualizaciones vía WebSocket
 * - Merge por id/updatedAt (last-write-wins)
 * - Persiste en localStorage
 * - Reconexión con backoff exponencial
 * - Funciona offline si servidor no disponible
 */

class TodoClient {
  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
    this.wsUrl = serverUrl.replace('http', 'ws');
    this.todos = [];
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000; // 30 segundos
    this.isOnline = false;
    
    // Cargar desde localStorage
    this.loadFromLocalStorage();
    
    // Conectar WebSocket
    this.connectWebSocket();
    
    // Inicializar UI
    this.initUI();
  }

  // ==================== Persistencia Local ====================

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('todos');
      if (stored) {
        this.todos = JSON.parse(stored);
        console.log('Datos cargados desde localStorage:', this.todos.length, 'todos');
      }
    } catch (error) {
      console.error('Error cargando desde localStorage:', error);
      this.todos = [];
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem('todos', JSON.stringify(this.todos));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  // ==================== WebSocket ====================

  connectWebSocket() {
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket conectado');
        this.isOnline = true;
        this.reconnectAttempts = 0;
        this.updateOnlineStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error procesando mensaje WS:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        this.isOnline = false;
        this.updateOnlineStatus(false);
      };

      this.ws.onclose = () => {
        console.log('WebSocket desconectado');
        this.isOnline = false;
        this.updateOnlineStatus(false);
        this.scheduleReconnect();
      };

    } catch (error) {
      console.error('Error conectando WebSocket:', error);
      this.isOnline = false;
      this.updateOnlineStatus(false);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    // Backoff exponencial: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    console.log(`Reconectando en ${delay / 1000}s...`);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log('Intentando reconectar...');
      this.connectWebSocket();
    }, delay);
  }

  handleWebSocketMessage(message) {
    const { type, payload, ts } = message;

    switch (type) {
      case 'connected':
        console.log('Confirmación de conexión:', payload.message);
        break;

      case 'created':
        console.log('Todo creado remotamente:', payload);
        this.mergeRemoteTodo(payload);
        break;

      case 'updated':
        console.log('Todo actualizado remotamente:', payload);
        this.mergeRemoteTodo(payload);
        break;

      case 'deleted':
        console.log('Todo eliminado remotamente:', payload.id);
        this.removeLocalTodo(payload.id);
        break;

      case 'pong':
        console.log('Pong recibido');
        break;

      default:
        console.log('Mensaje WS desconocido:', message);
    }
  }

  // ==================== Merge Logic (Last-Write-Wins) ====================

  mergeRemoteTodo(remoteTodo) {
    const localIndex = this.todos.findIndex(t => t.id === remoteTodo.id);

    if (localIndex === -1) {
      // No existe localmente, agregarlo
      this.todos.push(remoteTodo);
    } else {
      // Existe localmente, comparar updatedAt (last-write-wins)
      const localTodo = this.todos[localIndex];
      const localTime = new Date(localTodo.updatedAt).getTime();
      const remoteTime = new Date(remoteTodo.updatedAt).getTime();

      if (remoteTime >= localTime) {
        // El remoto es más reciente o igual, actualizarlo
        this.todos[localIndex] = remoteTodo;
      } else {
        console.log('Todo local más reciente, ignorando actualización remota');
        return; // No actualizar UI
      }
    }

    this.saveToLocalStorage();
    this.renderTodos();
  }

  removeLocalTodo(todoId) {
    const index = this.todos.findIndex(t => t.id === todoId);
    if (index !== -1) {
      this.todos.splice(index, 1);
      this.saveToLocalStorage();
      this.renderTodos();
    }
  }

  // ==================== REST API ====================

  async createTodo(text) {
    const todo = {
      text,
      completed: false
    };

    // Optimistic UI update (crear con ID temporal)
    const tempTodo = {
      id: `temp-${Date.now()}`,
      ...todo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.todos.push(tempTodo);
    this.saveToLocalStorage();
    this.renderTodos();

    // Intentar enviar al servidor
    try {
      const response = await fetch(`${this.serverUrl}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const createdTodo = await response.json();
      
      // Reemplazar todo temporal con el real
      const tempIndex = this.todos.findIndex(t => t.id === tempTodo.id);
      if (tempIndex !== -1) {
        this.todos[tempIndex] = createdTodo;
        this.saveToLocalStorage();
        this.renderTodos();
      }

      console.log('Todo creado:', createdTodo);
      
    } catch (error) {
      console.error('Error creando todo (modo offline):', error);
      // El todo temporal permanece en localStorage
    }
  }

  async updateTodo(id, updates) {
    // Optimistic update
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return;

    const oldTodo = { ...this.todos[index] };
    this.todos[index] = {
      ...this.todos[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToLocalStorage();
    this.renderTodos();

    // Intentar enviar al servidor
    try {
      const response = await fetch(`${this.serverUrl}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updatedTodo = await response.json();
      
      // Actualizar con respuesta del servidor
      const currentIndex = this.todos.findIndex(t => t.id === id);
      if (currentIndex !== -1) {
        this.todos[currentIndex] = updatedTodo;
        this.saveToLocalStorage();
        this.renderTodos();
      }

      console.log('Todo actualizado:', updatedTodo);

    } catch (error) {
      console.error('Error actualizando todo (modo offline):', error);
      // Los cambios optimistas permanecen
    }
  }

  async deleteTodo(id) {
    // Optimistic delete
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return;

    const deleted = this.todos.splice(index, 1)[0];
    this.saveToLocalStorage();
    this.renderTodos();

    // Intentar enviar al servidor
    try {
      const response = await fetch(`${this.serverUrl}/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('Todo eliminado:', id);

    } catch (error) {
      console.error('Error eliminando todo (modo offline):', error);
      // Ya fue eliminado localmente
    }
  }

  // ==================== UI ====================

  initUI() {
    // Crear contenedor principal si no existe
    if (!document.getElementById('todo-app')) {
      const app = document.createElement('div');
      app.id = 'todo-app';
      app.innerHTML = `
        <div class="todo-container">
          <h1>Todo App - REST + WebSocket Sync</h1>
          <div id="status" class="status offline">
            <span class="dot"></span>
            <span class="text">Offline</span>
          </div>
          <div class="input-group">
            <input type="text" id="new-todo" placeholder="Nueva tarea..." />
            <button id="add-todo">Agregar</button>
          </div>
          <ul id="todo-list"></ul>
        </div>
      `;
      document.body.appendChild(app);

      // Estilos básicos
      const style = document.createElement('style');
      style.textContent = `
        .todo-container {
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
        }
        .status.online {
          background: #d4edda;
          color: #155724;
        }
        .status.offline {
          background: #f8d7da;
          color: #721c24;
        }
        .status .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .status.online .dot {
          background: #28a745;
        }
        .status.offline .dot {
          background: #dc3545;
        }
        .input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        #new-todo {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #0056b3;
        }
        #todo-list {
          list-style: none;
          padding: 0;
        }
        .todo-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .todo-item.completed {
          opacity: 0.6;
        }
        .todo-item input[type="checkbox"] {
          cursor: pointer;
        }
        .todo-item .text {
          flex: 1;
        }
        .todo-item.completed .text {
          text-decoration: line-through;
        }
        .todo-item .delete {
          background: #dc3545;
          padding: 5px 10px;
          font-size: 12px;
        }
        .todo-item .delete:hover {
          background: #c82333;
        }
      `;
      document.head.appendChild(style);
    }

    // Event listeners
    document.getElementById('add-todo').addEventListener('click', () => {
      const input = document.getElementById('new-todo');
      const text = input.value.trim();
      if (text) {
        this.createTodo(text);
        input.value = '';
      }
    });

    document.getElementById('new-todo').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('add-todo').click();
      }
    });

    // Renderizar todos iniciales
    this.renderTodos();
  }

  renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = this.todos.map(todo => `
      <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} 
               onchange="todoClient.toggleTodo('${todo.id}')">
        <span class="text">${this.escapeHtml(todo.text)}</span>
        <button class="delete" onclick="todoClient.deleteTodo('${todo.id}')">Eliminar</button>
      </li>
    `).join('');
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      this.updateTodo(id, { completed: !todo.completed });
    }
  }

  updateOnlineStatus(isOnline) {
    const status = document.getElementById('status');
    if (status) {
      status.className = isOnline ? 'status online' : 'status offline';
      status.querySelector('.text').textContent = isOnline ? 'Online' : 'Offline';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Inicializar cliente global
let todoClient;

// Auto-inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      todoClient = new TodoClient();
    });
  } else {
    todoClient = new TodoClient();
  }
}

// Export para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TodoClient;
}
