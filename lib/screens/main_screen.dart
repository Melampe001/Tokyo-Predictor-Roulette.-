import 'package:flutter/material.dart';
import '../services/roulette_service.dart';
import '../models/roulette_result.dart';
import 'settings_screen.dart';
import 'manual_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final RouletteService _rouletteService = RouletteService();
  List<RouletteResult> _history = [];
  bool _isSpinning = false;
  int? _currentNumber;

  Future<void> _spinRoulette() async {
    setState(() => _isSpinning = true);

    // Simulate spin animation
    await Future.delayed(const Duration(seconds: 2));

    final result = _rouletteService.spin();
    setState(() {
      _currentNumber = result.number;
      _history.insert(0, result);
      if (_history.length > 100) {
        _history = _history.sublist(0, 100);
      }
      _isSpinning = false;
    });
  }

  Map<String, dynamic> _getAnalysis() {
    if (_history.length < 10) {
      return {
        'suggestion': 'Necesitas al menos 10 resultados para análisis',
        'hotNumbers': [],
        'coldNumbers': [],
      };
    }

    return _rouletteService.analyzeBatch(_history.take(10).toList());
  }

  @override
  Widget build(BuildContext context) {
    final analysis = _getAnalysis();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tokyo Roulette'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const ManualScreen()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Current result display
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(
                      _currentNumber == null
                          ? 'Presiona girar'
                          : _currentNumber.toString(),
                      style: TextStyle(
                        fontSize: 72,
                        fontWeight: FontWeight.bold,
                        color: _currentNumber == null
                            ? Colors.grey
                            : _history.isNotEmpty
                                ? _history[0].color
                                : Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _isSpinning ? null : _spinRoulette,
                      icon: _isSpinning
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.casino),
                      label: Text(_isSpinning ? 'Girando...' : 'Girar Ruleta'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Analysis section
            if (_history.isNotEmpty) ...[
              const Text(
                'Análisis (últimos 10 resultados)',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        analysis['suggestion'] ?? '',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 12),
                      if (analysis['hotNumbers'] != null &&
                          (analysis['hotNumbers'] as List).isNotEmpty) ...[
                        const Text(
                          'Números Calientes:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Wrap(
                          spacing: 8,
                          children: (analysis['hotNumbers'] as List<int>)
                              .map((n) => Chip(
                                    label: Text(n.toString()),
                                    backgroundColor: Colors.red.shade100,
                                  ))
                              .toList(),
                        ),
                      ],
                      const SizedBox(height: 8),
                      if (analysis['coldNumbers'] != null &&
                          (analysis['coldNumbers'] as List).isNotEmpty) ...[
                        const Text(
                          'Números Fríos:',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Wrap(
                          spacing: 8,
                          children: (analysis['coldNumbers'] as List<int>)
                              .map((n) => Chip(
                                    label: Text(n.toString()),
                                    backgroundColor: Colors.blue.shade100,
                                  ))
                              .toList(),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],

            // History section
            if (_history.isNotEmpty) ...[
              Text(
                'Historial (${_history.length} resultados)',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 60,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _history.length,
                  itemBuilder: (context, index) {
                    final result = _history[index];
                    return Container(
                      width: 50,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: result.color,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          result.number.toString(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],

            const SizedBox(height: 32),

            // Subscription prompt
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text(
                      'Funciones Avanzadas',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Desbloquea análisis de sectores específicos y predicciones avanzadas',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        ElevatedButton(
                          onPressed: () {
                            // TODO: Implement payment
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Integración de pagos próximamente'),
                              ),
                            );
                          },
                          child: const Text('\$199 Avanzada'),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            // TODO: Implement payment
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Integración de pagos próximamente'),
                              ),
                            );
                          },
                          child: const Text('\$299 Premium'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
