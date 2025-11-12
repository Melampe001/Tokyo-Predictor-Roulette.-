# TokioAI Integration Examples

This directory contains integration examples for connecting mobile and web clients to the TokioAI backend.

## Available Examples

### 1. Flutter Integration (`flutter-integration.dart`)

Complete Flutter client implementation with REST API and WebSocket support.

**Features:**
- REST API methods for all endpoints
- WebSocket real-time communication
- Example Flutter widget with UI
- Full documentation and comments

**Dependencies:**
```yaml
dependencies:
  http: ^1.1.0
  web_socket_channel: ^2.4.0
```

**Usage:**
```dart
final client = TokioAIClient(
  baseUrl: 'http://your-server:8080',
  wsUrl: 'ws://your-server:8080',
);

// Submit result
await client.submitResult(12);

// Get analysis
final analysis = await client.getAnalysis();
print(analysis['data']['suggestion']);

// Connect WebSocket
final stream = client.connectWebSocket();
stream.listen((message) {
  print('Received: ${message['type']}');
});
```

### 2. React Native Integration (`react-native-integration.js`)

Production-ready React Native component with full UI implementation.

**Features:**
- Complete React Native app component
- REST API integration
- WebSocket real-time updates
- Modern UI with number grid and results list
- Error handling and loading states

**Dependencies:**
```bash
npm install react-native-webview
```

**Usage:**
```javascript
import TokioAIApp from './examples/react-native-integration';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TokioAIApp />
    </SafeAreaView>
  );
};
```

### 3. Basic Node.js Usage (`usage.js`)

Simple Node.js example demonstrating TokioAI module usage.

**Usage:**
```bash
npm run example
```

## Server Configuration

### For Development (localhost)

```javascript
// Flutter/React Native
baseUrl: 'http://localhost:8080'
wsUrl: 'ws://localhost:8080'
```

### For Android Emulator

```javascript
// Android emulator uses special IP for host machine
baseUrl: 'http://10.0.2.2:8080'
wsUrl: 'ws://10.0.2.2:8080'
```

### For iOS Simulator

```javascript
// iOS simulator can use localhost
baseUrl: 'http://localhost:8080'
wsUrl: 'ws://localhost:8080'
```

### For Physical Devices

```javascript
// Use your computer's local IP address
baseUrl: 'http://192.168.1.100:8080'  // Replace with your IP
wsUrl: 'ws://192.168.1.100:8080'
```

**Finding your IP:**
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/result` | Submit a result |
| GET | `/api/analysis` | Get analysis |
| GET | `/api/results` | Get recent results |
| GET | `/api/statistics` | Get statistics |
| POST | `/api/clear` | Clear all results |

### WebSocket Messages

**Outgoing (Client → Server):**
```javascript
{ type: 'result', value: 12 }
{ type: 'request-analysis', count: 10 }
{ type: 'request-results', limit: 50 }
{ type: 'request-statistics' }
{ type: 'ping' }
```

**Incoming (Server → Client):**
```javascript
{ type: 'connected', message: '...', timestamp: '...' }
{ type: 'result-update', data: { resultado: 12, ... } }
{ type: 'result-captured', data: { resultado: 12, ... } }
{ type: 'analysis', data: { suggestion: '...', ... } }
{ type: 'results', data: [...], total: 100 }
{ type: 'statistics', data: { currentResults: 50, ... } }
{ type: 'results-cleared' }
{ type: 'error', message: '...' }
{ type: 'pong', timestamp: '...' }
```

## Running the Backend

Make sure the TokioAI backend server is running:

```bash
# Development mode
npm run dev

# Production mode
npm start

# Docker
docker-compose up -d
```

Server will be available at `http://localhost:8080`

## Testing the Integration

### 1. Start the Backend

```bash
cd /path/to/Tokyo-Predictor-Roulette.-
npm install
npm start
```

### 2. Test with curl

```bash
# Health check
curl http://localhost:8080/health

# Submit result
curl -X POST http://localhost:8080/api/result \
  -H "Content-Type: application/json" \
  -d '{"value": 12}'

# Get analysis
curl http://localhost:8080/api/analysis
```

### 3. Test WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'result', value: 12 }));
};

ws.onmessage = (event) => {
  console.log('Message:', JSON.parse(event.data));
};
```

## Common Issues

### Connection Refused

**Problem:** Cannot connect to backend from mobile device

**Solutions:**
1. Ensure backend is running: `npm start`
2. Check firewall allows port 8080
3. Use correct IP address (not localhost on physical devices)
4. For Android emulator, use `10.0.2.2` instead of `localhost`

### CORS Errors

**Problem:** CORS errors when making API requests

**Solution:** The backend already has CORS enabled. If you still see errors:
1. Make sure you're using the correct origin
2. Check server logs for CORS-related messages

### WebSocket Connection Failed

**Problem:** WebSocket cannot connect

**Solutions:**
1. Ensure URL uses `ws://` protocol (not `http://`)
2. Check server is running and accessible
3. Verify no proxy/firewall blocking WebSocket connections
4. Check server logs for WebSocket errors

### SSL/TLS Errors

**Problem:** SSL certificate errors on production

**Solution:** For production, use:
- `https://` for REST API
- `wss://` for WebSocket
- Valid SSL certificate on server

## Production Deployment

### HTTPS/WSS Setup

For production, use secure protocols:

```javascript
// Production configuration
const client = new TokioAIClient(
  baseUrl: 'https://your-domain.com',
  wsUrl: 'wss://your-domain.com',
);
```

### Environment Variables

Use environment variables for configuration:

```javascript
// Flutter
const String baseUrl = String.fromEnvironment('API_BASE_URL', 
  defaultValue: 'http://localhost:8080');

// React Native
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
```

## Additional Resources

- [TokioAI Backend Documentation](../TOKIOAI_README.md)
- [API Documentation](../README.md#-api-rest)
- [WebSocket Documentation](../README.md#-websocket)
- [Troubleshooting Guide](../HELP.md)

## Contributing

To add a new integration example:

1. Create a new file in this directory
2. Include comprehensive comments
3. Provide usage instructions
4. Add an entry to this README
5. Test thoroughly with the backend

## Support

For issues or questions:
- Check [HELP.md](../HELP.md) for common solutions
- Review [Issues](https://github.com/Melampe001/Tokyo-Predictor-Roulette.-/issues)
- Create a new issue with example details
