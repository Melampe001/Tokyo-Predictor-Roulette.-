# Tokyo Predictor Roulette - Web Dashboard

Minimal React dashboard for real-time roulette analysis visualization.

## Features

- Real-time WebSocket connection to backend server
- Submit manual roulette results
- View recent results history
- Request and display AI analysis
- Display statistics and trends
- Responsive design

## Development

### Prerequisites

- Node.js 18+ and npm
- Backend server running on port 8080

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The dashboard will be available at http://localhost:3000

The development server includes a proxy configuration that forwards API requests to the backend on port 8080.

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

### WebSocket Connection

The dashboard automatically connects to:
- Development: `ws://localhost:8080/ws`
- Production: `ws://<hostname>:8080/ws`

To change the WebSocket URL, edit `src/App.jsx`.

## Usage

1. **Submit Results**: Enter a number and click "Submit" to send a new result
2. **Request Analysis**: Click "Request Analysis" to trigger AI analysis on recent results
3. **Refresh Results**: Click "Refresh Results" to fetch the latest result history
4. **View Analysis**: Analysis results are displayed automatically when available

## WebSocket Messages

### Outgoing Messages

```javascript
// Submit a result
{ type: 'result', value: 12 }

// Request analysis
{ type: 'request-analysis' }

// Request recent results
{ type: 'request-results', limit: 50 }
```

### Incoming Messages

```javascript
// Connection established
{ type: 'connected', data: { timestamp, statistics } }

// Result update
{ type: 'result-update', data: { resultado, fecha, hora } }

// Analysis results
{ type: 'analysis', data: { batchSize, frequencies, trends, ... } }

// Results list
{ type: 'results', data: [...] }

// Error
{ type: 'error', message: '...' }
```

## Technology Stack

- React 18
- Vite (build tool)
- WebSocket API
- CSS-in-JS for styling

## File Structure

```
web-dashboard/
├── src/
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies and scripts
└── README.md           # This file
```
