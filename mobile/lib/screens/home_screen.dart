import 'package:flutter/material.dart';
import '../models/incident.dart';
import '../models/broadcast.dart';
import '../services/api_service.dart';
import '../services/translations.dart';
import '../theme/app_theme.dart';
import '../widgets/health_score_card.dart';
import '../widgets/incident_card.dart';
import '../widgets/emergency_broadcast_banner.dart';
import 'report_incident_screen.dart';
import 'incident_detail_screen.dart';
import 'demo_simulator_sheet.dart';
import 'admin_dashboard_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Incident> _incidents = [];
  HealthScoreData? _healthScore;
  List<EmergencyBroadcast> _broadcasts = [];
  bool _isLoading = true;

  String _selectedCategory = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, String>> _categories = [
    {'id': 'all', 'name': 'All Issues'},
    {'id': 'power_cut', 'name': 'Power Cut'},
    {'id': 'water_issue', 'name': 'Water Supply'},
    {'id': 'theft_security', 'name': 'Security'},
    {'id': 'stray_animals', 'name': 'Stray Animals'},
    {'id': 'road_hazard', 'name': 'Road Hazard'},
    {'id': 'sanitation', 'name': 'Sanitation'},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ApiService.fetchIncidents(
          category: _selectedCategory != 'all' ? _selectedCategory : null,
          search: _searchQuery.isNotEmpty ? _searchQuery : null,
        ),
        ApiService.fetchHealthScore(),
        ApiService.fetchBroadcasts(),
      ]);

      if (mounted) {
        setState(() {
          _incidents = results[0] as List<Incident>;
          _healthScore = results[1] as HealthScoreData;
          _broadcasts = results[2] as List<EmergencyBroadcast>;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load feed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleUpvote(Incident inc) async {
    try {
      final res = await ApiService.upvoteIncident(inc.id);
      final int newUpvotes = res['data']?['upvotes'] ?? (inc.upvotes + 1);
      final String newStatus = res['data']?['status'] ?? inc.status;

      setState(() {
        _incidents = _incidents.map((i) {
          if (i.id == inc.id) {
            return Incident(
              id: i.id,
              title: i.title,
              category: i.category,
              description: i.description,
              status: newStatus,
              severity: i.severity,
              location: i.location,
              address: i.address,
              media: i.media,
              reportCount: i.reportCount,
              upvotes: newUpvotes,
              reports: i.reports,
              createdAt: i.createdAt,
            );
          }
          return i;
        }).toList();
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Upvote recorded! Community credibility updated.'),
          duration: Duration(seconds: 2),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upvote failed: $e')),
      );
    }
  }

  void _openDemoLab() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DemoSimulatorSheet(
        onActionCompleted: _loadData,
      ),
    );
  }

  void _triggerSosEmergency() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.warning_rounded, color: Colors.red, size: 24),
            const SizedBox(width: 8),
            Text(
              AppTranslations.get('emergency_sos'),
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to trigger an immediate Emergency Panic Beacon? '
          'This will notify on-ground security guards and nearby residents.',
          style: TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ApiService.triggerSos(
                  lat: 28.6304,
                  lng: 77.2177,
                  address: 'Resident Vicinity (Mobile Beacon)',
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      backgroundColor: Colors.red,
                      content: Text('🚨 SOS Panic Beacon broadcasted to entire community!'),
                    ),
                  );
                  _loadData();
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to trigger SOS: $e')),
                  );
                }
              }
            },
            child: const Text('CONFIRM SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: AppTranslations.isHindi,
      builder: (context, isHindi, _) {
        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.shield_rounded, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppTranslations.get('app_name'),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      AppTranslations.get('app_subtitle'),
                      style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              // Language Switcher Toggle
              GestureDetector(
                onTap: AppTranslations.toggleLanguage,
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 2),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withAlpha(20),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.primaryBlue.withAlpha(50)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.language, size: 13, color: AppTheme.primaryBlue),
                      const SizedBox(width: 3),
                      Text(
                        isHindi ? 'EN' : 'हिन्दी',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryBlue,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Emergency SOS Panic Button
              IconButton(
                icon: const Icon(Icons.emergency_rounded, color: Colors.red),
                onPressed: _triggerSosEmergency,
                tooltip: AppTranslations.get('emergency_sos'),
              ),
              // Demo Lab Button for Hackathon Judges
              IconButton(
                icon: const Icon(Icons.science_outlined, color: Colors.indigo),
                onPressed: _openDemoLab,
                tooltip: 'Hackathon Demo Lab',
              ),
              // Admin Dashboard shortcut
              IconButton(
                icon: const Icon(Icons.admin_panel_settings_outlined, color: AppTheme.primaryBlue),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
                  );
                },
                tooltip: 'RWA Dashboard',
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Phase 10: Official Emergency Broadcast Banner
                  if (_broadcasts.isNotEmpty)
                    EmergencyBroadcastBanner(
                      broadcasts: _broadcasts,
                      onDismiss: (id) => setState(() => _broadcasts.removeWhere((b) => b.id == id)),
                    ),

                  // Bonus Twist 2: Neighbourhood Health Score Widget
                  HealthScoreCard(
                    data: _healthScore,
                    isLoading: _isLoading && _healthScore == null,
                    onRefresh: _loadData,
                  ),

                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: isHindi
                            ? 'समस्या, ब्लॉक या लैंडमार्क खोजें...'
                            : 'Search hazard, block or landmark...',
                        hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: AppTheme.borderLight),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: AppTheme.borderLight),
                        ),
                      ),
                      onChanged: (val) {
                        setState(() => _searchQuery = val);
                        _loadData();
                      },
                    ),
                  ),

                  // Horizontal Category Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: _categories.map((cat) {
                        final isSelected = _selectedCategory == cat['id'];
                        final label = cat['id'] == 'all'
                            ? AppTranslations.get('all_issues')
                            : AppTranslations.categoryName(cat['id']!);
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(
                              label,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected ? Colors.white : AppTheme.textDark,
                              ),
                            ),
                            selected: isSelected,
                            selectedColor: AppTheme.primaryBlue,
                            backgroundColor: Colors.white,
                            checkmarkColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: BorderSide(
                                color: isSelected ? AppTheme.primaryBlue : AppTheme.borderLight,
                              ),
                            ),
                            onSelected: (_) {
                              setState(() => _selectedCategory = cat['id']!);
                              _loadData();
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),

              // Section Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 4),
                child: Row(
                  children: [
                    const Text(
                      'Community Hazards Feed',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${_incidents.length} issues',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),

              // Incident List Cards
              if (_isLoading && _incidents.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_incidents.isEmpty)
                Container(
                  margin: const EdgeInsets.all(24),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.check_circle_outline, size: 40, color: Colors.green),
                      const SizedBox(height: 8),
                      const Text(
                        'No Active Incidents in this Category',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Your neighbourhood is clear! Tap below to report a new local hazard.',
                        style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _incidents.length,
                  itemBuilder: (context, idx) {
                    final item = _incidents[idx];
                    return IncidentCard(
                      incident: item,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => IncidentDetailScreen(
                              incidentId: item.id,
                              initialIncident: item,
                            ),
                          ),
                        ).then((_) => _loadData());
                      },
                      onUpvote: () => _handleUpvote(item),
                    );
                  },
                ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final res = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ReportIncidentScreen()),
          );
          if (res == true) _loadData();
        },
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: Text(
          AppTranslations.get('report_hazard'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
    );
  },
);
  }
}

