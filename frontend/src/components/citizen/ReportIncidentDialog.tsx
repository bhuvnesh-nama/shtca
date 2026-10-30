import React, { useState, useEffect, useRef } from "react";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number]>(
    initialLocation || [28.6139, 77.209]
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bonus Twist 1: Auto-Cluster Duplicate Detection State
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

      onSuccess();
      onOpenChange(false);

      setTitle("");
      setDescription("");
      setAddress("");
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
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold shadow-xs">
              +
            </span>
            Report Local Hazard / Issue
          </DialogTitle>
          <DialogDescription className="text-xs">
            Report an incident in your society or neighbourhood. Nearby reports in the same category automatically cluster together.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Category selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Incident Category</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES_CONFIG.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600 font-medium"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between w-full">
                      {getCategoryIcon(cat.id)}
                      {isSelected && <Check className="size-3.5 text-blue-600" />}
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
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">
              Incident Headline
            </Label>
            <Input
              id="title"
              placeholder="e.g., Basement transformer spark / Stray dogs barking near park"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Description & Current Impact
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the problem, severity, and any immediate impact on residents or vehicles..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              required
            />
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

          {/* Auto-Cluster Duplicate Detection Notification (Bonus Twist 1) */}
          {isCheckingDuplicate && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 text-[11px] text-muted-foreground">
              <Spinner className="size-3 text-blue-600" />
              <span>Scanning neighbourhood for nearby matching reports...</span>
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
                      Auto-Cluster Candidate Detected
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
                    ? "Corroborate existing incident (auto-clusters evidence & priority)"
                    : "Post as a separate, distinct incident"}
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
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[110px]"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-1.5" />
                  Submitting...
                </>
              ) : duplicateIncident && linkToExisting ? (
                "Corroborate & Link"
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
