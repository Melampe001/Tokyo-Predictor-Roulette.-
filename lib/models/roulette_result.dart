class RouletteResult {
  final int number;
  final DateTime timestamp;
  final String type; // 'european' or 'american'

  RouletteResult({
    required this.number,
    required this.timestamp,
    this.type = 'european',
  });

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
