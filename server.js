/**
 * Tokyo Predictor Roulette - Backend Server
 * 
 * Production-ready Node.js Express + WebSocket server
 * Integrates with TokioAI module for roulette analysis
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import winston from 'winston';
import dotenv from 'dotenv';
import TokioAI, { isStubMode } from './src/tokioai-adapter.js';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Configuration
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize TokioAI
const tokioConfig = {
  batchSize: parseInt(process.env.BATCH_SIZE) || 10,
  encryption: process.env.ENABLE_ENCRYPTION !== 'false',
  autoAnalyze: process.env.AUTO_ANALYZE !== 'false',
  wsPort: PORT
};

let tokio;
try {
  tokio = new TokioAI(tokioConfig);
  logger.info('TokioAI initialized', { 
    config: tokioConfig, 
    stubMode: isStubMode 
  });
  
  if (isStubMode) {
    logger.warn('⚠️  Running in STUB MODE - Replace with real TokioAI implementation');
  }
} catch (error) {
  logger.error('Failed to initialize TokioAI', { error: error.message });
  process.exit(1);
}

// Create Express app
const app = express();
app.use(express.json());

// CORS middleware for development
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// Request logging middleware
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = tokio.getStatistics();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    stubMode: isStubMode,
    tokioStats: stats
  });
});

// REST API: Submit a result
app.post('/api/result', async (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined || value === null) {
      return res.status(400).json({
        error: 'Missing required field: value'
      });
    }

    const result = tokio.captureResult(value);
    logger.info('Result captured', { value });

    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'result-update',
      data: result
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('Error capturing result', { error: error.message });
    res.status(500).json({
      error: 'Failed to capture result',
      message: error.message
    });
  }
});

// REST API: Get latest analysis
app.get('/api/analysis', (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count) : null;
    
    let analysis;
    if (tokio.analysis) {
      analysis = tokio.analysis;
    } else {
      // Trigger analysis if not available
      analysis = tokio.analyzeBatch(count);
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Error getting analysis', { error: error.message });
    res.status(500).json({
      error: 'Failed to get analysis',
      message: error.message
    });
  }
});

// REST API: Get recent results
app.get('/api/results', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const results = tokio.results.slice(-limit);
    
    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    logger.error('Error getting results', { error: error.message });
    res.status(500).json({
      error: 'Failed to get results',
      message: error.message
    });
  }
});

// REST API: Get statistics
app.get('/api/statistics', (req, res) => {
  try {
    const stats = tokio.getStatistics();
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    logger.error('Error getting statistics', { error: error.message });
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
  clients.add(ws);
  
  logger.info('WebSocket client connected', { clientId, total: clients.size });

  // Send current statistics on connection
  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      timestamp: new Date().toISOString(),
      statistics: tokio.getStatistics()
    }
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      logger.info('WebSocket message received', { type: data.type, clientId });

      switch (data.type) {
        case 'result':
          {
            const result = tokio.captureResult(data.value);
            broadcastToClients({
              type: 'result-update',
              data: result
            });
          }
          break;

        case 'request-analysis':
          {
            const analysis = tokio.analyzeBatch(data.count);
            ws.send(JSON.stringify({
              type: 'analysis',
              data: analysis
            }));
            
            // Also broadcast to other clients
            broadcastToClients({
              type: 'analysis-update',
              data: analysis
            });
          }
          break;

        case 'request-results':
          {
            const limit = data.limit || 50;
            const results = tokio.results.slice(-limit);
            ws.send(JSON.stringify({
              type: 'results',
              data: results
            }));
          }
          break;

        case 'request-statistics':
          {
            const stats = tokio.getStatistics();
            ws.send(JSON.stringify({
              type: 'statistics',
              data: stats
            }));
          }
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      logger.error('WebSocket message error', { 
        error: error.message, 
        clientId 
      });
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('WebSocket client disconnected', { clientId, total: clients.size });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', { error: error.message, clientId });
  });
});

// Broadcast helper function
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Listen for TokioAI events and broadcast
tokio.on('result-captured', (result) => {
  logger.debug('TokioAI event: result-captured', { result });
});

tokio.on('analysis-complete', (analysis) => {
  logger.info('TokioAI event: analysis-complete', { 
    batchSize: analysis.batchSize 
  });
  broadcastToClients({
    type: 'analysis-update',
    data: analysis
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Express error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close WebSocket connections
  clients.forEach((client) => {
    client.close(1000, 'Server shutting down');
  });

  // Close TokioAI resources
  try {
    tokio.close();
    logger.info('TokioAI resources closed');
  } catch (error) {
    logger.error('Error closing TokioAI', { error: error.message });
  }

  // Exit after timeout
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { 
    error: error.message, 
    stack: error.stack 
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: NODE_ENV,
    stubMode: isStubMode,
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      api: `http://localhost:${PORT}/api`,
      ws: `ws://localhost:${PORT}/ws`
    }
  });
});

export { app, server, tokio, wss };
