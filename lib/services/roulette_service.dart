import 'dart:math';
import '../models/roulette_result.dart';

class RouletteService {
  final Random _random = Random.secure();
  
  // European roulette: 0-36
  // American roulette: 0-36 + 00 (represented as 37)
  static const int maxNumberEuropean = 36;
  static const int maxNumberAmerican = 37;

  // Red numbers in roulette
  static const List<int> redNumbers = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
  ];

  // Black numbers in roulette
  static const List<int> blackNumbers = [
    2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
  ];

  /// Spin the roulette and get a random number
  RouletteResult spin({bool american = false}) {
    final maxNumber = american ? maxNumberAmerican : maxNumberEuropean;
    final number = _random.nextInt(maxNumber + 1);
    
    return RouletteResult(
      number: number,
      timestamp: DateTime.now(),
      type: american ? 'american' : 'european',
    );
  }

  /// Check if a number is red
  bool isRed(int number) {
    return redNumbers.contains(number);
  }

  /// Check if a number is black
  bool isBlack(int number) {
    return blackNumbers.contains(number);
  }

  /// Check if a number is green (0 or 00)
  bool isGreen(int number) {
    return number == 0 || number == 37;
  }

  /// Analyze a batch of results
  Map<String, dynamic> analyzeBatch(List<RouletteResult> results) {
    if (results.isEmpty) {
      return {
        'suggestion': 'No hay resultados para analizar',
        'hotNumbers': [],
        'coldNumbers': [],
      };
    }

    // Count frequency of each number
    final Map<int, int> frequencies = {};
    for (var result in results) {
      frequencies[result.number] = (frequencies[result.number] ?? 0) + 1;
    }

    // Find hot numbers (most frequent)
    final sortedByFrequency = frequencies.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    final hotNumbers = sortedByFrequency
        .take(3)
        .where((entry) => entry.value > 1)
        .map((entry) => entry.number)
        .toList();

    // Find cold numbers (numbers that haven't appeared)
    final appearedNumbers = frequencies.keys.toSet();
    final allNumbers = List.generate(37, (index) => index);
    final coldNumbers = allNumbers
        .where((n) => !appearedNumbers.contains(n))
        .take(3)
        .toList();

    // Analyze patterns
    final redCount = results.where((r) => isRed(r.number)).length;
    final blackCount = results.where((r) => isBlack(r.number)).length;
    final greenCount = results.where((r) => isGreen(r.number)).length;

    String suggestion;
    if (redCount > blackCount * 1.5) {
      suggestion = 'Los números rojos han salido con más frecuencia';
    } else if (blackCount > redCount * 1.5) {
      suggestion = 'Los números negros han salido con más frecuencia';
    } else {
      suggestion = 'Los colores están equilibrados';
    }

    return {
      'suggestion': suggestion,
      'hotNumbers': hotNumbers,
      'coldNumbers': coldNumbers,
      'redCount': redCount,
      'blackCount': blackCount,
      'greenCount': greenCount,
      'totalSpins': results.length,
    };
  }

  /// Get sector analysis (Premium feature)
  Map<String, dynamic> analyzeSectors(List<RouletteResult> results) {
    // Voisins du Zéro: 22-25 on the wheel
    final voisinsNumbers = [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25];
    
    // Orphelins: orphaned numbers
    final orphelinsNumbers = [1, 20, 14, 31, 9, 17, 34, 6];
    
    // Tiers du Cylindre: third of the wheel
    final tiersNumbers = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];

    final voisinsCount = results.where((r) => voisinsNumbers.contains(r.number)).length;
    final orphelinsCount = results.where((r) => orphelinsNumbers.contains(r.number)).length;
    final tiersCount = results.where((r) => tiersNumbers.contains(r.number)).length;

    return {
      'voisins': voisinsCount,
      'orphelins': orphelinsCount,
      'tiers': tiersCount,
    };
  }
}
