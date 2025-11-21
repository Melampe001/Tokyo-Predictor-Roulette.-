---
# Scope: Testing and quality assurance
# Applies to: test files, Jest configuration, test utilities
---

# Testing Instructions

This project uses multiple testing approaches. Follow these guidelines when working with tests.

## Testing Stack

### Jest (Backend API Tests)
- **Location:** `test/backend.test.js`
- **Command:** `npm test`
- **Framework:** Jest with supertest for HTTP testing
- **Configuration:** `jest.config.js`

### Legacy Tests (TokioAI Module)
- **Location:** `test/test.js`
- **Command:** `npm run test:legacy`
- **Framework:** Custom Node.js test runner
- **Purpose:** Validate TokioAI core functionality

## Test Requirements

### All Changes Must:
1. Pass existing tests (16 backend tests + TokioAI tests)
2. Include new tests for new functionality
3. Not reduce test coverage
4. Run successfully before committing

### When to Add Tests

**Add Jest tests when:**
- Creating new API endpoints
- Modifying existing endpoint behavior
- Adding middleware or error handling
- Changing WebSocket message handlers

**Add Legacy tests when:**
- Modifying TokioAI core module
- Changing encryption functionality
- Updating PDF generation
- Adding new analysis features

## Jest Testing Patterns

### Basic Structure
```javascript
describe('Feature/Component Name', () => {
  // Setup and teardown if needed
  beforeAll(() => {
    // Runs once before all tests
  });

  afterAll(() => {
    // Runs once after all tests
  });

  describe('Specific Functionality', () => {
    it('should describe expected behavior', async () => {
      // Test implementation
      const response = await request(app)
        .get('/api/endpoint')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
});
```

### Testing API Endpoints
```javascript
// GET endpoint test
it('should return data successfully', async () => {
  const response = await request(app)
    .get('/api/endpoint')
    .expect(200)
    .expect('Content-Type', /json/);

  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
});

// POST endpoint test
it('should accept valid input', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ value: 123 })
    .expect(200);

  expect(response.body.success).toBe(true);
});

// Error case test
it('should reject invalid input', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({}) // Missing required field
    .expect(400);

  expect(response.body.success).toBe(false);
  expect(response.body.message).toBeTruthy();
});
```

### Testing CORS Headers
```javascript
it('should include CORS headers', async () => {
  const response = await request(app)
    .get('/api/endpoint')
    .expect(200);

  expect(response.headers['access-control-allow-origin']).toBe('*');
});

it('should handle OPTIONS preflight', async () => {
  await request(app)
    .options('/api/endpoint')
    .expect(200);
});
```

### Mocking TokioAI
```javascript
// Mock TokioAI methods when needed
beforeEach(() => {
  jest.spyOn(tokio, 'captureResult').mockImplementation(() => ({
    resultado: 1,
    fecha: '2024-01-01',
    hora: '12:00:00'
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

## Legacy Test Patterns

### Test Structure (test/test.js)
```javascript
// Test case counter
let testsPassed = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error.message);
  }
}

// Use test function
test('Should create TokioAI instance', () => {
  const tokio = new TokioAI();
  if (!tokio) throw new Error('Failed to create instance');
});
```

## Running Tests

### Full Test Suite
```bash
# Run all tests
npm test && npm run test:legacy

# Run with coverage (Jest only)
npm test -- --coverage

# Run specific test file
npm test -- test/backend.test.js

# Run in watch mode (development)
npm test -- --watch
```

### Debugging Tests
```bash
# Run Jest with verbose output
npm test -- --verbose

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Organization

### Group Related Tests
```javascript
describe('TokioAI Integration', () => {
  describe('Result Submission', () => {
    // Tests for result submission
  });

  describe('Analysis Retrieval', () => {
    // Tests for analysis
  });
});
```

### Use Descriptive Names
```javascript
// Good
it('should return 400 when value is missing')
it('should capture result and return timestamp')

// Bad
it('test endpoint')
it('works correctly')
```

## Common Testing Scenarios

### Testing Async Operations
```javascript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases
```javascript
it('should handle errors gracefully', async () => {
  // Force an error condition
  jest.spyOn(tokio, 'analyzeBatch').mockImplementation(() => {
    throw new Error('Analysis failed');
  });

  const response = await request(app)
    .get('/api/analysis')
    .expect(500);

  expect(response.body.success).toBe(false);
});
```

### Testing WebSocket (if applicable)
```javascript
// Note: Current backend.test.js doesn't test WebSocket
// If adding WebSocket tests, use ws library in test
const WebSocket = require('ws');

it('should handle WebSocket messages', (done) => {
  const ws = new WebSocket('ws://localhost:8080');
  
  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'ping' }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    expect(message.type).toBe('pong');
    ws.close();
    done();
  });
});
```

## Test Maintenance

### Keep Tests Independent
- Each test should be able to run in isolation
- Don't rely on test execution order
- Clean up after each test if needed

### Avoid Test Interdependence
```javascript
// Good - each test is independent
it('should add result', async () => {
  await request(app).post('/api/result').send({ value: 1 });
  // Test complete
});

// Bad - second test depends on first
it('should add result', () => { /* ... */ });
it('should have the result from previous test', () => { /* ... */ });
```

### Update Tests When Changing Code
- If you modify an API endpoint, update its tests
- If you change response format, update assertions
- If you add validation, add tests for invalid cases

## Coverage Goals
- Aim for meaningful coverage, not just high percentages
- Focus on testing critical paths and error cases
- Don't test trivial getters/setters unless they have logic
- Test edge cases and boundary conditions
