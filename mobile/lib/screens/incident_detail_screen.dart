import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class IncidentDetailScreen extends StatefulWidget {
  final String incidentId;
  final Incident? initialIncident;

  const IncidentDetailScreen({
    super.key,
    required this.incidentId,
    this.initialIncident,
  });

  @override
  State<IncidentDetailScreen> createState() => _IncidentDetailScreenState();
}

class _IncidentDetailScreenState extends State<IncidentDetailScreen> {
  late Incident? _incident;
  bool _isLoading = false;
  bool _isUpvoting = false;
  bool _hasUpvoted = false;

  @override
  void initState() {
    super.initState();
    _incident = widget.initialIncident;
    _loadFullDetails();
  }

  Future<void> _loadFullDetails() async {
    setState(() => _isLoading = true);
    try {
      final full = await ApiService.fetchIncidentById(widget.incidentId);
      if (mounted) {
        setState(() => _incident = full);
      }
    } catch (e) {
      // Keep initial if available
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleUpvote() async {
    if (_hasUpvoted || _incident == null) return;

    setState(() => _isUpvoting = true);
    try {
      final res = await ApiService.upvoteIncident(_incident!.id);
      final int newUpvotes = res['data']?['upvotes'] ?? (_incident!.upvotes + 1);
      final String newStatus = res['data']?['status'] ?? _incident!.status;

      setState(() {
        _hasUpvoted = true;
        _incident = Incident(
          id: _incident!.id,
          title: _incident!.title,
          category: _incident!.category,
          description: _incident!.description,
          status: newStatus,
          severity: _incident!.severity,
          location: _incident!.location,
          address: _incident!.address,
          media: _incident!.media,
          reportCount: _incident!.reportCount,
          upvotes: newUpvotes,
          reports: _incident!.reports,
          createdAt: _incident!.createdAt,
        );
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Upvote recorded! Community credibility updated.'),
          backgroundColor: AppTheme.emerald,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to upvote: $e')),
      );
    } finally {
      if (mounted) setState(() => _isUpvoting = false);
    }
  }

  void _handleShare() {
    if (_incident == null) return;
    final text =
        '🚨 [HyperNet Alert] ${AppTheme.getCategoryName(_incident!.category)}: ${_incident!.title} at ${_incident!.address}. Status: ${_incident!.status}. Verify on community map!';
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Incident alert copied to clipboard!')),
    );
  }

  void _showFlagDialog() {
    if (_incident == null) return;
    String selectedReason = 'False Alarm / Hazard Does Not Exist';
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.report_problem_outlined, color: AppTheme.severityHigh),
              SizedBox(width: 8),
              Text('Report to Moderation', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Flag suspicious, inaccurate, or outdated incidents for society RWA review.',
                style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: selectedReason,
                isExpanded: true,
                style: const TextStyle(fontSize: 12, color: AppTheme.textDark),
                items: const [
                  DropdownMenuItem(
                    value: 'False Alarm / Hazard Does Not Exist',
                    child: Text('False Alarm / Does Not Exist', style: TextStyle(fontSize: 11)),
                  ),
                  DropdownMenuItem(
                    value: 'Resolved Already / Outdated',
                    child: Text('Resolved Already / Outdated', style: TextStyle(fontSize: 11)),
                  ),
                  DropdownMenuItem(
                    value: 'Duplicate Photo / Reused Media',
                    child: Text('Duplicate / Reused Photo', style: TextStyle(fontSize: 11)),
                  ),
                  DropdownMenuItem(
                    value: 'Spam or Inappropriate Content',
                    child: Text('Spam or Inappropriate', style: TextStyle(fontSize: 11)),
                  ),
                ],
                onChanged: (val) {
                  if (val != null) setDlgState(() => selectedReason = val);
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.severityHigh),
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await ApiService.flagIncident(_incident!.id, selectedReason);
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Moderation flag submitted to RWA')),
                  );
                } catch (e) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed: $e')),
                  );
                }
              },
              child: const Text('Submit Flag'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_incident == null && _isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Incident Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_incident == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Incident Details')),
        body: const Center(child: Text('Incident could not be loaded.')),
      );
    }

    final inc = _incident!;
    final catColor = AppTheme.getCategoryColor(inc.category);
    final catIcon = AppTheme.getCategoryIcon(inc.category);
    final isVerified = inc.upvotes >= 3;
    final isResolved = inc.status == 'resolved_verified';

    return Scaffold(
      appBar: AppBar(
        title: Text(AppTheme.getCategoryName(inc.category)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: _handleShare,
            tooltip: 'Share alert',
          ),
          IconButton(
            icon: const Icon(Icons.flag_outlined, color: AppTheme.severityHigh),
            onPressed: _showFlagDialog,
            tooltip: 'Report issue to moderation',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category & Verification Tags
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: catColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(catIcon, size: 14, color: catColor),
                      const SizedBox(width: 4),
                      Text(
                        AppTheme.getCategoryName(inc.category).toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: catColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                if (isVerified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.emeraldLight,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppTheme.emerald),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle, size: 12, color: AppTheme.emerald),
                        SizedBox(width: 4),
                        Text(
                          'Community Verified',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.emeraldDark,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Title
            Text(
              inc.title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
                height: 1.25,
              ),
            ),
            const SizedBox(height: 8),

            // Location & Date
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    inc.address,
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ),
                Text(
                  DateFormat('dd MMM, hh:mm a').format(inc.createdAt),
                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Verified Resolution Banner if Resolved
            if (isResolved)
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.emeraldLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.emerald),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.verified_rounded, color: AppTheme.emerald, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'Verified Resolution Completed',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.emeraldDark,
                                    ),
                                  ),
                                  if (inc.complaintRef != null) ...[
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.emerald.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'Ref #${inc.complaintRef}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.emeraldDark,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'This hazard has been inspected and rectified by the Society Maintenance & RWA team.',
                                style: TextStyle(fontSize: 11, color: AppTheme.emeraldDark),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (inc.resolutionMedia.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      const Divider(height: 1, color: AppTheme.emerald),
                      const SizedBox(height: 8),
                      const Text(
                        'Before & After Resolution Proof',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.emeraldDark,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'BEFORE (HAZARD)',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.severityCritical,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  height: 90,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: AppTheme.severityCritical.withValues(alpha: 0.5),
                                    ),
                                    image: inc.media.isNotEmpty
                                        ? DecorationImage(
                                            image: NetworkImage(inc.media.first),
                                            fit: BoxFit.cover,
                                          )
                                        : null,
                                    color: Colors.grey.shade200,
                                  ),
                                  child: inc.media.isEmpty
                                      ? const Center(child: Text('No initial photo', style: TextStyle(fontSize: 9)))
                                      : null,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'AFTER (RESOLVED)',
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.emerald),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  height: 90,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: AppTheme.emerald),
                                    image: DecorationImage(
                                      image: NetworkImage(inc.resolutionMedia.first),
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

            // Photos if any
            if (inc.media.isNotEmpty) ...[
              const Text(
                'Photo Evidence',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 120,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: inc.media.length,
                  itemBuilder: (context, idx) {
                    return Container(
                      width: 140,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.borderLight),
                        image: DecorationImage(
                          image: NetworkImage(inc.media[idx]),
                          fit: BoxFit.cover,
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Description / Summary
            const Text(
              'Incident Summary',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
            ),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Text(
                inc.description,
                style: const TextStyle(fontSize: 13, color: AppTheme.textDark, height: 1.4),
              ),
            ),
            const SizedBox(height: 18),

            // Clustered Resident Reports Timeline (Bonus Twist 1)
            Row(
              children: [
                const Icon(Icons.layers_rounded, size: 16, color: AppTheme.primaryBlue),
                const SizedBox(width: 6),
                Text(
                  'Clustered Citizen Reports (${inc.reportCount})',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
                  ),
                ),
                const Spacer(),
                if (inc.reportCount > 1)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Auto-Clustered',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            if (inc.reports.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: const Text(
                  'Initial citizen report logged for this incident.',
                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: inc.reports.length,
                itemBuilder: (context, idx) {
                  final rep = inc.reports[idx];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.person_outline, size: 13, color: AppTheme.primaryBlue),
                            const SizedBox(width: 4),
                            Text(
                              rep.reporterName ?? 'Resident',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textDark,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              DateFormat('hh:mm a, dd MMM').format(rep.createdAt),
                              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          rep.description,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        ),
                        if (rep.address != null && rep.address!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            '📍 ${rep.address}',
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),

            const SizedBox(height: 24),

            // Upvote / Verify Action Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _hasUpvoted || _isUpvoting ? null : _handleUpvote,
                icon: _isUpvoting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Icon(
                        _hasUpvoted ? Icons.check : Icons.thumb_up_alt_rounded,
                        size: 18,
                      ),
                label: Text(
                  _hasUpvoted
                      ? 'Verified by You (${inc.upvotes})'
                      : 'Upvote & Verify Hazard (${inc.upvotes})',
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _hasUpvoted ? AppTheme.emerald : AppTheme.primaryBlue,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
