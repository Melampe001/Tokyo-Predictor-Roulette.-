import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/tokioai_api_service.dart';
import '../services/tokioai_websocket_service.dart';
import '../models/result.dart';
import '../models/analysis.dart';
import '../models/statistics.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _apiService = TokioAIApiService(baseUrl: 'http://localhost:8080');
  final _wsService = TokioAIWebSocketService(url: 'ws://localhost:8080');
  
  final _resultController = TextEditingController();
  final _baseUrlController = TextEditingController(text: 'http://localhost:8080');
  
  bool _isConnected = false;
  bool _useWebSocket = true;
  List<RouletteResult> _results = [];
  Analysis? _analysis;
  Statistics? _statistics;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _checkHealth();
    
    // Listen to WebSocket events
    _wsService.onConnectionChange.listen((connected) {
      if (mounted) {
        setState(() {
          _isConnected = connected;
        });
      }
    });

    _wsService.onResult.listen((result) {
      if (mounted) {
        setState(() {
          _results.insert(0, result);
          if (_results.length > 50) {
            _results.removeLast();
          }
        });
      }
    });

    _wsService.onAnalysis.listen((analysis) {
      if (mounted) {
        setState(() {
          _analysis = analysis;
        });
      }
    });

    _wsService.onStatistics.listen((statistics) {
      if (mounted) {
        setState(() {
          _statistics = statistics;
        });
      }
    });

    _wsService.onError.listen((error) {
      if (mounted) {
        _showError(error);
      }
    });
  }

  @override
  void dispose() {
    _apiService.dispose();
    _wsService.dispose();
    _resultController.dispose();
    _baseUrlController.dispose();
    super.dispose();
  }

  Future<void> _checkHealth() async {
    try {
      final healthy = await _apiService.checkHealth();
      if (mounted) {
        setState(() {
          _isConnected = healthy;
        });
        if (!healthy) {
          _showError('Server is not healthy');
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Failed to connect: $e');
      }
    }
  }

  Future<void> _connectWebSocket() async {
    try {
      await _wsService.connect();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('WebSocket connected')),
        );
      }
    } catch (e) {
      _showError('WebSocket connection failed: $e');
    }
  }

  Future<void> _disconnectWebSocket() async {
    await _wsService.disconnect();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('WebSocket disconnected')),
      );
    }
  }

  Future<void> _submitResult() async {
    final value = int.tryParse(_resultController.text);
    if (value == null || value < 0 || value > 36) {
      _showError('Please enter a valid number (0-36)');
      return;
    }

    try {
      if (_useWebSocket && _wsService.isConnected) {
        _wsService.sendResult(value);
      } else {
        final result = await _apiService.submitResult(value);
        setState(() {
          _results.insert(0, result);
          if (_results.length > 50) {
            _results.removeLast();
          }
        });
      }
      _resultController.clear();
    } catch (e) {
      _showError('Failed to submit result: $e');
    }
  }

  Future<void> _loadAnalysis() async {
    try {
      if (_useWebSocket && _wsService.isConnected) {
        _wsService.requestAnalysis();
      } else {
        final analysis = await _apiService.getAnalysis();
        setState(() {
          _analysis = analysis;
        });
      }
    } catch (e) {
      _showError('Failed to load analysis: $e');
    }
  }

  Future<void> _loadResults() async {
    try {
      final results = await _apiService.getResults(limit: 20);
      setState(() {
        _results = results;
      });
    } catch (e) {
      _showError('Failed to load results: $e');
    }
  }

  Future<void> _loadStatistics() async {
    try {
      if (_useWebSocket && _wsService.isConnected) {
        _wsService.requestStatistics();
      } else {
        final stats = await _apiService.getStatistics();
        setState(() {
          _statistics = stats;
        });
      }
    } catch (e) {
      _showError('Failed to load statistics: $e');
    }
  }

  void _showError(String message) {
    setState(() {
      _errorMessage = message;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TokioAI Flutter Example'),
        actions: [
          IconButton(
            icon: Icon(_isConnected ? Icons.cloud_done : Icons.cloud_off),
            onPressed: _checkHealth,
            tooltip: _isConnected ? 'Connected' : 'Disconnected',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Connection section
            _buildConnectionSection(),
            const SizedBox(height: 20),
            
            // Submit result section
            _buildSubmitResultSection(),
            const SizedBox(height: 20),
            
            // Statistics section
            _buildStatisticsSection(),
            const SizedBox(height: 20),
            
            // Analysis section
            if (_analysis != null) _buildAnalysisSection(),
            if (_analysis != null) const SizedBox(height: 20),
            
            // Results list section
            _buildResultsSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Connection',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Use WebSocket'),
              subtitle: Text(_useWebSocket ? 'Real-time updates' : 'REST API only'),
              value: _useWebSocket,
              onChanged: (value) {
                setState(() {
                  _useWebSocket = value;
                });
              },
            ),
            if (_useWebSocket) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _wsService.isConnected ? null : _connectWebSocket,
                      icon: const Icon(Icons.wifi),
                      label: const Text('Connect'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _wsService.isConnected ? _disconnectWebSocket : null,
                      icon: const Icon(Icons.wifi_off),
                      label: const Text('Disconnect'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitResultSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Submit Result',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _resultController,
              decoration: const InputDecoration(
                labelText: 'Roulette Number (0-36)',
                border: OutlineInputBorder(),
                hintText: 'Enter a number',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
              onSubmitted: (_) => _submitResult(),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _submitResult,
                    icon: const Icon(Icons.send),
                    label: const Text('Submit'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: _loadAnalysis,
                  icon: const Icon(Icons.analytics),
                  label: const Text('Analyze'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Statistics',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadStatistics,
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_statistics != null) ...[
              _buildStatItem('Total Results', '${_statistics!.currentResults}'),
              _buildStatItem('Uptime', _statistics!.uptimeFormatted),
              _buildStatItem('Total Analyses', '${_statistics!.totalAnalyses}'),
            ] else
              const Text('No statistics available. Click refresh to load.'),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          Text(value),
        ],
      ),
    );
  }

  Widget _buildAnalysisSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Analysis',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            _buildStatItem('Batch Size', '${_analysis!.batchSize}'),
            _buildStatItem('Most Frequent', '${_analysis!.trends.mostFrequent} (${_analysis!.trends.maxFrequency}x)'),
            _buildStatItem('Trend', _analysis!.trends.dominant),
            _buildStatItem('Average', _analysis!.trends.average.toStringAsFixed(2)),
            const SizedBox(height: 12),
            const Text(
              'Suggestion:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(_analysis!.suggestion),
          ],
        ),
      ),
    );
  }

  Widget _buildResultsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Results',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadResults,
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_results.isEmpty)
              const Text('No results yet. Submit a result to see it here.')
            else
              SizedBox(
                height: 300,
                child: ListView.builder(
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    final result = _results[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getColorForNumber(result.resultado),
                        child: Text(
                          '${result.resultado}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text('Result: ${result.resultado}'),
                      subtitle: Text('${result.fecha} ${result.hora}'),
                      dense: true,
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _getColorForNumber(int number) {
    // Roulette colors: red, black, green (0)
    if (number == 0) return Colors.green;
    
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    
    if (redNumbers.contains(number)) {
      return Colors.red;
    }
    return Colors.black;
  }
}
