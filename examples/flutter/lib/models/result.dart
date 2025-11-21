/// Model representing a roulette result from TokioAI
class RouletteResult {
  final int resultado;
  final String fecha;
  final String hora;
  final int timestamp;

  RouletteResult({
    required this.resultado,
    required this.fecha,
    required this.hora,
    required this.timestamp,
  });

  /// Create a RouletteResult from JSON
  factory RouletteResult.fromJson(Map<String, dynamic> json) {
    return RouletteResult(
      resultado: json['resultado'] as int,
      fecha: json['fecha'] as String,
      hora: json['hora'] as String,
      timestamp: json['timestamp'] as int,
    );
  }

  /// Convert RouletteResult to JSON
  Map<String, dynamic> toJson() {
    return {
      'resultado': resultado,
      'fecha': fecha,
      'hora': hora,
      'timestamp': timestamp,
    };
  }

  @override
  String toString() {
    return 'RouletteResult(resultado: $resultado, fecha: $fecha, hora: $hora)';
  }
}
