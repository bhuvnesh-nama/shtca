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
import { useLanguage } from "@/context/LanguageContext";
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
  const { language } = useLanguage();
  const [address, setAddress] = useState("Society Central Compound / Resident Block");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrigger = async () => {
    try {
      setIsSubmitting(true);
      const lat = userLocation ? userLocation[0] : 28.6304;
      const lng = userLocation ? userLocation[1] : 77.2177;

      await incidentService.triggerSos({
        latitude: lat,
        longitude: lng,
        address,
        details: details.trim() || undefined,
      });

      toast.error(
        language === "hi"
          ? "🚨 आपातकालीन एसओएस सक्रिय! सभी पड़ोसियों एवं गार्ड को सूचना भेज दी गई है।"
          : "🚨 EMERGENCY SOS ACTIVE! Alert broadcasted to security patrol and neighbours."
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
                {language === "hi" ? "आपातकालीन एसओएस अलर्ट" : "Emergency SOS Panic Beacon"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {language === "hi"
                  ? "तत्काल पड़ोसियों, आरडब्ल्यूए और सुरक्षा गार्ड को सूचित करें"
                  : "Instant high-priority community & security guard alert"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 p-3 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">
              {language === "hi"
                ? "यह बटन तुरंत सोसायटी गार्ड और सभी सक्रिय निवासियों की स्क्रीन पर आपातकालीन लाल चेतावनी प्रसारित करेगा।"
                : "This triggers an immediate critical priority red banner across all active resident and security screens in your society."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="size-3.5 text-rose-600" />
              {language === "hi" ? "स्थान विवरण" : "Your Exact Location / Flat No."}
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Tower B, Flat 304 or Basement Parking"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {language === "hi" ? "समस्या का संक्षिप्त विवरण (वैकल्पिक)" : "Emergency Details (Optional)"}
            </Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                language === "hi"
                  ? "उदा. लिफ्ट फंस गई है, आग का धुआं दिख रहा है, संदिग्ध व्यक्ति..."
                  : "e.g. Elevator stuck, smoke detected, urgent medical/security help..."
              }
              className="text-xs min-h-[70px] resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Radio className="size-3 text-emerald-500 animate-pulse" />
            <span>
              {language === "hi"
                ? "जीपीएस कोऑर्डिनेट्स अपने आप जुड़े हैं"
                : "Live GPS coordinates automatically attached"}
            </span>
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
            {language === "hi" ? "रद्द करें" : "Cancel"}
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
            {language === "hi" ? "एसओएस प्रसारित करें" : "BROADCAST SOS ALERT"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

