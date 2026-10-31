import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/services/translations.dart';
import 'package:mobile/services/api_service.dart';
import 'package:mobile/models/broadcast.dart';
import 'package:mobile/models/incident.dart';
import 'package:mobile/models/jurisdiction.dart';

void main() {
  testWidgets('HyperNet app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HyperNetMobileApp());
    expect(find.byType(HyperNetMobileApp), findsOneWidget);
  });

  test('ApiService formatMediaUrl formats full and relative paths', () {
    expect(
      ApiService.formatMediaUrl('https://example.com/photo.jpg'),
      'https://example.com/photo.jpg',
    );
    expect(
      ApiService.formatMediaUrl('/public/uploads/test.png'),
      contains('/public/uploads/test.png'),
    );
  });

  test('Incident model parses media and resolution proof', () {
    final raw = {
      '_id': 'inc_101',
      'title': 'Leaking main line',
      'category': 'water_issue',
      'department': 'Jal Board / Water Works & Sewerage',
      'ward': 'Ward 42 - Preet Vihar / Anand Vihar',
      'description': 'Water wastage',
      'status': 'resolved_verified',
      'severity': 'medium',
      'location': {
        'type': 'Point',
        'coordinates': [77.21, 28.63],
      },
      'address': 'Gate 2',
      'media': ['https://example.com/before.jpg'],
      'resolutionMedia': ['https://example.com/after.jpg'],
      'complaintRef': 'MCD-2026-999',
      'reportCount': 2,
      'upvotes': 4,
      'reports': [],
      'createdAt': '2026-10-30T10:00:00.000Z',
    };

    final inc = Incident.fromJson(raw);
    expect(inc.id, 'inc_101');
    expect(inc.complaintRef, 'MCD-2026-999');
    expect(inc.department, 'Jal Board / Water Works & Sewerage');
    expect(inc.media.length, 1);
    expect(inc.resolutionMedia.length, 1);
  });

  test('Incident model parses assignedAuthority and comments correctly', () {
    final raw = {
      '_id': 'inc_102',
      'title': 'Cracked Road',
      'category': 'road_hazard',
      'department': 'PWD Roads & Infrastructure',
      'ward': 'Ward 42 - Preet Vihar',
      'description': 'Deep potholes',
      'status': 'under_review',
      'severity': 'high',
      'location': {
        'type': 'Point',
        'coordinates': [77.21, 28.63],
      },
      'assignedAuthority': {
        'officeId': 'AUTH-ZONE-EAST',
        'tier': 'zonal_ward',
        'name': 'East Zone Municipal Public Works Division',
        'office': 'Ward 42 Zonal Office, Anand Vihar',
        'jurisdictionType': 'Zonal Sector Public Works',
        'distanceKm': 4.2,
        'routingReason': 'Nearest operational municipal engineering unit',
      },
      'comments': [
        {
          'author': 'Inspector Verma',
          'role': 'Field Inspector',
          'message': 'Work crew dispatched to inspect pothole.',
          'createdAt': '2026-10-30T10:00:00.000Z',
        }
      ],
      'reportCount': 1,
      'upvotes': 2,
      'reports': [],
      'createdAt': '2026-10-30T10:00:00.000Z',
    };

    final inc = Incident.fromJson(raw);
    expect(inc.assignedAuthority, isNotNull);
    expect(inc.assignedAuthority!.officeId, 'AUTH-ZONE-EAST');
    expect(inc.assignedAuthority!.tierBadge, 'Tier 2: Zonal Ward');
    expect(inc.assignedAuthority!.distanceKm, 4.2);
    expect(inc.comments.length, 1);
    expect(inc.comments[0].author, 'Inspector Verma');
    expect(inc.comments[0].message, contains('Work crew dispatched'));
  });

  test('Jurisdiction registry contains multi-tier offices with regional and Jaipur coverage', () {
    expect(localJurisdictionOffices.length, greaterThanOrEqualTo(7));
    expect(localJurisdictionOffices.any((o) => o.id == 'AUTH-APEX-01'), isTrue);
    expect(localJurisdictionOffices.any((o) => o.id == 'AUTH-ZONE-JAIPUR-MALVIYA'), isTrue);
    expect(localJurisdictionOffices.any((o) => o.tier == 'apex_central'), isTrue);
    expect(localJurisdictionOffices.any((o) => o.tier == 'zonal_ward'), isTrue);
    expect(localJurisdictionOffices.any((o) => o.tier == 'local_society'), isTrue);
  });

  test('AppTranslations English and Hindi bilingual toggles', () {
    AppTranslations.isHindi.value = false;
    expect(AppTranslations.get('emergency_sos'), 'Civic Emergency 112');
    expect(AppTranslations.categoryName('power_cut'), contains('Power'));

    AppTranslations.toggleLanguage();
    expect(AppTranslations.isHindi.value, true);
    expect(AppTranslations.get('emergency_sos'), 'नागरिक आपात सेवा 112');
    expect(AppTranslations.categoryName('power_cut'), contains('बिजली'));

    // Reset back to English
    AppTranslations.toggleLanguage();
    expect(AppTranslations.isHindi.value, false);
  });

  test('EmergencyBroadcast model parses correctly', () {
    final raw = {
      '_id': 'broadcast_123',
      'title': '⚡ Substation Line Trip',
      'message': 'Standby generator operating until 6 PM',
      'severity': 'warning',
      'ward': 'Central Greenwood Society',
      'issuedBy': {
        'name': 'RWA Maintenance Desk',
        'role': 'Infrastructure Team',
      },
      'createdAt': '2026-10-30T10:00:00.000Z',
    };

    final broadcast = EmergencyBroadcast.fromJson(raw);
    expect(broadcast.id, 'broadcast_123');
    expect(broadcast.title, '⚡ Substation Line Trip');
    expect(broadcast.severity, 'warning');
    expect(broadcast.ward, 'Central Greenwood Society');
    expect(broadcast.issuedByName, 'RWA Maintenance Desk');
  });
}
