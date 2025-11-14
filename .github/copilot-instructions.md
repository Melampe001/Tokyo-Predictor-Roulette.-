# GitHub Copilot Instructions for Tokyo Predictor Roulette

This repository contains TokioAI, a predictive analysis module for a private Android casino application with AI integration, real-time WebSocket communication, and advanced security features.

## Project Overview

Tokyo Predictor Roulette is a Node.js-based predictive analysis system for roulette games featuring:
- **TokioAI Module**: AI-powered analysis engine for pattern detection and predictions
- **Backend Server**: Express.js REST API and WebSocket server for real-time communication
- **Web Dashboard**: React-based real-time web interface
- **Encryption**: AES-256-GCM security for data protection
- **PDF Reports**: Statistical report generation with PDFKit
- **Docker Support**: Containerized development and production environments

## Technology Stack

- **Runtime**: Node.js 18+ (ES Modules)
- **Backend**: Express.js 4.x
- **WebSocket**: ws library for real-time communication
- **Testing**: Jest (for unit tests) + custom test suite
- **Security**: Native crypto module with AES-256-GCM
- **Reports**: PDFKit for PDF generation
- **Logging**: Winston for structured logging
- **Configuration**: dotenv for environment variables

## Code Standards and Best Practices

### Language and Style

1. **Use ES Modules**: All code uses `import/export` syntax (not CommonJS `require`)
2. **Use Spanish for comments and documentation**: This is a Spanish-language project
3. **Async/Await**: Prefer async/await over raw Promises
4. **Error Handling**: Always wrap async operations in try-catch blocks
5. **Logging**: Use Winston logger for all logging (configured in `server.js`)

### File Organization

- `src/`: Core module implementation
  - `tokioai.js`: Main TokioAI class implementation
  - `tokioai-adapter.js`: Adapter layer with fallback stub
  - `crypto-utils.js`: Encryption utilities
  - `pdf-generator.js`: PDF report generation
- `server.js`: Express server with REST API, WebSocket, and Winston logger configuration
- `test/`: Test files
  - `test.js`: Legacy test suite (20 test cases)
  - `backend.test.js`: Jest test suite for backend
- `examples/`: Usage examples
- `web-dashboard/`: React web interface
- `docker/`: Docker configurations

### Required Before Each Commit

1. **Run tests**: `npm test` (Jest) and `npm run test:legacy` (custom suite)
2. **Lint check**: `npm run lint` (currently placeholder, but verify code quality)
3. **Verify imports**: Ensure all ES module imports use `.js` extensions

### Development Workflow

```bash
# Install dependencies
npm install

# Development with hot-reload
npm run dev

# Run tests
npm test
npm run test:legacy

# Run examples
npm run example

# Start production server
npm start
```

## Key Components and Guidelines

### TokioAI Module (`src/tokioai.js`)

**Core Methods** - Always implement these in any TokioAI class:
- `captureResult(value)`: Record a new roulette result (0-36)
- `analyzeBatch(count)`: Analyze last N results and generate predictions
- `getStatistics()`: Return statistical analysis of captured results
- `generatePDF(outputPath, includeStats)`: Create PDF report
- `saveEncrypted(filepath)`: Save encrypted results to file
- `loadEncrypted(source)`: Load encrypted results from file or buffer
- `clearResults()`: Clear all captured results
- `close()`: Cleanup and close resources

**Pattern Analysis**:
- Detects hot/cold numbers based on frequency
- Calculates color trends (red/black)
- Identifies dozens and columns patterns
- Provides confidence scores for predictions

### Backend Server (`server.js`)

**REST API Endpoints**:
- `POST /api/result`: Submit new result (body: `{ value: number }`)
- `GET /api/analysis?count=10`: Request analysis for last N results
- `GET /api/results?limit=50`: Get recent results
- `GET /api/statistics`: Get statistical summary
- `GET /health`: Health check endpoint

**WebSocket Messages**:
- `result`: Client submits result `{ type: 'result', value: number }`
- `request-analysis`: Request analysis `{ type: 'request-analysis', count: number }`
- `request-results`: Request recent results `{ type: 'request-results', limit: number }`
- `request-statistics`: Request statistics `{ type: 'request-statistics' }`

**Server Responses** (WebSocket):
- `analysis`: Analysis results with predictions and trends
- `results`: Array of recent results
- `statistics`: Statistical summary
- `error`: Error message

### Encryption (`src/crypto-utils.js`)

- **Always use AES-256-GCM** for data encryption
- **Generate unique IV** for each encryption operation
- **Include auth tag** in encrypted output for integrity verification
- **Format**: `{ encrypted: Buffer, iv: Buffer, authTag: Buffer }`

### Testing

**Unit Tests** (`test/backend.test.js`):
- Use Jest framework with ES modules support
- Mock external dependencies (WebSocket, file system)
- Test all REST API endpoints
- Test WebSocket message handlers
- Verify error handling

**Integration Tests** (`test/test.js`):
- Comprehensive 20-test suite
- Tests TokioAI module functionality
- Validates encryption/decryption
- Verifies PDF generation
- Tests statistics calculations

