/**
 * Tokyo Predictor Roulette - Backend Server
 * 
 * Production-ready Express + WebSocket server for TokioAI
 * Provides REST API and WebSocket endpoints for real-time analysis
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import TokioAIAdapter from './src/tokioai-adapter.js';
import { 
  initializeAuth, 
  registerUser, 
  authenticateUser, 
  authMiddleware,
  adminMiddleware,
  authenticateWebSocket,
  verifyToken,
  getAllUsers,
  deleteUser
} from './src/auth-middleware.js';
import { UserDataManager } from './src/user-data-manager.js';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Configuration
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later'
});

// Initialize authentication system
await initializeAuth();
logger.info('Authentication system initialized');

// Initialize user data manager
const userDataManager = new UserDataManager();
await userDataManager.initialize();
logger.info('User data manager initialized');

// Initialize TokioAI instance
let tokioAI;
try {
  tokioAI = new TokioAIAdapter({
    batchSize: parseInt(process.env.BATCH_SIZE || '10'),
    encryption: process.env.ENABLE_ENCRYPTION !== 'false',
    autoAnalyze: process.env.AUTO_ANALYZE !== 'false'
  });
  logger.info('TokioAI initialized successfully');
} catch (error) {
  logger.error('Failed to initialize TokioAI:', error);
  process.exit(1);
}

// REST API Endpoints

/**
 * Authentication Endpoints
 */

/**
 * POST /api/auth/login - User login
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required'
      });
    }

    const result = await authenticateUser(username, password);
    logger.info(`User logged in: ${username}`);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.warn(`Login failed: ${error.message}`);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/register - User registration
 */
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required'
      });
    }

    const user = await registerUser(username, password);
    logger.info(`New user registered: ${username}`);

    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    logger.warn(`Registration failed: ${error.message}`);
    res.status(400).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/verify - Verify token
 */
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * GET /api/auth/users - Get all users (admin only)
 */
