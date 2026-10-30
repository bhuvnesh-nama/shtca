import 'dart:async';
import 'package:flutter/material.dart';
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

  String _selectedCategory = 'power_cut';
  final double _latitude = 28.6304;
  final double _longitude = 77.2177;

  // Auto-Cluster Duplicate Detection State
  bool _isCheckingDuplicate = false;
  Map<String, dynamic>? _duplicateIncident;
  bool _linkToExisting = true;
  Timer? _debounceTimer;

  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'power_cut',
      'name': 'Power Cut',
      'icon': Icons.bolt_rounded,
      'color': Color(0xFFD97706),
    },
    {
      'id': 'water_issue',
      'name': 'Water Issue',
      'icon': Icons.water_drop_rounded,
      'color': Color(0xFF2563EB),
    },
    {
      'id': 'theft_security',
      'name': 'Theft & Security',
      'icon': Icons.shield_rounded,
      'color': Color(0xFFE11D48),
    },
    {
      'id': 'stray_animals',
      'name': 'Stray Animals',
      'icon': Icons.pets_rounded,
      'color': Color(0xFFEA580C),
    },
    {
      'id': 'road_hazard',
      'name': 'Road Hazard',
      'icon': Icons.warning_amber_rounded,
      'color': Color(0xFFCA8A04),
    },
    {
      'id': 'sanitation',
      'name': 'Sanitation',
      'icon': Icons.delete_outline_rounded,
      'color': Color(0xFF059669),
    },
  ];

  @override
  void initState() {
    super.initState();
    _triggerDuplicateCheck();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _addressController.dispose();
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

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      final forceNew = _duplicateIncident != null ? !_linkToExisting : false;

      final res = await ApiService.submitReport(
        category: _selectedCategory,
        title: _titleController.text.trim(),
        description: _descController.text.trim(),
        latitude: _latitude,
        longitude: _longitude,
        address: _addressController.text.trim(),
        forceNew: forceNew,
      );

      if (!mounted) return;
      final bool isNew = res['data']?['isNewIncident'] ?? true;
      final msg = isNew
          ? 'Report submitted! Live on community safety map.'
          : 'Report auto-clustered into active nearby incident!';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: isNew ? AppTheme.primaryBlue : Colors.indigo,
        ),
      );

      Navigator.pop(context, true);
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
      appBar: AppBar(
        title: const Text('Report Hazard / Issue'),
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
                'Incident Category',
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
                  childAspectRatio: 1.1,
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
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? color.withValues(alpha: 0.12) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? color : AppTheme.borderLight,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(cat['icon'], size: 24, color: color),
                          const SizedBox(height: 4),
                          Text(
                            cat['name'],
                            style: TextStyle(
                              fontSize: 11,
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
              const SizedBox(height: 16),

              // Title
              const Text(
                'Incident Headline',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  hintText: 'e.g. Transformer spark / Stray dogs barking near park',
                  hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
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
                  if (val == null || val.trim().isEmpty) return 'Please enter a title';
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Description
              const Text(
                'Description & Impact',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _descController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Describe what happened, current severity, and immediate impact...',
                  hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
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
                  if (val == null || val.trim().isEmpty) return 'Please describe the incident';
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Location / Landmark
              const Text(
                'Apartment Block / Landmark',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _addressController,
                decoration: InputDecoration(
                  hintText: 'e.g. Block C, Substation 4, Gate 2',
                  hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                  filled: true,
                  fillColor: Colors.white,
                  prefixIcon: const Icon(Icons.location_on_outlined, size: 18, color: AppTheme.primaryBlue),
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
              const SizedBox(height: 16),

              // Auto-Cluster Duplicate Candidate Banner (Bonus Twist 1)
              if (_isCheckingDuplicate)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: const [
                      SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Scanning neighbourhood for nearby reports...',
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
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.layers_rounded, size: 16, color: AppTheme.primaryBlue),
                          const SizedBox(width: 6),
                          const Text(
                            'AUTO-CLUSTER CANDIDATE DETECTED',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryBlue,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _duplicateIncident!['title'] ?? 'Matching active hazard nearby',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_duplicateIncident!['address'] ?? 'Nearby'} • ${_duplicateIncident!['reportCount'] ?? 1} existing reports',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 8),
                      const Divider(height: 1, color: Color(0xFFBFDBFE)),
                      const SizedBox(height: 4),
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        value: _linkToExisting,
                        onChanged: (val) {
                          setState(() => _linkToExisting = val ?? true);
                        },
                        title: Text(
                          _linkToExisting
                              ? 'Corroborate existing cluster (Recommended)'
                              : 'Post as a separate, distinct incident',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textDark,
                          ),
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
                  onPressed: _isSubmitting ? null : _handleSubmit,
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          _duplicateIncident != null && _linkToExisting
                              ? 'Corroborate & Cluster Report'
                              : 'Submit Citizen Report',
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
