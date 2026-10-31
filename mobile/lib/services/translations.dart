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
        return 'SHTCA';
      case 'app_subtitle':
        return hi ? 'लोक शिकायत एवं निवारण प्रणाली' : 'Civic Grievance & Redressal Platform';
      case 'emergency_sos':
        return hi ? 'नागरिक आपात सेवा 112' : 'Civic Emergency 112';
      case 'all_issues':
        return hi ? 'समस्त शिकायतें' : 'All Grievances';
      case 'report_hazard':
        return hi ? 'शिकायत दर्ज करें' : 'Register Grievance';
      case 'safety_feed':
        return hi ? 'शिकायत कतार' : 'Grievance Queue';
      case 'health_score':
        return hi ? 'नागरिक सेवा सूचकांक' : 'Civic Health Index';
      case 'rwa_dashboard':
        return hi ? 'अधिकारी नियंत्रण कक्ष' : 'Officer Console';
      case 'field_verified':
        return hi ? 'कनिष्ठ अभियंता स्थलीय सत्यापन' : 'Inspected by JE';
      case 'reopened':
        return hi ? 'पुनः खोली गई' : 'Re-Opened';
      case 'confirm_upvote':
        return hi ? 'समर्थन' : 'Upvote';
      case 'critical_alert':
        return hi ? 'नगर निगम आपात चेतावनी' : 'MUNICIPAL EMERGENCY';
      case 'official_advisory':
        return hi ? 'विभागीय जन परामर्श' : 'DEPARTMENTAL ADVISORY';
      case 'society_notice':
        return hi ? 'नगर निगम जन सूचना' : 'MUNICIPAL NOTICE';
      case 'action_taken_report':
        return hi ? 'कार्रवाई रिपोर्ट (ATR)' : 'Action Taken Report (ATR)';
      case 'tracking_no':
        return hi ? 'शिकायत संदर्भ संख्या' : 'Grievance Tracking #';
      case 'department':
        return hi ? 'संबंधित विभाग' : 'Concerned Department';
      case 'ward':
        return hi ? 'परिक्षेत्र / स्थल' : 'Vicinity / Area';
      default:
        return key;
    }
  }

  static String categoryName(String categoryId) {
    final bool hi = isHindi.value;
    switch (categoryId) {
      case 'power_cut':
      case 'utility_disruption':
        return hi ? 'बिजली कटौती व स्ट्रीटलाइट' : 'Power & Streetlight';
      case 'water_issue':
      case 'water_drainage':
        return hi ? 'जल आपूर्ति व सीवर लीकेज' : 'Water & Sewerage';
      case 'theft_security':
      case 'safety_concern':
        return hi ? 'सुरक्षा व अवैध अतिक्रमण' : 'Encroachment & Safety';
      case 'stray_animals':
        return hi ? 'आवारा पशु नियंत्रण' : 'Stray Animals';
      case 'road_hazard':
        return hi ? 'सड़क गड्ढे व मलबा' : 'Road Potholes & Infra';
      case 'sanitation':
        return hi ? 'कचरा, कूड़ेदान व स्वच्छता' : 'Sanitation & Garbage';
      default:
        return hi ? 'अन्य नागरिक समस्या' : 'Other Civic Issue';
    }
  }

  static String statusName(String status) {
    final bool hi = isHindi.value;
    switch (status) {
      case 'reported':
        return hi ? 'पंजीकृत' : 'Reported';
      case 'under_review':
        return hi ? 'निरीक्षण' : 'Under Review';
      case 'confirmed':
        return hi ? 'पुष्टित' : 'Confirmed';
      case 'action_pending':
        return hi ? 'अधिकारी को प्रेषित' : 'Assigned to JE';
      case 'work_in_progress':
        return hi ? 'कार्य प्रगति पर' : 'Work In Progress';
      case 'resolved_verified':
        return hi ? 'समाधान सत्यापित' : 'Resolved & Verified';
      case 'closed_unverified':
        return hi ? 'निस्तारित' : 'Closed';
      case 'reopened':
        return hi ? 'पुनः खोली गई' : 'Reopened';
      case 'rejected':
        return hi ? 'अस्वीकृत' : 'Rejected';
      default:
        return status.replaceAll('_', ' ');
    }
  }
}
