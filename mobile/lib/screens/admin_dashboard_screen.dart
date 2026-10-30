import 'package:flutter/material.dart';
import '../models/incident.dart';
import '../services/api_service.dart';
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

  void _showStatusDialog(Incident incident) {
    String selectedStatus = incident.status;
    final noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Update Incident Status', style: TextStyle(fontSize: 16)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      incident.title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    const Text('Lifecycle Status:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: selectedStatus,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'under_review', child: Text('Under Review', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'confirmed', child: Text('Confirmed Hazard', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'action_pending', child: Text('Action Pending (Dispatched)', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'resolved_verified', child: Text('Resolved - Verified', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'closed_unverified', child: Text('Closed - Unverified', style: TextStyle(fontSize: 12))),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => selectedStatus = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    const Text('RWA Note (Optional):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: noteController,
                      decoration: const InputDecoration(
                        hintText: 'e.g. Electrician Sharma fixed fuse',
                        hintStyle: TextStyle(fontSize: 11),
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
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final messenger = ScaffoldMessenger.of(context);
                    Navigator.pop(ctx);
                    try {
                      await ApiService.updateIncidentStatus(
                        incident.id,
                        selectedStatus,
                        resolutionNote: noteController.text.trim().isNotEmpty ? noteController.text.trim() : null,
                      );
                      messenger.showSnackBar(
                        const SnackBar(content: Text('Incident status updated!')),
                      );
                      _fetchData();
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text('Update failed: $e')),
                      );
                    }
                  },
                  child: const Text('Save'),
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
    final totalReports = _incidents.fold<int>(0, (sum, i) => sum + i.reportCount);
    final openCount = _incidents.where((i) => i.status != 'resolved_verified' && i.status != 'closed_unverified').length;
    final resolvedCount = _incidents.where((i) => i.status == 'resolved_verified').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('RWA Operations Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchData,
          ),
        ],
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
                    // Metric cards grid
                    Row(
                      children: [
                        _buildMetricCard('Total Reports', '$totalReports', AppTheme.primaryBlue, Icons.layers_rounded),
                        const SizedBox(width: 8),
                        _buildMetricCard('Open Hazards', '$openCount', Colors.orange, Icons.warning_amber_rounded),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildMetricCard('Resolved', '$resolvedCount', AppTheme.emerald, Icons.check_circle_outline),
                        const SizedBox(width: 8),
                        _buildMetricCard('Health Score', '${_health?.score ?? 80}/100', Colors.indigo, Icons.health_and_safety_outlined),
                      ],
                    ),
                    const SizedBox(height: 18),

                    const Text(
                      'Incident Management Queue',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                    ),
                    const SizedBox(height: 8),

                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _incidents.length,
                      itemBuilder: (context, idx) {
                        final item = _incidents[idx];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: Icon(
                              AppTheme.getCategoryIcon(item.category),
                              color: AppTheme.getCategoryColor(item.category),
                            ),
                            title: Text(
                              item.title,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Text(
                              '${item.address} • ${item.reportCount} reports',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                            trailing: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                minimumSize: const Size(60, 30),
                              ),
                              onPressed: () => _showStatusDialog(item),
                              child: const Text('Status', style: TextStyle(fontSize: 11)),
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
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                const Spacer(),
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
