/**
 * Tokyo Predictor WebSocket Client
 * REST-write + WS-push model for todos synchronization
 */

class TodoClient {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'http://localhost:3001';
    this.wsUrl = options.wsUrl || 'ws://localhost:3001';
    this.storageKey = options.storageKey || 'tokyo-todos';
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectDelay = options.maxReconnectDelay || 30000;
    this.currentReconnectDelay = this.reconnectDelay;
    
    this.ws = null;
    this.todos = [];
    this.listeners = [];
    this.reconnectAttempts = 0;
    this.isOnline = false;
    
    // Load from localStorage
    this.loadFromStorage();
    
    // Initialize WebSocket connection
    this.connect();
    
    // Fetch initial data from server
    this.fetchTodos();
  }

  /**
   * Load todos from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.todos = JSON.parse(stored);
        console.log('[TodoClient] Loaded from localStorage:', this.todos.length, 'todos');
      }
    } catch (error) {
      console.error('[TodoClient] Error loading from localStorage:', error);
      this.todos = [];
    }
  }

  /**
   * Save todos to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
      console.log('[TodoClient] Saved to localStorage:', this.todos.length, 'todos');
    } catch (error) {
      console.error('[TodoClient] Error saving to localStorage:', error);
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('[TodoClient] WebSocket already connected or connecting');
      return;
    }

    console.log('[TodoClient] Connecting to WebSocket:', this.wsUrl);
    
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('[TodoClient] WebSocket connected');
        this.isOnline = true;
        this.reconnectAttempts = 0;
        this.currentReconnectDelay = this.reconnectDelay;
        this.notifyListeners({ type: 'connection', status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[TodoClient] Received message:', message);
          this.handleMessage(message);
        } catch (error) {
          console.error('[TodoClient] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[TodoClient] WebSocket error:', error);
        this.isOnline = false;
        this.notifyListeners({ type: 'connection', status: 'error', error });
      };

      this.ws.onclose = () => {
        console.log('[TodoClient] WebSocket disconnected');
        this.isOnline = false;
        this.notifyListeners({ type: 'connection', status: 'disconnected' });
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('[TodoClient] Error creating WebSocket:', error);
      this.isOnline = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    console.log('[TodoClient] Scheduling reconnect attempt', this.reconnectAttempts, 'in', this.currentReconnectDelay, 'ms');
    
    setTimeout(() => {
      this.connect();
    }, this.currentReconnectDelay);

    // Exponential backoff
    this.currentReconnectDelay = Math.min(
      this.currentReconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log('[TodoClient] Server connection confirmed:', message.message);
        break;

      case 'created':
        this.handleCreated(message.data);
        break;

      case 'updated':
        this.handleUpdated(message.data);
        break;

      case 'deleted':
        this.handleDeleted(message.data);
        break;

      case 'pong':
        console.log('[TodoClient] Pong received:', message.timestamp);
        break;

      default:
        console.log('[TodoClient] Unknown message type:', message.type);
    }
  }

  /**
   * Handle created event from server
   */
  handleCreated(todo) {
    console.log('[TodoClient] Todo created:', todo);
    
    // Check if we already have this todo
    const existingIndex = this.todos.findIndex(t => t.id === todo.id);
    
    if (existingIndex === -1) {
      // Add new todo
      this.todos.push(todo);
      this.saveToStorage();
      this.notifyListeners({ type: 'created', data: todo });
    } else {
      // Update if the received todo is newer
      const existing = this.todos[existingIndex];
      if (new Date(todo.updatedAt) > new Date(existing.updatedAt)) {
        this.todos[existingIndex] = todo;
        this.saveToStorage();
        this.notifyListeners({ type: 'updated', data: todo });
      }
    }
  }

  /**
   * Handle updated event from server
   */
  handleUpdated(todo) {
    console.log('[TodoClient] Todo updated:', todo);
    
    const index = this.todos.findIndex(t => t.id === todo.id);
    
    if (index !== -1) {
      // Update if the received todo is newer
      const existing = this.todos[index];
      if (new Date(todo.updatedAt) > new Date(existing.updatedAt)) {
        this.todos[index] = todo;
        this.saveToStorage();
        this.notifyListeners({ type: 'updated', data: todo });
      }
    } else {
      // Add if we don't have it
      this.todos.push(todo);
      this.saveToStorage();
      this.notifyListeners({ type: 'created', data: todo });
    }
  }

  /**
   * Handle deleted event from server
   */
  handleDeleted(data) {
    console.log('[TodoClient] Todo deleted:', data.id);
    
    const index = this.todos.findIndex(t => t.id === data.id);
    
    if (index !== -1) {
      const deleted = this.todos.splice(index, 1)[0];
      this.saveToStorage();
      this.notifyListeners({ type: 'deleted', data: deleted });
    }
  }

  /**
   * Fetch todos from server (REST)
   */
  async fetchTodos() {
    try {
      console.log('[TodoClient] Fetching todos from server...');
      const response = await fetch(`${this.serverUrl}/todos`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const serverTodos = await response.json();
      console.log('[TodoClient] Fetched', serverTodos.length, 'todos from server');
      
      // Merge with local todos
      this.mergeTodos(serverTodos);
      this.saveToStorage();
      this.notifyListeners({ type: 'sync', data: this.todos });
      
      return serverTodos;
    } catch (error) {
      console.error('[TodoClient] Error fetching todos:', error);
      console.log('[TodoClient] Using offline data from localStorage');
      this.notifyListeners({ type: 'sync', data: this.todos, offline: true });
      return this.todos;
    }
  }

  /**
   * Merge server todos with local todos by updatedAt timestamp
   */
  mergeTodos(serverTodos) {
    const merged = new Map();
    
    // Add local todos to map
    this.todos.forEach(todo => {
      merged.set(todo.id, todo);
    });
    
    // Merge with server todos (server wins on conflicts)
    serverTodos.forEach(serverTodo => {
      const local = merged.get(serverTodo.id);
      if (!local || new Date(serverTodo.updatedAt) >= new Date(local.updatedAt)) {
        merged.set(serverTodo.id, serverTodo);
      }
    });
    
    this.todos = Array.from(merged.values());
  }

  /**
   * Create a new todo (REST)
   */
  async createTodo(text, completed = false) {
    const todo = {
      text,
      completed
    };

    try {
      console.log('[TodoClient] Creating todo via REST:', todo);
      const response = await fetch(`${this.serverUrl}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(todo)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const created = await response.json();
      console.log('[TodoClient] Todo created successfully:', created);
      
      // Add to local state (WebSocket will also send an update, but this is faster)
      this.handleCreated(created);
      
      return created;
    } catch (error) {
      console.error('[TodoClient] Error creating todo:', error);
      
      // Offline mode: create locally
      const offlineTodo = {
        id: `offline-${Date.now()}`,
        text,
        completed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        offline: true
      };
      
      this.todos.push(offlineTodo);
      this.saveToStorage();
      this.notifyListeners({ type: 'created', data: offlineTodo, offline: true });
      
      return offlineTodo;
    }
  }

  /**
   * Update a todo (REST)
   */
  async updateTodo(id, updates) {
    try {
      console.log('[TodoClient] Updating todo via REST:', id, updates);
      const response = await fetch(`${this.serverUrl}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updated = await response.json();
      console.log('[TodoClient] Todo updated successfully:', updated);
      
      // Update local state
      this.handleUpdated(updated);
      
      return updated;
    } catch (error) {
      console.error('[TodoClient] Error updating todo:', error);
      
      // Offline mode: update locally
      const index = this.todos.findIndex(t => t.id === id);
      if (index !== -1) {
        const offlineUpdate = {
          ...this.todos[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          offline: true
        };
        
        this.todos[index] = offlineUpdate;
        this.saveToStorage();
        this.notifyListeners({ type: 'updated', data: offlineUpdate, offline: true });
        
        return offlineUpdate;
      }
      
      throw error;
    }
  }

  /**
   * Delete a todo (REST)
   */
  async deleteTodo(id) {
    try {
      console.log('[TodoClient] Deleting todo via REST:', id);
      const response = await fetch(`${this.serverUrl}/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[TodoClient] Todo deleted successfully:', result);
      
      // Update local state
      this.handleDeleted({ id });
      
      return result;
    } catch (error) {
      console.error('[TodoClient] Error deleting todo:', error);
      
      // Offline mode: delete locally
      const index = this.todos.findIndex(t => t.id === id);
      if (index !== -1) {
        const deleted = this.todos.splice(index, 1)[0];
        this.saveToStorage();
        this.notifyListeners({ type: 'deleted', data: deleted, offline: true });
        
        return { message: 'Deleted offline', todo: deleted };
      }
      
      throw error;
    }
  }

  /**
   * Get all todos
   */
  getTodos() {
    return this.todos;
  }

  /**
   * Add a listener for events
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[TodoClient] Error in listener:', error);
      }
    });
  }

  /**
   * Send ping to server
   */
  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TodoClient;
}

// Example usage in browser
if (typeof window !== 'undefined') {
  window.TodoClient = TodoClient;
  
  // Auto-initialize example
  console.log('[TodoClient] Library loaded. Create instance with: new TodoClient()');
}
