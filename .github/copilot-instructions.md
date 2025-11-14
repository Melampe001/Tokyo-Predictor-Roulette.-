# Copilot Instructions for Tokyo Predictor Roulette

This is a Node.js-based backend application with predictive analysis capabilities for a casino application. The project uses TokioAI, a custom AI module for analysis, encryption, and PDF generation.

## Project Overview

**Technology Stack:**
- **Runtime:** Node.js 18+ (ESM modules)
- **Framework:** Express.js for REST API
- **Real-time:** WebSocket (ws library)
- **Testing:** Jest for backend tests, custom test suite for TokioAI module
- **Containerization:** Docker and Docker Compose
- **Frontend:** React + Vite (web-dashboard)

**Main Components:**
- `server.js`: Express server with REST API and WebSocket support
- `src/tokioai.js`: Core TokioAI predictive analysis module
- `src/crypto-utils.js`: AES-256-GCM encryption utilities
- `src/pdf-generator.js`: PDF report generation
- `web-dashboard/`: React-based real-time dashboard

## Code Standards

### Required Before Each Commit
- Run `npm test` to ensure all backend tests pass (should show 16 passing tests)
- Run `npm run test:legacy` to validate TokioAI module functionality
- Ensure code follows existing patterns and conventions
- No need to run linting separately (configured via npm scripts)

### Development Flow
- **Install dependencies:** `npm install`
- **Development mode:** `npm run dev` (runs with nodemon for hot-reload)
- **Production mode:** `npm start`
- **Run tests:** `npm test` (Jest) and `npm run test:legacy` (TokioAI)
- **Build Docker:** `docker build -t tokioai-backend -f docker/Dockerfile .`
- **Run with Docker Compose:** `docker-compose up -d`

## Repository Structure

- `server.js`: Main server entry point with Express and WebSocket configuration
- `src/`: Core modules
  - `tokioai.js`: TokioAI analysis engine
  - `tokioai-adapter.js`: Adapter pattern with fallback stubs
  - `crypto-utils.js`: Encryption utilities
  - `pdf-generator.js`: PDF report generation
- `test/`: Test suites
  - `backend.test.js`: Jest tests for Express API (16 tests)
  - `test.js`: Legacy tests for TokioAI module
- `examples/`: Usage examples for TokioAI module
- `web-dashboard/`: React frontend application
- `scripts/`: Utility scripts (APK analysis)
- `docker/`: Docker configuration files
- `.github/workflows/`: CI/CD workflows

## Key Guidelines

1. **Maintain ESM Module Format**: This project uses `"type": "module"` in package.json. Use ES6 import/export syntax.

2. **Follow Existing Patterns**: 
   - Use Express middleware patterns for API endpoints
   - Follow the existing error handling structure
   - Maintain consistency with WebSocket message format
   - Use Winston for logging

3. **Testing Requirements**:
   - Write Jest tests for new API endpoints
   - Add test cases to the legacy test suite for TokioAI functionality
   - Ensure all tests pass before submitting changes
   - Current test coverage: 16 backend tests, 20+ TokioAI module tests

4. **API Design**:
   - REST endpoints follow pattern: `/api/<resource>`
   - WebSocket messages use `{ type: 'action', data: {...} }` format
   - Include CORS headers for all API responses
   - Return consistent JSON format: `{ success: true/false, data: {...} }`

5. **Security**:
   - Use AES-256-GCM encryption for sensitive data
   - Validate all user inputs
   - Follow secure coding practices for WebSocket connections
   - Don't commit secrets or API keys

6. **Documentation**:
   - Update README.md for major feature changes
   - Document API changes in relevant sections
   - Add JSDoc comments for complex functions
   - Update TOKIOAI_README.md for module changes

7. **Docker and Deployment**:
   - Test Docker builds before committing Dockerfile changes
   - Ensure docker-compose.yml works for local development
   - Health checks are configured at `/health` endpoint

## Common Tasks

### Adding a New API Endpoint
1. Add route in `server.js` following existing patterns
2. Implement request validation
3. Add error handling
4. Write Jest tests in `test/backend.test.js`
5. Update API documentation in README.md

### Modifying TokioAI Module
1. Make changes in `src/tokioai.js`
2. Update tests in `test/test.js`
3. Run `npm run test:legacy` to verify
4. Update documentation in `TOKIOAI_README.md`

### Working with WebSocket
1. Follow existing message format: `{ type: 'message-type', data: {...} }`
2. Test with web-dashboard to ensure real-time updates work
3. Add test cases for new message types
4. Document message format in README.md

### Docker Changes
1. Test build: `docker build -t tokioai-backend -f docker/Dockerfile .`
2. Test compose: `docker-compose up`
3. Verify health check: `curl http://localhost:8080/health`
4. Check logs: `docker-compose logs -f`

## Language and Communication
- Primary language: **Spanish** (documentation and comments are in Spanish)
- Code: Use English for variable/function names following JavaScript conventions
- Comments: Spanish is acceptable and commonly used in this codebase

## Important Notes
- The project uses a custom TokioAI module - don't replace it with external AI libraries
- WebSocket and REST API should remain synchronized
- All 16 backend tests must pass before merging
- Docker configuration supports both development and production modes
- The web-dashboard is a separate React application with its own package.json
