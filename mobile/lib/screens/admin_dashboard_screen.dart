import 'package:flutter/material.dart';
import '../models/incident.dart';
import '../models/jurisdiction.dart';
import '../services/api_service.dart';
import '../services/translations.dart';
import '../theme/app_theme.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  List<Incident> _incidents = [];
  HealthScoreData? _health;
  bool _isLoading = true;
  LocalJurisdictionOffice _selectedOffice = localJurisdictionOffices[0];
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ApiService.fetchIncidents(),
        ApiService.fetchHealthScore(),
      ]);
      if (mounted) {
        setState(() {
          _incidents = results[0] as List<Incident>;
          _health = results[1] as HealthScoreData;
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showOfficePickerSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const Text(
                    'Select Local Jurisdiction Office',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                  ),
                  const Text(
                    'Hyperlocal Queue Isolation • 3-Tier Multi-Authority Routing',
                    style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      controller: scrollController,
                      itemCount: localJurisdictionOffices.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final office = localJurisdictionOffices[index];
                        final isSelected = office.id == _selectedOffice.id;

                        Color tierColor = AppTheme.govAshokaBlue;
                        if (office.tier == 'apex_central') tierColor = Colors.indigo;
                        if (office.tier == 'local_society') tierColor = AppTheme.emerald;

                        return InkWell(
                          onTap: () {
                            setState(() => _selectedOffice = office);
                            Navigator.pop(ctx);
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSelected ? tierColor.withValues(alpha: 0.08) : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSelected ? tierColor : AppTheme.borderLight,
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Text(office.icon, style: const TextStyle(fontSize: 22)),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              office.name,
                                              style: TextStyle(
                                                fontSize: 12.5,
                                                fontWeight: FontWeight.bold,
                                                color: isSelected ? tierColor : AppTheme.textDark,
                                              ),
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                            decoration: BoxDecoration(
                                              color: tierColor.withValues(alpha: 0.1),
                                              borderRadius: BorderRadius.circular(3),
                                            ),
                                            child: Text(
                                              office.tierBadge,
                                              style: TextStyle(
                                                fontSize: 8.5,
                                                fontWeight: FontWeight.bold,
                                                color: tierColor,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Territory: ${office.areaLabel}',
                                        style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted),
                                      ),
                                      Text(
                                        'HQ: ${office.office}',
                                        style: TextStyle(fontSize: 9.5, color: Colors.grey.shade600),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  Icon(Icons.check_circle_rounded, color: tierColor, size: 20),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showAtrDialog(Incident incident) {
    String selectedStatus = incident.status;
    String selectedDept = incident.department;
    final noteController = TextEditingController(text: incident.resolutionNote ?? '');
    final officerNameController = TextEditingController(text: incident.assignedOfficer?.name ?? 'Er. S.K. Sharma');
    final officerRoleController = TextEditingController(text: incident.assignedOfficer?.designation ?? 'Junior Engineer (JE)');
    final refController = TextEditingController(text: incident.complaintRef ?? '');

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              title: const Row(
                children: [
                  Icon(Icons.assignment_turned_in_outlined, color: AppTheme.govAshokaBlue, size: 22),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Action Taken Report (ATR) Portal',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            incident.complaintRef ?? 'ANO-PENDING',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, fontFamily: 'monospace', color: AppTheme.govAshokaBlue),
                          ),
                          Text(
                            incident.title,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.textDark),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            '${incident.ward} • ${incident.landmark ?? incident.address}',
                            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    const Text('संबंधित विभाग / Concerned Department:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      initialValue: selectedDept,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Jal Board / Water Works & Sewerage', child: Text('Jal Board / Water Works', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'Power Discom & Street Lighting', child: Text('Power Discom & Lighting', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'PWD Roads & Infrastructure', child: Text('PWD Roads & Infrastructure', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'Solid Waste Management & Sanitation', child: Text('Sanitation & Solid Waste', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'Stray Animal Control & Veterinary', child: Text('Stray Animal Control', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'Municipal Encroachment & Security', child: Text('Encroachment & Security', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'General Municipal Services', child: Text('General Municipal Services', style: TextStyle(fontSize: 11))),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedDept = val);
                      },
                    ),
                    const SizedBox(height: 10),

                    const Text('प्रभारी अभियंता (JE / Field Officer):', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: officerNameController,
                      style: const TextStyle(fontSize: 11),
                      decoration: const InputDecoration(
                        hintText: 'e.g. Er. S.K. Sharma',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                    ),
                    const SizedBox(height: 10),

                    const Text('निवारण स्थिति / Lifecycle Status:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      initialValue: selectedStatus,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'under_review', child: Text('निरीक्षण / Under Review', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'confirmed', child: Text('पुष्टित / Confirmed Hazard', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'action_pending', child: Text('अधिकारी को प्रेषित / Assigned to JE', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'work_in_progress', child: Text('कार्य प्रगति पर / Work In Progress', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'resolved_verified', child: Text('समाधान सत्यापित / Resolved', style: TextStyle(fontSize: 11))),
                        DropdownMenuItem(value: 'closed_unverified', child: Text('निस्तारित / Closed Unverified', style: TextStyle(fontSize: 11))),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedStatus = val);
                      },
                    ),
                    const SizedBox(height: 10),

                    const Text('कार्रवाई विवरण (ATR Remarks):', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: noteController,
                      maxLines: 2,
                      style: const TextStyle(fontSize: 11),
                      decoration: const InputDecoration(
                        hintText: 'उदा. कनिष्ठ अभियंता द्वारा मरम्मत पूर्ण की गई।',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                    ),
                    const SizedBox(height: 10),

                    const Text('शिकायत संदर्भ # (Complaint Ref):', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: refController,
                      style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
                      decoration: const InputDecoration(
                        hintText: 'ANO-2026-XXXX',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('रद्द करें / Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.govAshokaBlue),
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(ctx);
                    try {
                      await ApiService.updateIncidentStatus(
                        incident.id,
                        selectedStatus,
                        resolutionNote: noteController.text.trim().isNotEmpty ? noteController.text.trim() : null,
                        complaintRef: refController.text.trim().isNotEmpty ? refController.text.trim() : null,
                        department: selectedDept,
                        assignedOfficer: {
                          'name': officerNameController.text.trim(),
                          'designation': officerRoleController.text.trim(),
                        },
                        actionTakenReport: {
                          'actionSummary': noteController.text.trim(),
                          'resolvedBy': officerNameController.text.trim(),
                          'completionDate': DateTime.now().toIso8601String(),
                        },
                      );
                      messenger.showSnackBar(
                        const SnackBar(content: Text('कार्रवाई रिपोर्ट (ATR) सफलतापूर्वक अद्यतित!')),
                      );
                      _fetchData();
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text('Update failed: $e')),
                      );
                    }
                  },
                  child: const Text('सुरक्षित करें / Save ATR', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Strict Hyperlocal Isolation Filter
    final isolatedIncidents = _incidents.where((item) {
      if (_selectedOffice.id == 'AUTH-APEX-01') return true;

      final isDirectMatch = item.assignedAuthority?.officeId == _selectedOffice.id;
      if (isDirectMatch) return true;

      final authName = (item.assignedAuthority?.name ?? '').toLowerCase();
      final authOff = (item.assignedAuthority?.office ?? '').toLowerCase();
      if (authName.contains(_selectedOffice.shortName.toLowerCase()) ||
          authOff.contains(_selectedOffice.office.toLowerCase())) {
        return true;
      }

      final corpus = '${item.ward} ${item.address} ${item.landmark ?? ""} ${item.title}'.toLowerCase();
      return _selectedOffice.zoneKeywords.any((kw) => corpus.contains(kw.toLowerCase()));
    }).toList();

    // 2. Status filter
    final filtered = isolatedIncidents.where((item) {
      if (_statusFilter == 'open') {
        return item.status != 'resolved_verified' && item.status != 'closed_unverified';
      }
      if (_statusFilter == 'resolved') {
        return item.status == 'resolved_verified';
      }
      return true;
    }).toList();

    final totalReports = isolatedIncidents.fold<int>(0, (sum, i) => sum + i.reportCount);
    final openCount = isolatedIncidents.where((i) => i.status != 'resolved_verified' && i.status != 'closed_unverified').length;
    final resolvedCount = isolatedIncidents.where((i) => i.status == 'resolved_verified').length;

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: Column(
          children: [
            AppTheme.tricolorStrip(height: 4),
            AppBar(
              title: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('CivicDesk Authority Console', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  Text('Hyperlocal Grievance ATR & Field Operations', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _fetchData,
                  tooltip: 'ताज़ा करें (Refresh)',
                ),
              ],
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Active Local Jurisdiction Office Selector Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.3)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(_selectedOffice.icon, style: const TextStyle(fontSize: 22)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'ACTIVE JURISDICTION OFFICE',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textMuted,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    Text(
                                      _selectedOffice.name,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.govAshokaBlue,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              OutlinedButton.icon(
                                onPressed: _showOfficePickerSheet,
                                icon: const Icon(Icons.swap_horiz_rounded, size: 14),
                                label: const Text('Switch', style: TextStyle(fontSize: 11)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  minimumSize: const Size(60, 30),
                                  side: BorderSide(color: AppTheme.govAshokaBlue.withValues(alpha: 0.4)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  _selectedOffice.tierBadge,
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                                ),
                                const Text(' • ', style: TextStyle(color: AppTheme.textMuted)),
                                Expanded(
                                  child: Text(
                                    _selectedOffice.areaLabel,
                                    style: const TextStyle(fontSize: 10, color: AppTheme.textDark),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Metric cards grid
                    Row(
                      children: [
                        _buildMetricCard('क्षेत्र में शिकायतें', '$totalReports', AppTheme.govAshokaBlue, Icons.layers_rounded),
                        const SizedBox(width: 8),
                        _buildMetricCard('लंबित मामले', '$openCount', Colors.orange.shade800, Icons.warning_amber_rounded),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildMetricCard('निस्तारित (Resolved)', '$resolvedCount', AppTheme.emerald, Icons.check_circle_outline),
                        const SizedBox(width: 8),
                        _buildMetricCard('स्वास्थ्य सूचकांक', '${_health?.score ?? 80}/100', Colors.indigo, Icons.health_and_safety_outlined),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Status Filters Filter Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('All Grievances'),
                            selected: _statusFilter == 'all',
                            onSelected: (val) {
                              if (val) setState(() => _statusFilter = 'all');
                            },
                          ),
                          const SizedBox(width: 6),
                          ChoiceChip(
                            label: Text('Open ($openCount)'),
                            selected: _statusFilter == 'open',
                            onSelected: (val) {
                              if (val) setState(() => _statusFilter = 'open');
                            },
                          ),
                          const SizedBox(width: 6),
                          ChoiceChip(
                            label: Text('Resolved ($resolvedCount)'),
                            selected: _statusFilter == 'resolved',
                            onSelected: (val) {
                              if (val) setState(() => _statusFilter = 'resolved');
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        const Text(
                          'लोक शिकायत निवारण कतार (Grievance Queue)',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        ),
                        const Spacer(),
                        Text(
                          '${filtered.length} मामले',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    if (filtered.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.borderLight),
                        ),
                        child: Center(
                          child: Text(
                            'इस क्षेत्राधिकार कार्यालय (${_selectedOffice.shortName}) में कोई शिकायत नहीं है।',
                            style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final item = filtered[idx];
                          final bool isFallback = item.assignedAuthority?.distanceKm != null && item.assignedAuthority!.distanceKm! > 0;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          item.complaintRef ?? 'ANO-PENDING',
                                          style: const TextStyle(
                                            fontSize: 9.5,
                                            fontFamily: 'monospace',
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.govAshokaBlue,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          item.department,
                                          style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.amber.shade50,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          AppTranslations.statusName(item.status),
                                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.amber.shade900),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),

                                  // Assigned Authority Dispatch Badge
                                  if (item.assignedAuthority != null) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isFallback ? Colors.amber.shade50 : Colors.blue.shade50,
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(
                                          color: isFallback ? Colors.amber.shade200 : Colors.blue.shade100,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Text(item.assignedAuthority!.iconEmoji, style: const TextStyle(fontSize: 10)),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              '${item.assignedAuthority!.name} (${item.assignedAuthority!.tierBadge})',
                                              style: TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w600,
                                                color: isFallback ? Colors.amber.shade900 : AppTheme.govAshokaBlue,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          if (isFallback)
                                            Text(
                                              '⚡ Fallback ${item.assignedAuthority!.distanceKm}km',
                                              style: TextStyle(
                                                fontSize: 8.5,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.amber.shade900,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                  ],

                                  Text(
                                    item.title,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${item.ward} • ${item.landmark ?? item.address} (${item.reportCount} नागरिक)',
                                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                  ),
                                  if (item.assignedOfficer != null) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'प्रभारी JE: ${item.assignedOfficer!.name} (${item.assignedOfficer!.designation})',
                                      style: const TextStyle(fontSize: 10, color: AppTheme.govAshokaBlue, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                  const SizedBox(height: 6),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.govAshokaBlue,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        minimumSize: const Size(80, 30),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                      ),
                                      onPressed: () => _showAtrDialog(item),
                                      icon: const Icon(Icons.edit_note, size: 14),
                                      label: const Text('कार्रवाई / ATR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMetricCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
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
                Expanded(child: Text(label, style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted, fontWeight: FontWeight.w600))),
                Icon(icon, size: 16, color: color),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }
}