app.get('/api/auth/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = getAllUsers();
    res.json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

/**
 * DELETE /api/auth/users/:username - Delete user (admin only)
 */
app.delete('/api/auth/users/:username', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    await deleteUser(username);
    await userDataManager.deleteUserData(username);
    
    logger.info(`User deleted: ${username}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting user ${req.params.username}:`, error);
    res.status(400).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

/**
 * Health check endpoint (public)
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// REST API Endpoints

/**
 * POST /api/result - Submit a new result (requires authentication)
 */
app.post('/api/result', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body;
    const username = req.user.username;
    
    if (value === undefined || value === null) {
      return res.status(400).json({
        error: 'Missing required field: value'
      });
    }

    const result = tokioAI.captureResult(value);
    
    // Store in user-specific encrypted storage
    await userDataManager.storeUserResult(username, result);
    
    logger.info('Result captured:', { username, value, timestamp: result.timestamp });

    // Broadcast to WebSocket clients of the same user
    broadcastToUserClients(username, {
      type: 'result-update',
      data: result
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error capturing result:', error);
    res.status(500).json({
      error: 'Failed to capture result',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis - Get latest analysis (requires authentication)
 */
app.get('/api/analysis', authMiddleware, (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count) : null;
    const analysis = tokioAI.analyzeBatch(count);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Error generating analysis:', error);
    res.status(500).json({
      error: 'Failed to generate analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/results - Get recent results (requires authentication, user-specific)
 */
app.get('/api/results', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const username = req.user.username;
    const results = await userDataManager.getUserResults(username, limit);

    res.json({
      success: true,
      data: results,
      total: results.length
    });
  } catch (error) {
    logger.error('Error fetching results:', error);
    res.status(500).json({
      error: 'Failed to fetch results',
      message: error.message
    });
  }
});

/**
 * GET /api/statistics - Get system statistics (requires authentication, user-specific)
 */
app.get('/api/statistics', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const stats = await userDataManager.getUserStatistics(username);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/history - Get user history (requires authentication)
 */
app.get('/api/history', authMiddleware, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const username = req.user.username;
    const history = await userDataManager.getUserHistory(username, limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error fetching history:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

/**
 * GET /api/export - Export user data (requires authentication)
 */
app.get('/api/export', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const userData = await userDataManager.exportUserData(username);

    if (!userData) {
      return res.status(404).json({
        error: 'No data found',
        message: 'No data available for export'
      });
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({
      error: 'Failed to export data',
      message: error.message
    });
  }
});

/**
 * POST /api/clear - Clear all results (requires authentication, user-specific)
 */
app.post('/api/clear', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    await userDataManager.clearUserResults(username);
    
    logger.warn(`User ${username} cleared their results`);

    broadcastToUserClients(username, {
      type: 'results-cleared'
    });

    res.json({
      success: true,
      message: 'All results cleared'
    });
  } catch (error) {
    logger.error('Error clearing results:', error);
    res.status(500).json({
      error: 'Failed to clear results',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// WebSocket Server
const wss = new WebSocketServer({ server });
const clients = new Map(); // Map of username -> Set of WebSocket connections

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(message) {
  const payload = JSON.stringify(message);
  clients.forEach(userClients => {
    userClients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    });
  });
}

/**
 * Broadcast message to specific user's WebSocket clients
 */
function broadcastToUserClients(username, message) {
  const userClients = clients.get(username);
  if (!userClients) {
    return;
  }

  const payload = JSON.stringify(message);
  userClients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

/**
 * WebSocket connection handler
 */
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  let authenticated = false;
  let username = null;

  // Attempt to authenticate via URL parameters
  try {
    const url = req.url;
    const user = authenticateWebSocket('ws://localhost' + url);
    username = user.username;
    authenticated = true;
    
    // Add to clients map
    if (!clients.has(username)) {
      clients.set(username, new Set());
    }
    clients.get(username).add(ws);
    
    logger.info(`WebSocket client authenticated: ${username} from ${clientIp}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Tokyo Predictor server',
      authenticated: true,
      username,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    logger.warn(`WebSocket connection from ${clientIp} without authentication`);
    
    // Send authentication required message
    ws.send(JSON.stringify({
      type: 'auth-required',
      message: 'Authentication required. Please provide a valid token.',
      timestamp: new Date().toISOString()
    }));
  }

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.debug('WebSocket message received:', message);

      // Handle authentication
      if (message.type === 'authenticate') {
        try {
          const user = verifyToken(message.token);
          username = user.username;
          authenticated = true;
          
          // Add to clients map
          if (!clients.has(username)) {
            clients.set(username, new Set());
          }
          clients.get(username).add(ws);
          
          logger.info(`WebSocket client authenticated: ${username}`);
          
          ws.send(JSON.stringify({
            type: 'authenticated',
            message: 'Authentication successful',
            username,
            timestamp: new Date().toISOString()
          }));
          return;
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Authentication failed: ' + error.message
          }));
          return;
        }
      }

      // Require authentication for other operations
      if (!authenticated) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication required'
        }));
        return;
      }

      switch (message.type) {
        case 'result':
          // Capture a new result
          if (message.value !== undefined) {
            const result = tokioAI.captureResult(message.value);
            
            // Store in user-specific encrypted storage
            await userDataManager.storeUserResult(username, result);
            
            ws.send(JSON.stringify({
              type: 'result-captured',
              data: result
            }));
            
            // Broadcast to user's other clients
            broadcastToUserClients(username, {
              type: 'result-update',
              data: result
            });
          }
          break;

        case 'request-analysis':
          // Generate and send analysis
          const analysis = tokioAI.analyzeBatch(message.count);
          ws.send(JSON.stringify({
            type: 'analysis',
            data: analysis
          }));
          break;

        case 'request-results':
          // Send recent results (user-specific)
          const limit = message.limit || 50;
          const results = await userDataManager.getUserResults(username, limit);
          ws.send(JSON.stringify({
            type: 'results',
            data: results,
            total: results.length
          }));
          break;

        case 'request-statistics':
          // Send statistics (user-specific)
          const stats = await userDataManager.getUserStatistics(username);
          ws.send(JSON.stringify({
            type: 'statistics',
            data: stats
          }));
          break;

        case 'request-history':
          // Send history (user-specific)
          const historyLimit = message.limit || 100;
          const history = await userDataManager.getUserHistory(username, historyLimit);
          ws.send(JSON.stringify({
            type: 'history',
            data: history
          }));
          break;

        case 'ping':
          // Respond to ping
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${message.type}`
          }));
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
        error: error.message
      }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    logger.info(`WebSocket client disconnected${username ? `: ${username}` : ''} from ${clientIp}`);
    
    if (username && clients.has(username)) {
      const userClients = clients.get(username);
      userClients.delete(ws);
      
      // Remove username entry if no more connections
      if (userClients.size === 0) {
        clients.delete(username);
      }
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    logger.error(`WebSocket error for client ${username || 'unauthenticated'} from ${clientIp}:`, error);
    
    if (username && clients.has(username)) {
      const userClients = clients.get(username);
      userClients.delete(ws);
      
      // Remove username entry if no more connections
      if (userClients.size === 0) {
        clients.delete(username);
      }
    }
  });
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Close WebSocket server
  wss.clients.forEach(client => {
    client.close();
  });
  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close TokioAI
  if (tokioAI) {
    tokioAI.close();
    logger.info('TokioAI closed');
  }

  // Exit
  setTimeout(() => {
    logger.info('Shutdown complete');
    process.exit(0);
  }, 1000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  logger.info(`Tokyo Predictor server started`);
  logger.info(`Environment: ${NODE_ENV}`);
  logger.info(`HTTP server listening on port ${PORT}`);
  logger.info(`WebSocket server ready at ws://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
