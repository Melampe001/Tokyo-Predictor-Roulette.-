// Flutter Integration Example for TokioAI Backend
// This example demonstrates how to integrate the TokioAI backend with a Flutter mobile app

import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

/// TokioAI Client for Flutter
/// 
/// Connects to the TokioAI backend server via REST API and WebSocket
class TokioAIClient {
  final String baseUrl;
  final String wsUrl;
  
  WebSocketChannel? _channel;
  StreamController<Map<String, dynamic>>? _messageController;
  
  /// Constructor
  /// 
  /// [baseUrl] - HTTP base URL (e.g., 'http://localhost:8080')
  /// [wsUrl] - WebSocket URL (e.g., 'ws://localhost:8080')
  TokioAIClient({
    required this.baseUrl,
    required this.wsUrl,
  });
  
  // ==================== REST API Methods ====================
  
  /// Submit a result to the backend
  Future<Map<String, dynamic>> submitResult(int value) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/result'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'value': value}),
    );
    
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to submit result: ${response.statusCode}');
    }
  }
  
  /// Get analysis from the backend
  Future<Map<String, dynamic>> getAnalysis({int? count}) async {
    String url = '$baseUrl/api/analysis';
    if (count != null) {
      url += '?count=$count';
    }
    
    final response = await http.get(Uri.parse(url));
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to get analysis: ${response.statusCode}');
    }
  }
  
  /// Get recent results
  Future<List<dynamic>> getResults({int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/results?limit=$limit'),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'] as List<dynamic>;
    } else {
      throw Exception('Failed to get results: ${response.statusCode}');
    }
  }
  
  /// Get statistics
  Future<Map<String, dynamic>> getStatistics() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/statistics'),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['data'] as Map<String, dynamic>;
    } else {
      throw Exception('Failed to get statistics: ${response.statusCode}');
    }
  }
  
  /// Clear all results
  Future<void> clearResults() async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/clear'),
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to clear results: ${response.statusCode}');
    }
  }
  
  /// Health check
  Future<bool> healthCheck() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/health'));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  // ==================== WebSocket Methods ====================
  
  /// Connect to WebSocket server
  Stream<Map<String, dynamic>> connectWebSocket() {
    _messageController = StreamController<Map<String, dynamic>>.broadcast();
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      _channel!.stream.listen(
        (message) {
          try {
            final data = json.decode(message);
            _messageController!.add(data);
          } catch (e) {
            print('Error parsing WebSocket message: $e');
          }
        },
        onError: (error) {
          print('WebSocket error: $error');
          _messageController!.addError(error);
        },
        onDone: () {
          print('WebSocket connection closed');
          _messageController!.close();
        },
      );
    } catch (e) {
      print('Failed to connect WebSocket: $e');
      _messageController!.addError(e);
    }
    
    return _messageController!.stream;
  }
  
  /// Send result via WebSocket
  void sendResultViaWebSocket(int value) {
    if (_channel != null) {
      _channel!.sink.add(json.encode({
        'type': 'result',
        'value': value,
      }));
    }
  }
  
  /// Request analysis via WebSocket
  void requestAnalysis({int? count}) {
    if (_channel != null) {
      final message = {'type': 'request-analysis'};
      if (count != null) {
        message['count'] = count;
      }
      _channel!.sink.add(json.encode(message));
    }
  }
  
  /// Request results via WebSocket
  void requestResults({int? limit}) {
    if (_channel != null) {
      final message = {'type': 'request-results'};
      if (limit != null) {
        message['limit'] = limit;
      }
      _channel!.sink.add(json.encode(message));
    }
  }
  
  /// Request statistics via WebSocket
  void requestStatistics() {
    if (_channel != null) {
      _channel!.sink.add(json.encode({'type': 'request-statistics'}));
    }
  }
  
  /// Send ping
  void sendPing() {
    if (_channel != null) {
      _channel!.sink.add(json.encode({'type': 'ping'}));
    }
  }
  
  /// Disconnect WebSocket
  void disconnectWebSocket() {
    _channel?.sink.close(status.goingAway);
    _messageController?.close();
  }
  
  /// Dispose resources
  void dispose() {
    disconnectWebSocket();
  }
}

