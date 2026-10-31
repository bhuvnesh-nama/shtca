import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet.heat";
import type { IncidentItem } from "@/types/incident";
import type { LocalOfficeJurisdiction } from "@/types/jurisdiction";
import { Button } from "@/components/ui/button";
import {
  Crosshair,
  Plus,
  Minus,
  Flame,
  MapPin,
  Layers,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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
  initialMode?: "pins" | "heatmap" | "hybrid";
  isAdmin?: boolean;
  onOpenStatusModal?: (incident: IncidentItem) => void;
  onIncidentUpdated?: (updated: IncidentItem) => void;
  showCategoryChips?: boolean;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  activeOffice?: LocalOfficeJurisdiction;
  offices?: LocalOfficeJurisdiction[];
  onSelectOffice?: (officeId: string) => void;
}

type MapTheme = "streets" | "light" | "satellite";
type MapMode = "pins" | "heatmap" | "hybrid";

const customTilesUrl = import.meta.env.VITE_MAP_TILES_URL || "";

const getStreetsTileUrl = () => {
  if (customTilesUrl) return customTilesUrl;
  // 100% Free OpenStreetMap: Global Street Detail, No Watermark, No API Key Required
  return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
};

const getLightTileUrl = () => {
  if (customTilesUrl) return customTilesUrl;
  // 100% Free OpenStreetMap: Global Street Detail, No Watermark, No API Key Required
  return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
};

