# TokioAI Flutter Integration Example

This is a complete Flutter example showing how to integrate with the TokioAI backend for roulette predictive analysis.

## Features

- ✅ REST API integration with all TokioAI endpoints
- ✅ WebSocket real-time communication
- ✅ Submit roulette results (0-36)
- ✅ View analysis with trends and suggestions
- ✅ Display server statistics
- ✅ Real-time result updates via WebSocket
- ✅ Material Design 3 UI
- ✅ Error handling and status indicators
- ✅ Connection management

## Prerequisites

- Flutter 3.0.0 or higher
- Dart 3.0.0 or higher
- TokioAI backend server running (see main README.md)

## Setup

### 1. Install Flutter Dependencies

```bash
cd examples/flutter
flutter pub get
```

### 2. Start TokioAI Backend

Make sure the TokioAI backend server is running:

```bash
# In the root directory
npm install
npm start
```

The server should be running on `http://localhost:8080`

### 3. Run the Flutter App

```bash
# Run on web
flutter run -d chrome

# Run on Android emulator
flutter run

# Run on iOS simulator
flutter run -d ios
```

## Configuration

By default, the app connects to `http://localhost:8080`. To change the backend URL:

1. Open `lib/services/tokioai_api_service.dart`
2. Modify the `baseUrl` parameter in the constructor
3. Open `lib/services/tokioai_websocket_service.dart`
4. Modify the `url` parameter in the constructor

Example for production:
```dart
final _apiService = TokioAIApiService(
  baseUrl: 'https://your-server.com',
);

final _wsService = TokioAIWebSocketService(
  url: 'wss://your-server.com',
);
```

## Usage

### REST API Mode

1. Leave "Use WebSocket" toggle OFF
2. Submit results using the form
3. Click "Analyze" to request analysis
4. Click refresh icons to update statistics and results

### WebSocket Mode (Real-time)

1. Toggle "Use WebSocket" ON
2. Click "Connect" to establish WebSocket connection
3. Submit results - they'll appear in real-time for all connected clients
4. Analysis and statistics update automatically

## Project Structure

```
lib/
├── main.dart                              # App entry point
├── models/
│   ├── result.dart                        # RouletteResult model
│   ├── analysis.dart                      # Analysis, Trends, Patterns models
│   └── statistics.dart                    # Statistics model
├── services/
│   ├── tokioai_api_service.dart          # REST API client
│   └── tokioai_websocket_service.dart    # WebSocket client
└── screens/
    └── home_screen.dart                   # Main UI screen
```

## API Service Methods

### TokioAIApiService

```dart
// Check server health
Future<bool> checkHealth()

// Submit a roulette result
Future<RouletteResult> submitResult(int value)

// Get analysis
Future<Analysis> getAnalysis({int? count})

// Get recent results
Future<List<RouletteResult>> getResults({int limit = 50})

// Get statistics
Future<Statistics> getStatistics()

// Clear all results
Future<void> clearResults()
```

### TokioAIWebSocketService

```dart
// Connect/disconnect
Future<void> connect()
Future<void> disconnect()

// Send messages
void sendResult(int value)
void requestAnalysis({int? count})
void requestResults({int limit = 50})
void requestStatistics()
void ping()

// Listen to streams
Stream<RouletteResult> get onResult
Stream<Analysis> get onAnalysis
Stream<Statistics> get onStatistics
Stream<bool> get onConnectionChange
Stream<String> get onError
```

## Models

### RouletteResult
```dart
class RouletteResult {
  final int resultado;      // Number (0-36)
  final String fecha;       // Date
  final String hora;        // Time
  final int timestamp;      // Unix timestamp
}
```

### Analysis
```dart
class Analysis {
  final int batchSize;
  final Trends trends;
  final Map<String, double> probabilities;
  final Patterns patterns;
  final String suggestion;
}
```

### Statistics
```dart
class Statistics {
  final int currentResults;
  final int uptime;         // in milliseconds
  final int totalAnalyses;
  
  String get uptimeFormatted; // Human-readable uptime
}
```

## Example: Using REST API

```dart
import 'package:tokioai_flutter_example/services/tokioai_api_service.dart';

final api = TokioAIApiService(baseUrl: 'http://localhost:8080');

// Submit a result
try {
  final result = await api.submitResult(12);
  print('Submitted: ${result.resultado}');
} catch (e) {
  print('Error: $e');
}

// Get analysis
try {
  final analysis = await api.getAnalysis(count: 10);
  print('Suggestion: ${analysis.suggestion}');
  print('Most frequent: ${analysis.trends.mostFrequent}');
} catch (e) {
  print('Error: $e');
}
```

## Example: Using WebSocket

```dart
import 'package:tokioai_flutter_example/services/tokioai_websocket_service.dart';

final ws = TokioAIWebSocketService(url: 'ws://localhost:8080');

// Connect
await ws.connect();

// Listen to results
ws.onResult.listen((result) {
  print('New result: ${result.resultado}');
});

// Listen to analysis
ws.onAnalysis.listen((analysis) {
  print('Analysis: ${analysis.suggestion}');
});

// Send a result
ws.sendResult(25);

// Request analysis
ws.requestAnalysis(count: 10);

// Disconnect when done
await ws.disconnect();
ws.dispose();
```

## Android Integration

### Add Internet Permission

In `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- ... rest of manifest -->
</manifest>
```

### Allow HTTP in Debug Mode

In `android/app/src/main/AndroidManifest.xml` within `<application>`:

```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

**Note**: For production, use HTTPS/WSS instead of HTTP/WS.

## iOS Integration

### Configure App Transport Security

In `ios/Runner/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

**Note**: For production, configure proper domain exceptions instead of allowing arbitrary loads.

## Testing

### Unit Tests

Create tests for services:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test('submitResult returns RouletteResult', () async {
    final client = MockClient((request) async {
      return http.Response(
        '{"success":true,"data":{"resultado":12,"fecha":"2025-11-12","hora":"21:30:45","timestamp":1234567890}}',
        201,
      );
    });
    
    final api = TokioAIApiService(client: client);
    final result = await api.submitResult(12);
    
    expect(result.resultado, 12);
    expect(result.fecha, '2025-11-12');
  });
}
```

## Troubleshooting

### Connection Issues

1. **Cannot connect to localhost on Android emulator**
   - Use `10.0.2.2` instead of `localhost`
   - Example: `http://10.0.2.2:8080`

2. **Cannot connect to localhost on physical device**
   - Use your computer's IP address
   - Example: `http://192.168.1.100:8080`
   - Make sure both devices are on the same network

3. **WebSocket connection fails**
   - Check if the backend server is running
   - Verify the WebSocket URL (should start with `ws://` or `wss://`)
   - Check firewall settings

### CORS Issues (Web)

If running on web and getting CORS errors, the backend server already includes CORS headers. Make sure:
- The backend server is running
- You're using the correct URL
- The server's CORS configuration allows your origin

## Building for Production

### Android APK

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### iOS IPA

```bash
flutter build ios --release
```

Then archive in Xcode.

### Web

```bash
flutter build web --release
```

Output: `build/web/`

## License

Same as the parent TokioAI project.

## Support

For issues or questions:
1. Check the main README.md
2. Check HELP.md for troubleshooting
3. Open an issue on GitHub

## Next Steps

- Add state management (Provider/Riverpod/Bloc)
- Add local persistence (SQLite/Hive)
- Add charts for visualization
- Add biometric authentication
- Add offline mode
- Add push notifications
- Implement PDF viewing
