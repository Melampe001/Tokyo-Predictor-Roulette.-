# Tokyo Predictor Dashboard

Web dashboard for real-time monitoring and interaction with the Tokyo Predictor backend server.

## Features

- 🔄 Real-time WebSocket connection to backend server
- 📝 Submit new roulette results
- 📊 Request and view analysis
- 📈 View statistics
- 🎲 Display recent results in real-time
- 🎨 Modern, responsive UI with gradient design

## Prerequisites

- Node.js 18+ installed
- Tokyo Predictor backend server running on port 8080

## Installation

```bash
cd web-dashboard
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The dashboard will be available at http://localhost:3000

## Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Configuration

The dashboard connects to the backend WebSocket server at the same hostname on port 8080. To change this, modify the `wsUrl` in `src/App.jsx`:

```javascript
const wsUrl = `ws://${window.location.hostname}:8080`;
```

## WebSocket Messages

The dashboard sends and receives the following WebSocket message types:

### Outgoing (to server):
- `{ type: 'result', value: number }` - Submit a new result
- `{ type: 'request-analysis', count?: number }` - Request analysis
- `{ type: 'request-results', limit?: number }` - Request recent results
- `{ type: 'request-statistics' }` - Request statistics

### Incoming (from server):
- `{ type: 'connected', message: string }` - Connection established
- `{ type: 'result-update', data: object }` - New result broadcast
- `{ type: 'results', data: array }` - Results list
- `{ type: 'analysis', data: object }` - Analysis data
- `{ type: 'statistics', data: object }` - Statistics data
- `{ type: 'error', message: string }` - Error message

## Tech Stack

- React 18
- Vite
- WebSocket API
- CSS3 (with animations and gradients)

## Browser Support

Modern browsers with WebSocket support (Chrome, Firefox, Safari, Edge)
