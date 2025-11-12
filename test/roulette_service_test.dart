import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tokyo_roulette_predicciones/services/roulette_service.dart';
import 'package:tokyo_roulette_predicciones/models/roulette_result.dart';

void main() {
  group('RouletteService', () {
    late RouletteService rouletteService;

    setUp(() {
      rouletteService = RouletteService();
    });

    test('spin returns a valid European number (0-36)', () {
      final result = rouletteService.spin();
      expect(result.number, greaterThanOrEqualTo(0));
      expect(result.number, lessThanOrEqualTo(36));
      expect(result.type, 'european');
    });

    test('spin returns a valid American number (0-37)', () {
      final result = rouletteService.spin(american: true);
      expect(result.number, greaterThanOrEqualTo(0));
      expect(result.number, lessThanOrEqualTo(37));
      expect(result.type, 'american');
    });

    test('isRed identifies red numbers correctly', () {
      expect(rouletteService.isRed(1), true);
      expect(rouletteService.isRed(3), true);
      expect(rouletteService.isRed(2), false);
      expect(rouletteService.isRed(0), false);
    });

    test('isBlack identifies black numbers correctly', () {
      expect(rouletteService.isBlack(2), true);
      expect(rouletteService.isBlack(4), true);
      expect(rouletteService.isBlack(1), false);
      expect(rouletteService.isBlack(0), false);
    });

    test('isGreen identifies green numbers correctly', () {
      expect(rouletteService.isGreen(0), true);
      expect(rouletteService.isGreen(37), true);
      expect(rouletteService.isGreen(1), false);
      expect(rouletteService.isGreen(2), false);
    });

    test('analyzeBatch returns empty analysis for empty list', () {
      final analysis = rouletteService.analyzeBatch([]);
      expect(analysis['suggestion'], contains('No hay resultados'));
      expect(analysis['hotNumbers'], isEmpty);
      expect(analysis['coldNumbers'], isEmpty);
    });

    test('analyzeBatch returns correct analysis for sample data', () {
      final results = [
        RouletteResult(number: 1, timestamp: DateTime.now()),
        RouletteResult(number: 1, timestamp: DateTime.now()),
        RouletteResult(number: 2, timestamp: DateTime.now()),
        RouletteResult(number: 3, timestamp: DateTime.now()),
        RouletteResult(number: 3, timestamp: DateTime.now()),
        RouletteResult(number: 3, timestamp: DateTime.now()),
      ];

      final analysis = rouletteService.analyzeBatch(results);
      expect(analysis['totalSpins'], 6);
      expect(analysis['hotNumbers'], isNotEmpty);
      expect(analysis['hotNumbers'], contains(3)); // 3 appears most frequently
    });

    test('analyzeSectors calculates sector counts correctly', () {
      final results = [
        RouletteResult(number: 22, timestamp: DateTime.now()), // Voisins
        RouletteResult(number: 0, timestamp: DateTime.now()), // Voisins
        RouletteResult(number: 1, timestamp: DateTime.now()), // Orphelins
        RouletteResult(number: 27, timestamp: DateTime.now()), // Tiers
      ];

      final sectorAnalysis = rouletteService.analyzeSectors(results);
      expect(sectorAnalysis['voisins'], 2);
      expect(sectorAnalysis['orphelins'], 1);
      expect(sectorAnalysis['tiers'], 1);
    });
  });

  group('RouletteResult', () {
    test('toJson and fromJson work correctly', () {
      final now = DateTime.now();
      final result = RouletteResult(
        number: 15,
        timestamp: now,
        type: 'european',
      );

      final json = result.toJson();
      expect(json['number'], 15);
      expect(json['type'], 'european');

      final restored = RouletteResult.fromJson(json);
      expect(restored.number, 15);
      expect(restored.type, 'european');
    });

    test('color property returns correct colors', () {
      // Test red number
      final redResult = RouletteResult(
        number: 1,
        timestamp: DateTime.now(),
      );
      expect(redResult.color, Colors.red);

      // Test black number
      final blackResult = RouletteResult(
        number: 2,
        timestamp: DateTime.now(),
      );
      expect(blackResult.color, Colors.black);

      // Test green number (0)
      final greenResult = RouletteResult(
        number: 0,
        timestamp: DateTime.now(),
      );
      expect(greenResult.color, Colors.green);

      // Test green number (00 - represented as 37)
      final greenResult2 = RouletteResult(
        number: 37,
        timestamp: DateTime.now(),
      );
      expect(greenResult2.color, Colors.green);
    });
  });
}
