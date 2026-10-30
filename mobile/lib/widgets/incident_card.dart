import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
import '../services/translations.dart';
import '../theme/app_theme.dart';

class IncidentCard extends StatelessWidget {
  final Incident incident;
  final VoidCallback onTap;
  final VoidCallback onUpvote;

  const IncidentCard({
    super.key,
    required this.incident,
    required this.onTap,
    required this.onUpvote,
  });

  String _formatTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('dd MMM').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final catColor = AppTheme.getCategoryColor(incident.category);
    final catIcon = AppTheme.getCategoryIcon(incident.category);
    final isCluster = incident.reportCount > 1;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Accent Ribbon
            Container(
              height: 3,
              decoration: BoxDecoration(
                color: incident.status == 'resolved_verified'
                    ? AppTheme.emerald
                    : incident.status == 'reopened'
                        ? AppTheme.severityCritical
                        : AppTheme.govAshokaBlue,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Row 1: Tracking ID Badge & Department & Status
                  Row(
                    children: [
                      // Tracking Reference
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Text(
                          incident.complaintRef ?? 'MCD-2026-PENDING',
                          style: const TextStyle(
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            color: AppTheme.govAshokaBlue,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),

                      // Category icon pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: catColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(catIcon, size: 12, color: catColor),
                            const SizedBox(width: 3),
                            Text(
                              incident.category.replaceAll('_', ' ').toUpperCase(),
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: catColor,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Spacer(),

                      // Status Badge
                      _buildStatusChip(incident.status),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Row 2: Department Line
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.govAshokaBlue.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.15)),
                    ),
                    child: Text(
                      '🏛️ ${incident.department}',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.govAshokaBlue,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Assigned Local Authority Dispatch Box
                  if (incident.assignedAuthority != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Row(
                        children: [
                          Text(
                            incident.assignedAuthority!.iconEmoji,
                            style: const TextStyle(fontSize: 11),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '${incident.assignedAuthority!.name} (${incident.assignedAuthority!.tierBadge})',
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.govAshokaBlue,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (incident.assignedAuthority!.distanceKm != null &&
                              incident.assignedAuthority!.distanceKm! > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                              decoration: BoxDecoration(
                                color: Colors.amber.shade100,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: Text(
                                '⚡ Fallback ${incident.assignedAuthority!.distanceKm}km',
                                style: TextStyle(
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.amber.shade900,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                  ],

                  // Row 3: Title & Description
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              incident.title,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textDark,
                                height: 1.25,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              incident.description,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.textMuted,
                                height: 1.3,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (incident.media.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.network(
                            ApiService.formatMediaUrl(incident.media.first),
                            width: 52,
                            height: 52,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Assigned JE Note (if available)
                  if (incident.assignedOfficer != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.engineering_outlined, size: 13, color: AppTheme.govAshokaBlue),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              'अधिकारी / JE: ${incident.assignedOfficer!.name} (${incident.assignedOfficer!.designation})',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.govAshokaBlue,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  const Divider(height: 1, color: AppTheme.borderLight),
                  const SizedBox(height: 8),

                  // Bottom Row: Ward / Landmark, reports, upvote & time
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 12, color: AppTheme.textMuted),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          '${incident.ward} • ${incident.landmark ?? incident.address}',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),

                      // Grouped citizen reports
                      if (isCluster)
                        Container(
                          margin: const EdgeInsets.only(right: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text(
                            '${incident.reportCount} नागरिक',
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.govAshokaBlue,
                            ),
                          ),
                        ),

                      // Upvote Button
                      InkWell(
                        onTap: onUpvote,
                        borderRadius: BorderRadius.circular(4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.thumb_up_alt_rounded, size: 11, color: AppTheme.govAshokaBlue),
                              const SizedBox(width: 3),
                              Text(
                                '${incident.upvotes}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.govAshokaBlue,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),

                      // Comments count badge
                      if (incident.comments.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: Colors.grey.shade300),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.chat_bubble_outline_rounded, size: 10, color: Colors.grey),
                              const SizedBox(width: 2.5),
                              Text(
                                '${incident.comments.length}',
                                style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.black87),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],

                      // Time
                      Text(
                        _formatTimeAgo(incident.createdAt),
                        style: const TextStyle(
                          fontSize: 9,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bg = Colors.grey.shade100;
    Color text = Colors.grey.shade700;
    String label = AppTranslations.statusName(status);

    switch (status) {
      case 'reported':
        bg = Colors.amber.shade50;
        text = Colors.amber.shade900;
        break;
      case 'under_review':
        bg = Colors.purple.shade50;
        text = Colors.purple.shade800;
        break;
      case 'confirmed':
        bg = Colors.blue.shade50;
        text = Colors.blue.shade800;
        break;
      case 'action_pending':
      case 'work_in_progress':
        bg = Colors.orange.shade50;
        text = Colors.orange.shade900;
        break;
      case 'resolved_verified':
        bg = AppTheme.emeraldLight;
        text = AppTheme.emeraldDark;
        break;
      case 'reopened':
        bg = Colors.red.shade50;
        text = Colors.red.shade800;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.bold,
          color: text,
        ),
      ),
    );
  }
}
