import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryBlue = Color(0xFF2563EB);
  static const Color secondaryNavy = Color(0xFF1E3A8A);
  static const Color backgroundLight = Color(0xFFF8FAFC);
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
      primaryColor: primaryBlue,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: ColorScheme.light(
        primary: primaryBlue,
        secondary: secondaryNavy,
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
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: borderLight, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
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
        return const Color(0xFF2563EB); // Blue
      case 'theft_security':
      case 'safety_concern':
        return const Color(0xFFE11D48); // Rose
      case 'stray_animals':
        return const Color(0xFFEA580C); // Orange
      case 'road_hazard':
        return const Color(0xFFCA8A04); // Yellow
      case 'sanitation':
        return const Color(0xFF059669); // Green
      default:
        return const Color(0xFF64748B);
    }
  }

  static String getCategoryName(String category) {
    switch (category) {
      case 'power_cut':
      case 'utility_disruption':
        return 'Power Cut';
      case 'water_issue':
      case 'water_drainage':
        return 'Water Issue';
      case 'theft_security':
      case 'safety_concern':
        return 'Theft & Security';
      case 'stray_animals':
        return 'Stray Animals';
      case 'road_hazard':
        return 'Road Hazard';
      case 'sanitation':
        return 'Sanitation';
      default:
        return 'Local Issue';
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
        return primaryBlue;
    }
  }
}
