import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/services/translations.dart';
import 'package:mobile/models/broadcast.dart';

void main() {
  testWidgets('HyperNet app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const HyperNetMobileApp());
    expect(find.text('HyperNet Safety'), findsOneWidget);
  });

  test('AppTranslations English and Hindi bilingual toggles', () {
    AppTranslations.isHindi.value = false;
    expect(AppTranslations.get('emergency_sos'), 'Emergency SOS');
    expect(AppTranslations.categoryName('power_cut'), 'Power Cut');

    AppTranslations.toggleLanguage();
    expect(AppTranslations.isHindi.value, true);
    expect(AppTranslations.get('emergency_sos'), 'आपातकालीन एसओएस');
    expect(AppTranslations.categoryName('power_cut'), 'बिजली कटौती');

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
