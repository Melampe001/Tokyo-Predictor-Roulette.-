# Tokyo Predictor Roulette - Web Dashboard

Minimal React dashboard for interacting with the Tokyo Predictor Roulette backend server.

## Features

- Real-time WebSocket connection to backend
- Submit new results
- Request analysis
- View recent results
- Connection status monitoring
- Auto-reconnect on disconnect

## Development

### Prerequisites

- Node.js 20 or higher
- Backend server running on `http://localhost:8080`

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

Environment variables can be set in a `.env` file:

```bash
VITE_WS_URL=ws://localhost:8080
VITE_API_URL=http://localhost:8080
```

## Usage

1. **Start the backend server** first (see main README.md)
2. **Start the dashboard**: `npm run dev`
3. **Submit results**: Enter a number and click "Submit Result"
4. **Request Analysis**: Click "Request Analysis" to analyze recent results
5. **View Results**: Recent results are displayed in a table at the bottom

## WebSocket Messages

The dashboard communicates with the backend using these message types:

### Sent to Server

- `{ type: 'result', value: number }` - Submit a new result
- `{ type: 'request-analysis' }` - Request analysis
- `{ type: 'request-results', count: number }` - Fetch recent results

### Received from Server

- `{ type: 'connected', usingStub: boolean }` - Connection established
- `{ type: 'result-update', data: object }` - New result added
- `{ type: 'analysis', data: object }` - Analysis response
- `{ type: 'analysis-update', data: object }` - Analysis broadcast
- `{ type: 'results', data: array }` - Results list
- `{ type: 'error', message: string }` - Error message

## Browser Support

Modern browsers with WebSocket support (Chrome, Firefox, Safari, Edge).
