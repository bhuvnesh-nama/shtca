import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORIES_CONFIG, type IncidentCategory, type IncidentItem } from "@/types/incident";
import { resolveNearestJurisdiction } from "@/types/jurisdiction";
import { incidentService } from "@/services/incidentService";
import { toast } from "sonner";
import {
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
  Building2,
} from "lucide-react";

interface ReportIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialLocation?: [number, number] | null;
  onTriggerMapPinSelect?: () => void;
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

export const ReportIncidentDialog: React.FC<ReportIncidentDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialLocation,
  onTriggerMapPinSelect,
}) => {
  const [category, setCategory] = useState<IncidentCategory>("power_cut");
  const [pincode, setPincode] = useState("110092");
  const [landmark, setLandmark] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number]>(
    initialLocation || [26.86081, 75.81854]
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-resolve nearest municipal authority jurisdiction based on GPS coords
  const assignedJurisdiction = useMemo(() => {
    return resolveNearestJurisdiction(coords[0], coords[1]);
  }, [coords]);

  // Nearby similar issue detection state
  const [duplicateIncident, setDuplicateIncident] = useState<IncidentItem | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [linkToExisting, setLinkToExisting] = useState(true);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setCoords(initialLocation);
    }
  }, [initialLocation]);

  // Live duplicate checking when category or coordinates change
  useEffect(() => {
    if (!open) return;

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
  }, [category, coords, open]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords([position.coords.latitude, position.coords.longitude]);
        setIsDetectingLocation(false);
        toast.success("Location detected via device GPS");
      },
      (error) => {
        setIsDetectingLocation(false);
        toast.error("Unable to retrieve GPS location: " + error.message);
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
      toast.success("Evidence photo uploaded");
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
      toast.error("Please enter a short issue title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe the incident");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await incidentService.submitReport({
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: coords[0],
        longitude: coords[1],
        address: address.trim(),
        ward: assignedJurisdiction.desk.id,
        pincode: pincode.trim(),
        landmark: landmark.trim(),
        complainantPhone: complainantPhone.trim(),
        media: mediaUrls,
        forceNew: true,
      });

      if (res?.isNewIncident === false) {
        toast.success("Report registered with authority desk!");
      } else {
        const ref = res?.incident?.complaintRef || "CIVIC-2026-XXXX";
        toast.success(`Grievance registered successfully! Ref: ${ref}`);
      }

      onSuccess();
      onOpenChange(false);

      setTitle("");
      setDescription("");
      setAddress("");
      setLandmark("");
      setMediaUrls([]);
      setDuplicateIncident(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-[#003366] text-amber-400 text-xs font-bold shadow-xs">
              CIVIC
            </span>
            <DialogTitle className="text-lg font-bold">
              Public Grievance Registration
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Public Grievance Redressal and Monitoring System. Directly dispatched to the designated authority cell.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Municipal Jurisdiction Routing & Contact */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg border border-blue-200/80 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900/40">
              <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1">
                <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold">
                  <Building2 className="size-3.5" /> Auto-Dispatched Municipal Office
                </span>
                <span className="text-[10px] text-muted-foreground font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
                  {assignedJurisdiction.distanceKm < 9999 ? `~${assignedJurisdiction.distanceKm} km away` : "Auto Resolved"}
                </span>
              </div>
              <div className="text-xs font-medium text-foreground">
                {assignedJurisdiction.desk.name} ({assignedJurisdiction.desk.office})
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Jurisdiction: {assignedJurisdiction.desk.areaLabel} • Zonal Node: <code className="font-mono text-[10px] bg-muted px-1 py-0.2 rounded">{assignedJurisdiction.desk.id}</code>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mobile No. (SMS Alert)</Label>
              <Input
                placeholder="e.g. 9810XXXXXX"
                value={complainantPhone}
                onChange={(e) => setComplainantPhone(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Grievance Category</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES_CONFIG.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-[#003366] bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-[#003366] font-medium"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between w-full">
                      {getCategoryIcon(cat.id)}
                      {isSelected && <Check className="size-3.5 text-[#003366] dark:text-blue-400" />}
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-semibold">
              Headline / Subject <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Drinking water pipeline burst / Deep road pothole"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-8"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs font-semibold">
              Description <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what happened, exact location, when problem started, and urgency of repair..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-xs resize-none"
              required
            />
          </div>

          {/* Landmark & Pincode */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Landmark</Label>
              <Input
                placeholder="e.g. Near Mother Dairy / Gate 3"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Pincode</Label>
              <Input
                placeholder="e.g. 110092"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="text-xs h-8"
                maxLength={6}
              />
            </div>
          </div>

          {/* Location Picker */}
          <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="size-3.5 text-blue-600" /> Incident Location
              </Label>
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
                  <Crosshair className="size-3 text-blue-600" />
                )}
                Use GPS
              </Button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono bg-background p-2 rounded-sm border">
              <span>Lat: {coords[0].toFixed(5)}</span>
              <span>•</span>
              <span>Lng: {coords[1].toFixed(5)}</span>
              {onTriggerMapPinSelect && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onTriggerMapPinSelect();
                  }}
                  className="ml-auto text-blue-600 hover:underline font-sans text-[11px] font-medium"
                >
                  Adjust pin on map →
                </button>
              )}
            </div>

            <Input
              placeholder="Apartment block, pillar number or landmark (e.g. Block C, Gate 2)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Photo Evidence (Optional)</Label>
            <div className="flex flex-wrap gap-2 items-center">
              {mediaUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative size-16 rounded-md overflow-hidden border border-border group"
                >
                  <img src={url} alt="Evidence" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 size-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

              <label className="flex flex-col items-center justify-center size-16 rounded-md border border-dashed border-input hover:border-blue-500 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                {isUploadingImage ? (
                  <Spinner className="size-4" />
                ) : (
                  <>
                    <Upload className="size-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
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

          {/* Nearby Similar Incident Notification */}
          {isCheckingDuplicate && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 text-[11px] text-muted-foreground">
              <Spinner className="size-3 text-blue-600" />
              <span>Checking for similar open reports nearby...</span>
            </div>
          )}

          {duplicateIncident && !isCheckingDuplicate && (
            <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 p-3.5 space-y-2.5 transition-all">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
                  <Layers className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="size-3 text-blue-600" />
                      Similar Issue Reported Nearby
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground leading-snug mt-0.5 truncate">
                    {duplicateIncident.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {duplicateIncident.address || "Nearby in this neighbourhood"} • {duplicateIncident.reportCount || 1} existing report{(duplicateIncident.reportCount || 1) > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="pt-1 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="link-cluster-checkbox"
                  checked={linkToExisting}
                  onChange={(e) => setLinkToExisting(e.target.checked)}
                  className="size-4 rounded-sm border-blue-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="link-cluster-checkbox"
                  className="text-xs font-medium text-foreground cursor-pointer select-none leading-tight"
                >
                  {linkToExisting
                    ? "Link to existing report (attaches photos & details to speed up resolution)"
                    : "Post as a separate, distinct report"}
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUploadingImage}
              className="bg-[#003366] hover:bg-[#002244] text-white min-w-[140px] font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-1.5" />
                  Submitting...
                </>
              ) : duplicateIncident && linkToExisting ? (
                "Add to Existing Ticket"
              ) : (
                "Submit Grievance"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
