import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/incident.dart';
import '../models/broadcast.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:8000/api';
      }
    } catch (_) {
      // Fallback if Platform check fails
    }
    return 'http://localhost:8000/api';
  }

  static String formatMediaUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    final host = baseUrl.replaceAll('/api', '');
    return '$host${url.startsWith('/') ? '' : '/'}$url';
  }

  // Fetch Nearby / Active Incidents
  static Future<List<Incident>> fetchIncidents({
    String? category,
    String? status,
    String? search,
  }) async {
    final queryParams = <String, String>{};
    if (category != null && category != 'all') queryParams['category'] = category;
    if (status != null && status != 'all') queryParams['status'] = status;
    if (search != null && search.trim().isNotEmpty) queryParams['search'] = search.trim();

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

  // Fetch Neighbourhood Health Score (Bonus Twist 2)
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

  // Check Nearby Duplicates for Auto-Clustering (Bonus Twist 1)
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

  // Submit Citizen Report with Auto-Clustering
  static Future<Map<String, dynamic>> submitReport({
    required String category,
    required String title,
    required String description,
    required double latitude,
    required double longitude,
    String? address,
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

  // Update Status by Admin / RWA
  static Future<void> updateIncidentStatus(
    String id,
    String status, {
    String? resolutionNote,
  }) async {
    final uri = Uri.parse('$baseUrl/incidents/$id/status');
    final response = await http.patch(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'status': status,
        if (resolutionNote != null) 'resolutionNote': resolutionNote,
      }),
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

  // Demo Simulation Action (Feature 65)
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
    fi