// ==================== Usage Example ====================

void main() async {
  // Initialize client
  final client = TokioAIClient(
    baseUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8080',
  );
  
  // Check backend health
  print('Checking backend health...');
  final isHealthy = await client.healthCheck();
  print('Backend healthy: $isHealthy');
  
  // Submit results via REST API
  print('\nSubmitting results...');
  await client.submitResult(12);
  await client.submitResult(35);
  await client.submitResult(3);
  
  // Get analysis
  print('\nGetting analysis...');
  final analysis = await client.getAnalysis();
  print('Analysis: ${analysis['data']['suggestion']}');
  
  // Get results
  print('\nGetting recent results...');
  final results = await client.getResults(limit: 10);
  print('Recent results: ${results.length} items');
  
  // Get statistics
  print('\nGetting statistics...');
  final stats = await client.getStatistics();
  print('Statistics: $stats');
  
  // WebSocket example
  print('\nConnecting via WebSocket...');
  final stream = client.connectWebSocket();
  
  stream.listen((message) {
    print('WebSocket message: ${message['type']}');
    
    switch (message['type']) {
      case 'connected':
        print('Connected to WebSocket server');
        
        // Send a result via WebSocket
        client.sendResultViaWebSocket(25);
        
        // Request analysis
        Future.delayed(Duration(seconds: 1), () {
          client.requestAnalysis(count: 10);
        });
        
        // Request statistics
        Future.delayed(Duration(seconds: 2), () {
          client.requestStatistics();
        });
        break;
        
      case 'result-captured':
        print('Result captured: ${message['data']}');
        break;
        
      case 'analysis':
        print('Analysis received: ${message['data']['suggestion']}');
        break;
        
      case 'statistics':
        print('Statistics: ${message['data']}');
        break;
        
      case 'error':
        print('Error: ${message['message']}');
        break;
    }
  });
  
  // Keep connection open for a while
  await Future.delayed(Duration(seconds: 5));
  
  // Clean up
  client.dispose();
  print('\nDisconnected');
}

// ==================== Flutter Widget Example ====================

/*
import 'package:flutter/material.dart';

class TokioAIPage extends StatefulWidget {
  @override
  _TokioAIPageState createState() => _TokioAIPageState();
}

class _TokioAIPageState extends State<TokioAIPage> {
  late TokioAIClient _client;
  List<dynamic> _results = [];
  String _suggestion = '';
  bool _isConnected = false;
  
  @override
  void initState() {
    super.initState();
    _client = TokioAIClient(
      baseUrl: 'http://your-server:8080',
      wsUrl: 'ws://your-server:8080',
    );
    _connectWebSocket();
  }
  
  void _connectWebSocket() {
    final stream = _client.connectWebSocket();
    stream.listen((message) {
      setState(() {
        _isConnected = true;
        
        if (message['type'] == 'result-update') {
          _results.insert(0, message['data']);
        } else if (message['type'] == 'analysis') {
          _suggestion = message['data']['suggestion'];
        }
      });
    });
  }
  
  Future<void> _submitResult(int value) async {
    try {
      await _client.submitResult(value);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Result $value submitted')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
  
  @override
  void dispose() {
    _client.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('TokioAI Client'),
        actions: [
          Icon(_isConnected ? Icons.cloud_done : Icons.cloud_off),
        ],
      ),
      body: Column(
        children: [
          // Suggestion display
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.blue[50],
            child: Text(
              _suggestion.isEmpty ? 'No analysis yet' : _suggestion,
              style: TextStyle(fontSize: 16),
            ),
          ),
          
          // Number pad for input
          Padding(
            padding: EdgeInsets.all(16),
            child: GridView.count(
              shrinkWrap: true,
              crossAxisCount: 6,
              children: List.generate(37, (index) {
                return ElevatedButton(
                  onPressed: () => _submitResult(index),
                  child: Text('$index'),
                );
              }),
            ),
          ),
          
          // Results list
          Expanded(
            child: ListView.builder(
              itemCount: _results.length,
              itemBuilder: (context, index) {
                final result = _results[index];
                return ListTile(
                  title: Text('Result: ${result['resultado']}'),
                  subtitle: Text('${result['fecha']} ${result['hora']}'),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
*/
