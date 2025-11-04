/**
 * Tokyo Predictor Roulette Backend Server
 * 
 * Production-ready Node.js Express + WebSocket server
 * Integrates with TokioAI for predictive analysis
 */

import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';
import winston from 'winston';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  createTokioAI, 
  captureResult, 
  analyzeBatch,
  generatePDF,
  saveEncrypted,
  isUsingStub
} from './src/tokioai-adapter.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Winston logger
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
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

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
let tokioAI = null;

try {
  tokioAI = createTokioAI({
    batchSize: parseInt(process.env.BATCH_SIZE || '10'),
    encryption: process.env.ENCRYPTION !== 'false',
    autoAnalyze: process.env.AUTO_ANALYZE !== 'false'
  });
  
  if (isUsingStub()) {
    logger.warn('⚠ TokioAI running in stub mode - real implementation should be integrated');
  } else {
    logger.info('✓ TokioAI initialized successfully');
  }
} catch (error) {
  logger.error('Failed to initialize TokioAI:', error);
  process.exit(1);
}

// WebSocket Server
const wss = new WebSocketServer({ server });

// Track connected clients
const clients = new Set();

wss.on('connection', (ws, req) => {
  clients.add(ws);
  const clientIp = req.socket.remoteAddress;
  
  logger.info(`WebSocket client connected`, { clientIp, totalClients: clients.size });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Tokyo Predictor Roulette server',
    usingStub: isUsingStub()
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      logger.debug('WebSocket message received', { type: data.type });

      switch (data.type) {
        case 'result': {
          // Capture result
          if (typeof data.value === 'undefined') {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Result value is required' 
            }));
            return;
          }

          const entry = captureResult(tokioAI, data.value);
          logger.info('Result captured', { value: data.value });

          // Broadcast to all clients
          broadcast({
            type: 'result-update',
            data: entry
          });
          break;
        }

        case 'request-analysis': {
          // Perform analysis
          const analysis = analyzeBatch(tokioAI);
          logger.info('Analysis performed', { 
            batchSize: analysis.batchSize,
            totalResults: analysis.statistics?.totalResults 
          });

          // Send analysis to requesting client
          ws.send(JSON.stringify({
            type: 'analysis',
            data: analysis
          }));

          // Broadcast analysis update to all clients
          broadcast({
            type: 'analysis-update',
            data: {
              timestamp: analysis.timestamp,
              suggestion: analysis.suggestion,
              statistics: analysis.statistics
            }
          });
          break;
        }

        case 'request-results': {
          // Send recent results
          const count = data.count || 50;
          const results = tokioAI.results?.slice(-count) || [];
          
          ws.send(JSON.stringify({
            type: 'results',
            data: results
          }));
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }

        default:
          logger.warn('Unknown WebSocket message type', { type: data.type });
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: `Unknown message type: ${data.type}` 
          }));
      }
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('WebSocket client disconnected', { 
      clientIp, 
      totalClients: clients.size 
    });
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', { error: error.message, clientIp });
  });
});

// Broadcast helper function
function broadcast(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// REST API Endpoints

/**
 * POST /api/result
 * Capture a new result
 */
app.post('/api/result', async (req, res) => {
  try {
    const { value } = req.body;

    if (typeof value === 'undefined') {
      return res.status(400).json({ 
        error: 'Result value is required' 
      });
    }

    const entry = captureResult(tokioAI, value);
    logger.info('Result captured via REST API', { value });

    // Broadcast to WebSocket clients
    broadcast({
      type: 'result-update',
      data: entry
    });

    res.json({ 
      success: true, 
      data: entry 
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
 * GET /api/analysis
 * Get current analysis or perform new analysis
 */
app.get('/api/analysis', async (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count) : null;
    const analysis = analyzeBatch(tokioAI, count);
    
    logger.info('Analysis retrieved via REST API', { 
      batchSize: analysis.batchSize 
    });

    res.json({ 
      success: true, 
      data: analysis,
      usingStub: isUsingStub()
    });
  } catch (error) {
    logger.error('Error performing analysis:', error);
    res.status(500).json({ 
      error: 'Failed to perform analysis',
      message: error.message 
    });
  }
});

/**
 * GET /api/results
 * Get recent results
 */
app.get('/api/results', (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count) : 50;
    const results = tokioAI.results?.slice(-count) || [];
    
    res.json({ 
      success: true, 
      data: results,
      total: tokioAI.results?.length || 0
    });
  } catch (error) {
    logger.error('Error retrieving results:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve results',
      message: error.message 
    });
  }
});

/**
 * GET /api/statistics
 * Get system statistics
 */
app.get('/api/statistics', (req, res) => {
  try {
    const stats = tokioAI.getStatistics();
    
    res.json({ 
      success: true, 
      data: stats,
      server: {
        uptime: process.uptime(),
        connectedClients: clients.size,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    logger.error('Error retrieving statistics:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve statistics',
      message: error.message 
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    tokioAI: {
      available: !!tokioAI,
      usingStub: isUsingStub(),
      resultsCount: tokioAI?.results?.length || 0
    }
  });
});

/**
 * GET /
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Tokyo Predictor Roulette Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: {
        result: 'POST /api/result',
        analysis: 'GET /api/analysis',
        results: 'GET /api/results',
        statistics: 'GET /api/statistics'
      },
      websocket: 'ws://[host]:[port]'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Start server
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  logger.info(`🚀 Server started on port ${PORT}`);
  logger.info(`   REST API: http://localhost:${PORT}`);
  logger.info(`   WebSocket: ws://localhost:${PORT}`);
  logger.info(`   Health check: http://localhost:${PORT}/health`);
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isUsingStub()) {
    logger.warn('⚠ Running with TokioAI stub implementation');
    logger.warn('  TODO: Integrate real TokioAI implementation for production use');
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close WebSocket connections
    clients.forEach((client) => {
      client.close();
    });
    
    // Close TokioAI
    if (tokioAI) {
      tokioAI.close();
    }
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
