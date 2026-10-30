import 'package:flutter/material.dart';
import '../models/incident.dart';
import '../models/broadcast.dart';
import '../services/api_service.dart';
import '../services/translations.dart';
import '../theme/app_theme.dart';
import '../widgets/incident_card.dart';
import '../widgets/emergency_broadcast_banner.dart';
import 'report_incident_screen.dart';
import 'incident_detail_screen.dart';
import 'admin_dashboard_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Incident> _incidents = [];
  List<EmergencyBroadcast> _broadcasts = [];
  bool _isLoading = true;

  String _selectedCategory = 'all';
  String _selectedWard = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _wards = [
    'all',
    'Ward 42 - Preet Vihar / Anand Vihar',
    'Ward 18 - Connaught Place / Central',
    'Ward 24 - Mayur Vihar Phase 1',
    'Ward 35 - Karol Bagh Zone',
    'Ward 14 - Anand Vihar ISBT',
  ];

  final List<Map<String, String>> _categories = [
    {'id': 'all', 'name': 'All Complaints'},
    {'id': 'road_hazard', 'name': 'Potholes & Roads'},
    {'id': 'water_issue', 'name': 'Water & Drainage'},
    {'id': 'power_cut', 'name': 'Power Outage'},
    {'id': 'sanitation', 'name': 'Sanitation & Waste'},
    {'id': 'stray_animals', 'name': 'Stray Animals'},
    {'id': 'theft_security', 'name': 'Safety & Security'},
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
        ApiService.fetchBroadcasts(ward: _selectedWard != 'all' ? _selectedWard : null),
      ]);

      if (mounted) {
        setState(() {
          List<Incident> raw = results[0] as List<Incident>;
          if (_selectedWard != 'all') {
            raw = raw.where((i) => i.ward == _selectedWard).toList();
          }
          _incidents = raw;
          _broadcasts = results[1] as List<EmergencyBroadcast>;
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
            return i.copyWith(
              upvotes: newUpvotes,
              status: newStatus,
            );
          }
          return i;
        }).toList();
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('नागरिक समर्थन दर्ज! (Upvote recorded)'),
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

  void _triggerSosEmergency() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.red, size: 24),
            SizedBox(width: 8),
            Text(
              'नागरिक आपातकालीन 112',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 16),
            ),
          ],
        ),
        content: const Text(
          'क्या आप नगर निगम व पुलिस नियंत्रण कक्ष को तत्काल आपात सूचना प्रेषित करना चाहते हैं?\n(Do you want to broadcast an urgent emergency alert to civic authorities?)',
          style: TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('रद्द करें / Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ApiService.triggerSos(
                  lat: 28.6304,
                  lng: 77.2177,
                  address: 'Municipal Ward Emergency Vicinity',
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      backgroundColor: Colors.red,
                      content: Text('🚨 आपात सूचना नगर निगम नियंत्रण कक्ष को प्रेषित कर दी गई है!'),
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
            child: const Text('पुष्टि करें (Confirm SOS)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
          appBar: PreferredSize(
            preferredSize: const Size.fromHeight(60),
            child: Column(
              children: [
                AppTheme.tricolorStrip(height: 4),
                AppBar(
                  title: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppTheme.govAshokaBlue,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '🏛️',
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppTranslations.get('app_name'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.govAshokaBlue,
                            ),
                          ),
                          Text(
                            AppTranslations.get('app_subtitle'),
                            style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted),
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
                          color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.language, size: 13, color: AppTheme.govAshokaBlue),
                            const SizedBox(width: 3),
                            Text(
                              isHindi ? 'EN' : 'हिन्दी',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.govAshokaBlue,
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
                    // Officer Console shortcut
                    IconButton(
                      icon: const Icon(Icons.admin_panel_settings_rounded, color: AppTheme.govAshokaBlue),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
                        );
                      },
                      tooltip: 'Officer Console (अधिकारी कक्ष)',
                    ),
                  ],
                ),
              ],
            ),
          ),
          body: RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Emergency Broadcast Banner
                  if (_broadcasts.isNotEmpty)
                    EmergencyBroadcastBanner(
                      broadcasts: _broadcasts,
                      onDismiss: (id) => setState(() => _broadcasts.removeWhere((b) => b.id == id)),
                    ),

                  // Ward / Jurisdiction Selector Filter Dropdown
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedWard,
                        isExpanded: true,
                        icon: const Icon(Icons.keyboard_arrow_down, size: 20, color: AppTheme.govAshokaBlue),
                        items: _wards.map((w) {
                          return DropdownMenuItem<String>(
                            value: w,
                            child: Text(
                              w == 'all' ? '🏛️ All Local Jurisdictions / Zones' : '📍 $w',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textDark),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedWard = val);
                            _loadData();
                          }
                        },
                      ),
                    ),
                  ),

                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: isHindi
                            ? 'खोजें: शिकायत संदर्भ (MCD-...), स्थल, या श्रेणी...'
                            : 'Search tracking ID, landmark, or category...',
                        hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppTheme.borderLight),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
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
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
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
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                color: isSelected ? Colors.white : AppTheme.textDark,
                              ),
                            ),
                            selected: isSelected,
                            selectedColor: AppTheme.govAshokaBlue,
                            backgroundColor: Colors.white,
                            checkmarkColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6),
                              side: BorderSide(
                                color: isSelected ? AppTheme.govAshokaBlue : AppTheme.borderLight,
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
                        Text(
                          isHindi ? 'नागरिक शिकायत निवारण कतार' : 'Municipal Grievance Redressal Feed',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textDark,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${_incidents.length} प्रकरण',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
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
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.check_circle_outline, size: 40, color: AppTheme.emerald),
                          const SizedBox(height: 8),
                          const Text(
                            'इस वार्ड / श्रेणी में कोई सक्रिय शिकायत नहीं है',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'वार्ड में स्थिति सामान्य है। नई जन शिकायत दर्ज करने हेतु नीचे दिए गए बटन का उपयोग करें।',
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
            backgroundColor: AppTheme.govAshokaBlue,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.note_add_outlined),
            label: Text(
              AppTranslations.get('report_hazard'),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        );
      },
    );
  }
}
