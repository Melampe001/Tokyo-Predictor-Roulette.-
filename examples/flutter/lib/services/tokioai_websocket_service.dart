import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/result.dart';
import '../models/analysis.dart';
import '../models/statistics.dart';

/// Service for real-time communication with TokioAI via WebSocket
class TokioAIWebSocketService {
  final String url;
  WebSocketChannel? _channel;
  bool _isConnected = false;

  // Stream controllers for different message types
  final _resultController = StreamController<RouletteResult>.broadcast();
  final _analysisController = StreamController<Analysis>.broadcast();
  final _statisticsController = StreamController<Statistics>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  // Public streams
  Stream<RouletteResult> get onResult => _resultController.stream;
  Stream<Analysis> get onAnalysis => _analysisController.stream;
  Stream<Statistics> get onStatistics => _statisticsController.stream;
  Stream<bool> get onConnectionChange => _connectionController.stream;
  Stream<String> get onError => _errorController.stream;

  bool get isConnected => _isConnected;

  TokioAIWebSocketService({
    this.url = 'ws://localhost:8080',
  });

  /// Connect to the WebSocket server
  Future<void> connect() async {
    if (_isConnected) {
      return;
    }

    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _isConnected = true;
      _connectionController.add(true);

      // Listen to messages
      _channel!.stream.listen(
        _onMessage,
        onError: _onError,
        onDone: _onDisconnect,
      );
    } catch (e) {
      _isConnected = false;
      _connectionController.add(false);
      _errorController.add('Connection failed: $e');
      rethrow;
    }
  }

  /// Handle incoming WebSocket messages
  void _onMessage(dynamic message) {
    try {
      final data = jsonDecode(message as String);
      final type = data['type'] as String?;

      switch (type) {
        case 'connected':
          // Connection confirmation
          break;

        case 'result-update':
        case 'result-captured':
          if (data['data'] != null) {
            final result = RouletteResult.fromJson(data['data']);
            _resultController.add(result);
          }
          break;

        case 'analysis':
          if (data['data'] != null) {
            final analysis = Analysis.fromJson(data['data']);
            _analysisController.add(analysis);
          }
          break;

        case 'statistics':
          if (data['data'] != null) {
            final statistics = Statistics.fromJson(data['data']);
            _statisticsController.add(statistics);
          }
          break;

        case 'results':
          // List of results - could emit to a separate stream if needed
          break;

        case 'results-cleared':
          // Results were cleared
          break;

        case 'error':
          final errorMessage = data['message'] as String? ?? 'Unknown error';
          _errorController.add(errorMessage);
          break;

        case 'pong':
          // Pong response to ping
          break;

        default:
          // Unknown message type
          break;
      }
    } catch (e) {
      _errorController.add('Failed to parse message: $e');
    }
  }

  /// Handle WebSocket errors
  void _onError(error) {
    _errorController.add('WebSocket error: $error');
  }

  /// Handle WebSocket disconnection
  void _onDisconnect() {
    _isConnected = false;
    _connectionController.add(false);
  }

  /// Send a roulette result via WebSocket
  void sendResult(int value) {
    if (!_isConnected) {
      throw Exception('Not connected to WebSocket');
    }

    _channel!.sink.add(jsonEncode({
      'type': 'result',
      'value': value,
    }));
  }

  /// Request analysis via WebSocket
  void requestAnalysis({int? count}) {
    if (!_isConnected) {
      throw Exception('Not connected to WebSocket');
    }

    final message = <String, dynamic>{
      'type': 'request-analysis',
    };
    
    if (count != null) {
      message['count'] = count;
    }

    _channel!.sink.add(jsonEncode(message));
  }

  /// Request results via WebSocket
  void requestResults({int limit = 50}) {
    if (!_isConnected) {
      throw Exception('Not connected to WebSocket');
    }

    _channel!.sink.add(jsonEncode({
      'type': 'request-results',
      'limit': limit,
    }));
  }

  /// Request statistics via WebSocket
  void requestStatistics() {
    if (!_isConnected) {
      throw Exception('Not connected to WebSocket');
    }

    _channel!.sink.add(jsonEncode({
      'type': 'request-statistics',
    }));
  }

  /// Send a ping to keep connection alive
  void ping() {
    if (!_isConnected) {
      return;
    }

    _channel!.sink.add(jsonEncode({
      'type': 'ping',
    }));
  }

  /// Disconnect from WebSocket
  Future<void> disconnect() async {
    if (!_isConnected) {
      return;
    }

    await _channel?.sink.close();
    _isConnected = false;
    _connectionController.add(false);
  }

  /// Dispose all resources
  void dispose() {
    disconnect();
    _resultController.close();
    _analysisController.close();
    _statisticsController.close();
    _connectionController.close();
    _errorController.close();
  }
}
