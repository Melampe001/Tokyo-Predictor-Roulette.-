/// Model representing analysis data from TokioAI
class Analysis {
  final int batchSize;
  final Trends trends;
  final Map<String, double> probabilities;
  final Patterns patterns;
  final String suggestion;

  Analysis({
    required this.batchSize,
    required this.trends,
    required this.probabilities,
    required this.patterns,
    required this.suggestion,
  });

  /// Create Analysis from JSON
  factory Analysis.fromJson(Map<String, dynamic> json) {
    final probabilities = <String, double>{};
    final probJson = json['probabilities'] as Map<String, dynamic>?;
    if (probJson != null) {
      probJson.forEach((key, value) {
        probabilities[key] = (value as num).toDouble();
      });
    }

    return Analysis(
      batchSize: json['batchSize'] as int,
      trends: Trends.fromJson(json['trends'] as Map<String, dynamic>),
      probabilities: probabilities,
      patterns: Patterns.fromJson(json['patterns'] as Map<String, dynamic>),
      suggestion: json['suggestion'] as String,
    );
  }
}

/// Trends data within analysis
class Trends {
  final String dominant;
  final int mostFrequent;
  final int maxFrequency;
  final double average;
  final Map<String, int> frequencies;

  Trends({
    required this.dominant,
    required this.mostFrequent,
    required this.maxFrequency,
    required this.average,
    required this.frequencies,
  });

  factory Trends.fromJson(Map<String, dynamic> json) {
    final frequencies = <String, int>{};
    final freqJson = json['frequencies'] as Map<String, dynamic>?;
    if (freqJson != null) {
      freqJson.forEach((key, value) {
        frequencies[key] = value as int;
      });
    }

    return Trends(
      dominant: json['dominant'] as String,
      mostFrequent: json['mostFrequent'] as int,
      maxFrequency: json['maxFrequency'] as int,
      average: (json['average'] as num).toDouble(),
      frequencies: frequencies,
    );
  }
}

/// Patterns detected in the analysis
class Patterns {
  final List<List<int>> sequences;
  final Map<String, int> repetitions;

  Patterns({
    required this.sequences,
    required this.repetitions,
  });

  factory Patterns.fromJson(Map<String, dynamic> json) {
    final sequences = <List<int>>[];
    final seqJson = json['sequences'] as List<dynamic>?;
    if (seqJson != null) {
      for (var seq in seqJson) {
        sequences.add((seq as List<dynamic>).cast<int>());
      }
    }

    final repetitions = <String, int>{};
    final repJson = json['repetitions'] as Map<String, dynamic>?;
    if (repJson != null) {
      repJson.forEach((key, value) {
        repetitions[key] = value as int;
      });
    }

    return Patterns(
      sequences: sequences,
      repetitions: repetitions,
    );
  }
}
