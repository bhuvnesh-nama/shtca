import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/incident.dart';
import '../theme/app_theme.dart';
import '../services/translations.dart';

class CivicMapView extends StatefulWidget {
  final List<Incident> incidents;
  final Function(Incident) onIncidentTap;
  final VoidCallback? onRefresh;
  final LatLng? userLocation;

  const CivicMapView({
    super.key,
    required this.incidents,
    required this.onIncidentTap,
    this.onRefresh,
    this.userLocation,
  });

  @override
  State<CivicMapView> createState() => _CivicMapViewState();
}

class _CivicMapViewState extends State<CivicMapView> {
  final MapController _mapController = MapController();
  Incident? _selectedIncident;
  static const LatLng _defaultCenter = LatLng(26.86081, 75.81854);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final loc = widget.userLocation ?? _defaultCenter;
      _mapController.move(loc, 14.5);
    });
  }

  @override
  void didUpdateWidget(covariant CivicMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.userLocation != null && widget.userLocation != oldWidget.userLocation) {
      _mapController.move(widget.userLocation!, 14.5);
    }
  }

  @override
  Widget build(BuildContext context) {
    final LatLng center = widget.userLocation ?? _defaultCenter;

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: center,
            initialZoom: 14.5,
            minZoom: 5.0,
            maxZoom: 18.0,
            onTap: (_, __) {
              if (_selectedIncident != null) {
                setState(() => _selectedIncident = null);
              }
            },
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.shtca.portal',
            ),
            MarkerLayer(
              markers: [
                if (widget.userLocation != null)
                  Marker(
                    point: widget.userLocation!,
                    width: 32,
                    height: 32,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.25),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2.5),
                            boxShadow: const [
                              BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 1)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ...widget.incidents.map((inc) {
                final pos = LatLng(inc.location.latitude, inc.location.longitude);
                final isSelected = _selectedIncident?.id == inc.id;
                final markerColor = _getMarkerColor(inc.status);
                final categoryIcon = _getCategoryIcon(inc.category);

                return Marker(
                  point: pos,
                  width: isSelected ? 48 : 38,
                  height: isSelected ? 48 : 38,
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedIncident = inc);
                      _mapController.move(pos, 14.5);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: markerColor,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.9),
                          width: isSelected ? 3.5 : 2.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: markerColor.withValues(alpha: 0.45),
                            blurRadius: isSelected ? 10 : 5,
                            spreadRadius: isSelected ? 2 : 1,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        categoryIcon,
                        size: isSelected ? 24 : 18,
                        color: Colors.white,
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
          ],
        ),

        // Top Status Legend Pill
        Positioned(
          top: 12,
          left: 16,
          right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.94),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 6,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildLegendItem('लंबित / Reported', const Color(0xFFEA580C)),
                _buildLegendItem('प्रगति पर / Active', const Color(0xFF0284C7)),
                _buildLegendItem('निस्तारित / Done', const Color(0xFF16A34A)),
              ],
            ),
          ),
        ),

        // Recenter FAB
        Positioned(
          right: 16,
          bottom: _selectedIncident != null ? 220 : 24,
          child: FloatingActionButton.small(
            heroTag: 'map_recenter_fab',
            backgroundColor: Colors.white,
            foregroundColor: AppTheme.govAshokaBlue,
            onPressed: () {
              _mapController.move(center, 13.0);
              setState(() => _selectedIncident = null);
            },
            tooltip: 'मानचित्र पुनः केंद्रित करें (Recenter Map)',
            child: const Icon(Icons.my_location, size: 20),
          ),
        ),

        // Selected Incident Bottom Sheet Preview Card
        if (_selectedIncident != null)
          Positioned(
            left: 14,
            right: 14,
            bottom: 16,
            child: _buildIncidentPreviewCard(_selectedIncident!),
          ),
      ],
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppTheme.textDark),
        ),
      ],
    );
  }

  Widget _buildIncidentPreviewCard(Incident inc) {
    final statusColor = _getMarkerColor(inc.status);
    final statusLabel = AppTranslations.statusName(inc.status);
    final categoryLabel = AppTranslations.categoryName(inc.category);

    return Card(
      elevation: 8,
      shadowColor: Colors.black26,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: statusColor.withValues(alpha: 0.3), width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row: Tracking Badge + Status + Close
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.govAshokaBlue.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: AppTheme.govAshokaBlue.withValues(alpha: 0.2)),
                  ),
                  child: Text(
                    inc.complaintRef ?? inc.id.substring(0, 8).toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.govAshokaBlue,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
                const Spacer(),
                IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: const Icon(Icons.close, size: 18, color: AppTheme.textMuted),
                  onPressed: () => setState(() => _selectedIncident = null),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Title
            Text(
              inc.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 4),

            // Category & Landmark
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    inc.address.isNotEmpty
                        ? inc.address
                        : (inc.landmark?.isNotEmpty == true ? inc.landmark! : categoryLabel),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Actions: Support count + View Details Button
            Row(
              children: [
                Row(
                  children: [
                    const Icon(Icons.thumb_up_alt_outlined, size: 14, color: AppTheme.govAshokaBlue),
                    const SizedBox(width: 4),
                    Text(
                      '${inc.upvotes} समर्थन',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.govAshokaBlue,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                ElevatedButton.icon(
                  onPressed: () => widget.onIncidentTap(inc),
                  icon: const Icon(Icons.arrow_forward_rounded, size: 15),
                  label: const Text(
                    'विवरण देखें / Details',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.govAshokaBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getMarkerColor(String status) {
    switch (status.toLowerCase()) {
      case 'resolved':
        return const Color(0xFF16A34A);
      case 'in_progress':
      case 'assigned':
        return const Color(0xFF0284C7);
      case 'investigating':
        return const Color(0xFFD97706);
      default:
        return const Color(0xFFEA580C);
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'road_hazard':
        return Icons.warning_amber_rounded;
      case 'water_issue':
        return Icons.water_drop_outlined;
      case 'power_cut':
        return Icons.flash_on_outlined;
      case 'sanitation':
        return Icons.delete_outline;
      case 'stray_animals':
        return Icons.pets_outlined;
      case 'theft_security':
        return Icons.security_outlined;
      default:
        return Icons.report_problem_outlined;
    }
  }
}
