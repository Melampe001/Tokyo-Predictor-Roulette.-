# TokioAI Flutter Integration Architecture

This document explains the architecture and data flow of the Flutter integration with TokioAI backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Flutter Application                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  HomeScreen  │  │   Models     │  │     Services       │   │
│  │     (UI)     │  │              │  │                    │   │
│  │              │  │  - Result    │  │  - API Service     │   │
│  │  Material    │──│  - Analysis  │──│  - WS Service      │   │
│  │  Design 3    │  │  - Statistics│  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                         │          │            │
└─────────────────────────────────────────┼──────────┼────────────┘
                                          │          │
                                      REST API    WebSocket
                                          │          │
                                          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TokioAI Backend Server                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Express    │  │   WebSocket  │  │    TokioAI Core    │   │
│  │   REST API   │  │    Server    │  │                    │   │
│  │              │  │              │  │  - Analysis        │   │
│  │  6 Endpoints │──│  Real-time   │──│  - Encryption      │   │
│  │              │  │  Events      │  │  - PDF Generation  │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. REST API Flow (Request-Response)

```
Flutter App                  TokioAI Backend
    │                              │
    │   POST /api/result           │
    ├─────────────────────────────>│
    │   { "value": 12 }            │
    │                              │
    │                              │ ┌──> Capture Result
    │                              │ │
    │                              │ └──> Store in Memory
    │                              │
    │   201 Created                │
    │<─────────────────────────────┤
    │   { "success": true,         │
    │     "data": { ... } }        │
    │                              │
    │   GET /api/analysis          │
    ├─────────────────────────────>│
    │                              │
    │                              │ ┌──> Analyze Batch
    │                              │ │
    │                              │ ├──> Calculate Trends
    │                              │ │
    │                              │ └──> Generate Suggestion
    │                              │
    │   200 OK                     │
    │<─────────────────────────────┤
    │   { "success": true,         │
    │     "data": { analysis } }   │
    │                              │
```

### 2. WebSocket Flow (Real-time)

```
Flutter App                  TokioAI Backend
    │                              │
    │   Connect (ws://)            │
    ├─────────────────────────────>│
    │                              │
    │   Connected                  │
    │<─────────────────────────────┤
    │   { "type": "connected" }    │
    │                              │
    │   Send Result                │
    ├─────────────────────────────>│
    │   { "type": "result",        │
    │     "value": 25 }            │
    │                              │
    │                              │ ┌──> Capture Result
    │                              │ │
    │                              │ └──> Broadcast to All
    │                              │
    │   Result Update              │
    │<─────────────────────────────┤
    │   { "type": "result-update", │
    │     "data": { ... } }        │
    │                              │
    │   Request Analysis           │
    ├─────────────────────────────>│
    │   { "type": "request-        │
    │     analysis" }              │
    │                              │
    │                              │ ┌──> Analyze
    │                              │ │
    │                              │ └──> Send Response
    │                              │
    │   Analysis                   │
    │<─────────────────────────────┤
    │   { "type": "analysis",      │
    │     "data": { ... } }        │
    │                              │
```

## Component Details

### Flutter Models

#### RouletteResult
Represents a single roulette result with timestamp and formatted date/time.

```dart
RouletteResult {
  int resultado;      // 0-36
  String fecha;       // "DD/MM/YYYY"
  String hora;        // "HH:MM:SS"
  int timestamp;      // Unix timestamp
}
```

#### Analysis
Contains comprehensive analysis data with trends, patterns, and suggestions.

```dart
Analysis {
  int batchSize;
  Trends trends;
  Map<String, double> probabilities;
  Patterns patterns;
  String suggestion;
}

Trends {
  String dominant;              // "altos", "bajos", "neutral"
  int mostFrequent;            // Most frequent number
  int maxFrequency;            // How many times
  double average;              // Average of results
  Map<String, int> frequencies; // All frequencies
}

Patterns {
  List<List<int>> sequences;    // Consecutive sequences
  Map<String, int> repetitions; // Repeated numbers
}
```

#### Statistics
Server statistics and metrics.

```dart
Statistics {
  int currentResults;   // Total results stored
  int uptime;          // Server uptime (ms)
  int totalAnalyses;   // Total analyses performed
}
```

