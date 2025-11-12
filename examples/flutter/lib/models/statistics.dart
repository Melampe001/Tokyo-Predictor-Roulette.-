/// Model representing statistics from TokioAI
class Statistics {
  final int currentResults;
  final int uptime;
  final int totalAnalyses;

  Statistics({
    required this.currentResults,
    required this.uptime,
    this.totalAnalyses = 0,
  });

  /// Create Statistics from JSON
  factory Statistics.fromJson(Map<String, dynamic> json) {
    return Statistics(
      currentResults: json['currentResults'] as int,
      uptime: json['uptime'] as int,
      totalAnalyses: json['totalAnalyses'] as int? ?? 0,
    );
  }

  /// Get uptime in a human-readable format
  String get uptimeFormatted {
    final seconds = uptime ~/ 1000;
    final minutes = seconds ~/ 60;
    final hours = minutes ~/ 60;
    
    if (hours > 0) {
      return '${hours}h ${minutes % 60}m';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds % 60}s';
    } else {
      return '${seconds}s';
    }
  }

  @override
  String toString() {
    return 'Statistics(results: $currentResults, uptime: $uptimeFormatted, analyses: $totalAnalyses)';
  }
}
