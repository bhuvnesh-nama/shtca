class GeoCoordinates {
  final double latitude;
  final double longitude;

  GeoCoordinates({required this.latitude, required this.longitude});

  factory GeoCoordinates.fromJson(Map<String, dynamic>? json) {
    if (json == null || json['coordinates'] == null) {
      return GeoCoordinates(latitude: 28.6139, longitude: 77.209);
    }
    final List coords = json['coordinates'] as List;
    // GeoJSON Point is [longitude, latitude]
    if (coords.length >= 2) {
      return GeoCoordinates(
        longitude: (coords[0] as num).toDouble(),
        latitude: (coords[1] as num).toDouble(),
      );
    }
    return GeoCoordinates(latitude: 28.6139, longitude: 77.209);
  }
}

class ReportItem {
  final String id;
  final String title;
  final String description;
  final String? reporterName;
  final String? address;
  final DateTime createdAt;

  ReportItem({
    required this.id,
    required this.title,
    required this.description,
    this.reporterName,
    this.address,
    required this.createdAt,
  });

  factory ReportItem.fromJson(Map<String, dynamic> json) {
    return ReportItem(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      reporterName: json['reporterName'] ?? 'Anonymous Resident',
      address: json['address'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class Incident {
  final String id;
  final String title;
  final String category;
  final String description;
  final String status;
  final String severity;
  final GeoCoordinates location;
  final String address;
  final List<String> media;
  final List<String> resolutionMedia;
  final String? resolutionNote;
  final String? complaintRef;
  final DateTime? resolvedAt;
  final int flagsCount;
  final int reportCount;
  final int upvotes;
  final List<ReportItem> reports;
  final DateTime createdAt;

  Incident({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.status,
    required this.severity,
    required this.location,
    required this.address,
    required this.media,
    this.resolutionMedia = const [],
    this.resolutionNote,
    this.complaintRef,
    this.resolvedAt,
    this.flagsCount = 0,
    required this.reportCount,
    required this.upvotes,
    required this.reports,
    required this.createdAt,
  });

  factory Incident.fromJson(Map<String, dynamic> json) {
    List<ReportItem> parsedReports = [];
    if (json['reports'] != null && json['reports'] is List) {
      for (var r in json['reports']) {
        if (r is Map<String, dynamic>) {
          parsedReports.add(ReportItem.fromJson(r));
        }
      }
    }

    List<String> parsedMedia = [];
    if (json['media'] != null && json['media'] is List) {
      parsedMedia = (json['media'] as List).map((e) => e.toString()).toList();
    }

    List<String> parsedResolutionMedia = [];
    if (json['resolutionMedia'] != null && json['resolutionMedia'] is List) {
      parsedResolutionMedia =
          (json['resolutionMedia'] as List).map((e) => e.toString()).toList();
    }

    return Incident(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? 'other',
      description: json['description'] ?? '',
      status: json['status'] ?? 'reported',
      severity: json['severity'] ?? 'medium',
      location: GeoCoordinates.fromJson(json['location']),
      address: json['address'] ?? 'Society Area',
      media: parsedMedia,
      resolutionMedia: parsedResolutionMedia,
      resolutionNote: json['resolutionNote'],
      complaintRef: json['complaintRef'],
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.tryParse(json['resolvedAt'])
          : null,
      flagsCount: (json['flagsCount'] as num?)?.toInt() ?? 0,
      reportCount: (json['reportCount'] as num?)?.toInt() ?? 1,
      upvotes: (json['upvotes'] as num?)?.toInt() ?? 1,
      reports: parsedReports,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class HealthScoreData {
  final int score;
  final String grade;
  final String label;
  final int activeCount;
  final int resolvedCount;
  final Map<String, int> categoryCounts;

  HealthScoreData({
    required this.score,
    required this.grade,
    required this.label,
    required this.activeCount,
    required this.resolvedCount,
    required this.categoryCounts,
  });

  factory HealthScoreData.fromJson(Map<String, dynamic> json) {
    Map<String, int> counts = {};
    if (json['categoryCounts'] != null && json['categoryCounts'] is Map) {
      (json['categoryCounts'] as Map).forEach((k, v) {
        counts[k.toString()] = (v as num).toInt();
      });
    }

    return HealthScoreData(
      score: (json['score'] as num?)?.toInt() ?? 80,
      grade: json['grade'] ?? 'B',
      label: json['label'] ?? 'Good Community Health',
      activeCount: (json['activeCount'] as num?)?.toInt() ?? 0,
      resolvedCount: (json['resolvedCount'] as num?)?.toInt() ?? 0,
      categoryCounts: counts,
    );
  }
}