### Flutter Services

#### TokioAIApiService
HTTP client for REST API communication.

**Methods:**
- `checkHealth()` - Verify server is running
- `submitResult(value)` - Submit a new result
- `getAnalysis(count?)` - Get analysis
- `getResults(limit?)` - Get recent results
- `getStatistics()` - Get server statistics
- `clearResults()` - Clear all results

**Example:**
```dart
final api = TokioAIApiService(baseUrl: 'http://localhost:8080');
final result = await api.submitResult(25);
final analysis = await api.getAnalysis();
```

#### TokioAIWebSocketService
WebSocket client for real-time communication.

**Streams:**
- `onResult` - New results
- `onAnalysis` - Analysis updates
- `onStatistics` - Statistics updates
- `onConnectionChange` - Connection status
- `onError` - Error messages

**Methods:**
- `connect()` - Establish WebSocket connection
- `disconnect()` - Close connection
- `sendResult(value)` - Submit result via WebSocket
- `requestAnalysis(count?)` - Request analysis
- `requestResults(limit?)` - Request results list
- `requestStatistics()` - Request statistics
- `ping()` - Keep-alive ping

**Example:**
```dart
final ws = TokioAIWebSocketService(url: 'ws://localhost:8080');
await ws.connect();

ws.onResult.listen((result) {
  print('New result: ${result.resultado}');
});

ws.sendResult(25);
```

## API Endpoints

### REST API

| Method | Endpoint          | Description           | Request Body         | Response         |
|--------|-------------------|-----------------------|----------------------|------------------|
| GET    | `/health`         | Health check          | -                    | Health status    |
| POST   | `/api/result`     | Submit result         | `{"value": number}`  | RouletteResult   |
| GET    | `/api/analysis`   | Get analysis          | -                    | Analysis         |
| GET    | `/api/results`    | Get recent results    | -                    | RouletteResult[] |
| GET    | `/api/statistics` | Get statistics        | -                    | Statistics       |
| POST   | `/api/clear`      | Clear all results     | -                    | Success message  |

### WebSocket Messages

#### Client → Server

```json
// Submit result
{"type": "result", "value": 25}

// Request analysis
{"type": "request-analysis", "count": 10}

// Request results
{"type": "request-results", "limit": 50}

// Request statistics
{"type": "request-statistics"}

// Keep-alive
{"type": "ping"}
```

#### Server → Client

```json
// Connection established
{"type": "connected", "message": "...", "timestamp": "..."}

// Result update
{"type": "result-update", "data": {RouletteResult}}

// Analysis response
{"type": "analysis", "data": {Analysis}}

// Results list
{"type": "results", "data": [RouletteResult]}

// Statistics
{"type": "statistics", "data": {Statistics}}

// Error
{"type": "error", "message": "..."}

// Pong response
{"type": "pong", "timestamp": "..."}
```

## State Management

The current implementation uses basic `setState` for simplicity. For production apps, consider:

### Provider Pattern
```dart
class TokioAIProvider extends ChangeNotifier {
  final TokioAIApiService _api;
  final TokioAIWebSocketService _ws;
  
  List<RouletteResult> _results = [];
  Analysis? _analysis;
  
  Future<void> submitResult(int value) async {
    final result = await _api.submitResult(value);
    _results.insert(0, result);
    notifyListeners();
  }
}
```

### Bloc Pattern
```dart
abstract class TokioAIEvent {}
class SubmitResultEvent extends TokioAIEvent {
  final int value;
  SubmitResultEvent(this.value);
}

abstract class TokioAIState {}
class ResultSubmittedState extends TokioAIState {
  final RouletteResult result;
  ResultSubmittedState(this.result);
}
```

## Error Handling

### API Service Errors
```dart
try {
  final result = await api.submitResult(value);
} catch (e) {
  if (e is SocketException) {
    // Network error
  } else if (e is TimeoutException) {
    // Request timeout
  } else {
    // Other errors
  }
}
```

### WebSocket Errors
```dart
ws.onError.listen((error) {
  // Handle WebSocket errors
  print('WebSocket error: $error');
});

ws.onConnectionChange.listen((connected) {
  if (!connected) {
    // Handle disconnection
    // Attempt reconnection
  }
});
```

## Testing Strategy