const TILE_CONFIGS: Record<MapTheme, { url: string; attribution: string; subdomains?: string; maxZoom: number }> = {
  streets: {
    url: getStreetsTileUrl(),
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  light: {
    url: getLightTileUrl(),
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
};

const CATEGORY_CHIPS = [
  { id: "all", label: "All", icon: "🌐" },
  { id: "road_hazard", label: "Potholes & Roads", icon: "🚧" },
  { id: "water_issue", label: "Water & Drainage", icon: "💧" },
  { id: "power_cut", label: "Power Disruption", icon: "⚡" },
  { id: "sanitation", label: "Sanitation & Waste", icon: "🗑️" },
  { id: "stray_animals", label: "Stray Animals", icon: "🐕" },
  { id: "theft_security", label: "Security & Safety", icon: "🛡️" },
];

const getSeverityColor = (severity: string) => {
  if (severity === "critical" || severity === "high") return "#e11d48"; // rose red
  if (severity === "medium") return "#d97706"; // amber orange
  if (severity === "low") return "#059669"; // emerald green
  return "#2563eb"; // blue
};

// SVG category icons inside circular pins matching reference image
const getCategorySvg = (category: string) => {
  switch (category) {
    case "road_hazard":
      return `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    case "power_cut":
    case "utility_disruption":
      return `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case "water_issue":
    case "water_drainage":
      return `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case "sanitation":
      return `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    case "stray_animals":
      return `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/></svg>`;
    default:
      return `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  }
};

// Marker icon matching reference screenshot: colored round icon with category inside
const getMarkerIcon = (category: string, severity: string, isSelected: boolean, reportCount: number = 1) => {
  const color = getSeverityColor(severity);
  const size = isSelected ? 36 : 30;
  const isCluster = reportCount > 1;

  const clusterBadgeHtml = isCluster
    ? `<div style="
        position: absolute;
        top: -7px;
        right: -7px;
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
      ">+${reportCount}</div>`
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
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
      cursor: pointer;
      transition: transform 0.15s ease;
      ${isSelected ? "transform: scale(1.22); z-index: 1000; box-shadow: 0 0 0 4px rgba(37,99,235,0.4);" : ""}
    ">
      <div style="display: flex; align-items: center; justify-content: center;">
        ${getCategorySvg(category)}
      </div>
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

const getHybridMarkerIcon = (severity: string) => {
  const color = getSeverityColor(severity);
  const html = `
    <div style="
      width: 14px;
      height: 14px;
      background-color: ${color};
      border: 2px solid #ffffff;
      border-radius: 9999px;
      box-shadow: 0 0 8px ${color}, 0 2px 4px rgba(0,0,0,0.4);
      cursor: pointer;
    "></div>
  `;
  return L.divIcon({
    className: "custom-hybrid-pin",
    html,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
};

const getUserLocationIcon = () => {
  return L.divIcon({
    className: "custom-user-location-pin",
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.45); z-index: 2;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const pickPinIcon = L.divIcon({
  className: "custom-pick-pin",
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
      <div style="background-color: #2563eb; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; margin-bottom: 2px;">
        Incident Location
      </div>
      <div style="width: 18px; height: 18px; background-color: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [0, 0],
});

const getOfficeMarkerIcon = (tier: string, isCurrent: boolean) => {
  const iconEmoji = tier === "apex_central" ? "🏛️" : tier === "local_society" ? "🏡" : "🏢";
  const bg = tier === "apex_central" ? "#4f46e5" : tier === "local_society" ? "#059669" : "#0284c7";
  const size = isCurrent ? 40 : 32;

  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background-color: ${bg};
        color: white;
        border-radius: 10px;
        border: 2.5px solid white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        font-size: ${isCurrent ? 18 : 15}px;
        ${isCurrent ? "outline: 3px solid #10b981; transform: scale(1.15);" : ""}
        transition: transform 0.15s ease;
      ">
        ${iconEmoji}
      </div>
      <div style="
        margin-top: 2px;
        background: #0f172a;
        color: #f8fafc;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      ">HQ</div>
    </div>
  `;

  return L.divIcon({
    className: "custom-office-pin",
    html,
    iconSize: [size, size + 16],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
};

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
  initialMode = "pins",
  isAdmin = false,
  onOpenStatusModal: _onOpenStatusModal,
  onIncidentUpdated: _onIncidentUpdated,
  showCategoryChips = true,
  activeCategory: parentCategory,
  onSelectCategory: parentSelectCategory,
  activeOffice,
  offices = [],
  onSelectOffice,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const officesLayerRef = useRef<L.LayerGroup | null>(null);
  const jurisdictionCircleRef = useRef<L.Circle | null>(null);
  const heatLayerRef = useRef<any>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const onLocationPickRef = useRef(onLocationPick);

  // States
  const [mapMode, setMapMode] = useState<MapMode>(initialMode);
  const [mapTheme, setMapTheme] = useState<MapTheme>("streets");
  const [isLocating, setIsLocating] = useState(false);
  const [internalCategory, setInternalCategory] = useState("all");

  const activeCategory = parentCategory !== undefined ? parentCategory : internalCategory;

  const handleCategoryClick = (catId: string) => {
    if (parentSelectCategory) {
      parentSelectCategory(catId);
    } else {
      setInternalCategory(catId);
    }
  };

  useEffect(() => {
    onLocationPickRef.current = onLocationPick;
  }, [onLocationPick]);

  // Filter incidents for display based on category chip
  const displayedIncidents = useMemo(() => {
    if (activeCategory === "all") return incidents;
    return incidents.filter((i) => i.category === activeCategory);
  }, [incidents, activeCategory]);

  const handleModeChange = (mode: MapMode) => {
    setMapMode(mode);
    if (mode === "heatmap" && mapTheme === "satellite") {
      setMapTheme("streets");
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = userLocation || [26.86081, 75.81854];
    const initialZoom = userLocation ? 14 : 13;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });

    const cfg = TILE_CONFIGS[mapTheme];
    const initialTileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      subdomains: cfg.subdomains || "abc",
      maxZoom: cfg.maxZoom,
    }).addTo(map);

    tileLayerRef.current = initialTileLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const officesLayer = L.layerGroup().addTo(map);
    officesLayerRef.current = officesLayer;

    mapInstanceRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onLocationPickRef.current) {
        onLocationPickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      if (jurisdictionCircleRef.current) {
        jurisdictionCircleRef.current.remove();
        jurisdictionCircleRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Map Tile Theme
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_CONFIGS[mapTheme];
    const newTileLayer = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      subdomains: cfg.subdomains || "abc",
      maxZoom: cfg.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapTheme]);

  // Update user location pin and fly to it
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const [lat, lng] = userLocation;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      userMarkerRef.current = L.marker(userLocation, {
        icon: getUserLocationIcon(),
        zIndexOffset: 1200,
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; padding: 2px;">
            <b style="color: #2563eb; display: block; margin-bottom: 2px;">📍 Your Live Location</b>
            <span style="color: #64748b; font-size: 11px;">Active high-accuracy device coordinates</span>
          </div>
        `);
    }

    if (userCircleRef.current) {
      userCircleRef.current.setLatLng(userLocation);
    } else {
      userCircleRef.current = L.circle(userLocation, {
        radius: 120,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map);
    }

    map.flyTo([lat, lng], 15, { animate: true, duration: 1.0 });
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

  // Render incident markers & heatmap layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Render Heatmap if in "heatmap" or "hybrid" mode
    if (mapMode === "heatmap" || mapMode === "hybrid") {
      const heatPoints: [number, number, number][] = [];

      displayedIncidents.forEach((incident) => {
        if (!incident.location?.coordinates || incident.location.coordinates.length < 2) return;
        const [lng, lat] = incident.location.coordinates;
        const reportCount = incident.reportCount || (Array.isArray(incident.reports) ? incident.reports.length : 1);

        let baseIntensity = 0.55;
        if (incident.severity === "critical") baseIntensity = 1.0;
        else if (incident.severity === "high") baseIntensity = 0.85;
        else if (incident.severity === "medium") baseIntensity = 0.65;
        else if (incident.severity === "low") baseIntensity = 0.45;

        const intensity = Math.min(1.0, baseIntensity + (reportCount - 1) * 0.15);
        heatPoints.push([lat, lng, intensity]);

        // Micro-splays for thermal cloud realism
        const splays = Math.min(Math.max(reportCount * 2, 4), 6);
        for (let i = 0; i < splays; i++) {
          const angle = (i * Math.PI * 2) / splays;
          const dist = 0.00038 + (i % 2) * 0.00018;
          heatPoints.push([
            lat + Math.sin(angle) * dist,
            lng + Math.cos(angle) * dist,
            intensity * 0.78,
          ]);
        }
      });

      if (heatPoints.length > 0) {
        const heat = (L as any).heatLayer(heatPoints, {
          radius: 36,
          blur: 24,
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.38,
          gradient: {
            0.15: "#2563eb",
            0.35: "#06b6d4",
            0.55: "#22c55e",
            0.75: "#eab308",
            0.88: "#f97316",
            1.00: "#ef4444",
          },
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      }
    }

    // Render Pins if in "pins" or "hybrid" mode
    if (mapMode === "pins" || mapMode === "hybrid") {
      displayedIncidents.forEach((incident) => {
        if (!incident.location?.coordinates || incident.location.coordinates.length < 2) return;

        const [lng, lat] = incident.location.coordinates;
        const isSelected = selectedIncident?._id === incident._id;
        const reportCount = incident.reportCount || (Array.isArray(incident.reports) ? incident.reports.length : 1);

        const ticketId = incident.complaintRef || `ANO-${incident._id.slice(-6).toUpperCase()}`;
        const isSevere = incident.severity === "critical" || incident.severity === "high";

        // Floating Popup Card matching reference image
        const popupContent = `
          <div style="font-family: inherit; width: 230px; padding: 4px; border-radius: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 800; color: #1e3a8a;">
                ${ticketId}
              </span>
              <div style="display: flex; gap: 4px;">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 5px; border-radius: 9999px; background: ${isSevere ? "#e11d48" : "#d97706"}; color: white;">
                  ${isSevere ? "Severe" : "Moderate"}
                </span>
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 5px; border-radius: 9999px; background: #10b981; color: white;">
                  Ongoing
                </span>
              </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #64748b;">
                <span>Ticket Raised On</span>
                <b style="color: #0f172a;">${new Date(incident.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</b>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #64748b;">
                <span>Incident Type</span>
                <b style="color: #2563eb;">${incident.category.replace("_", " ")}</b>
              </div>
              <div style="color: #64748b; font-size: 10px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                📍 ${incident.address || "Society area"}
              </div>
            </div>

            <button id="inspect-incident-${incident._id}" style="
              width: 100%;
              background-color: #003366;
              color: white;
              border: none;
              border-radius: 6px;
              padding: 6px 10px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">
              View Full Grievance Details →
            </button>
          </div>
        `;

        const icon =
          mapMode === "hybrid"
            ? getHybridMarkerIcon(incident.severity)
            : getMarkerIcon(incident.category, incident.severity, isSelected, reportCount);

        const marker = L.marker([lat, lng], { icon });
        marker.bindPopup(popupContent);

        marker.on("click", () => {
          onSelectIncident(incident);
        });

        marker.on("popupopen", () => {
          const btn = document.getElementById(`inspect-incident-${incident._id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectIncident(incident);
            };
          }
        });

        marker.addTo(markersLayer);
      });
    }
  }, [displayedIncidents, selectedIncident, onSelectIncident, mapMode]);

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
      map.flyTo([lat, lng], 16, { animate: true, duration: 1.0 });
    }
  }, [selectedIncident]);

  // Fly to Active Office and Draw Jurisdiction Boundary
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeOffice) return;

    map.flyTo(activeOffice.center, activeOffice.zoom, {
      animate: true,
      duration: 1.2,
    });

    // Update jurisdiction boundary circle
    if (jurisdictionCircleRef.current) {
      jurisdictionCircleRef.current.remove();
      jurisdictionCircleRef.current = null;
    }

    if (activeOffice.id !== "AUTH-APEX-01") {
      const color = activeOffice.tier === "local_society" ? "#059669" : "#0284c7";
      const circle = L.circle(activeOffice.center, {
        radius: activeOffice.radiusKm * 1000,
        color: color,
        weight: 2,
        dashArray: "6, 8",
        fillColor: color,
        fillOpacity: 0.08,
      }).addTo(map);
      jurisdictionCircleRef.current = circle;
    }
  }, [activeOffice]);

  // Render Office Headquarters Pins on Map for Officers & Admins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const officesLayer = officesLayerRef.current;
    if (!map || !officesLayer) return;

    officesLayer.clearLayers();

    if (!isAdmin || !offices || offices.length === 0) return;

    offices.forEach((office) => {
      const isCurrent = activeOffice?.id === office.id;
      const icon = getOfficeMarkerIcon(office.tier, isCurrent);

      const marker = L.marker(office.center, {
        icon,
        zIndexOffset: isCurrent ? 1500 : 900,
      });

      const popupHtml = `
        <div style="font-family: inherit; width: 230px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="font-size: 20px;">${office.icon}</div>
            <div>
              <b style="font-size: 13px; color: #003366; display: block; line-height: 1.2;">${office.shortName}</b>
              <span style="font-size: 9px; font-weight: 800; color: #2563eb; text-transform: uppercase;">${office.tierBadge}</span>
            </div>
          </div>
          <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">
            📍 ${office.office}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
            <b>Jurisdiction:</b> ${office.areaLabel} (${office.radiusKm} km radius)
          </div>
          <button id="switch-office-btn-${office.id}" style="
            width: 100%;
            background-color: #003366;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.25);
          ">
            ${isCurrent ? "✓ Active Local Queue" : "Focus this Local Jurisdiction →"}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`switch-office-btn-${office.id}`);
        if (btn && onSelectOffice) {
          btn.onclick = () => {
            onSelectOffice(office.id);
            toast.success(`Switched active jurisdiction to ${office.shortName}`);
            marker.closePopup();
          };
        }
      });

      marker.addTo(officesLayer);
    });
  }, [isAdmin, offices, activeOffice, onSelectOffice]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    toast.info("Acquiring high-precision GPS position...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo(coords, 16, { animate: true, duration: 1.2 });
        }
        if (onDetectLocation) {
          onDetectLocation();
        }
        toast.success("Map centered on your real location");
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Could not acquire location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onDetectLocation]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border shadow-xs bg-muted">
      {/* 1. Leaflet Canvas Container */}
      <div ref={mapContainerRef} className={`w-full ${heightClass}`} />

      {/* 2. Top Floating Horizontal Category Chips Bar matching reference image */}
      {showCategoryChips && (
        <div className="absolute top-3 left-3 sm:left-48 right-16 z-[400] flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleCategoryClick(chip.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm backdrop-blur-md transition-all ${
                  isActive
                    ? "bg-[#003366] text-white shadow-md ring-2 ring-blue-400 font-bold"
                    : "bg-background/95 hover:bg-background text-foreground/80 hover:text-foreground border border-border/70"
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
                {chip.id !== "all" && (
                  <span className="text-[10px] opacity-75">
                    ({incidents.filter((i) => i.category === chip.id).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Local Jurisdiction Indicator Pill for Authorities & Officers */}
      {isAdmin && activeOffice && (
        <div className="absolute top-14 left-3 z-[400] hidden sm:flex items-center gap-2 bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border shadow-sm text-xs font-semibold">
          <span className="text-base">{activeOffice.icon}</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
              Jurisdiction Office
            </span>
            <span className="font-bold text-foreground truncate max-w-[220px]">
              {activeOffice.shortName}
            </span>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
            {displayedIncidents.length} Local Records
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              mapInstanceRef.current?.flyTo(activeOffice.center, activeOffice.zoom, { animate: true, duration: 1 });
            }}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground border border-border/60"
            title="Pan to Office HQ"
          >
            Center HQ
          </Button>
        </div>
      )}

      {/* 4. Floating Mode Switcher (Pins vs Heatmap vs Hybrid) - Top Left */}
      <div className="absolute top-3 left-3 z-[400] hidden sm:flex items-center rounded-lg border border-border bg-background/95 backdrop-blur shadow-sm p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => handleModeChange("pins")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            mapMode === "pins"
              ? "bg-blue-600 text-white shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Show standard incident pins"
        >
          <MapPin className="size-3" />
          Pins
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("heatmap")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            mapMode === "heatmap"
              ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Show continuous thermal hazard density heatmap"
        >
          <Flame className="size-3" />
          Heatmap
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("hybrid")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            mapMode === "hybrid"
              ? "bg-purple-600 text-white shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Show thermal heatmap with clickable incident pins"
        >
          <Layers className="size-3" />
          Hybrid
        </button>
      </div>

      {/* 5. Map Tile Theme Switcher (Streets / Light / Satellite) - Bottom Right Floating */}
      <div className="absolute bottom-5 right-14 z-[400] hidden md:flex items-center rounded-lg border border-border bg-background/95 backdrop-blur shadow-sm p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMapTheme("streets")}
          className={`px-2 py-0.5 rounded text-[11px] transition-all ${
            mapTheme === "streets" ? "bg-slate-900 text-white font-bold" : "text-muted-foreground"
          }`}
        >
          Streets
        </button>
        <button
          type="button"
          onClick={() => setMapTheme("light")}
          className={`px-2 py-0.5 rounded text-[11px] transition-all ${
            mapTheme === "light" ? "bg-slate-900 text-white font-bold" : "text-muted-foreground"
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setMapTheme("satellite")}
          className={`px-2 py-0.5 rounded text-[11px] transition-all ${
            mapTheme === "satellite" ? "bg-slate-900 text-white font-bold" : "text-muted-foreground"
          }`}
        >
          Satellite
        </button>
      </div>

      {/* 6. Floating Action Controls - Top Right */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="size-9 rounded-lg p-0 bg-background/95 backdrop-blur shadow-md hover:bg-background border border-border text-blue-600 dark:text-blue-400"
          title="Center on my real location"
        >
          {isLocating ? (
            <Loader2 className="size-4 animate-spin text-blue-600" />
          ) : (
            <Crosshair className="size-4" />
          )}
        </Button>

        <div className="flex flex-col rounded-lg border border-border bg-background/95 backdrop-blur shadow-md overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="size-9 flex items-center justify-center text-foreground hover:bg-muted border-b border-border/60 transition-colors"
            title="Zoom In"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="size-9 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            title="Zoom Out"
          >
            <Minus className="size-4" />
          </button>
        </div>
      </div>

      {/* 7. Continuous Thermal Heatmap Density Legend - Bottom Left */}
      {(mapMode === "heatmap" || mapMode === "hybrid") && (
        <div className="absolute bottom-5 left-3 sm:left-4 z-[400] bg-background/95 backdrop-blur border border-border shadow-md rounded-lg p-2.5 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between gap-4 text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Flame className="size-3.5 text-rose-500 animate-pulse" />
              Grievance Thermal Density
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold px-1.5 py-0.5 rounded bg-muted">
              {displayedIncidents.length} Records
            </span>
          </div>

          <div className="h-2.5 w-48 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-green-500 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />

          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
            <span>Low</span>
            <span>Moderate</span>
            <span className="font-semibold text-rose-600">Critical Hotspot</span>
          </div>
        </div>
      )}

      {/* 8. Instructions when picking location */}
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
