# Tokyo Predictor Roulette

Proyecto de análisis predictivo para casino privado Android con módulo de IA.

## TokioAI - Módulo de Análisis Predictivo

TokioAI es un módulo de agente IA diseñado para análisis predictivo, integración dinámica de RNG y seguridad reforzada.

### Características Principales

- ✅ **Captura y Sincronización**: Resultados manuales o vía WebSocket
- ✅ **Análisis por Lotes**: Procesa grupos de 10 resultados con cálculo de tendencias
- ✅ **Sugerencias Optimizadas**: Recomendaciones basadas en patrones y frecuencias
- ✅ **Encriptación Local**: Seguridad con AES-256-GCM
- ✅ **Generación de PDF**: Reportes con columnas: Resultado, Probabilidad, Fecha, Hora
- ✅ **Backend Server**: Production-ready Express + WebSocket server
- ✅ **Web Dashboard**: React-based real-time monitoring dashboard
- ✅ **Docker Support**: Containerized deployment ready
- ✅ **CI/CD**: Automated testing and build workflows

## Quick Start

### Prerequisites

- Node.js 20 or higher
- Docker (optional, for containerized deployment)

### Installation

```bash
npm install
```

### Run Backend Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:8080` (or the port specified in `PORT` environment variable).

### Run Tests

```bash
# Run all tests (unit + backend)
npm test

# Run unit tests only
npm run test:unit

# Run backend API tests only
npm run test:backend
```

### Run Web Dashboard

```bash
cd web-dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=8080
NODE_ENV=development

# TokioAI Configuration
BATCH_SIZE=10
ENCRYPTION=true
AUTO_ANALYZE=true

# Logging
LOG_LEVEL=info
```

## Docker Deployment

### Build Docker Image

```bash
docker build -f docker/Dockerfile -t tokyo-predictor-backend .
```

### Run Docker Container

```bash
docker run -d \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  --name tokyo-predictor \
  tokyo-predictor-backend
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
```

## API Endpoints

### REST API

- `GET /health` - Health check endpoint
- `GET /` - API information
- `POST /api/result` - Submit a new result
  ```json
  { "value": 25 }
  ```
- `GET /api/analysis` - Get analysis (optional `?count=N`)
- `GET /api/results` - Get recent results (optional `?count=N`)
- `GET /api/statistics` - Get system statistics

### WebSocket

Connect to `ws://localhost:8080` and send/receive messages:

**Client → Server:**
```json
{ "type": "result", "value": 25 }
{ "type": "request-analysis" }
{ "type": "request-results", "count": 50 }
```

**Server → Client:**
```json
{ "type": "result-update", "data": {...} }
{ "type": "analysis", "data": {...} }
{ "type": "analysis-update", "data": {...} }
```

## APK Analysis Tool

Analyze Android APK files:

```bash
./scripts/analyze_apk.sh path/to/your-app.apk
```

The script will generate a detailed analysis report including:
- Basic APK information
- File structure
- Permissions
- Certificate information
- Security analysis
- Checksums (MD5, SHA256)

## CI/CD Workflows

### Backend CI Workflow

Located at `.github/workflows/backend-ci.yml`, this workflow:
- Runs on push/PR to main, develop, and feature branches
- Tests with Node.js 20
- Runs all tests
- Checks server startup
- Builds web-dashboard
- Builds and tests Docker image
- Uploads build artifacts

### Required CI Secrets

For Android keystore signing (if using Flutter build workflows):
- `KEYSTORE_BASE64` - Base64 encoded keystore file
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_ALIAS` - Key alias
- `KEY_PASSWORD` - Key password

To add secrets: Go to repository Settings → Secrets and variables → Actions → New repository secret

## Project Structure

```
.
├── server.js                 # Express + WebSocket server
├── src/
│   ├── tokioai.js           # Core TokioAI module
│   ├── tokioai-adapter.js   # Adapter with stub fallback
│   ├── crypto-utils.js      # Encryption utilities
│   └── pdf-generator.js     # PDF generation
├── test/
│   ├── test.js              # Unit tests for TokioAI
│   └── backend.test.js      # Backend API tests (Jest)
├── web-dashboard/           # React dashboard
│   ├── src/
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── docker/
│   └── Dockerfile           # Production Docker image
├── scripts/
│   └── analyze_apk.sh       # APK analysis script
├── .github/
│   └── workflows/
│       └── backend-ci.yml   # CI workflow
└── docker-compose.yml       # Docker Compose configuration
```

## Development Guide

### Using the TokioAI Module

```javascript
import TokioAI from './src/tokioai.js';

// Create instance
const tokio = new TokioAI({
  batchSize: 10,
  encryption: true,
  autoAnalyze: true
});

// Capture results
tokio.captureResult(12);
tokio.captureResult(35);

// Analyze
const analysis = tokio.analyzeBatch();
console.log(analysis.suggestion);

// Generate PDF
await tokio.generatePDF('./reporte.pdf');
```

### Integration Notes

⚠️ **Important**: The current implementation uses a stub adapter (`src/tokioai-adapter.js`) that falls back to basic functionality if the real TokioAI module is not fully integrated.

**TODO for Maintainers:**
1. Ensure the real TokioAI implementation is working correctly
2. Test all adapter functions with real TokioAI
3. Remove stub fallback code once verified
4. Update documentation with any specific configuration requirements

See the [integration issue](#) for detailed steps.

## Web Dashboard Usage

1. Start the backend server: `npm start`
2. Start the dashboard: `cd web-dashboard && npm run dev`
3. Open `http://localhost:3000` in your browser
4. Submit results using the input field
5. Request analysis to see patterns and suggestions
6. View real-time updates from other clients

The dashboard automatically reconnects if the connection is lost.

## Testing

### Unit Tests (TokioAI)

```bash
npm run test:unit
```

Tests cover:
- TokioAI initialization
- Result capture and batch processing
- Analysis and pattern detection
- Encryption/decryption
- Statistics and events

### Backend API Tests (Jest + Supertest)

```bash
npm run test:backend
```

Tests cover:
- REST API endpoints
- Request/response validation
- Error handling
- CORS headers
- Health checks

## Troubleshooting

### Server won't start

- Check if port 8080 is already in use: `lsof -i :8080`
- Verify Node.js version: `node --version` (should be 20+)
- Check logs in `logs/` directory

### WebSocket connection fails

- Ensure backend server is running
- Check firewall settings
- Verify WebSocket URL in dashboard configuration

### Docker build fails

- Ensure Docker is running
- Check Docker version: `docker --version`
- Try building with `--no-cache` flag

## Documentation

- [TokioAI Module Documentation](./TOKIOAI_README.md)
- [Web Dashboard README](./web-dashboard/README.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## Workflows CI/CD

Este proyecto incluye workflows para:
- Backend CI (Node.js testing, Docker build)
- Flutter Build (Android APK)
- Node.js Testing (múltiples versiones y sistemas operativos)

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Commit changes: `git commit -am 'Add new feature'`
5. Push branch: `git push origin feature/my-feature`
6. Create a Pull Request

## License

Ver [LICENSE](./LICENSE) para más detalles. 
