/**
 * Tokyo WS-Sync Client
 * Cliente que usa REST para writes y WebSocket para pushes
 * 
 * Características:
 * - REST para crear/actualizar/eliminar todos
 * - WebSocket para recibir actualizaciones en tiempo real
 * - Merge por id/updatedAt para resolver conflictos
 * - Reconexión automática con backoff exponencial
 * - Persistencia offline con localStorage
 */

class WSSyncClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.wsUrl = options.wsUrl || 'ws://localhost:3000';
    this.onUpdate = options.onUpdate || (() => {});
    
    // Estado
    this.todos = new Map(); // Map<id, todo>
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Inicial: 1 segundo
    this.maxReconnectDelay = 30000; // Máximo: 30 segundos
    
    // Cargar desde localStorage
    this.loadFromStorage();
    
    // Inicializar
    this.connect();
    this.fetchTodos();
  }

  /**
   * Conectar a WebSocket con reconexión automática
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔌 Conectando a WebSocket...');
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('✓ WebSocket conectado');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWSMessage(message);
      } catch (error) {
        console.error('✗ Error procesando mensaje WS:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('✗ Error en WebSocket:', error);
    };
  }

  /**
   * Programar reconexión con backoff exponencial
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('✗ Máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`⏱ Reconectando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Manejar mensajes WebSocket
   */
  handleWSMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'connected':
        console.log('✓', message.message);
        break;

      case 'ping':
        // Responder a ping
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;

      case 'created':
        console.log('📥 Todo creado:', data);
        this.mergeTodo(data);
        break;

      case 'updated':
        console.log('📥 Todo actualizado:', data);
        this.mergeTodo(data);
        break;

      case 'deleted':
        console.log('📥 Todo eliminado:', data.id);
        this.todos.delete(data.id);
        this.saveToStorage();
        this.onUpdate(Array.from(this.todos.values()));
        break;

      default:
        console.log('📡 Mensaje WS:', message);
    }
  }

  /**
   * Merge de todo por id/updatedAt
   * Si el todo entrante es más reciente, se actualiza
   */
  mergeTodo(incomingTodo) {
    const existing = this.todos.get(incomingTodo.id);

    if (!existing) {
      // Nuevo todo
      this.todos.set(incomingTodo.id, incomingTodo);
      this.saveToStorage();
      this.onUpdate(Array.from(this.todos.values()));
      return;
    }

    // Comparar timestamps
    const existingTime = new Date(existing.updatedAt).getTime();
    const incomingTime = new Date(incomingTodo.updatedAt).getTime();

    if (incomingTime > existingTime) {
      // El todo entrante es más reciente
      this.todos.set(incomingTodo.id, incomingTodo);
      this.saveToStorage();
      this.onUpdate(Array.from(this.todos.values()));
    } else {
      console.log('⏩ Todo local es más reciente, ignorando actualización');
    }
  }

  /**
   * Obtener todos los todos desde el servidor
   */
  async fetchTodos() {
    try {
      const response = await fetch(`${this.baseUrl}/todos`);
      const result = await response.json();

      if (result.success) {
        // Merge con datos locales
        result.data.forEach(todo => this.mergeTodo(todo));
        console.log(`✓ ${result.data.length} todos obtenidos del servidor`);
      }
    } catch (error) {
      console.error('✗ Error obteniendo todos:', error);
      console.log('⚠ Usando datos offline de localStorage');
    }
  }

  /**
   * Crear un nuevo todo (REST write)
   */
  async createTodo(text) {
    try {
      const response = await fetch(`${this.baseUrl}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✓ Todo creado:', result.data);
        // No necesitamos actualizar localmente, llegarĂ¡ via WebSocket
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('✗ Error creando todo:', error);
      
      // Modo offline: guardar localmente
      const offlineTodo = {
        id: 'offline-' + Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        offline: true
      };
      
      this.todos.set(offlineTodo.id, offlineTodo);
      this.saveToStorage();
      this.onUpdate(Array.from(this.todos.values()));
      
      console.log('⚠ Todo guardado offline, se sincronizará al reconectar');
      return offlineTodo;
    }
  }

  /**
   * Actualizar un todo (REST write)
   */
  async updateTodo(id, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✓ Todo actualizado:', result.data);
        // La actualización llegará via WebSocket
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('✗ Error actualizando todo:', error);
      
      // Modo offline: actualizar localmente
      const todo = this.todos.get(id);
      if (todo) {
        const updatedTodo = {
          ...todo,
          ...updates,
          updatedAt: new Date().toISOString(),
          offline: true
        };
        this.todos.set(id, updatedTodo);
        this.saveToStorage();
        this.onUpdate(Array.from(this.todos.values()));
        console.log('⚠ Todo actualizado offline, se sincronizará al reconectar');
        return updatedTodo;
      }
    }
  }

  /**
   * Eliminar un todo (REST write)
   */
  async deleteTodo(id) {
    try {
      const response = await fetch(`${this.baseUrl}/todos/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        console.log('✓ Todo eliminado:', id);
        // La eliminación llegará via WebSocket
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('✗ Error eliminando todo:', error);
      
      // Modo offline: eliminar localmente
      this.todos.delete(id);
      this.saveToStorage();
      this.onUpdate(Array.from(this.todos.values()));
      console.log('⚠ Todo eliminado offline, se sincronizará al reconectar');
      return true;
    }
  }

  /**
   * Obtener todos los todos locales
   */
  getTodos() {
    return Array.from(this.todos.values());
  }

  /**
   * Sincronizar todos offline con el servidor
   */
  async syncOfflineTodos() {
    const offlineTodos = Array.from(this.todos.values()).filter(t => t.offline);
    
    if (offlineTodos.length === 0) {
      console.log('✓ No hay todos offline para sincronizar');
      return;
    }

    console.log(`🔄 Sincronizando ${offlineTodos.length} todos offline...`);

    for (const todo of offlineTodos) {
      try {
        if (todo.id.startsWith('offline-')) {
          // Crear en servidor
          await this.createTodo(todo.text);
          // Eliminar la versión offline
          this.todos.delete(todo.id);
        } else {
          // Actualizar en servidor
          await this.updateTodo(todo.id, {
            text: todo.text,
            completed: todo.completed
          });
        }
      } catch (error) {
        console.error(`✗ Error sincronizando todo ${todo.id}:`, error);
      }
    }

    this.saveToStorage();
    console.log('✓ Sincronización completada');
  }

  /**
   * Guardar en localStorage
   */
  saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      const data = Array.from(this.todos.values());
      localStorage.setItem('ws-sync-todos', JSON.stringify(data));
    }
  }

  /**
   * Cargar desde localStorage
   */
  loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem('ws-sync-todos');
        if (data) {
          const todos = JSON.parse(data);
          todos.forEach(todo => this.todos.set(todo.id, todo));
          console.log(`✓ ${todos.length} todos cargados desde localStorage`);
        }
      } catch (error) {
        console.error('✗ Error cargando desde localStorage:', error);
      }
    }
  }

  /**
   * Limpiar localStorage
   */
  clearStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('ws-sync-todos');
      console.log('✓ localStorage limpiado');
    }
  }

  /**
   * Cerrar conexión
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('🔌 Desconectado');
    }
  }
}

// Exportar para uso en Node.js o navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WSSyncClient;
}

// Ejemplo de uso
if (typeof window !== 'undefined') {
  window.WSSyncClient = WSSyncClient;
  
  // Demo de uso
  console.log('');
  console.log('='.repeat(50));
  console.log('Tokyo WS-Sync Client cargado');
  console.log('='.repeat(50));
  console.log('');
  console.log('Ejemplo de uso:');
  console.log('');
  console.log('const client = new WSSyncClient({');
  console.log('  baseUrl: "http://localhost:3000",');
  console.log('  wsUrl: "ws://localhost:3000",');
  console.log('  onUpdate: (todos) => {');
  console.log('    console.log("Todos actualizados:", todos);');
  console.log('  }');
  console.log('});');
  console.log('');
  console.log('// Crear todo');
  console.log('await client.createTodo("Mi nueva tarea");');
  console.log('');
  console.log('// Actualizar todo');
  console.log('await client.updateTodo(todoId, { completed: true });');
  console.log('');
  console.log('// Eliminar todo');
  console.log('await client.deleteTodo(todoId);');
  console.log('');
  console.log('// Obtener todos');
  console.log('const todos = client.getTodos();');
  console.log('');
}
