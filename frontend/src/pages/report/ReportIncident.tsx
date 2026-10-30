import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORIES_CONFIG, type IncidentCategory, type IncidentItem } from "@/types/incident";
import { incidentService } from "@/services/incidentService";
import { toast } from "sonner";
import {
  ArrowLeft,
  Crosshair,
  Upload,
  AlertTriangle,
  Droplets,
  Trash2,
  Zap,
  ShieldAlert,
  Dog,
  HelpCircle,
  X,
  MapPin,
  Check,
  Layers,
  Sparkles,
  Shield,
  Camera,
} from "lucide-react";

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

const getCategoryIcon = (category: IncidentCategory | string) => {
  switch (category) {
    case "power_cut":
    case "utility_disruption":
      return <Zap className="size-5 text-amber-500" />;
    case "water_issue":
    case "water_drainage":
      return <Droplets className="size-5 text-blue-500" />;
    case "theft_security":
    case "safety_concern":
      return <ShieldAlert className="size-5 text-rose-500" />;
    case "stray_animals":
      return <Dog className="size-5 text-orange-500" />;
    case "road_hazard":
      return <AlertTriangle className="size-5 text-yellow-600" />;
    case "sanitation":
      return <Trash2 className="size-5 text-emerald-600" />;
    default:
      return <HelpCircle className="size-5 text-slate-500" />;
  }
};

