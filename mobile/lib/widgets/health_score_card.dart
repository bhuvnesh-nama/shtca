import 'package:flutter/material.dart';
import '../models/incident.dart';
import '../theme/app_theme.dart';

class HealthScoreCard extends StatelessWidget {
  final HealthScoreData? data;
  final bool isLoading;
  final VoidCallback onRefresh;

  const HealthScoreCard({
    super.key,
    required this.data,
    this.isLoading = false,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading || data == null) {
      return Container(
        height: 110,
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: const Center(
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      );
    }

    final score = data!.score;
    Color scoreColor = Colors.green;
    if (score < 60) {
      scoreColor = AppTheme.severityCritical;
    } else if (score < 75) {
      scoreColor = AppTheme.severityMedium;
    } else if (score < 90) {
      scoreColor = AppTheme.primaryBlue;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Circular Score Badge
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: scoreColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: scoreColor.withValues(alpha: 0.35)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '$score',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: scoreColor,
                        height: 1.0,
                      ),
                    ),
                    Text(
                      'SCORE',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        color: scoreColor,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.account_balance_rounded,
                          size: 16,
                          color: AppTheme.govAshokaBlue,
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          'वार्ड नागरिक सेवा सूचकांक (Civic Index)',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.govAshokaBlue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      data!.label,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: scoreColor,
                      ),
                    ),
                    Text(
                      '${data!.activeCount} लंबित शिकायतें • ${data!.resolvedCount} निस्तारित',
                      style: const TextStyle(
                        fontSize: 10.5,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, size: 20, color: AppTheme.textMuted),
                onPressed: onRefresh,
                tooltip: 'Refresh score',
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Category counts horizontal chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildCategoryPill(
                  Icons.bolt_rounded,
                  'Power',
                  data!.categoryCounts['power_cut'] ?? 0,
                  const Color(0xFFD97706),
                ),
                _buildCategoryPill(
                  Icons.water_drop_rounded,
                  'Water',
                  data!.categoryCounts['water_issue'] ?? 0,
                  AppTheme.primaryBlue,
                ),
                _buildCategoryPill(
                  Icons.shield_rounded,
                  'Security',
                  data!.categoryCounts['theft_security'] ?? 0,
                  AppTheme.severityCritical,
                ),
                _buildCategoryPill(
                  Icons.pets_rounded,
                  'Animals',
                  data!.categoryCounts['stray_animals'] ?? 0,
                  const Color(0xFFEA580C),
                ),
                _buildCategoryPill(
                  Icons.warning_amber_rounded,
                  'Roads',
                  data!.categoryCounts['road_hazard'] ?? 0,
                  const Color(0xFFCA8A04),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryPill(IconData icon, String name, int count, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.backgroundLight,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            '$name: ',
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
          Text(
            '$count',
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppTheme.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
