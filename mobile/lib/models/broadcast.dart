class EmergencyBroadcast {
  final String id;
  final String title;
  final String message;
  final String severity; // critical, warning, info
  final String ward;
  final String issuedByName;
  final String issuedByRole;
  final DateTime createdAt;

  const EmergencyBroadcast({
    required this.id,
    required this.title,
    required this.message,
    required this.severity,
    required this.ward,
    required this.issuedByName,
    required this.issuedByRole,
    required this.createdAt,
  });

  factory EmergencyBroadcast.fromJson(Map<String, dynamic> json) {
    return EmergencyBroadcast(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      severity: json['severity'] ?? 'warning',
      ward: json['ward'] ?? 'all',
      issuedByName: json['issuedBy']?['name'] ?? 'RWA Safety Council',
      issuedByRole: json['issuedBy']?['role'] ?? 'Authority',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

