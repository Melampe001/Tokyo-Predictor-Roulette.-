import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/result.dart';
import '../models/analysis.dart';
import '../models/statistics.dart';

/// Service for interacting with TokioAI REST API
class TokioAIApiService {
  final String baseUrl;
  final http.Client _client;

  TokioAIApiService({
    this.baseUrl = 'http://localhost:8080',
    http.Client? client,
  }) : _client = client ?? http.Client();

  /// Check if the server is healthy
  Future<bool> checkHealth() async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/health'),
        headers: {'Accept': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] == 'healthy';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Submit a new roulette result
  Future<RouletteResult> submitResult(int value) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/api/result'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({'value': value}),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] != null) {
        return RouletteResult.fromJson(data['data']);
      }
    }
    
    throw Exception('Failed to submit result: ${response.statusCode}');
  }

  /// Get analysis of recent results
  Future<Analysis> getAnalysis({int? count}) async {
    final uri = count != null
        ? Uri.parse('$baseUrl/api/analysis?count=$count')
        : Uri.parse('$baseUrl/api/analysis');

    final response = await _client.get(
      uri,
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] != null) {
        return Analysis.fromJson(data['data']);
      }
    }
    
    throw Exception('Failed to get analysis: ${response.statusCode}');
  }

  /// Get recent results
  Future<List<RouletteResult>> getResults({int limit = 50}) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/api/results?limit=$limit'),
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] != null) {
        final List<dynamic> results = data['data'];
        return results.map((json) => RouletteResult.fromJson(json)).toList();
      }
    }
    
    throw Exception('Failed to get results: ${response.statusCode}');
  }

  /// Get server statistics
  Future<Statistics> getStatistics() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/api/statistics'),
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true && data['data'] != null) {
        return Statistics.fromJson(data['data']);
      }
    }
    
    throw Exception('Failed to get statistics: ${response.statusCode}');
  }

  /// Clear all results
  Future<void> clearResults() async {
    final response = await _client.post(
      Uri.parse('$baseUrl/api/clear'),
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to clear results: ${response.statusCode}');
    }
  }

  /// Dispose the HTTP client
  void dispose() {
    _client.close();
  }
}
