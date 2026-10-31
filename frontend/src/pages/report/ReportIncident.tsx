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
import { LOCAL_JURISDICTION_OFFICES } from "@/types/jurisdiction";
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
  Camera,
  Building2,
  FileCheck2,
  Phone,
  User,
  Hash,
  Copy,
  Printer,
  ChevronRight,
} from "lucide-react";

// Fix Leaflet default marker icons in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEPARTMENT_LOOKUP: Record<string, string> = {
  power_cut: "Power Discom & Street Lighting Division",
  utility_disruption: "Power & Utilities Redressal Cell",
  water_issue: "Water Supply & Works Board",
  water_drainage: "Drainage & Sewerage Board",
  road_hazard: "Public Works & Road Infrastructure (PWD)",
  sanitation: "Solid Waste Management & Sanitation",
  stray_animals: "Veterinary & Stray Animal Control Cell",
  theft_security: "Public Safety & Civil Vigilance Unit",
  safety_concern: "Civil Safety & Vigilance Unit",
  other: "General Civic Redressal Cell",
};

function getNearestOffice(lat: number, lng: number) {
  let nearest = LOCAL_JURISDICTION_OFFICES.find((o) => o.tier !== "apex_central") || LOCAL_JURISDICTION_OFFICES[0];
  let minDist = Infinity;
  for (const off of LOCAL_JURISDICTION_OFFICES) {
    if (off.tier === "apex_central") continue;
    const dLat = ((off.center[0] - lat) * Math.PI) / 180;
    const dLng = ((off.center[1] - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((off.center[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDist) {
      minDist = dist;
      nearest = off;
    }
  }
  return { office: nearest, distanceKm: Number(minDist.toFixed(1)) };
}

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

// Reverse geocode helper from coordinates using OSM Nominatim
const fetchAddressFromCoords = async (lat: number, lng: number) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "SHTCACivic/1.0" } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const ReportIncident: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paramLat = searchParams.get("lat");
  const paramLng = searchParams.get("lng");
  const initialLat = paramLat && !isNaN(parseFloat(paramLat)) ? parseFloat(paramLat) : 26.86081;
  const initialLng = paramLng && !isNaN(parseFloat(paramLng)) ? parseFloat(paramLng) : 75.81854;

  const [coords, setCoords] = useState<[number, number]>([initialLat, initialLng]);

  const nearestAuthority = React.useMemo(() => {
    return getNearestOffice(coords[0], coords[1]);
  }, [coords]);

  // Form State
  const [category, setCategory] = useState<IncidentCategory>("power_cut");
  const [ward, setWard] = useState<string>(nearestAuthority.office.name);
  const [pincode, setPincode] = useState<string>("302017");
  const [landmark, setLandmark] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [reporterName, setReporterName] = useState<string>("");
  const [complainantPhone, setComplainantPhone] = useState<string>("");

  useEffect(() => {
    setWard(nearestAuthority.office.name);
  }, [nearestAuthority]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nearby similar issue detection state
  const [duplicateIncident, setDuplicateIncident] = useState<IncidentItem | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [linkToExisting, setLinkToExisting] = useState(true);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Submitted Receipt State
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    trackingRef: string;
    department: string;
    ward: string;
    title: string;
    isNew: boolean;
    date: string;
  } | null>(null);

  // Leaflet Mini-Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Auto-detect location on initial load if no custom lat/lng query params
  useEffect(() => {
    if (!paramLat && !paramLng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detectedCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCoords(detectedCoords);
          fetchAddressFromCoords(detectedCoords[0], detectedCoords[1]).then((geo) => {
            if (geo?.display_name && !address) {
              setAddress(geo.display_name);
            }
            if (geo?.address?.postcode) {
              setPincode(geo.address.postcode);
            }
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [paramLat, paramLng]);

  // Initialize interactive location picker map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || submittedReceipt) return;

    const map = L.map(mapContainerRef.current, {
      center: coords,
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    // 100% Free OpenStreetMap Clean Tiles (No API key required, zero watermarks)
    const tileUrl = import.meta.env.VITE_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker(coords, { draggable: true }).addTo(map);

    marker.on("dragend", async (e: any) => {
      const position = e.target.getLatLng();
      const newPos: [number, number] = [position.lat, position.lng];
      setCoords(newPos);
      const geo = await fetchAddressFromCoords(newPos[0], newPos[1]);
      if (geo?.display_name) {
        setAddress(geo.display_name);
      }
      if (geo?.address?.postcode) {
        setPincode(geo.address.postcode);
      }
    });

    map.on("click", async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setCoords(newPos);
      const geo = await fetchAddressFromCoords(newPos[0], newPos[1]);
      if (geo?.display_name) {
        setAddress(geo.display_name);
      }
      if (geo?.address?.postcode) {
        setPincode(geo.address.postcode);
      }
    });

    mapInstanceRef.current = map;
    pinMarkerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [submittedReceipt]);

  // Update marker position when coords change externally
  useEffect(() => {
    if (pinMarkerRef.current && mapInstanceRef.current) {
      pinMarkerRef.current.setLatLng(coords);
      mapInstanceRef.current.panTo(coords);
    }
  }, [coords]);

  // Check for nearby matching duplicate incidents when coords or category changes
  useEffect(() => {
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    checkTimerRef.current = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const data = await incidentService.checkDuplicate(category, coords[0], coords[1], 250);
        if (data?.hasNearbyDuplicate && data.incident) {
          setDuplicateIncident(data.incident);
        } else {
          setDuplicateIncident(null);
        }
      } catch (err) {
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
      async (pos) => {
        const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCoords(newCoords);
        toast.success("Location locked to your current coordinates");
        setIsDetectingLocation(false);
        const geo = await fetchAddressFromCoords(newCoords[0], newCoords[1]);
        if (geo?.display_name) {
          setAddress(geo.display_name);
        }
        if (geo?.address?.postcode) {
          setPincode(geo.address.postcode);
        }
      },
      () => {
        toast.error("Unable to retrieve your current location. Please pick location manually on map.");
        setIsDetectingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file size exceeds 8MB limit");
      return;
    }

    setIsUploadingImage(true);
    try {
      const url = await incidentService.uploadEvidence(file);
      setMediaUrls((prev) => [...prev, url]);
      toast.success("Photo evidence attached successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a subject / headline for the grievance");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a detailed description of the civic issue");
      return;
    }

    const resolvedDept = DEPARTMENT_LOOKUP[category] || "General Civic Redressal Cell";

    setIsSubmitting(true);
    try {
      const res = await incidentService.submitReport({
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: coords[0],
        longitude: coords[1],
        address: address.trim(),
        department: resolvedDept,
        ward,
        pincode: pincode.trim(),
        landmark: landmark.trim(),
        reporterName: reporterName.trim() || undefined,
        complainantPhone: complainantPhone.trim() || undefined,
        media: mediaUrls,
        forceNew: true,
      });

      const trackingRef =
        res?.incident?.complaintRef || "JPR-2026-" + Math.floor(10000 + Math.random() * 90000);

      setSubmittedReceipt({
        trackingRef,
        department: resolvedDept,
        ward,
        title: title.trim(),
        isNew: res?.isNewIncident !== false,
        date: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      toast.success(`Grievance registered successfully! Ref: ${trackingRef}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit grievance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If receipt is generated, show official Government Grievance Receipt
  if (submittedReceipt) {
    return (
      <div className="min-h-screen bg-muted/20 text-foreground flex flex-col pb-16">
        {/* Tricolor Header Strip */}
        <div className="h-1 w-full flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <header className="border-b bg-background/95 backdrop-blur py-3 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#003366] text-white">
                <Building2 className="size-5 text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-base text-[#003366] dark:text-blue-300">
                  CivicDesk Grievance Portal
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Citizen Grievance Redressal & Verification System
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs">
              <ArrowLeft className="size-3.5 mr-1" />
              Return to Map
            </Button>
          </div>
        </header>

        <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center">
          <Card className="border-2 border-emerald-500/60 shadow-lg p-6 sm:p-8 bg-card space-y-6">
            <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b">
              <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <FileCheck2 className="size-8" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Grievance Registered Successfully
              </h2>
              <p className="text-xs text-muted-foreground">
                Public Grievance Officially Logged with Department Authority
              </p>
            </div>

            {/* Receipt Summary Details */}
            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border text-xs">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground font-semibold">Grievance Registration No:</span>
                <span className="font-mono font-bold text-sm text-[#003366] dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                  <Hash className="size-3.5 text-blue-600" />
                  {submittedReceipt.trackingRef}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Designated Department:</span>
                  <span className="font-semibold text-foreground text-xs leading-snug">
                    {submittedReceipt.department}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Authority Office / Desk:</span>
                  <span className="font-semibold text-foreground text-xs leading-snug">
                    {submittedReceipt.ward}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Date & Time:</span>
                  <span className="font-medium text-foreground text-xs">{submittedReceipt.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Expected Service SLA:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                    Within 24 Hours (Citizen Charter)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t text-[11px]">
                <span className="text-muted-foreground block">Grievance Subject:</span>
                <p className="font-medium text-foreground mt-0.5">{submittedReceipt.title}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-semibold">Citizen Advisory:</p>
              <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                Your grievance has been forwarded to the designated field engineer and nodal officer. Once on-site inspection and repair are conducted, an Action Taken Report (ATR) will be published live on the portal.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(submittedReceipt.trackingRef);
                  toast.success("Reference Number copied to clipboard!");
                }}
                className="w-full sm:flex-1 text-xs gap-1.5"
              >
                <Copy className="size-3.5" /> Copy Ref No
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="w-full sm:flex-1 text-xs gap-1.5"
              >
                <Printer className="size-3.5" /> Print Receipt
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmittedReceipt(null);
                  setTitle("");
                  setDescription("");
                  setMediaUrls([]);
                }}
                className="w-full sm:flex-1 text-xs gap-1.5"
              >
                Lodge Another Grievance
              </Button>
              <Button
                onClick={() => navigate("/")}
                className="w-full sm:flex-1 text-xs bg-[#003366] hover:bg-[#002244] text-white font-bold gap-1.5"
              >
                Track on Live Map <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const assignedDepartment = DEPARTMENT_LOOKUP[category];

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col pb-16 sm:pb-8">
      {/* Indian Tricolor Strip */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Official Government Top Header */}
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
              <span className="hidden sm:inline">Back to Safety Map</span>
            </Button>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#003366] text-white shadow-xs">
                <Building2 className="size-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  Public Grievance Registration
                </h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  Centralized Civic Grievance Redressal and Monitoring Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs">
              Cancel
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grievance Form */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Department, Category, Details & Proof */}
            <div className="lg:col-span-7 space-y-5">
              {/* Category & Department Selection Card */}
              <Card className="p-4 sm:p-5 border shadow-xs bg-card space-y-3.5">
                <div>
                  <Label className="text-sm font-bold text-foreground block">
                    1. Department & Grievance Category
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select category to automatically route grievance to the competent authority
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
                            ? "border-[#003366] bg-blue-50/80 dark:bg-blue-950/50 ring-2 ring-[#003366]/30 font-semibold"
                            : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between w-full">
                          {getCategoryIcon(cat.id)}
                          {isSelected && <Check className="size-4 text-[#003366] dark:text-blue-400" />}
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

                {/* Auto-routed Department Indicator */}
                <div className="p-2.5 rounded-lg bg-muted/40 border text-xs flex items-center gap-2">
                  <Building2 className="size-4 text-[#003366] dark:text-blue-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Assigned Department:
                    </span>
                    <span className="font-semibold text-foreground truncate block text-xs">
                      {assignedDepartment}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Grievance Subject & Description Card */}
              <Card className="p-4 sm:p-5 border shadow-xs bg-card space-y-4">
                <div>
                  <Label className="text-sm font-bold text-foreground block">
                    2. Grievance Particulars
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Describe the issue clearly for on-ground field inspection and repair
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Headline / Subject <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Main water distribution pipeline burst / Streetlight failure"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Detailed Grievance Description <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what happened, exact location, when problem started, and urgency of repair..."
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
                    <Camera className="size-3.5 text-[#003366] dark:text-blue-400" /> Photo Evidence (Optional)
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
                  <span className="text-[10px] text-muted-foreground block">
                    Upload on-ground photos to accelerate Action Taken Report (ATR) verification.
                  </span>
                </div>
              </Card>

              {/* Complainant Contact Information */}
              <Card className="p-4 sm:p-5 border shadow-xs bg-card space-y-3.5">
                <div>
                  <Label className="text-sm font-bold text-foreground block">
                    3. Complainant Contact Information
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter your name and mobile number for SMS tracking updates and field officer contact
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="reporterName" className="text-xs font-semibold flex items-center gap-1">
                      <User className="size-3 text-muted-foreground" />
                      Complainant Name
                    </Label>
                    <Input
                      id="reporterName"
                      placeholder="e.g. Ramesh Verma"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="complainantPhone" className="text-xs font-semibold flex items-center gap-1">
                      <Phone className="size-3 text-muted-foreground" />
                      Mobile No. (for SMS Updates)
                    </Label>
                    <Input
                      id="complainantPhone"
                      type="tel"
                      placeholder="e.g. 9810XXXXXX"
                      value={complainantPhone}
                      onChange={(e) => setComplainantPhone(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Ward, Landmark, Pincode & Ground Map */}
            <div className="lg:col-span-5 space-y-5">
              {/* Location, Ward & Address Details Card */}
              <Card className="p-4 sm:p-5 border shadow-xs bg-card space-y-3.5">
                <div>
                  <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-4 text-[#003366] dark:text-blue-400" />
                    4. Real-time Location & Map Verification
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pinpoint location on map and provide landmark for field inspection
                  </p>
                </div>

                {/* Auto-Assigned Nearest Jurisdiction */}
                <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-3.5 flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
                    🏛️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">
                        {nearestAuthority.office.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                        {nearestAuthority.distanceKm} km away &bull; Nearest Authority
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {nearestAuthority.office.office} &bull; Hotline: {nearestAuthority.office.contactNumber}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                      <Check className="size-3.5" />
                      Auto-routed from your GPS pin. No manual zone selection required.
                    </p>
                  </div>
                </div>

                {/* Landmark & Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="landmark" className="text-xs font-semibold">
                      Landmark
                    </Label>
                    <Input
                      id="landmark"
                      placeholder="e.g. Near Mother Dairy / Gate 3"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pincode" className="text-xs font-semibold">
                      Pincode
                    </Label>
                    <Input
                      id="pincode"
                      placeholder="e.g. 110092"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="text-xs h-9"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Colony / Street Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="e.g. Vikas Marg, Near Mother Dairy, Block B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                {/* Interactive Leaflet Ground Map */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Drop Pin on Map
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="h-7 text-xs gap-1"
                    >
                      {isDetectingLocation ? (
                        <Spinner className="size-3" />
                      ) : (
                        <Crosshair className="size-3 text-[#003366] dark:text-blue-400" />
                      )}
                      Current GPS
                    </Button>
                  </div>

                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border shadow-2xs">
                    <div ref={mapContainerRef} className="size-full" />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono bg-muted/40 p-2 rounded-lg border">
                    <span>Lat: {coords[0].toFixed(5)}</span>
                    <span>•</span>
                    <span>Lng: {coords[1].toFixed(5)}</span>
                  </div>
                </div>
              </Card>

              {/* Nearby Similar Incident Alert Card */}
              {isCheckingDuplicate && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 text-xs text-muted-foreground">
                  <Spinner className="size-3.5 text-blue-600" />
                  <span>Checking for similar open reports nearby...</span>
                </div>
              )}

              {duplicateIncident && !isCheckingDuplicate && (
                <Card className="rounded-xl border-2 border-blue-300 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 p-4 space-y-3 transition-all shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#003366] text-white shrink-0 shadow-xs">
                      <Layers className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="size-3 text-blue-600" />
                          Similar Issue Reported Nearby
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground leading-snug mt-1">
                        {duplicateIncident.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Ref: {duplicateIncident.complaintRef || "Active Ticket"} • {duplicateIncident.reportCount || 1} existing report{(duplicateIncident.reportCount || 1) > 1 ? "s" : ""}
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
                          <strong>Link to existing grievance (Recommended):</strong> Attaches your photos & details to this active municipal ticket to elevate repair priority.
                        </span>
                      ) : (
                        <span>
                          <strong>Submit as a separate grievance:</strong> Will create an independent ticket for municipal inspection.
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
                  className="w-full bg-[#003366] hover:bg-[#002244] text-white font-bold h-11 text-sm shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2" />
                      Registering Grievance...
                    </>
                  ) : duplicateIncident && linkToExisting ? (
                    "Add Details to Existing Ticket"
                  ) : (
                    "Submit Public Grievance"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="w-full text-xs"
                >
                  Cancel and Return to Portal
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
