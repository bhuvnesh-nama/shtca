import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, AlertTriangle, Loader2, MapPin, Radio } from "lucide-react";
import { incidentService } from "@/services/incidentService";
import { toast } from "sonner";

interface SosEmergencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLocation?: [number, number] | null;
}

export const SosEmergencyDialog: React.FC<SosEmergencyDialogProps> = ({
  open,
  onOpenChange,
  userLocation,
}) => {
  const [address, setAddress] = useState("Main Road Crossing / Civic Center Area");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrigger = async () => {
    try {
      setIsSubmitting(true);
      let lat = userLocation ? userLocation[0] : 0;
      let lng = userLocation ? userLocation[1] : 0;

      // If userLocation not yet determined, try rapid browser position
      if (!lat && !lng && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000, enableHighAccuracy: true });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          lat = 20.5937;
          lng = 78.9629;
        }
      }

      await incidentService.triggerSos({
        latitude: lat || 20.5937,
        longitude: lng || 78.9629,
        address,
        details: details.trim() || undefined,
      });

      toast.error(
        "🚨 EMERGENCY SOS BROADCASTED! Immediate priority alert sent to local authorities & emergency teams."
      );
      onOpenChange(false);
      setDetails("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to trigger SOS beacon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-rose-300 dark:border-rose-900 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <div className="size-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center animate-pulse">
              <ShieldAlert className="size-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-rose-600">
                Civic Emergency SOS Alert
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                High-priority life safety and civic emergency response beacon
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 p-3 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">
              This triggers a high-priority emergency broadcast across all local response units and active civic monitoring terminals. Use only for genuine emergencies (gas leaks, live wire hazards, structural collapse).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="size-3.5 text-rose-600" />
              Incident Location
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Community Center, Main Market Crossing"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Emergency Details (Optional)
            </Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. High voltage transformer sparked and fallen wire on road..."
              className="text-xs min-h-[70px] resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Radio className="size-3 text-emerald-500 animate-pulse" />
            <span>Live GPS coordinates automatically attached</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleTrigger}
            disabled={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-md hover:shadow-rose-500/20"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldAlert className="size-3.5" />
            )}
            BROADCAST SOS ALERT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

