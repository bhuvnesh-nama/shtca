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
import '../services/location_service.dart';
import 'package:latlong2/latlong.dart';
import '../widgets/civic_map_view.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Incident> _incidents = [];
  List<EmergencyBroadcast> _broadcasts = [];
  bool _isLoading = true;
  bool _isMapView = false;
  bool _isTriggeringSos = false;
  DateTime? _lastSosTriggered;
  LatLng? _userLocation = LocationService.defaultJaipurCenter;
  bool _isLocating = false;

  String _selectedCategory = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

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
    _initLocationAndLoad();
  }

  Future<void> _initLocationAndLoad() async {
    setState(() => _isLocating = true);
    try {
      final pos = await LocationService.determinePosition();
      if (mounted) {
        setState(() {
          _userLocation = pos;
          _isLocating = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLocating = false);
    }
    await _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final pos = _userLocation ?? LocationService.currentLocation;
      final results = await Future.wait([
        ApiService.fetchIncidents(
          category: _selectedCategory != 'all' ? _selectedCategory : null,
          search: _searchQuery.isNotEmpty ? _searchQuery : null,
          latitude: pos.latitude,
          longitude: pos.longitude,
          radius: 40000,
        ),
        ApiService.fetchBroadcasts(),
      ]);

      if (mounted) {
        setState(() {
          _incidents = results[0] as List<Incident>;
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
    if (_lastSosTriggered != null) {
      final elapsed = DateTime.now().difference(_lastSosTriggered!).inSeconds;
      if (elapsed < 60) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFD97706),
            content: Text('⚠️ आपात सूचना पहले से सक्रिय है। कृपया ${60 - elapsed} सेकंड प्रतीक्षा करें।\n(Alert already active. Please wait ${60 - elapsed}s)'),
            duration: const Duration(seconds: 3),
          ),
        );
        return;
      }
    }

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
              if (_isTriggeringSos) return;
              Navigator.pop(ctx);
              _isTriggeringSos = true;
              _lastSosTriggered = DateTime.now();

              try {
                final pos = _userLocation ?? LocationService.currentLocation;
                await ApiService.triggerSos(
                  lat: pos.latitude,
                  lng: pos.longitude,
                  address: 'GPS Pinpointed Citizen Emergency Vicinity',
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
              } finally {
                _isTriggeringSos = false;
              }
            },
            child: const Text('पुष्टि करें (Confirm SOS)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showNotificationsBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final isHindi = AppTranslations.isHindi.value;
          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.78,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppTheme.tricolorStrip(height: 3.5),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active_outlined, color: AppTheme.govAshokaBlue, size: 22),
                      const SizedBox(width: 8),
                      Text(
                        isHindi ? 'नागरिक सूचनाएं एवं आपात अलर्ट' : 'Civic Notifications & Alerts',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: _broadcasts.isNotEmpty ? Colors.red.withValues(alpha: 0.1) : Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _broadcasts.isNotEmpty
                              ? (isHindi ? '${_broadcasts.length} सक्रिय अलर्ट' : '${_broadcasts.length} Active')
                              : (isHindi ? 'कोई अलर्ट नहीं' : 'All Clear'),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _broadcasts.isNotEmpty ? Colors.red : Colors.green,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                if (_broadcasts.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      children: [
                        const Icon(Icons.check_circle_outline, size: 48, color: AppTheme.emerald),
                        const SizedBox(height: 12),
                        Text(
                          isHindi ? 'कोई नई आपातकालीन सूचना नहीं है' : 'No Active Emergency Broadcasts',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          isHindi
                              ? 'आपके क्षेत्र में स्थिति सामान्य है। सभी नागरिक सेवाएं सुचारू रूप से कार्य कर रही हैं।'
                              : 'Conditions in your municipal sector are normal. All public utilities are operating smoothly.',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                else
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      children: [
                        EmergencyBroadcastBanner(
                          broadcasts: _broadcasts,
                          onDismiss: (id) {
                            setState(() => _broadcasts.removeWhere((b) => b.id == id));
                            setModalState(() {});
                          },
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
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
                  title: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.borderLight),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 3, offset: Offset(0, 1)),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Image.asset(
                      'assets/logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => Container(
                        color: AppTheme.govAshokaBlue,
                        padding: const EdgeInsets.all(4),
                        child: const Text('🏛️', style: TextStyle(fontSize: 16)),
                      ),
                    ),
                  ),
                  actions: [
                    // Notification Bell with Badge
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.notifications_none_rounded, color: AppTheme.govAshokaBlue),
                          onPressed: _showNotificationsBottomSheet,
                          tooltip: 'सूचनाएं / Civic Alerts',
                        ),
                        if (_broadcasts.isNotEmpty)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
                              child: Text(
                                '${_broadcasts.length}',
                                style: const TextStyle(color: Colors.white, fontSize: 8.5, fontWeight: FontWeight.bold),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                    ),
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
                    // View Toggle (Feed vs Map)
                    IconButton(
                      icon: Icon(
                        _isMapView ? Icons.format_list_bulleted_rounded : Icons.map_rounded,
                        color: _isMapView ? AppTheme.emerald : AppTheme.govAshokaBlue,
                      ),
                      onPressed: () => setState(() => _isMapView = !_isMapView),
                      tooltip: _isMapView ? 'सूची दृश्य (List View)' : 'लाइव मानचित्र (Live Map)',
                    ),
                    // Emergency SOS Panic Button
                    IconButton(
                      icon: const Icon(Icons.emergency_rounded, color: Colors.red),
                      onPressed: _triggerSosEmergency,
                      tooltip: AppTranslations.get('emergency_sos'),
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
                  // Hyperlocal Vicinity GPS Detection Status
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.govAshokaBlue.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.my_location_rounded, size: 15, color: AppTheme.govAshokaBlue),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _isLocating
                                ? (isHindi ? 'जीपीएस स्थान प्राप्त किया जा रहा है...' : 'Acquiring device GPS...')
                                : (isHindi
                                    ? 'निकटवर्ती शिकायतें (~40 किमी दायरा) • स्वचालित जीपीएस'
                                    : 'Hyperlocal Vicinity (~40 km cluster) • GPS Detected'),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.govAshokaBlue),
                          ),
                        ),
                        InkWell(
                          onTap: () async {
                            final pos = await LocationService.determinePosition(forceRefresh: true);
                            setState(() => _userLocation = pos);
                            _loadData();
                          },
                          child: const Icon(Icons.refresh_rounded, size: 16, color: AppTheme.govAshokaBlue),
                        ),
                      ],
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

                  // Section Header & View Toggle (Feed vs Live Map)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
                    child: Row(
                      children: [
                        Text(
                          _isMapView
                              ? (isHindi ? '🗺️ लाइव नागरिक मानचित्र' : '🗺️ Live Civic Map')
                              : (isHindi ? '📋 नागरिक शिकायत निवारण' : '📋 Grievance Redressal Feed'),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textDark,
                          ),
                        ),
                        const Spacer(),
                        // Segmented View Toggle Switch
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: Row(
                            children: [
                              GestureDetector(
                                onTap: () => setState(() => _isMapView = false),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: !_isMapView ? AppTheme.govAshokaBlue : Colors.transparent,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.format_list_bulleted,
                                        size: 13,
                                        color: !_isMapView ? Colors.white : AppTheme.govAshokaBlue,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        isHindi ? 'सूची' : 'List',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: !_isMapView ? Colors.white : AppTheme.govAshokaBlue,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => setState(() => _isMapView = true),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _isMapView ? AppTheme.govAshokaBlue : Colors.transparent,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.map_rounded,
                                        size: 13,
                                        color: _isMapView ? Colors.white : AppTheme.govAshokaBlue,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        isHindi ? 'मानचित्र' : 'Map',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: _isMapView ? Colors.white : AppTheme.govAshokaBlue,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Map View vs List View Container
                  if (_isMapView)
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      height: MediaQuery.of(context).size.height * 0.62,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.borderLight),
                        boxShadow: const [
                          BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2)),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: CivicMapView(
                          incidents: _incidents,
                          onIncidentTap: (item) {
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
                          onRefresh: _loadData,
                        ),
                      ),
                    )
                  else if (_isLoading && _incidents.isEmpty)
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
                            'इस क्षेत्र / श्रेणी में कोई सक्रिय शिकायत नहीं है',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'क्षेत्र में स्थिति सामान्य है। नई जन शिकायत दर्ज करने हेतु नीचे दिए गए बटन का उपयोग करें।',
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
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _isMapView ? 1 : 0,
            onTap: (index) {
              if (index == 0) {
                setState(() => _isMapView = false);
              } else if (index == 1) {
                setState(() => _isMapView = true);
              } else if (index == 2) {
                _showNotificationsBottomSheet();
              }
            },
            selectedItemColor: AppTheme.govAshokaBlue,
            unselectedItemColor: AppTheme.textMuted,
            selectedFontSize: 11,
            unselectedFontSize: 11,
            items: [
              BottomNavigationBarItem(
                icon: const Icon(Icons.format_list_bulleted_rounded),
                activeIcon: const Icon(Icons.format_list_bulleted_rounded),
                label: isHindi ? 'शिकायतें' : 'Grievances',
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.map_outlined),
                activeIcon: const Icon(Icons.map_rounded),
                label: isHindi ? 'मानचित्र' : 'Live Map',
              ),
              BottomNavigationBarItem(
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.notifications_none_rounded),
                    if (_broadcasts.isNotEmpty)
                      Positioned(
                        top: -2,
                        right: -4,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(minWidth: 12, minHeight: 12),
                          child: Text(
                            '${_broadcasts.length}',
                            style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
                activeIcon: const Icon(Icons.notifications_rounded),
                label: isHindi ? 'सूचनाएं' : 'Alerts',
              ),
            ],
          ),
        );
      },
    );
  }
}
