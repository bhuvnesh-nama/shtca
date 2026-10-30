import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { IncidentItem } from "@/types/incident";
import {
  Bell,
  BellRing,
  ShieldAlert,
  Zap,
  Droplets,
  Dog,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface AlertsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidents: IncidentItem[];
  onSelectIncident: (incident: IncidentItem) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "power_cut":
    case "utility_disruption":
      return <Zap className="size-4 text-amber-500" />;
    case "water_issue":
    case "water_drainage":
      return <Droplets className="size-4 text-blue-500" />;
    case "theft_security":
    case "safety_concern":
      return <ShieldAlert className="size-4 text-rose-500" />;
    case "stray_animals":
      return <Dog className="size-4 text-orange-500" />;
    case "road_hazard":
      return <AlertTriangle className="size-4 text-yellow-600" />;
    default:
      return <ShieldAlert className="size-4 text-slate-500" />;
  }
};

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  open,
  onOpenChange,
  incidents,
  onSelectIncident,
}) => {
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, []);

  const handleRequestPush = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser push notifications are not supported on this device.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        toast.success("Push notifications enabled! You will be alerted for local hazards.");
        new Notification("HyperNet Safety Alerts", {
          body: "You are now connected to live neighbourhood safety alerts.",
          icon: "/favicon.ico",
        });
      } else {
        toast.info("Push notification permission dismissed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not activate notifications.");
    }
  };

  // Urgent alerts: critical or high severity
  const criticalAlerts = incidents.filter(
    (i) => i.severity === "critical" || i.severity === "high"
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-5 flex flex-col h-full">
        <SheetHeader className="text-left space-y-1 pb-3 border-b">
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <BellRing className="size-5 text-blue-600" />
            Neighbourhood Safety Alerts
          </SheetTitle>
          <SheetDescription className="text-xs">
            Live broadcasts and push notifications for urgent local incidents
          </SheetDescription>
        </SheetHeader>

        {/* Push Notification Toggle Box */}
        <div className="p-3 my-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Bell className="size-3.5 text-blue-600" />
              Push Alerts
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {pushEnabled ? "Active for your building/area" : "Get notified for urgent power & security alerts"}
            </p>
          </div>

          <Button
            size="sm"
            variant={pushEnabled ? "outline" : "default"}
            onClick={handleRequestPush}
            disabled={pushEnabled}
            className={`h-7 text-xs font-semibold ${
              pushEnabled
                ? "text-emerald-600 border-emerald-300 dark:border-emerald-800"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {pushEnabled ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-600" /> Enabled
              </span>
            ) : (
              "Enable Alerts"
            )}
          </Button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            High Priority Alerts ({criticalAlerts.length})
          </span>

          {criticalAlerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg mt-2">
              No critical emergencies or severe hazards active in your zone.
            </div>
          ) : (
            criticalAlerts.map((alert) => (
              <div
                key={alert._id}
                onClick={() => {
                  onSelectIncident(alert);
                  onOpenChange(false);
                }}
                className="p-3 rounded-lg border border-border/80 bg-card hover:border-blue-300 dark:hover:border-blue-800 cursor-pointer transition-all space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    {getCategoryIcon(alert.category)}
                    {alert.title}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {alert.severity}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {alert.description}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[200px]">{alert.address || "Society area"}</span>
                  <span className="flex items-center gap-1 shrink-0 font-medium text-blue-600">
                    View Location →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
