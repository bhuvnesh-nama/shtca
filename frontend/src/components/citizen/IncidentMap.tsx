import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { IncidentItem } from "@/types/incident";
import { Button } from "@/components/ui/button";
import { Crosshair, Plus, Flame, MapPin } from "lucide-react";

// Fix Leaflet's default marker icons in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface IncidentMapProps {
  incidents: IncidentItem[];
  selectedIncident?: IncidentItem | null;
  onSelectIncident: (incident: IncidentItem) => void;
  userLocation?: [number, number] | null;
  onDetectLocation?: () => void;
  isPickingLocation?: boolean;
  pickedLocation?: [number, number] | null;
  onLocationPick?: (lat: number, lng: number) => void;
  heightClass?: string;
}

const getSeverityColor = (severity: string) => {
  if (severity === "critical" || severity === "high") return "#e11d48"; // rose
  if (severity === "medium") return "#d97706"; // amber
  if (severity === "low") return "#059669"; // green
  return "#2563eb"; // blue
};

// Marker color based on severity and category with cluster badge
const getMarkerIcon = (severity: string, isSelected: boolean, reportCount: number = 1) => {
  const color = getSeverityColor(severity);
  const size = isSelected ? 34 : 28;
  const isCluster = reportCount > 1;

  const clusterBadgeHtml = isCluster
    ? `<div style="
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #0f172a;
        color: #f8fafc;
        font-size: 10px;
        font-weight: 700;
        border-radius: 9999px;
        padding: 1px 5px;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        letter-spacing: -0.2px;
      ">+${reportCount}</div>`
    : "";

  const pulseRingHtml = isCluster
    ? `<div style="
        position: absolute;
        inset: -5px;
        border-radius: 9999px;
        border: 2px solid ${color};
        opacity: 0.5;
        pointer-events: none;
      "></div>`
    : "";

  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      color: white;
      border-radius: 9999px;
      border: 2.5px solid white;
      box-shadow: 0 4px 8px -1px rgba(0, 0, 0, 0.35);
      cursor: pointer;
      transition: transform 0.15s ease;
      ${isSelected ? "transform: scale(1.2); z-index: 1000;" : ""}
    ">
      ${pulseRingHtml}
      <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: white;"></div>
      ${clusterBadgeHtml}
    </div>
  `;

  return L.divIcon({
    className: "custom-incident-pin",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const pickPinIcon = L.divIcon({
  className: "custom-pick-pin",
  html: `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
    ">
      <div style="
        background-color: #2563eb;
        color: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        margin-bottom: 2px;
      ">
        Incident Location
      </div>
      <div style="
        width: 18px;
        height: 18px;
        background-color: #2563eb;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
  iconSize: [0, 0],
});

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  userLocation,
  onDetectLocation,
  isPickingLocation = false,
  pickedLocation,
  onLocationPick,
  heightClass = "h-[calc(100vh-140px)]",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const onLocationPickRef = useRef(onLocationPick);

  // Heatmap vs Standard Pins state
  const [mapMode, setMapMode] = useState<"pins" | "heatmap">("pins");

  useEffect(() => {
    onLocationPickRef.current = onLocationPick;
  }, [onLocationPick]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: India/Delhi coordinates fallback
    const initialLat = 28.6139;
    const initialLng = 77.209;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const heatmapLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    heatmapLayerRef.current = heatmapLayer;
    mapInstanceRef.current = map;

    // Handle clicks when in location picking mode
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onLocationPickRef.current) {
        onLocationPickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      userMarkerRef.current = L.circleMarker(userLocation, {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup("<b>Your Current Location</b>");
    }
  }, [userLocation]);

  // Update picked location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickingLocation && pickedLocation) {
      if (pickMarkerRef.current) {
        pickMarkerRef.current.setLatLng(pickedLocation);
      } else {
        const marker = L.marker(pickedLocation, {
          icon: pickPinIcon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          if (onLocationPick) {
            onLocationPick(pos.lat, pos.lng);
          }
        });

        pickMarkerRef.current = marker;
      }
      map.panTo(pickedLocation);
    } else if (pickMarkerRef.current) {
      pickMarkerRef.current.remove();
      pickMarkerRef.current = null;
    }
  }, [isPickingLocation, pickedLocation, onLocationPick]);

  // Update incident markers & heatmap layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const heatmapLayer = heatmapLayerRef.current;
    if (!map || !markersLayer || !heatmapLayer) return;

    markersLayer.clearLayers();
    heatmapLayer.clearLayers();

    incidents.forEach((incident) => {
      if (
        !incident.location ||
        !incident.location.coordinates ||
        incident.location.coordinates.length < 2
      ) {
        return;
      }

      const [lng, lat] = incident.location.coordinates;
      const isSelected = selectedIncident?._id === incident._id;
      const reportCount = incident.reportCount || (Array.isArray(incident.reports) ? incident.reports.length : 1);
      const color = getSeverityColor(incident.severity);

      // Build popup
      const firstImage = incident.media?.[0];
      const imageHtml = firstImage
        ? `<img src="${firstImage}" alt="${incident.title}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />`
        : "";

      const clusterBadgeText = reportCount > 1
        ? `<span style="font-size: 10px; font-weight: 700; background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 9999px;">
            ⚡ ${reportCount} Clustered Reports
           </span>`
        : `<span style="font-size: 10px; font-weight: 600; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 9999px;">
            1 Report
           </span>`;

      const popupContent = `
        <div style="font-family: inherit; width: 210px; padding: 3px;">
          ${imageHtml}
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 5px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #2563eb;">
              ${incident.category.replace("_", " ")}
            </span>
            ${clusterBadgeText}
          </div>
          <h4 style="font-size: 13px; font-weight: 600; margin: 0 0 4px 0; color: #0f172a; line-height: 1.25;">
            ${incident.title}
          </h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0; line-height: 1.35; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${incident.description}
          </p>
          <button id="view-incident-${incident._id}" style="
            width: 100%;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          ">
            View Details & Corroborations
          </button>
        </div>
      `;

      if (mapMode === "heatmap") {
        // Render Hotspot Density Ring
        const hotspotRadius = 80 + Math.min(reportCount, 5) * 35;
        const circle = L.circle([lat, lng], {
          radius: hotspotRadius,
          color: color,
          fillColor: color,
          fillOpacity: 0.28,
          weight: 2,
        }).addTo(heatmapLayer);

        circle.bindPopup(popupContent);
        circle.on("popupopen", () => {
          const btn = document.getElementById(`view-incident-${incident._id}`);
          if (btn) btn.onclick = () => onSelectIncident(incident);
        });

        // Add a smaller core pin inside the hotspot
        const coreMarker = L.circleMarker([lat, lng], {
          radius: 7,
          color: "#ffffff",
          fillColor: color,
          fillOpacity: 1,
          weight: 2,
        }).addTo(heatmapLayer);
        coreMarker.bindPopup(popupContent);
        coreMarker.on("popupopen", () => {
          const btn = document.getElementById(`view-incident-${incident._id}`);
          if (btn) btn.onclick = () => onSelectIncident(incident);
        });
      } else {
        // Render Standard Pin with cluster badge
        const icon = getMarkerIcon(incident.severity, isSelected, reportCount);
        const marker = L.marker([lat, lng], { icon });
        marker.bindPopup(popupContent);
        marker.on("popupopen", () => {
          const btn = document.getElementById(`view-incident-${incident._id}`);
          if (btn) btn.onclick = () => onSelectIncident(incident);
        });
        marker.addTo(markersLayer);
      }
    });
  }, [incidents, selectedIncident, onSelectIncident, mapMode]);

  // Center on selected incident
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIncident) return;

    if (
      selectedIncident.location &&
      selectedIncident.location.coordinates &&
      selectedIncident.location.coordinates.length >= 2
    ) {
      const [lng, lat] = selectedIncident.location.coordinates;
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [selectedIncident]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border shadow-xs">
      <div ref={mapContainerRef} className={`w-full ${heightClass}`} />

      {/* Floating Mode Switcher (Pins vs Hotspots Heatmap) */}
      <div className="absolute top-3 left-3 z-[400] flex items-center rounded-lg border border-border bg-background/90 backdrop-blur shadow-sm p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMapMode("pins")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            mapMode === "pins"
              ? "bg-blue-600 text-white shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="size-3" />
          Pins
        </button>
        <button
          type="button"
          onClick={() => setMapMode("heatmap")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            mapMode === "heatmap"
              ? "bg-amber-600 text-white shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="size-3" />
          Hotspots
        </button>
      </div>

      {/* Floating control buttons */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        {onDetectLocation && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onDetectLocation}
            className="size-9 rounded-lg p-0 bg-background/90 backdrop-blur shadow-md hover:bg-background border border-border"
            title="Center on my location"
          >
            <Crosshair className="size-4 text-blue-600 dark:text-blue-400" />
          </Button>
        )}
      </div>

      {/* Instructions when picking location */}
      {isPickingLocation && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[400] max-w-sm bg-background/95 backdrop-blur border border-blue-200 dark:border-blue-900 shadow-lg rounded-lg p-3 text-xs">
          <p className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 mb-1">
            <Plus className="size-3.5" /> Tap anywhere on the map
          </p>
          <p className="text-muted-foreground">
            Tap or drag the blue pin to pinpoint where the hazard or service problem is located.
          </p>
        </div>
      )}
    </div>
  );
};
