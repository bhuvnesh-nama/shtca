import 'package:flutter/material.dart';
import '../models/broadcast.dart';
import '../services/translations.dart';

class EmergencyBroadcastBanner extends StatelessWidget {
  final List<EmergencyBroadcast> broadcasts;
  final void Function(String id)? onDismiss;

  const EmergencyBroadcastBanner({
    super.key,
    required this.broadcasts,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    if (broadcasts.isEmpty) return const SizedBox.shrink();

    return ValueListenableBuilder<bool>(
      valueListenable: AppTranslations.isHindi,
      builder: (context, _, __) {
        return Column(
          children: broadcasts.map((b) => _buildBroadcastItem(context, b)).toList(),
        );
      },
    );
  }

  Widget _buildBroadcastItem(BuildContext context, EmergencyBroadcast b) {
    final bool isCritical = b.severity == 'critical';
    final bool isWarning = b.severity == 'warning';

    final Color bgColor = isCritical
        ? const Color(0xFFFFF1F2)
        : isWarning
            ? const Color(0xFFFFFBEB)
            : const Color(0xFFEFF6FF);

    final Color borderColor = isCritical
        ? const Color(0xFFFDA4AF)
        : isWarning
            ? const Color(0xFFFDE68A)
            : const Color(0xFFBFDBFE);

    final Color badgeColor = isCritical
        ? const Color(0xFFE11D48)
        : isWarning
            ? const Color(0xFFD97706)
            : const Color(0xFF2563EB);

    final IconData iconData = isCritical
        ? Icons.warning_rounded
        : isWarning
            ? Icons.error_outline_rounded
            : Icons.info_outline_rounded;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: badgeColor.withAlpha(25),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(iconData, color: badgeColor, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: badgeColor,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isCritical
                            ? AppTranslations.get('critical_alert')
                            : isWarning
                                ? AppTranslations.get('official_advisory')
                                : AppTranslations.get('society_notice'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        b.ward == 'all' ? 'All Pilot Wards' : b.ward,
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey.shade700,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  b.title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  b.message,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade800,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Issued by: ${b.issuedByName} (${b.issuedByRole})',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          if (onDismiss != null)
            GestureDetector(
              onTap: () => onDismiss!(b.id),
              child: Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Icon(
                  Icons.close_rounded,
                  size: 16,
                  color: Colors.grey.shade600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

