import 'package:flutter/material.dart';

class RouletteResult {
  final int number;
  final DateTime timestamp;
  final String type; // 'european' or 'american'

  RouletteResult({
    required this.number,
    required this.timestamp,
    this.type = 'european',
  });

  /// Get the color for this roulette number
  Color get color {
    // Red numbers in roulette
    const redNumbers = [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
    ];
    
    // Black numbers in roulette
    const blackNumbers = [
      2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
    ];
    
    if (redNumbers.contains(number)) {
      return Colors.red;
    } else if (blackNumbers.contains(number)) {
      return Colors.black;
    } else {
      return Colors.green; // 0 or 00
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'number': number,
      'timestamp': timestamp.toIso8601String(),
      'type': type,
    };
  }

  factory RouletteResult.fromJson(Map<String, dynamic> json) {
    return RouletteResult(
      number: json['number'] as int,
      timestamp: DateTime.parse(json['timestamp'] as String),
      type: json['type'] as String? ?? 'european',
    );
  }
}