### Unit Tests
```dart
test('submitResult returns RouletteResult', () async {
  final mockClient = MockClient((request) async {
    return http.Response('{"success":true,"data":{...}}', 201);
  });
  
  final api = TokioAIApiService(client: mockClient);
  final result = await api.submitResult(12);
  
  expect(result.resultado, 12);
});
```

### Widget Tests
```dart
testWidgets('displays result after submission', (tester) async {
  await tester.pumpWidget(MyApp());
  
  await tester.enterText(find.byType(TextField), '25');
  await tester.tap(find.text('Submit'));
  await tester.pump();
  
  expect(find.text('25'), findsOneWidget);
});
```

### Integration Tests
```dart
testWidgets('full flow: connect, submit, analyze', (tester) async {
  await tester.pumpWidget(MyApp());
  
  // Connect WebSocket
  await tester.tap(find.text('Connect'));
  await tester.pumpAndSettle();
  
  // Submit result
  await tester.enterText(find.byType(TextField), '25');
  await tester.tap(find.text('Submit'));
  await tester.pumpAndSettle();
  
  // Verify result displayed
  expect(find.text('25'), findsOneWidget);
});
```

## Performance Considerations

### 1. Connection Pooling
Reuse HTTP client instances:
```dart
final _client = http.Client();

@override
void dispose() {
  _client.close();
  super.dispose();
}
```

### 2. Stream Management
Properly dispose streams:
```dart
final _subscription = ws.onResult.listen(...);

@override
void dispose() {
  _subscription.cancel();
  ws.dispose();
  super.dispose();
}
```

### 3. List Rendering
Use ListView.builder for large lists:
```dart
ListView.builder(
  itemCount: results.length,
  itemBuilder: (context, index) {
    return ResultTile(result: results[index]);
  },
)
```

### 4. Network Optimization
- Implement request caching
- Use pagination for large datasets
- Implement exponential backoff for retries
- Add request debouncing

## Security Considerations

### 1. HTTPS/WSS in Production
```dart
// Development
final api = TokioAIApiService(baseUrl: 'http://localhost:8080');

// Production
final api = TokioAIApiService(baseUrl: 'https://your-domain.com');
final ws = TokioAIWebSocketService(url: 'wss://your-domain.com');
```

### 2. Input Validation
```dart
int? value = int.tryParse(controller.text);
if (value == null || value < 0 || value > 36) {
  // Show error
  return;
}
```

### 3. Certificate Pinning
For production apps, implement certificate pinning:
```dart
final client = HttpClient()
  ..badCertificateCallback = (cert, host, port) {
    return cert.sha1 == expectedSha1;
  };
```

### 4. Authentication
Add token-based authentication:
```dart
final response = await http.post(
  uri,
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode(data),
);
```

## Deployment

### Android
1. Update `android/app/src/main/AndroidManifest.xml`
2. Configure ProGuard rules
3. Build release APK: `flutter build apk --release`

### iOS
1. Update `ios/Runner/Info.plist`
2. Configure App Transport Security
3. Build release: `flutter build ios --release`

### Web
1. Build: `flutter build web --release`
2. Deploy to hosting service
3. Configure CORS on backend

## Troubleshooting

### Common Issues

**Issue: Cannot connect on Android emulator**
- Solution: Use `10.0.2.2` instead of `localhost`

**Issue: WebSocket disconnects frequently**
- Solution: Implement ping/pong keep-alive mechanism
- Check firewall settings

**Issue: CORS errors on web**
- Solution: Backend already includes CORS headers
- Verify origin is allowed

**Issue: SSL certificate errors**
- Solution: Use proper certificates in production
- Configure certificate validation

## Next Steps

1. Add offline support with local storage (SQLite/Hive)
2. Implement data visualization (charts)
3. Add biometric authentication
4. Implement push notifications
5. Add PDF viewing capability
6. Implement retry logic with exponential backoff
7. Add comprehensive error tracking
8. Implement state management (Provider/Bloc/Riverpod)

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [HTTP Package](https://pub.dev/packages/http)
- [WebSocket Channel](https://pub.dev/packages/web_socket_channel)
- [TokioAI Backend README](../../README.md)
- [Flutter Best Practices](https://flutter.dev/docs/development/best-practices)
