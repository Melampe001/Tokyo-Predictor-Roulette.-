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
import TokioAIAdapter from './src/tokioai-adapter.js';

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
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

/**
 * GET /check - Simple readiness check endpoint
 * Returns 200 OK if service is ready to handle requests
 * Useful for Kubernetes readiness probes and load balancers
 */
app.get('/check', (req, res) => {
  res.status(200).json({
    status: 'ok',
    ready: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /status - Comprehensive status endpoint
 * Returns detailed system information including TokioAI status
 */
app.get('/status', (req, res) => {
  try {
    const tokioStats = tokioAI.getStatistics();
    const memUsage = process.memoryUsage();
    
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        environment: NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        unit: 'MB'
      },
      tokioai: {
        resultsCount: tokioStats.currentResults,
        totalResults: tokioStats.totalResults,
        totalAnalyses: tokioStats.totalAnalyses,
        lastAnalysis: tokioStats.lastAnalysis,
        uptime: tokioStats.uptime
      },
      websocket: {
        connectedClients: clients.size,
        serverReady: wss.readyState === 1
      }
    });
  } catch (error) {
    logger.error('Error fetching status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch system status',
      error: error.message
    });
  }
});

/**
 * POST /api/result - Submit a new result
 */
app.post('/api/result', async (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined || value === null) {
      return res.status(400).json({
        error: 'Missing required field: value'
      });
    }

    const result = tokioAI.captureResult(value);
    logger.info('Result captured:', { value, timestamp: result.timestamp });

    // Broadcast to WebSocket clients
    broadcastToClients({
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
 * GET /api/analysis - Get latest analysis
 */
app.get('/api/analysis', (req, res) => {
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
 * GET /api/results - Get recent results
 */
app.get('/api/results', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const results = tokioAI.results.slice(-limit);

    res.json({
      success: true,
      data: results,
      total: tokioAI.results.length
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
 * GET /api/statistics - Get system statistics
 */
app.get('/api/statistics', (req, res) => {
  try {
    const stats = tokioAI.getStatistics();
    
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
 * POST /api/clear - Clear all results (use with caution)
 */
app.post('/api/clear', (req, res) => {
  try {
    tokioAI.clearResults();
    logger.warn('All results cleared');

    broadcastToClients({
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
const clients = new Set();

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(message) {
  const payload = JSON.stringify(message);
  clients.forEach(client => {
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
  logger.info(`WebSocket client connected from ${clientIp}`);
  clients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Tokyo Predictor server',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.debug('WebSocket message received:', message);

      switch (message.type) {
        case 'result':
          // Capture a new result
          if (message.value !== undefined) {
            const result = tokioAI.captureResult(message.value);
            ws.send(JSON.stringify({
              type: 'result-captured',
              data: result
            }));
            // Broadcast to other clients
            broadcastToClients({
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
          // Send recent results
          const limit = message.limit || 50;
          const results = tokioAI.results.slice(-limit);
          ws.send(JSON.stringify({
            type: 'results',
            data: results,
            total: tokioAI.results.length
          }));
          break;

        case 'request-statistics':
          // Send statistics
          const stats = tokioAI.getStatistics();
          ws.send(JSON.stringify({
            type: 'statistics',
            data: stats
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
    logger.info(`WebSocket client disconnected from ${clientIp}`);
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    logger.error(`WebSocket error for client ${clientIp}:`, error);
    clients.delete(ws);
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
