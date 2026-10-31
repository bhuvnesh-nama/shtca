import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
import '../services/translations.dart';
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
  bool _isSubmittingComment = false;
  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _incident = widget.initialIncident;
    _loadFullDetails();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
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
        _incident = _incident!.copyWith(
          upvotes: newUpvotes,
          status: newStatus,
        );
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('नागरिक समर्थन दर्ज! (Upvote recorded)'),
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

  Future<void> _handleSubmitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty || _incident == null || _isSubmittingComment) return;

    setState(() => _isSubmittingComment = true);
    try {
      await ApiService.addComment(
        _incident!.id,
        text,
        author: 'Citizen Ground Rep',
        role: 'Resident Complainant',
      );
      _commentController.clear();
      await _loadFullDetails();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ground comment recorded successfully!'),
          backgroundColor: AppTheme.emerald,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit comment: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSubmittingComment = false);
    }
  }

  void _handleShare() {
    if (_incident == null) return;
    final text =
        '🏛️ [नागरिक शिकायत / Civic Grievance] ${_incident!.complaintRef ?? ''}\nविभाग: ${_incident!.department}\nविषय: ${_incident!.title}\nस्थल: ${_incident!.landmark ?? _incident!.address}\nस्थिति: ${AppTranslations.statusName(_incident!.status)}';
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Grievance details copied to clipboard!')),
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
              Text('नगर निगम समीक्षा हेतु फ्लैग करें', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'अनुचित अथवा भ्रामक शिकायत को नगर निगम निगरानी सेल को प्रेषित करें।',
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
                    child: Text('निराधार / शिकायत स्थल पर समस्या नहीं', style: TextStyle(fontSize: 11)),
                  ),
                  DropdownMenuItem(
                    value: 'Resolved Already / Outdated',
                    child: Text('पूर्व में निस्तारित / अप्रासंगिक', style: TextStyle(fontSize: 11)),
                  ),
                  DropdownMenuItem(
                    value: 'Duplicate Photo / Reused Media',
                    child: Text('डुप्लिकेट फोटो / पुरानी तस्वीर', style: TextStyle(fontSize: 11)),
                  ),
                  DropdownMenuItem(
                    value: 'Spam or Inappropriate Content',
                    child: Text('अनुचित सामग्री / स्पैम', style: TextStyle(fontSize: 11)),
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
              child: const Text('रद्द करें'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.severityHigh),
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await ApiService.flagIncident(_incident!.id, selectedReason);
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('फ्लैग नगर निगम निगरानी कक्ष को प्रेषित')),
                  );
                } catch (e) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed: $e')),
                  );
                }
              },
              child: const Text('फ्लैग दर्ज करें'),
            ),
          ],
        ),
      ),
    );
  }

  void _showReopenDialog() {
    if (_incident == null) return;
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('शिकायत पुनः खोलें / Re-Open Grievance', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'यदि समस्या का पूर्ण समाधान नहीं हुआ है, तो पुनः खोलने का कारण दर्ज करें:',
              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: reasonController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'उदा. पाइपलाइन से अभी भी जल रिसाव हो रहा है...',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.all(8),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('रद्द करें')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.severityHigh),
            onPressed: () async {
              if (reasonController.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                await ApiService.reopenIncident(_incident!.id, reasonController.text.trim());
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('शिकायत पुनः खोली गई एवं कनिष्ठ अभियंता को प्रेषित की गई')),
                );
                _loadFullDetails();
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed: $e')),
                );
              }
            },
            child: const Text('पुनः खोलें / Reopen', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_incident == null && _isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('शिकायत विवरण')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_incident == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('शिकायत विवरण')),
        body: const Center(child: Text('Grievance could not be loaded.')),
      );
    }

    final inc = _incident!;
    final catColor = AppTheme.getCategoryColor(inc.category);
    final catIcon = AppTheme.getCategoryIcon(inc.category);
    final isResolved = inc.status == 'resolved_verified';

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: Column(
          children: [
            AppTheme.tricolorStrip(height: 4),
            AppBar(
              title: Text(
                inc.complaintRef ?? 'लोक शिकायत विवरण',
                style: const TextStyle(fontSize: 14, fontFamily: 'monospace', fontWeight: FontWeight.bold),
              ),
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
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tracking Reference Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.govAshokaBlue,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.receipt_long, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'लोक शिकायत संदर्भ संख्या (Tracking Ref #)',
                          style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                        ),
                        SelectableText(
                          inc.complaintRef ?? 'MCD-2026-PENDING',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                            color: AppTheme.govAshokaBlue,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy, size: 16, color: AppTheme.govAshokaBlue),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: inc.complaintRef ?? ''));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Tracking number copied!')),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Department & Category Tags
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    '🏛️ ${inc.department}',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: catColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(catIcon, size: 13, color: catColor),
                      const SizedBox(width: 4),
                      Text(
                        AppTheme.getCategoryName(inc.category),
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: catColor),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.amber.shade300),
                  ),
                  child: Text(
                    AppTranslations.statusName(inc.status),
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber.shade900),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Title
            Text(
              inc.title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
                height: 1.25,
              ),
            ),
            const SizedBox(height: 8),

            // Ward & Landmark
            Container(
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
                      const Icon(Icons.location_city, size: 14, color: AppTheme.govAshokaBlue),
                      const SizedBox(width: 6),
                      Text(
                        'वार्ड: ${inc.ward}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.place_outlined, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'स्थल: ${inc.landmark ?? inc.address} ${inc.pincode != null ? '(PIN: ${inc.pincode})' : ''}',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.schedule, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 6),
                      Text(
                        'दर्ज दिनांक: ${DateFormat('dd MMM yyyy, hh:mm a').format(inc.createdAt)}',
                        style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Nearest Authority Spatial Dispatch Card
            if (inc.assignedAuthority != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderLight),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          inc.assignedAuthority!.iconEmoji,
                          style: const TextStyle(fontSize: 18),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'ASSIGNED LOCAL AUTHORITY (क्षेत्राधिकार कार्यालय)',
                                style: TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textMuted,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              Text(
                                inc.assignedAuthority!.name,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.govAshokaBlue,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.govAshokaBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            inc.assignedAuthority!.tierBadge,
                            style: const TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.govAshokaBlue,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: inc.assignedAuthority!.distanceKm != null && inc.assignedAuthority!.distanceKm! > 0
                            ? Colors.amber.shade50
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: inc.assignedAuthority!.distanceKm != null && inc.assignedAuthority!.distanceKm! > 0
                              ? Colors.amber.shade200
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                inc.assignedAuthority!.distanceKm != null && inc.assignedAuthority!.distanceKm! > 0
                                    ? Icons.alt_route_rounded
                                    : Icons.verified_user_rounded,
                                size: 14,
                                color: inc.assignedAuthority!.distanceKm != null && inc.assignedAuthority!.distanceKm! > 0
                                    ? Colors.amber.shade900
                                    : AppTheme.govAshokaBlue,
                              ),
                              const SizedBox(width: 5),
                              Expanded(
                                child: Text(
                                  inc.assignedAuthority!.distanceKm != null && inc.assignedAuthority!.distanceKm! > 0
                                      ? '⚡ Fallback Nearest Office Dispatch (${inc.assignedAuthority!.distanceKm!.toStringAsFixed(1)} km away)'
                                      : '🎯 Hyperlocal Direct Allocation (Local Territory)',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.bold,
                                    color: inc.assignedAuthority!.distanceKm != null && inc.assignedAuthority!.distanceKm! > 0
                                        ? Colors.amber.shade900
                                        : AppTheme.govAshokaBlue,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            inc.assignedAuthority!.routingReason,
                            style: TextStyle(
                              fontSize: 10,
                              color: inc.assignedAuthority!.distanceKm != null && inc.assignedAuthority!.distanceKm! > 0
                                  ? Colors.amber.shade900
                                  : AppTheme.textMuted,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'HQ: ${inc.assignedAuthority!.office}${inc.assignedAuthority!.contactNumber != null ? ' • ☎ ${inc.assignedAuthority!.contactNumber}' : ''}',
                            style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Assigned Junior Engineer Card (if available)
            if (inc.assignedOfficer != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.engineering_outlined, color: AppTheme.govAshokaBlue, size: 24),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('आवंटित कनिष्ठ अभियंता / Assigned Officer:', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                          Text(
                            inc.assignedOfficer!.name,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                          ),
                          Text(
                            inc.assignedOfficer!.designation,
                            style: const TextStyle(fontSize: 11, color: AppTheme.textDark),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Action Taken Report (ATR) Card if Resolved
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
                    const Row(
                      children: [
                        Icon(Icons.verified_rounded, color: AppTheme.emerald, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'नगर निगम कार्रवाई रिपोर्ट (Action Taken Report - ATR)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.emeraldDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      inc.resolutionNote ?? inc.actionTakenReport?.actionSummary ?? 'कनिष्ठ अभियंता द्वारा कार्य पूर्ण कर लिया गया है।',
                      style: const TextStyle(fontSize: 11.5, color: AppTheme.emeraldDark, height: 1.3),
                    ),
                    if (inc.resolutionMedia.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      const Divider(height: 1, color: AppTheme.emerald),
                      const SizedBox(height: 8),
                      const Text(
                        'समाधान पूर्व एवं पश्चात साक्ष्य फोटो (Before & After Fix Proof):',
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppTheme.emeraldDark),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('BEFORE (शिकायत)', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.severityCritical)),
                                const SizedBox(height: 4),
                                Container(
                                  height: 85,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: AppTheme.severityCritical.withValues(alpha: 0.5)),
                                    image: inc.media.isNotEmpty
                                        ? DecorationImage(image: NetworkImage(ApiService.formatMediaUrl(inc.media.first)), fit: BoxFit.cover)
                                        : null,
                                    color: Colors.grey.shade200,
                                  ),
                                  child: inc.media.isEmpty
                                      ? const Center(child: Text('No photo', style: TextStyle(fontSize: 9)))
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
                                const Text('AFTER (समाधान)', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.emerald)),
                                const SizedBox(height: 4),
                                Container(
                                  height: 85,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: AppTheme.emerald),
                                    image: DecorationImage(
                                      image: NetworkImage(ApiService.formatMediaUrl(inc.resolutionMedia.first)),
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
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: _showReopenDialog,
                        icon: const Icon(Icons.replay, size: 14, color: AppTheme.severityCritical),
                        label: const Text(
                          'असंतोषजनक समाधान? पुनः खोलें (Reopen)',
                          style: TextStyle(fontSize: 10.5, color: AppTheme.severityCritical, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Photos if any
            if (inc.media.isNotEmpty) ...[
              const Text(
                'स्थल साक्ष्य फोटो / Evidence Photos',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 110,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: inc.media.length,
                  itemBuilder: (context, idx) {
                    return Container(
                      width: 130,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.borderLight),
                        image: DecorationImage(
                          image: NetworkImage(ApiService.formatMediaUrl(inc.media[idx])),
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
              'शिकायत विवरण / Grievance Details',
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
                style: const TextStyle(fontSize: 12.5, color: AppTheme.textDark, height: 1.4),
              ),
            ),
            const SizedBox(height: 18),

            // Linked Resident Reports
            Row(
              children: [
                const Icon(Icons.people_outline, size: 16, color: AppTheme.govAshokaBlue),
                const SizedBox(width: 6),
                Text(
                  'नागरिक समर्थन एवं पुष्टियां (${inc.reportCount})',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
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
                  'प्रारंभिक नागरिक शिकायत दर्ज।',
                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
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
                            const Icon(Icons.person_pin, size: 13, color: AppTheme.govAshokaBlue),
                            const SizedBox(width: 4),
                            Text(
                              rep.reporterName ?? 'Citizen',
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
                          style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  );
                },
              ),

            const SizedBox(height: 20),

            // Ground Comments & Field Activity
            Row(
              children: [
                const Icon(Icons.forum_outlined, size: 16, color: AppTheme.govAshokaBlue),
                const SizedBox(width: 6),
                Text(
                  'Ground Logs & Citizen Comments (${inc.comments.length})',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (inc.comments.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: const Text(
                  'No ground logs yet. Citizens or field inspectors can post real-time updates below.',
                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: inc.comments.length,
                itemBuilder: (context, idx) {
                  final c = inc.comments[idx];
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
                            const Icon(Icons.person, size: 13, color: AppTheme.govAshokaBlue),
                            const SizedBox(width: 4),
                            Text(
                              c.author,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textDark,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: Text(
                                c.role,
                                style: const TextStyle(fontSize: 9, color: AppTheme.govAshokaBlue, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const Spacer(),
                            Text(
                              DateFormat('hh:mm a, dd MMM').format(c.createdAt),
                              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          c.message,
                          style: const TextStyle(fontSize: 11.5, color: AppTheme.textDark),
                        ),
                      ],
                    ),
                  );
                },
              ),

            const SizedBox(height: 8),

            // Add Comment Input Box
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      style: const TextStyle(fontSize: 12),
                      decoration: const InputDecoration(
                        hintText: 'Type field update or comment...',
                        hintStyle: TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      ),
                      onSubmitted: (_) => _handleSubmitComment(),
                    ),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    onPressed: _isSubmittingComment ? null : _handleSubmitComment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.govAshokaBlue,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      minimumSize: const Size(60, 34),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    child: _isSubmittingComment
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text(
                            'Add',
                            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                  ),
                ],
              ),
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
                    ? 'नागरिक समर्थन दिया गया (${inc.upvotes})'
                    : 'शिकायत का समर्थन करें / Upvote (${inc.upvotes})',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _hasUpvoted ? AppTheme.emerald : AppTheme.govAshokaBlue,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
