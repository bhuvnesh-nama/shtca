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

class AssignedOfficer {
  final String name;
  final String designation;
  final String? phone;
  final DateTime? assignedAt;

  AssignedOfficer({
    required this.name,
    required this.designation,
    this.phone,
    this.assignedAt,
  });

  factory AssignedOfficer.fromJson(Map<String, dynamic> json) {
    return AssignedOfficer(
      name: json['name'] ?? '',
      designation: json['designation'] ?? 'Junior Engineer (Civil)',
      phone: json['phone'],
      assignedAt: json['assignedAt'] != null
          ? DateTime.tryParse(json['assignedAt'])
          : null,
    );
  }
}

class AssignedAuthority {
  final String? officeId;
  final String tier;
  final String name;
  final String office;
  final String jurisdictionType;
  final double? distanceKm;
  final String routingReason;
  final String? contactNumber;

  AssignedAuthority({
    this.officeId,
    required this.tier,
    required this.name,
    required this.office,
    required this.jurisdictionType,
    this.distanceKm,
    required this.routingReason,
    this.contactNumber,
  });

  factory AssignedAuthority.fromJson(Map<String, dynamic> json) {
    return AssignedAuthority(
      officeId: json['officeId'],
      tier: json['tier'] ?? 'zonal_ward',
      name: json['name'] ?? 'Local Civic Authority',
      office: json['office'] ?? 'Municipal Office',
      jurisdictionType: json['jurisdictionType'] ?? 'Zonal Sector Public Works',
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      routingReason: json['routingReason'] ?? 'Dispatched based on geographic proximity',
      contactNumber: json['contactNumber'],
    );
  }

  String get tierBadge {
    switch (tier) {
      case 'apex_central':
        return 'Tier 1: Apex Central';
      case 'local_society':
        return 'Tier 3: Colony RWA';
      default:
        return 'Tier 2: Zonal Ward';
    }
  }

  String get iconEmoji {
    switch (tier) {
      case 'apex_central':
        return '🏛️';
      case 'local_society':
        return '🏡';
      default:
        return '🏢';
    }
  }
}

class IncidentComment {
  final String author;
  final String role;
  final String message;
  final DateTime createdAt;

  IncidentComment({
    required this.author,
    required this.role,
    required this.message,
    required this.createdAt,
  });

  factory IncidentComment.fromJson(Map<String, dynamic> json) {
    return IncidentComment(
      author: json['author'] ?? 'Resident Complainant',
      role: json['role'] ?? 'Citizen',
      message: json['message'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class ActionTakenReport {
  final String actionSummary;
  final String resolvedBy;
  final DateTime? completionDate;
  final List<String> afterMedia;

  ActionTakenReport({
    required this.actionSummary,
    required this.resolvedBy,
    this.completionDate,
    this.afterMedia = const [],
  });

  factory ActionTakenReport.fromJson(Map<String, dynamic> json) {
    List<String> mediaList = [];
    if (json['afterMedia'] != null && json['afterMedia'] is List) {
      mediaList = (json['afterMedia'] as List).map((e) => e.toString()).toList();
    }
    return ActionTakenReport(
      actionSummary: json['actionSummary'] ?? '',
      resolvedBy: json['resolvedBy'] ?? '',
      completionDate: json['completionDate'] != null
          ? DateTime.tryParse(json['completionDate'])
          : null,
      afterMedia: mediaList,
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
  final String department;
  final String ward;
  final String? pincode;
  final String? landmark;
  final AssignedOfficer? assignedOfficer;
  final AssignedAuthority? assignedAuthority;
  final ActionTakenReport? actionTakenReport;
  final List<String> media;
  final List<String> resolutionMedia;
  final String? resolutionNote;
  final String? complaintRef;
  final DateTime? resolvedAt;
  final int flagsCount;
  final int reportCount;
  final int upvotes;
  final List<ReportItem> reports;
  final List<IncidentComment> comments;
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
    this.department = 'General Municipal Services',
    this.ward = 'Ward 42 - Preet Vihar / Anand Vihar',
    this.pincode,
    this.landmark,
    this.assignedOfficer,
    this.assignedAuthority,
    this.actionTakenReport,
    required this.media,
    this.resolutionMedia = const [],
    this.resolutionNote,
    this.complaintRef,
    this.resolvedAt,
    this.flagsCount = 0,
    required this.reportCount,
    required this.upvotes,
    required this.reports,
    this.comments = const [],
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

    List<IncidentComment> parsedComments = [];
    if (json['comments'] != null && json['comments'] is List) {
      for (var c in json['comments']) {
        if (c is Map<String, dynamic>) {
          parsedComments.add(IncidentComment.fromJson(c));
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
      address: json['address'] ?? 'Municipal Area',
      department: json['department'] ?? 'General Municipal Services',
      ward: json['ward'] ?? 'Ward 42 - Preet Vihar / Anand Vihar',
      pincode: json['pincode'],
      landmark: json['landmark'],
      assignedOfficer: json['assignedOfficer'] != null && json['assignedOfficer'] is Map<String, dynamic>
          ? AssignedOfficer.fromJson(json['assignedOfficer'])
          : null,
      assignedAuthority: json['assignedAuthority'] != null && json['assignedAuthority'] is Map<String, dynamic>
          ? AssignedAuthority.fromJson(json['assignedAuthority'])
          : null,
      actionTakenReport: json['actionTakenReport'] != null && json['actionTakenReport'] is Map<String, dynamic>
          ? ActionTakenReport.fromJson(json['actionTakenReport'])
          : null,
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
      comments: parsedComments,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Incident copyWith({
    String? status,
    int? upvotes,
    int? reportCount,
    String? resolutionNote,
    List<String>? resolutionMedia,
    DateTime? resolvedAt,
    AssignedOfficer? assignedOfficer,
    AssignedAuthority? assignedAuthority,
    ActionTakenReport? actionTakenReport,
    List<IncidentComment>? comments,
  }) {
    return Incident(
      id: id,
      title: title,
      category: category,
      description: description,
      status: status ?? this.status,
      severity: severity,
      location: location,
      address: address,
      department: department,
      ward: ward,
      pincode: pincode,
      landmark: landmark,
      assignedOfficer: assignedOfficer ?? this.assignedOfficer,
      assignedAuthority: assignedAuthority ?? this.assignedAuthority,
      actionTakenReport: actionTakenReport ?? this.actionTakenReport,
      media: media,
      resolutionMedia: resolutionMedia ?? this.resolutionMedia,
      resolutionNote: resolutionNote ?? this.resolutionNote,
      complaintRef: complaintRef,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      flagsCount: flagsCount,
      reportCount: reportCount ?? this.reportCount,
      upvotes: upvotes ?? this.upvotes,
      reports: reports,
      comments: comments ?? this.comments,
      createdAt: createdAt,
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
