import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/incident.dart';
import '../models/broadcast.dart';

class ApiService {
  /// Production Backend API Gateway on dedicated subdomain
  // Active Development Wi-Fi LAN IP (Accessible from connected physical phone)
  static const String defaultLanApiUrl = 'http://172.20.11.238:8000/api';
  static const String productionApiUrl = 'https://api.shtca.com/api';

  static String get baseUrl {
    // 1. Compile-time flag override (e.g. flutter run --dart-define=API_URL=http://...)
    const configuredUrl = String.fromEnvironment('API_URL', defaultValue: '');
    if (configuredUrl.isNotEmpty) {
      return configuredUrl;
    }

    // 2. Local emulator fallback if explicitly requested:
    // flutter run --dart-define=USE_LOCAL_EMULATOR=true
    const useLocal = bool.fromEnvironment('USE_LOCAL_EMULATOR', defaultValue: false);
    if (useLocal) {
      if (kIsWeb) return 'http://localhost:8000/api';
      try {
        if (Platform.isAndroid) return 'http://10.0.2.2:8000/api';
      } catch (_) {}
      return 'http://localhost:8000/api';
    }

    // 3. Default to active Wi-Fi LAN host so physical device testing works out-of-the-box
    return defaultLanApiUrl;
  }

  static String formatMediaUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final host = baseUrl.replaceAll('/api', '');
    return '$host${url.startsWith('/') ? '' : '/'}$url';
  }

  // Fetch Nearby / Active Incidents (Geospatial & Category Filtered)
  static Future<List<Incident>> fetchIncidents({
    String? category,
    String? status,
    String? search,
    String? officeId,
    String? ward,
    double? latitude,
    double? longitude,
    double? radius,
  }) async {
    final queryParams = <String, String>{};
    if (category != null && category != 'all') queryParams['category'] = category;
    if (status != null && status != 'all') queryParams['status'] = status;
    if (search != null && search.trim().isNotEmpty) queryParams['search'] = search.trim();
    if (officeId != null && officeId != 'all' && officeId != 'AUTH-APEX-01') {
      queryParams['officeId'] = officeId;
    }
    if (ward != null && ward != 'all') queryParams['ward'] = ward;
    if (latitude != null) queryParams['lat'] = latitude.toString();
    if (longitude != null) queryParams['lng'] = longitude.toString();
    if (radius != null) queryParams['radius'] = radius.toString();

    final uri = Uri.parse('$baseUrl/incidents').replace(queryParameters: queryParams);

    final response = await http.get(uri).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      final List items = json['data']?['incidents'] ?? [];
      return items.map((e) => Incident.fromJson(e)).toList();
    } else {
      throw Exception('Failed to load incidents: ${response.statusCode}');
    }
  }

  // Fetch Single Incident with full populated reports
  static Future<Incident> fetchIncidentById(String id) async {
    final uri = Uri.parse('$baseUrl/incidents/$id');
    final response = await http.get(uri).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return Incident.fromJson(json['data']);
    } else {
      throw Exception('Failed to fetch incident details');
    }
  }

  // Fetch Neighbourhood Safety & Health Score
  static Future<HealthScoreData> fetchHealthScore() async {
    final uri = Uri.parse('$baseUrl/incidents/health-score');
    final response = await http.get(uri).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return HealthScoreData.fromJson(json['data']);
    } else {
      throw Exception('Failed to fetch health score');
    }
  }

  // Check Nearby Duplicates for Grouping
  static Future<Map<String, dynamic>> checkDuplicate({
    required String category,
    required double lat,
    required double lng,
    int radius = 300,
  }) async {
    final uri = Uri.parse('$baseUrl/reports/check-duplicate').replace(
      queryParameters: {
        'category': category,
        'lat': lat.toString(),
        'lng': lng.toString(),
        'radius': radius.toString(),
      },
    );

    final response = await http.get(uri).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['data'] ?? {'hasNearbyDuplicate': false};
    }
    return {'hasNearbyDuplicate': false};
  }

  // Submit Citizen Municipal Grievance Report
  static Future<Map<String, dynamic>> submitReport({
    required String category,
    required String title,
    required String description,
    required double latitude,
    required double longitude,
    String? address,
    String? ward,
    String? pincode,
    String? landmark,
    String? complainantPhone,
    List<String>? media,
    bool forceNew = false,
  }) async {
    final uri = Uri.parse('$baseUrl/reports');
    final body = jsonEncode({
      'category': category,
      'title': title,
      'description': description,
      'latitude': latitude,
      'longitude': longitude,
      'address': address ?? '',
      'ward': ward ?? 'Ward 42 - Preet Vihar / Anand Vihar',
      if (pincode != null) 'pincode': pincode,
      if (landmark != null) 'landmark': landmark,
      if (complainantPhone != null) 'complainantPhone': complainantPhone,
      'media': media ?? [],
      'forceNew': forceNew,
    });

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: body,
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final err = jsonDecode(response.body);
      throw Exception(err['message'] ?? 'Failed to submit report');
    }
  }

  // Upvote / Verify Incident (Community Upvoting Requirement)
  static Future<Map<String, dynamic>> upvoteIncident(String id) async {
    final uri = Uri.parse('$baseUrl/incidents/$id/upvote');
    final response = await http.post(uri).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to upvote incident');
    }
  }

  // Report / Flag Incident (Phase 7 Moderation)
  static Future<Map<String, dynamic>> flagIncident(String id, String reason) async {
    final uri = Uri.parse('$baseUrl/incidents/$id/flag');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'reason': reason}),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to submit flag');
    }
  }

  // Update Status and Action Taken Report (ATR) by Municipal Authority
  static Future<void> updateIncidentStatus(
    String id,
    String status, {
    String? resolutionNote,
    String? complaintRef,
    String? department,
    Map<String, dynamic>? assignedOfficer,
    Map<String, dynamic>? actionTakenReport,
    List<String>? resolutionMedia,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents/$id/status');
    final body = jsonEncode({
      'status': status,
      if (resolutionNote != null) 'resolutionNote': resolutionNote,
      if (complaintRef != null) 'complaintRef': complaintRef,
      if (department != null) 'department': department,
      if (assignedOfficer != null) 'assignedOfficer': assignedOfficer,
      if (actionTakenReport != null) 'actionTakenReport': actionTakenReport,
      if (resolutionMedia != null) 'resolutionMedia': resolutionMedia,
    });

    final response = await http.patch(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: body,
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      throw Exception('Failed to update incident status');
    }
  }

  // Re-Open Incident (Phase 8)
  static Future<Map<String, dynamic>> reopenIncident(String id, String reason) async {
    final uri = Uri.parse('$baseUrl/incidents/$id/reopen');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'reason': reason}),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to reopen incident');
    }
  }

  // Field Verification Stamp (Phase 8)
  static Future<Map<String, dynamic>> fieldVerifyIncident(
    String id,
    String inspectorName, {
    String? role,
    String? notes,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents/$id/field-verify');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'inspectorName': inspectorName,
        'role': role ?? 'RWA Field Marshal',
        'notes': notes ?? 'Physical ground inspection completed',
      }),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to record field verification');
    }
  }

  // Add Ground Log / Citizen Comment to Grievance Timeline
  static Future<Map<String, dynamic>> addComment(
    String incidentId,
    String message, {
    String? author,
    String? role,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents/$incidentId/comments');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'message': message,
        'author': author ?? 'Mobile Citizen',
        'role': role ?? 'Resident Complainant',
      }),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to post comment to grievance');
    }
  }

  // Scenario Simulation Action
  static Future<String> simulateScenario(String scenario) async {
    final uri = Uri.parse('$baseUrl/incidents/simulate');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'scenario': scenario}),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['message'] ?? 'Simulation completed successfully';
    } else {
      throw Exception('Simulation request failed');
    }
  }

  // Phase 10: Fetch Active Emergency Broadcasts
  static Future<List<EmergencyBroadcast>> fetchBroadcasts({String? ward}) async {
    final queryParams = <String, String>{};
    if (ward != null && ward != 'all') queryParams['ward'] = ward;

    final uri = Uri.parse('$baseUrl/incidents/broadcasts').replace(queryParameters: queryParams);
    final response = await http.get(uri).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      final List items = json['data'] ?? [];
      return items.map((e) => EmergencyBroadcast.fromJson(e)).toList();
    } else {
      return [];
    }
  }

  // Phase 10: Trigger Citizen Emergency SOS Beacon
  static Future<Map<String, dynamic>> triggerSos({
    required double lat,
    required double lng,
    String? address,
    String? details,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents/sos');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'latitude': lat,
        'longitude': lng,
        'address': address ?? 'Citizen Emergency Vicinity',
        'details': details ?? 'Resident SOS panic triggered from native mobile app',
      }),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to trigger SOS beacon');
    }
  }

  // Phase 10: Fetch Scale & Query Performance Diagnostics
  static Future<Map<String, dynamic>> fetchPerformanceMetrics() async {
    final uri = Uri.parse('$baseUrl/incidents/performance');
    final response = await http.get(uri).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['data'] ?? {};
    } else {
      return {};
    }
  }
}