const ReportIncident: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paramLat = searchParams.get("lat");
  const paramLng = searchParams.get("lng");
  const initialLat = paramLat && !isNaN(parseFloat(paramLat)) ? parseFloat(paramLat) : 28.6304;
  const initialLng = paramLng && !isNaN(parseFloat(paramLng)) ? parseFloat(paramLng) : 77.2177;

  const [category, setCategory] = useState<IncidentCategory>("power_cut");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number]>([initialLat, initialLng]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-Cluster Duplicate Detection State
  const [duplicateIncident, setDuplicateIncident] = useState<IncidentItem | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [linkToExisting, setLinkToExisting] = useState(true);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Leaflet Mini-Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Initialize interactive location picker map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: coords,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
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
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            white-space: nowrap;
            margin-bottom: 2px;
          ">
            Hazard Spot
          </div>
          <div style="
            width: 18px;
            height: 18px;
            background-color: #2563eb;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0,0,0,0.35);
          "></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const marker = L.marker(coords, { icon: pinIcon, draggable: true }).addTo(map);
    pinMarkerRef.current = marker;
    mapInstanceRef.current = map;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setCoords([pos.lat, pos.lng]);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setCoords([e.latlng.lat, e.latlng.lng]);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync marker position when coords update
  useEffect(() => {
    if (mapInstanceRef.current && pinMarkerRef.current) {
      pinMarkerRef.current.setLatLng(coords);
      mapInstanceRef.current.panTo(coords);
    }
  }, [coords]);

  // Request browser geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  // Live duplicate checking when category or coordinates change
  useEffect(() => {
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    checkTimerRef.current = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const res = await incidentService.checkDuplicate(category, coords[0], coords[1], 300);
        if (res && res.hasNearbyDuplicate && res.incident) {
          setDuplicateIncident(res.incident);
          setLinkToExisting(true);
        } else {
          setDuplicateIncident(null);
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
        setDuplicateIncident(null);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 450);

    return () => {
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
      }
    };
  }, [category, coords]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setCoords(newCoords);
        setIsDetectingLocation(false);
        toast.success("Location set from device GPS");
      },
      (error) => {
        setIsDetectingLocation(false);
        toast.error("Unable to retrieve GPS: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    setIsUploadingImage(true);
    try {
      const url = await incidentService.uploadEvidence(file);
      setMediaUrls((prev) => [...prev, url]);
      toast.success("Evidence photo attached");
    } catch (err: any) {
      toast.error("Failed to upload image: " + (err.message || "Network error"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a short headline for this issue");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe the incident and its current impact");
      return;
    }

    const forceNew = duplicateIncident ? !linkToExisting : false;

    setIsSubmitting(true);
    try {
      const res = await incidentService.submitReport({
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: coords[0],
        longitude: coords[1],
        address: address.trim(),
        media: mediaUrls,
        forceNew,
      });

      if (res?.isNewIncident === false) {
        toast.success("Report auto-clustered with nearby active incident!");
      } else {
        toast.success("Report submitted! It is now live on the community map.");
      }

      navigate("/");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col pb-16 sm:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur shadow-xs">
        <div className="max-w-5xl mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to Map</span>
            </Button>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2">
              <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Shield className="size-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  Report Local Hazard / Issue
                </h1>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Community Safety & Municipal Service Alert
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Category, Headline, Details & Photo */}
            <div className="lg:col-span-7 space-y-5">
              {/* Category Picker */}
              <Card className="p-4 sm:p-5 border shadow-xs bg-card">
                <div className="mb-3">
                  <Label className="text-sm font-bold text-foreground block">
                    1. Select Hazard Category
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Categorize the issue so neighbours and RWA staff receive targeted alerts
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORIES_CONFIG.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 ring-2 ring-blue-600/30 font-semibold"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between w-full">
                          {getCategoryIcon(cat.id)}
                          {isSelected && <Check className="size-4 text-blue-600" />}
                        </div>
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {cat.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Title & Description */}
              <Card className="p-4 sm:p-5 border shadow-xs bg-card space-y-4">
                <div>
                  <Label className="text-sm font-bold text-foreground block">
                    2. Describe the Incident
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Provide clear headline and current on-ground situation
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Incident Headline <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Basement transformer spark / Stray dogs barking near park"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Details & Impact on Residents <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what happened, current severity, affected blocks, and if maintenance or security was alerted..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                    required
                  />
                </div>

                {/* Photo Evidence */}
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Camera className="size-3.5 text-blue-600" /> Photo Evidence (Optional)
                  </Label>

                  <div className="flex flex-wrap gap-2.5 items-center">
                    {mediaUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative size-20 rounded-lg overflow-hidden border border-border group shadow-xs"
                      >
                        <img src={url} alt="Evidence" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 size-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}

                    <label className="flex flex-col items-center justify-center size-20 rounded-lg border-2 border-dashed border-input hover:border-blue-500 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                      {isUploadingImage ? (
                        <Spinner className="size-4" />
                      ) : (
                        <>
                          <Upload className="size-5 text-muted-foreground mb-1" />
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            Upload
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Location Map & Auto-Cluster Candidate */}
            <div className="lg:col-span-5 space-y-5">
              {/* Interactive Location Picker */}
              <Card className="p-4 sm:p-5 border shadow-xs bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="size-4 text-blue-600" />
                      3. Pinpoint Location
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tap or drag the pin on the map to mark exact spot
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="h-8 text-xs gap-1"
                  >
                    {isDetectingLocation ? (
                      <Spinner className="size-3" />
                    ) : (
                      <Crosshair className="size-3.5 text-blue-600" />
                    )}
                    Use GPS
                  </Button>
                </div>

                {/* Interactive Leaflet Mini-Map */}
                <div className="relative w-full h-52 rounded-xl overflow-hidden border border-border shadow-2xs">
                  <div ref={mapContainerRef} className="size-full" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono bg-muted/40 p-2 rounded-lg border">
                  <span>Lat: {coords[0].toFixed(5)}</span>
                  <span>•</span>
                  <span>Lng: {coords[1].toFixed(5)}</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Apartment Block / Landmark Note
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g. Greenwood Residency, Block C, Gate 2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </Card>

              {/* Auto-Cluster Duplicate Detection Card (Bonus Twist 1) */}
              {isCheckingDuplicate && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 text-xs text-muted-foreground">
                  <Spinner className="size-3.5 text-blue-600" />
                  <span>Scanning neighbourhood for nearby matching reports...</span>
                </div>
              )}

              {duplicateIncident && !isCheckingDuplicate && (
                <Card className="rounded-xl border-2 border-blue-300 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 p-4 space-y-3 transition-all shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
                      <Layers className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="size-3 text-blue-600" />
                          Auto-Cluster Candidate Detected
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground leading-snug mt-1">
                        {duplicateIncident.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {duplicateIncident.address || "Nearby in this neighbourhood"} •{" "}
                        {duplicateIncident.reportCount || 1} existing report
                        {(duplicateIncident.reportCount || 1) > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200 dark:border-blue-900 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="link-cluster-checkbox-page"
                      checked={linkToExisting}
                      onChange={(e) => setLinkToExisting(e.target.checked)}
                      className="size-4 mt-0.5 rounded-sm border-blue-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="link-cluster-checkbox-page"
                      className="text-xs font-medium text-foreground cursor-pointer select-none leading-relaxed"
                    >
                      {linkToExisting ? (
                        <span>
                          <strong>Corroborate existing cluster (Recommended):</strong> Links your
                          details & photos directly to this active issue to elevate community
                          priority.
                        </span>
                      ) : (
                        <span>
                          <strong>Post as a separate incident:</strong> Will create an independent
                          pin on the map.
                        </span>
                      )}
                    </label>
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || isUploadingImage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Submitting Report...
                    </>
                  ) : duplicateIncident && linkToExisting ? (
                    "Corroborate & Link Cluster"
                  ) : (
                    "Submit Hazard Report"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full text-xs"
                >
                  Cancel and Return to Safety Map
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ReportIncident;
