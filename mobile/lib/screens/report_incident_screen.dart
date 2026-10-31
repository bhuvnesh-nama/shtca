import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/jurisdiction.dart';
import '../services/location_service.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ReportIncidentScreen extends StatefulWidget {
  const ReportIncidentScreen({super.key});

  @override
  State<ReportIncidentScreen> createState() => _ReportIncidentScreenState();
}

class _ReportIncidentScreenState extends State<ReportIncidentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _addressController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _pincodeController = TextEditingController(text: '302017');
  final _phoneController = TextEditingController();
  final MapController _mapController = MapController();
  bool _isLocatingGps = false;

  String _selectedCategory = 'power_cut';

  double _latitude = 26.86081;
  double _longitude = 75.81854;

  LocalJurisdictionOffice get _nearestOffice {
    LocalJurisdictionOffice nearest = localJurisdictionOffices.firstWhere(
      (o) => o.tier != 'apex_central',
      orElse: () => localJurisdictionOffices[0],
    );
    double minDist = double.infinity;
    for (final off in localJurisdictionOffices) {
      if (off.tier == 'apex_central') continue;
      final dLat = (off.latitude - _latitude) * 3.141592653589793 / 180;
      final dLon = (off.longitude - _longitude) * 3.141592653589793 / 180;
      final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
          math.cos(_latitude * 3.141592653589793 / 180) *
              math.cos(off.latitude * 3.141592653589793 / 180) *
              math.sin(dLon / 2) *
              math.sin(dLon / 2);
      final dist = 6371 * 2 * math.asin(math.sqrt(a));
      if (dist < minDist) {
        minDist = dist;
        nearest = off;
      }
    }
    return nearest;
  }

  String get _selectedWard => _nearestOffice.name;
  final List<String> _attachedMedia = [];

  // Similar issue detection state
  bool _isCheckingDuplicate = false;
  Map<String, dynamic>? _duplicateIncident;
  bool _linkToExisting = true;
  Timer? _debounceTimer;

  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'power_cut',
      'name': 'Power Cut\nविद्युत',
      'icon': Icons.bolt_rounded,
      'color': Color(0xFFD97706),
    },
    {
      'id': 'water_issue',
      'name': 'Water / Sewer\nजल बोर्ड',
      'icon': Icons.water_drop_rounded,
      'color': Color(0xFF0284C7),
    },
    {
      'id': 'road_hazard',
      'name': 'Road / Pothole\nसड़क लोक निर्माण',
      'icon': Icons.warning_amber_rounded,
      'color': Color(0xFFCA8A04),
    },
    {
      'id': 'sanitation',
      'name': 'Sanitation\nसफाई व कूड़ा',
      'icon': Icons.delete_outline_rounded,
      'color': Color(0xFF059669),
    },
    {
      'id': 'stray_animals',
      'name': 'Stray Animals\nआवारा पशु',
      'icon': Icons.pets_rounded,
      'color': Color(0xFFEA580C),
    },
    {
      'id': 'theft_security',
      'name': 'Encroachment\nसुरक्षा व अतिक्रमण',
      'icon': Icons.shield_rounded,
      'color': Color(0xFFE11D48),
    },
  ];

  @override
  void initState() {
    super.initState();
    _initGpsLocation();
    _triggerDuplicateCheck();
  }

  Future<void> _initGpsLocation() async {
    setState(() => _isLocatingGps = true);
    try {
      final pos = await LocationService.determinePosition();
      if (mounted) {
        setState(() {
          _latitude = pos.latitude;
          _longitude = pos.longitude;
          _isLocatingGps = false;
        });
        _mapController.move(pos, 15.5);
        _triggerDuplicateCheck();
      }
    } catch (_) {
      if (mounted) setState(() => _isLocatingGps = false);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _addressController.dispose();
    _landmarkController.dispose();
    _pincodeController.dispose();
    _phoneController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _triggerDuplicateCheck() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () async {
      if (!mounted) return;
      setState(() => _isCheckingDuplicate = true);
      try {
        final result = await ApiService.checkDuplicate(
          category: _selectedCategory,
          lat: _latitude,
          lng: _longitude,
          radius: 300,
        );
        if (mounted) {
          setState(() {
            if (result['hasNearbyDuplicate'] == true && result['incident'] != null) {
              _duplicateIncident = result['incident'];
              _linkToExisting = true;
            } else {
              _duplicateIncident = null;
            }
          });
        }
      } catch (_) {
        if (mounted) setState(() => _duplicateIncident = null);
      } finally {
        if (mounted) setState(() => _isCheckingDuplicate = false);
      }
    });
  }

  void _showAcknowledgmentReceipt(String trackingRef, String department) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Column(
          children: [
            AppTheme.tricolorStrip(height: 3),
            const SizedBox(height: 12),
            const Icon(Icons.check_circle, color: AppTheme.emerald, size: 44),
            const SizedBox(height: 8),
            const Text(
              'लोक शिकायत पावती रसीद',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
              textAlign: TextAlign.center,
            ),
            const Text(
              'Grievance Registered Successfully',
              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                children: [
                  const Text('शिकायत संदर्भ संख्या / Tracking Number', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                  const SizedBox(height: 4),
                  SelectableText(
                    trackingRef,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      color: AppTheme.govAshokaBlue,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _receiptRow('संबंधित विभाग:', department),
            const SizedBox(height: 6),
            _receiptRow('प्राधिकरण डेस्क:', _nearestOffice.shortName),
            const SizedBox(height: 6),
            _receiptRow('स्थल:', _landmarkController.text.isNotEmpty ? _landmarkController.text : _addressController.text),
            const SizedBox(height: 10),
            const Text(
              'ℹ️ आपकी शिकायत संबंधित कनिष्ठ अभियंता (JE) को प्रेषित कर दी गई है। स्थिति ट्रैक करने हेतु संदर्भ संख्या सुरक्षित रखें।',
              style: TextStyle(fontSize: 10, color: AppTheme.textMuted),
            ),
          ],
        ),
        actions: [
          OutlinedButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: trackingRef));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Tracking number copied to clipboard!')),
              );
            },
            icon: const Icon(Icons.copy, size: 14),
            label: const Text('Copy Ref #', style: TextStyle(fontSize: 12)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.govAshokaBlue),
            onPressed: () {
              Navigator.pop(ctx); // Close dialog
              Navigator.pop(context, true); // Pop report screen with success
            },
            child: const Text('पूर्ण / Done', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _receiptRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
        ),
      ],
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      const forceNew = true;

      final res = await ApiService.submitReport(
        category: _selectedCategory,
        title: _titleController.text.trim(),
        description: _descController.text.trim(),
        latitude: _latitude,
        longitude: _longitude,
        address: _addressController.text.trim(),
        ward: _selectedWard,
        pincode: _pincodeController.text.trim(),
        landmark: _landmarkController.text.trim(),
        complainantPhone: _phoneController.text.trim(),
        media: _attachedMedia,
        forceNew: forceNew,
      );

      if (!mounted) return;
      final trackingRef = res['data']?['incident']?['complaintRef'] ??
          res['data']?['complaintRef'] ??
          'JPR-2026-${DateTime.now().millisecondsSinceEpoch % 10000}';
      final department = AppTheme.getDepartmentName(_selectedCategory);

      _showAcknowledgmentReceipt(trackingRef, department);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
          backgroundColor: AppTheme.severityHigh,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  Text('लोक शिकायत पंजीकरण', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  Text('Register Municipal Civic Grievance', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Category Selection
              const Text(
                'शिकायत श्रेणी / Grievance Category',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
              const SizedBox(height: 8),

              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 1.05,
                ),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = _selectedCategory == cat['id'];
                  final Color color = cat['color'];

                  return InkWell(
                    onTap: () {
                      setState(() => _selectedCategory = cat['id']);
                      _triggerDuplicateCheck();
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? color.withValues(alpha: 0.12) : Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? color : AppTheme.borderLight,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      padding: const EdgeInsets.all(6),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(cat['icon'], size: 22, color: color),
                          const SizedBox(height: 4),
                          Text(
                            cat['name'],
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected ? color : AppTheme.textDark,
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),

              // Auto-routed Municipal Department Indicator
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.govAshokaBlue.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.account_balance_outlined, size: 16, color: AppTheme.govAshokaBlue),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('संबंधित प्राधिकारी (Auto-Routed Department):', style: TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                          Text(
                            AppTheme.getDepartmentName(_selectedCategory),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Auto-Assigned Municipal Jurisdiction
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryBlue,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.account_balance_rounded, color: Colors.white, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _nearestOffice.name,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1E3A8A),
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDBEAFE),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Text(
                                  'Auto-Assigned',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            _nearestOffice.office,
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                          ),
                          const SizedBox(height: 4),
                          const Row(
                            children: [
                              Icon(Icons.check_circle_rounded, size: 13, color: Color(0xFF16A34A)),
                              SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'GPS द्वारा निकटतम प्राधिकरण को स्वचालित आवंटित',
                                  style: TextStyle(fontSize: 10.5, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
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
              const SizedBox(height: 14),

              // Title
              const Text(
                'शिकायत का संक्षिप्त विषय / Grievance Subject *',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  hintText: 'उदा. मुख्य पाइपलाइन टूटी हुई है / ट्रांसफार्मर से धुआं निकल रहा है',
                  hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'कृपया शिकायत का विषय दर्ज करें';
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Description
              const Text(
                'विस्तृत विवरण / Detailed Grievance Description *',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _descController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'समस्या का स्पष्ट विवरण, प्रभाव एवं समय सीमा दर्ज करें...',
                  hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'कृपया विवरण दर्ज करें';
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Landmark & Pincode in 2 columns
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'निकटतम स्थल / Landmark *',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _landmarkController,
                          decoration: InputDecoration(
                            hintText: 'उदा. मेट्रो पिलर 42, मदर डेयरी',
                            hintStyle: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: AppTheme.borderLight),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: AppTheme.borderLight),
                            ),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return 'स्थल दर्ज करें';
                            return null;
                          },
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
                          'पिन कोड / PIN',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _pincodeController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            hintText: '110092',
                            hintStyle: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: AppTheme.borderLight),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: AppTheme.borderLight),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Interactive Map Location Picker
              Container(
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
                        const Icon(Icons.pin_drop_rounded, size: 16, color: AppTheme.govAshokaBlue),
                        const SizedBox(width: 6),
                        const Text(
                          'मानचित्र पर स्थान चिन्हित करें / Pinpoint on Map',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                        ),
                        const Spacer(),
                        InkWell(
                          onTap: _isLocatingGps ? null : _initGpsLocation,
                          borderRadius: BorderRadius.circular(6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _isLocatingGps ? Icons.hourglass_top_rounded : Icons.my_location_rounded,
                                  size: 12,
                                  color: AppTheme.govAshokaBlue,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _isLocatingGps ? 'Locating...' : 'Current GPS',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.govAshokaBlue),
                                ),
                              ],
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${_latitude.toStringAsFixed(4)}°, ${_longitude.toStringAsFixed(4)}°',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.govAshokaBlue),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'सटीक स्थल हेतु मानचित्र पर टैप करें (Tap anywhere on map to pin location)',
                      style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 160,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: FlutterMap(
                          mapController: _mapController,
                          options: MapOptions(
                            initialCenter: LatLng(_latitude, _longitude),
                            initialZoom: 14.0,
                            onTap: (_, latLng) {
                              setState(() {
                                _latitude = latLng.latitude;
                                _longitude = latLng.longitude;
                              });
                              _triggerDuplicateCheck();
                            },
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.shtca.portal',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(_latitude, _longitude),
                                  width: 36,
                                  height: 36,
                                  child: const Icon(
                                    Icons.location_on,
                                    size: 36,
                                    color: Color(0xFFEA580C),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Complainant Phone for SMS updates
              const Text(
                'शिकायतकर्ता मोबाइल नंबर / Mobile No. for SMS Updates *',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  hintText: 'उदा. 9876543210 (निस्तारण स्थिति SMS हेतु)',
                  hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  filled: true,
                  fillColor: Colors.white,
                  prefixIcon: const Icon(Icons.phone_android, size: 18, color: AppTheme.govAshokaBlue),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderLight),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Photo Evidence
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'स्थल साक्ष्य फोटो / Ground Photo Evidence',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      String sampleUrl;
                      switch (_selectedCategory) {
                        case 'power_cut':
                          sampleUrl = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=60';
                          break;
                        case 'water_issue':
                          sampleUrl = 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=600&auto=format&fit=crop&q=60';
                          break;
                        case 'road_hazard':
                          sampleUrl = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60';
                          break;
                        case 'stray_animals':
                          sampleUrl = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=60';
                          break;
                        default:
                          sampleUrl = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=60';
                      }
                      setState(() {
                        if (!_attachedMedia.contains(sampleUrl)) {
                          _attachedMedia.add(sampleUrl);
                        }
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('स्थल साक्ष्य फोटो संलग्न की गई (Photo attached)')),
                      );
                    },
                    icon: const Icon(Icons.camera_alt_outlined, size: 14, color: AppTheme.govAshokaBlue),
                    label: const Text('फोटो जोड़ें / Attach Photo', style: TextStyle(fontSize: 11, color: AppTheme.govAshokaBlue, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              if (_attachedMedia.isNotEmpty)
                SizedBox(
                  height: 70,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _attachedMedia.length,
                    itemBuilder: (context, idx) {
                      return Stack(
                        children: [
                          Container(
                            width: 70,
                            height: 70,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.borderLight),
                              image: DecorationImage(
                                image: NetworkImage(ApiService.formatMediaUrl(_attachedMedia[idx])),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            top: 2,
                            right: 10,
                            child: GestureDetector(
                              onTap: () => setState(() => _attachedMedia.removeAt(idx)),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: Colors.black54,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, size: 12, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              const SizedBox(height: 16),

              // Nearby Similar Incident Banner
              if (_isCheckingDuplicate)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'निकटवर्ती समान शिकायतों की जांच की जा रही है...',
                        style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),

              if (_duplicateIncident != null && !_isCheckingDuplicate)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.layers_rounded, size: 16, color: AppTheme.govAshokaBlue),
                          SizedBox(width: 6),
                          Text(
                            'इस स्थान पर पहले से दर्ज शिकायत उपलब्ध है',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.govAshokaBlue,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _duplicateIncident!['title'] ?? 'Matching active hazard nearby',
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_duplicateIncident!['address'] ?? 'Nearby'} • ${_duplicateIncident!['reportCount'] ?? 1} नागरिक पुष्टि',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 6),
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        value: _linkToExisting,
                        onChanged: (val) {
                          setState(() => _linkToExisting = val ?? true);
                        },
                        title: Text(
                          _linkToExisting
                              ? 'मौजूदा शिकायत में समर्थन जोड़ें (Link to Existing)'
                              : 'अलग नई शिकायत दर्ज करें (Post Separate)',
                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.textDark),
                        ),
                        controlAffinity: ListTileControlAffinity.leading,
                      ),
                    ],
                  ),
                ),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.govAshokaBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: _isSubmitting ? null : _handleSubmit,
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          _duplicateIncident != null && _linkToExisting
                              ? 'समर्थन दर्ज करें (Upvote Existing)'
                              : 'शिकायत दर्ज करें (Submit Grievance)',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
