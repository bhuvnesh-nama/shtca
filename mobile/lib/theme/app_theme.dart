import 'package:flutter/material.dart';

class AppTheme {
  // Indian Government Municipal Palette
  static const Color govAshokaBlue = Color(0xFF003366); // Ashoka Navy
  static const Color govSaffron = Color(0xFFFF9933);    // Tricolor Saffron
  static const Color govGreen = Color(0xFF138808);      // Tricolor Green
  static const Color primaryBlue = Color(0xFF003366);
  static const Color secondaryNavy = Color(0xFF0B2545);
  static const Color backgroundLight = Color(0xFFF4F6F9);
  static const Color cardLight = Colors.white;
  static const Color textDark = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFE2E8F0);

  // Severity colors
  static const Color severityCritical = Color(0xFFE11D48); // Rose
  static const Color severityHigh = Color(0xFFDC2626);     // Red
  static const Color severityMedium = Color(0xFFD97706);   // Amber
  static const Color severityLow = Color(0xFF059669);      // Green

  // Status & Emerald colors
  static const Color emerald = Color(0xFF059669);
  static const Color emeraldLight = Color(0xFFD1FAE5);
  static const Color emeraldDark = Color(0xFF065F46);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: govAshokaBlue,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: govAshokaBlue,
        secondary: govSaffron,
        surface: cardLight,
        error: severityHigh,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: textDark,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textDark,
          fontSize: 17,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: borderLight, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: govAshokaBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // Official Indian Tricolor Strip Widget
  static Widget tricolorStrip({double height = 4.0}) {
    return Container(
      height: height,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [govSaffron, Colors.white, govGreen],
          stops: [0.33, 0.5, 0.67],
        ),
      ),
    );
  }

  static IconData getCategoryIcon(String category) {
    switch (category) {
      case 'power_cut':
      case 'utility_disruption':
        return Icons.bolt_rounded;
      case 'water_issue':
      case 'water_drainage':
        return Icons.water_drop_rounded;
      case 'theft_security':
      case 'safety_concern':
        return Icons.shield_rounded;
      case 'stray_animals':
        return Icons.pets_rounded;
      case 'road_hazard':
        return Icons.warning_amber_rounded;
      case 'sanitation':
        return Icons.delete_outline_rounded;
      default:
        return Icons.help_outline_rounded;
    }
  }

  static Color getCategoryColor(String category) {
    switch (category) {
      case 'power_cut':
      case 'utility_disruption':
        return const Color(0xFFD97706); // Amber
      case 'water_issue':
      case 'water_drainage':
        return const Color(0xFF0284C7); // Sky Blue
      case 'theft_security':
      case 'safety_concern':
        return const Color(0xFFE11D48); // Rose
      case 'stray_animals':
        return const Color(0xFFEA580C); // Orange
      case 'road_hazard':
        return const Color(0xFFCA8A04); // Yellow
      case 'sanitation':
        return const Color(0xFF059669); // Emerald
      default:
        return const Color(0xFF64748B);
    }
  }

  static String getCategoryName(String category) {
    switch (category) {
      case 'power_cut':
      case 'utility_disruption':
        return 'Power Cut / विद्युत आपूर्ति';
      case 'water_issue':
      case 'water_drainage':
        return 'Water Leakage / जल आपूर्ति';
      case 'theft_security':
      case 'safety_concern':
        return 'Security / सुरक्षा व अतिक्रमण';
      case 'stray_animals':
        return 'Stray Animals / आवारा पशु';
      case 'road_hazard':
        return 'Road Pothole / सड़क गड्ढे';
      case 'sanitation':
        return 'Sanitation / सफाई व कचरा';
      default:
        return 'Civic Grievance / जन शिकायत';
    }
  }

  static String getDepartmentName(String category) {
    switch (category) {
      case 'power_cut':
      case 'utility_disruption':
        return 'Power Discom & Street Lighting (विद्युत विभाग)';
      case 'water_issue':
      case 'water_drainage':
        return 'Jal Board / Water Works & Sewerage (जल बोर्ड)';
      case 'road_hazard':
        return 'PWD Roads & Infrastructure (लोक निर्माण विभाग)';
      case 'sanitation':
        return 'Solid Waste Management & Sanitation (सफाई विभाग)';
      case 'stray_animals':
        return 'Stray Animal Control & Veterinary (पशु नियंत्रण)';
      case 'theft_security':
      case 'safety_concern':
        return 'Municipal Encroachment & Security (सुरक्षा सेल)';
      default:
        return 'General Municipal Services (नगर निगम)';
    }
  }

  static Color getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return severityCritical;
      case 'high':
        return severityHigh;
      case 'medium':
        return severityMedium;
      case 'low':
        return severityLow;
      default:
        return govAshokaBlue;
    }
  }
}
