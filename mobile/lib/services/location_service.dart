import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

class LocationService {
  // Default fallback center: Jaipur, Rajasthan (User testing coordinates)
  static const LatLng defaultJaipurCenter = LatLng(26.86081, 75.81854);

  static LatLng? _cachedLocation;
  static bool _hasRequestedPermission = false;

  static LatLng get currentLocation => _cachedLocation ?? defaultJaipurCenter;

  /// Check and request device location permission, then fetch live GPS coordinates.
  static Future<LatLng> determinePosition({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedLocation != null) {
      return _cachedLocation!;
    }

    try {
      // 1. Check if location services are enabled on device
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('[LocationService] Location services disabled on device. Using default.');
        _cachedLocation = defaultJaipurCenter;
        return defaultJaipurCenter;
      }

      // 2. Check current permission status
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        _hasRequestedPermission = true;
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          debugPrint('[LocationService] Location permission denied by user.');
          _cachedLocation = defaultJaipurCenter;
          return defaultJaipurCenter;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        debugPrint('[LocationService] Location permissions permanently denied.');
        _cachedLocation = defaultJaipurCenter;
        return defaultJaipurCenter;
      }

      // 3. Permission granted: fetch current device GPS location
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );

      final liveCoords = LatLng(position.latitude, position.longitude);
      _cachedLocation = liveCoords;
      debugPrint('[LocationService] Live device GPS coordinates: ${liveCoords.latitude}, ${liveCoords.longitude}');
      return liveCoords;
    } catch (e) {
      debugPrint('[LocationService] Error determining device position: $e');
      _cachedLocation ??= defaultJaipurCenter;
      return _cachedLocation!;
    }
  }

  /// Request permission explicitly if not already requested
  static Future<bool> ensurePermissionRequested() async {
    if (_hasRequestedPermission) return true;
    _hasRequestedPermission = true;
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        final res = await Geolocator.requestPermission();
        return res == LocationPermission.whileInUse || res == LocationPermission.always;
      }
      return permission == LocationPermission.whileInUse || permission == LocationPermission.always;
    } catch (_) {
      return false;
    }
  }
}