**Run tests with**:
```bash
npm test                 # Jest tests
npm run test:legacy      # Legacy test suite
```

### Docker

**Development**:
```bash
docker-compose up dev
```

**Production**:
```bash
docker-compose up prod
```

**Environment Variables** (`.env`):
- `PORT`: Server port (default: 3000)
- `WS_PORT`: WebSocket port (default: 8080)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## Common Patterns

### Adding a New REST Endpoint

```javascript
// In server.js
app.post('/api/new-endpoint', async (req, res) => {
  try {
    const result = await tokioai.someMethod(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error en /api/new-endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Adding a New WebSocket Message Type

```javascript
// In server.js WebSocket handler
case 'new-message-type':
  try {
    const result = await tokioai.someMethod(message.data);
    ws.send(JSON.stringify({
      type: 'new-response-type',
      data: result
    }));
  } catch (error) {
    logger.error('Error en mensaje new-message-type:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
  break;
```

### Adding a New TokioAI Method

```javascript
// In src/tokioai.js
async newMethod(param) {
  try {
    // Validate input
    if (!param) {
      throw new Error('Parameter is required');
    }
    
    // Perform operation
    const result = this.results.map(/* ... */);
    
    logger.info('Método newMethod ejecutado', { param, resultCount: result.length });
    return result;
  } catch (error) {
    logger.error('Error en newMethod:', error);
    throw error;
  }
}
```

## Documentation

- **README.md**: Main project documentation (Spanish)
- **HELP.md**: Comprehensive help guide with troubleshooting
- **TOKIOAI_README.md**: TokioAI module documentation
- **IMPLEMENTATION_SUMMARY.md**: Implementation details and architecture
- **QUICKSTART.md**: Quick start guide
- **DOCKER_TROUBLESHOOTING.md**: Docker-specific troubleshooting

## Dependencies

### Production Dependencies
- `express`: Web framework
- `ws`: WebSocket library
- `pdfkit`: PDF generation
- `winston`: Logging
- `dotenv`: Environment configuration

### Development Dependencies
- `jest`: Testing framework
- `supertest`: HTTP testing
- `nodemon`: Development hot-reload

**When adding new dependencies**:
1. Check if similar functionality exists in current dependencies
2. Verify package is actively maintained
3. Check for security vulnerabilities: `npm audit`
4. Document why the dependency is needed
5. Update package.json with exact version or compatible range

## Error Handling

### Always log errors with context:
```javascript
logger.error('Descriptive error message', {
  context: 'additional context',
  error: error.message,
  stack: error.stack
});
```

### Return user-friendly error messages:
```javascript
res.status(500).json({
  success: false,
  error: 'Mensaje descriptivo para el usuario'
});
```

## Security Guidelines

1. **Never commit secrets**: Use `.env` for sensitive data
2. **Validate all inputs**: Check types, ranges, and formats
3. **Use encryption**: Always encrypt sensitive data at rest
4. **Sanitize outputs**: Prevent XSS in web dashboard
5. **Rate limiting**: Consider adding rate limits to API endpoints
6. **CORS**: Configure appropriate CORS settings for production

## Git Commit Messages

Use conventional commit format (Spanish):
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de errores
- `docs:` - Cambios en documentación
- `test:` - Añadir o modificar tests
- `refactor:` - Refactorización de código
- `chore:` - Tareas de mantenimiento

Examples:
- `feat: añadir endpoint para exportar análisis en JSON`
- `fix: corregir cálculo de probabilidades en TokioAI`
- `docs: actualizar README con nuevas instrucciones de Docker`

## AI Assistance Guidelines

When using GitHub Copilot:

1. **Context Awareness**: Copilot should maintain Spanish comments/docs in Spanish parts of the codebase
2. **ES Modules**: Always suggest `import/export` syntax, never `require`
3. **Error Handling**: Always include try-catch blocks for async operations
4. **Logging**: Suggest Winston logger usage instead of console.log
5. **Testing**: Suggest test cases when adding new functionality
6. **Type Safety**: Add JSDoc comments for better type hints
7. **Constants**: Extract magic numbers and strings to named constants
8. **Validation**: Always validate user inputs before processing

## Troubleshooting Common Issues

### WebSocket Connection Failures
- Verify WS_PORT environment variable
- Check firewall settings
- Ensure server is running before connecting clients

### Test Failures
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)
- Verify `--experimental-vm-modules` flag for Jest

### PDF Generation Issues
- Ensure output directory exists and is writable
- Check PDFKit version compatibility
- Verify font paths if using custom fonts

### Encryption Errors
- Ensure encryption key is properly formatted
- Verify IV is unique for each encryption
- Check auth tag is included in encrypted data

## Future Considerations

When extending this project:
- Consider adding TypeScript for better type safety
- Implement comprehensive API documentation (OpenAPI/Swagger)
- Add integration with Flutter client (Tokyoapps)
- Implement user authentication and authorization
- Add database persistence (currently in-memory)
- Consider microservices architecture for scalability
- Add comprehensive monitoring and metrics
- Implement CI/CD pipeline with automated testing
