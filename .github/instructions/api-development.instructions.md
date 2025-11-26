---
# Scope: API development and modifications
# Applies to: server.js, REST endpoints, WebSocket handlers
---

# API Development Instructions

These instructions apply when working on the Express REST API or WebSocket functionality.

## REST API Standards

### Endpoint Structure
- All API endpoints should start with `/api/`
- Use RESTful naming conventions (resources, not actions)
- Return consistent JSON format: `{ success: boolean, data: any, message?: string }`

### Request Validation
- Validate all input parameters
- Return 400 Bad Request for invalid input with descriptive error message
- Check for required fields before processing

### Error Handling
- Catch all errors and return appropriate HTTP status codes
- Use try-catch blocks for operations that may throw
- Log errors using Winston logger
- Return user-friendly error messages (don't expose internal details)

### CORS Configuration
- All API endpoints must include CORS headers
- Support OPTIONS preflight requests
- Current CORS policy allows all origins (development mode)

## WebSocket Standards

### Message Format
All WebSocket messages must follow this structure:
```javascript
{
  type: 'message-type',  // Required: action identifier
  data: {},              // Optional: message payload
  timestamp: '...'       // Auto-added by server
}
```

### Supported Message Types
**Client → Server:**
- `result`: Submit a new result value
- `request-analysis`: Request current analysis
- `request-results`: Request result list
- `request-statistics`: Request system statistics
- `ping`: Keep-alive check

**Server → Client:**
- `connected`: Initial connection confirmation
- `result-update`: Broadcast when new result is captured
- `result-captured`: Confirmation of result submission
- `analysis`: Analysis data response
- `results`: Results list response
- `statistics`: Statistics response
- `results-cleared`: Confirmation of clear operation
- `error`: Error notification
- `pong`: Ping response

### WebSocket Error Handling
- Wrap all message handlers in try-catch
- Send error messages via WebSocket (don't crash connection)
- Log WebSocket errors with client information

## Testing Requirements

### New Endpoints Must Include:
1. Happy path test
2. Error case tests (invalid input, missing parameters)
3. CORS header verification
4. Integration test if it interacts with TokioAI

### Test File Structure
Add tests to `test/backend.test.js` following existing patterns:
```javascript
describe('Endpoint Name', () => {
  it('should handle success case', async () => {
    // Test implementation
  });
  
  it('should handle error case', async () => {
    // Test implementation
  });
});
```

## Logging Guidelines
- Use Winston logger (already configured in server.js)
- Log all API requests: `logger.info('METHOD /path', { ip, timestamp })`
- Log important operations: `logger.info('Operation completed', { details })`
- Log errors: `logger.error('Error message', { error, context })`

## Security Considerations
- Validate and sanitize all user inputs
- Don't expose stack traces in production
- Use HTTPS in production (configured at deployment level)
- Rate limiting should be considered for production deployments

## Examples

### Adding a New REST Endpoint
```javascript
// In server.js
app.post('/api/new-endpoint', async (req, res) => {
  try {
    logger.info('POST /api/new-endpoint', {
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Validate input
    const { requiredField } = req.body;
    if (!requiredField) {
      return res.status(400).json({
        success: false,
        message: 'requiredField is required'
      });
    }

    // Process request
    const result = await processData(requiredField);

    // Return response
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in /api/new-endpoint', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
```

### Adding a New WebSocket Message Handler
```javascript
// In WebSocket message handler
case 'new-action':
  try {
    const result = await performAction(message.data);
    ws.send(JSON.stringify({
      type: 'action-response',
      data: result,
      timestamp: new Date().toISOString()
    }));
    
    // Broadcast to all clients if needed
    broadcastToAll({
      type: 'action-update',
      data: result
    });
  } catch (error) {
    logger.error('WebSocket error in new-action', {
      error: error.message
    });
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process action'
    }));
  }
  break;
```
