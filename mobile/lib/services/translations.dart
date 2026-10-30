import 'package:flutter/foundation.dart';

class AppTranslations {
  static final ValueNotifier<bool> isHindi = ValueNotifier<bool>(false);

  static void toggleLanguage() {
    isHindi.value = !isHindi.value;
  }

  static String get(String key) {
    final bool hi = isHindi.value;
    switch (key) {
      case 'app_name':
        return hi ? 'हाइपरनेट सुरक्षा' : 'HyperNet Safety';
      case 'app_subtitle':
        return hi ? 'स्थानीय समुदाय सुरक्षा नेटवर्क' : 'Neighbourhood Safety & Hazards';
      case 'emergency_sos':
        return hi ? 'आपातकालीन एसओएस' : 'Emergency SOS';
      case 'all_issues':
        return hi ? 'सभी समस्याएं' : 'All Issues';
      case 'report_hazard':
        return hi ? 'समस्या दर्ज करें' : 'Report Hazard';
      case 'safety_feed':
        return hi ? 'सुरक्षा फ़ीड' : 'Safety Feed';
      case 'health_score':
        return hi ? 'सोसायटी स्वास्थ्य स्कोर' : 'Society Health Score';
      case 'rwa_dashboard':
        return hi ? 'संचालन डैशबोर्ड' : 'Operations Dashboard';
      case 'demo_lab':
        return hi ? 'डेमो लैब' : 'Demo Lab';
      case 'field_verified':
        return hi ? 'मौका मुआयना सत्यापित' : 'Field Verified';
      case 'reopened':
        return hi ? 'पुनः खोला गया' : 'Reopened';
      case 'confirm_upvote':
        return hi ? 'पुष्टि करें' : 'Confirm';
      case 'critical_alert':
        return hi ? 'अति आवश्यक चेतावनी' : 'CRITICAL ALERT';
      case 'official_advisory':
        return hi ? 'आधिकारिक सलाह' : 'OFFICIAL ADVISORY';
      case 'society_notice':
        return hi ? 'सार्वजनिक सूचना' : 'SOCIETY NOTICE';
      default:
        return key;
    }
  }

  static String categoryName(String categoryId) {
    final bool hi = isHindi.value;
    switch (categoryId) {
      case 'power_cut':
      case 'utility_disruption':
        return hi ? 'बिजली कटौती' : 'Power Cut';
      case 'water_issue':
      case 'water_drainage':
        return hi ? 'जल आपूर्ति लीकेज' : 'Water Supply';
      case 'theft_security':
      case 'safety_concern':
        return hi ? 'चोरी व सुरक्षा' : 'Security';
      case 'stray_animals':
        return hi ? 'आवारा पशु खतरा' : 'Stray Animals';
      case 'road_hazard':
        return hi ? 'सड़क गड्ढे व अवरोध' : 'Road Hazard';
      case 'sanitation':
        return hi ? 'कचरा एवं स्वच्छता' : 'Sanitation';
      default:
        return hi ? 'अन्य समस्या' : 'Other Issue';
    }
  }
}
