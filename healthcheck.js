#!/usr/bin/env node
/**
 * Health check script for Tokyo Predictor server
 * Used by Docker healthcheck
 */

import http from 'http';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

const options = {
  host: HOST,
  port: PORT,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  process.exit(res.statusCode === 200 ? 0 : 1);
});

request.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timed out');
  request.destroy();
  process.exit(1);
});

request.end();
