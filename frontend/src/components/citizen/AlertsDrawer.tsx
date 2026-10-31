import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { IncidentItem, BroadcastItem } from "@/types/incident";
import { incidentService } from "@/services/incidentService";
import {
  Bell,
  BellRing,
  ShieldAlert,
  Zap,
  Droplets,
  Dog,
  AlertTriangle,
  CheckCircle2,
  Info,
  Radio,
  X,
  UserCheck,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";

interface AlertsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidents: IncidentItem[];
  onSelectIncident: (incident: IncidentItem) => void;
  onBroadcastCountChange?: (count: number) => void;
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

const DISMISSED_BROADCASTS_KEY = "shtca_dismissed_broadcasts";
const DISMISSED_GRIEVANCES_KEY = "shtca_dismissed_grievances";

const getSavedIds = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveIds = (key: string, ids: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.warn(`Failed to save dismissed IDs for ${key}:`, err);
  }
};

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  open,
  onOpenChange,
  incidents,
  onSelectIncident,
  onBroadcastCountChange,
}) => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getSavedIds(DISMISSED_BROADCASTS_KEY));
  const [dismissedGrievanceIds, setDismissedGrievanceIds] = useState<Set<string>>(() => getSavedIds(DISMISSED_GRIEVANCES_KEY));
  const [activeTab, setActiveTab] = useState<"all" | "broadcasts" | "grievances">("all");

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }
  }, []);

  // Fetch official broadcasts & listen to socket events
  useEffect(() => {
    incidentService
      .getBroadcasts("all")
      .then((data) => {
        const list = data || [];
        setBroadcasts(list);
        const saved = getSavedIds(DISMISSED_BROADCASTS_KEY);
        if (onBroadcastCountChange) {
          onBroadcastCountChange(list.filter((b) => !saved.has(b._id)).length);
        }
      })
      .catch((err) => {
        console.warn("Failed to load broadcasts:", err);
      });

    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const socket = io(socketUrl, { withCredentials: true });

    socket.on("broadcast:new", ({ broadcast }: { broadcast: BroadcastItem }) => {
      setBroadcasts((prev) => {
        const updated = [broadcast, ...prev.filter((b) => b._id !== broadcast._id)];
        if (onBroadcastCountChange) {
          onBroadcastCountChange(updated.filter((b) => !dismissedIds.has(b._id)).length);
        }
        return updated;
      });
      toast.info(`Official Advisory: ${broadcast.title}`);
    });

    socket.on("broadcast:dismissed", ({ id }: { id: string }) => {
      setBroadcasts((prev) => {
        const updated = prev.filter((b) => b._id !== id);
        if (onBroadcastCountChange) {
          onBroadcastCountChange(updated.filter((b) => !dismissedIds.has(b._id)).length);
        }
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [onBroadcastCountChange, dismissedIds]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveIds(DISMISSED_BROADCASTS_KEY, next);
      if (onBroadcastCountChange) {
        onBroadcastCountChange(broadcasts.filter((b) => !next.has(b._id)).length);
      }
      return next;
    });
  };

  const handleDismissGrievance = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedGrievanceIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveIds(DISMISSED_GRIEVANCES_KEY, next);
      return next;
    });
  };

  const handleClearAll = () => {
    const nextBroadcasts = new Set([...dismissedIds, ...broadcasts.map((b) => b._id)]);
    setDismissedIds(nextBroadcasts);
    saveIds(DISMISSED_BROADCASTS_KEY, nextBroadcasts);

    const nextGrievances = new Set([...dismissedGrievanceIds, ...incidents.map((i) => i._id)]);
    setDismissedGrievanceIds(nextGrievances);
    saveIds(DISMISSED_GRIEVANCES_KEY, nextGrievances);

    if (onBroadcastCountChange) {
      onBroadcastCountChange(0);
    }
    toast.success("All notifications and advisories cleared.");
  };

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
        new Notification("Civic & Neighbourhood Safety Alerts", {
          body: "You are now connected to official alerts and emergency advisories.",
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

  const visibleBroadcasts = broadcasts.filter((b) => !dismissedIds.has(b._id));
  const criticalAlerts = incidents.filter(
    (i) => (i.severity === "critical" || i.severity === "high") && !dismissedGrievanceIds.has(i._id)
  );

  const totalCount = visibleBroadcasts.length + criticalAlerts.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-5 flex flex-col h-full bg-background border-l border-border">
        {/* Header */}
        <SheetHeader className="text-left space-y-1 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <BellRing className="size-5 text-blue-600" />
              Notifications & Advisories
            </SheetTitle>
            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    title="Clear all alerts"
                  >
                    <CheckCheck className="size-3.5" />
                    Clear All
                  </button>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {totalCount} Active
                  </span>
                </>
              )}
            </div>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Official emergency broadcasts, civic notices, and high-priority hazard alerts
          </SheetDescription>
        </SheetHeader>

        {/* Push Notification Toggle Box */}
        <div className="p-3 my-2 rounded-lg border bg-blue-50/50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Bell className="size-3.5 text-blue-600" />
              Push Alerts
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {pushEnabled ? "Active for your locality" : "Get notified instantly for emergency advisories"}
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

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-muted/40 mb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("broadcasts")}
            className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "broadcasts"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Broadcasts ({visibleBroadcasts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("grievances")}
            className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "grievances"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Grievances ({criticalAlerts.length})
          </button>
        </div>

        {/* Scrollable Notifications Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* 1. Official Broadcasts Section */}
          {(activeTab === "all" || activeTab === "broadcasts") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Official Broadcasts & Advisories ({visibleBroadcasts.length})</span>
              </div>

              {visibleBroadcasts.length === 0 ? (
                activeTab === "broadcasts" && (
                  <div className="p-5 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                    No active emergency broadcasts at this time.
                  </div>
                )
              ) : (
                visibleBroadcasts.map((broadcast) => {
                  const isCritical = broadcast.severity === "critical";
                  const isWarning = broadcast.severity === "warning";

                  const bgClass = isCritical
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-100"
                    : isWarning
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-100"
                    : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-100";

                  const badgeClass = isCritical
                    ? "bg-rose-600 text-white"
                    : isWarning
                    ? "bg-amber-500 text-white"
                    : "bg-blue-600 text-white";

                  const IconComp = isCritical ? ShieldAlert : isWarning ? AlertTriangle : Info;

                  return (
                    <div
                      key={broadcast._id}
                      className={`relative rounded-xl border p-3.5 shadow-2xs transition-all ${bgClass}`}
                    >
                      <button
                        onClick={(e) => handleDismiss(broadcast._id, e)}
                        className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                        title="Dismiss notification"
                      >
                        <X className="size-3.5" />
                      </button>

                      <div className="flex items-start gap-2.5 pr-4">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            isCritical
                              ? "bg-rose-600/10 text-rose-600"
                              : isWarning
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-blue-600/10 text-blue-600"
                          }`}
                        >
                          <IconComp className="size-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
                              {isCritical ? "Critical Alert" : isWarning ? "Official Advisory" : "Civic Notice"}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                              <Radio className="size-2.5 text-emerald-500 animate-pulse" />
                              {broadcast.ward === "all" ? "All Sectors" : broadcast.ward}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-foreground leading-snug mb-1">
                            {broadcast.title}
                          </h4>

                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                            {broadcast.message}
                          </p>

                          {broadcast.issuedBy && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/40 pt-1.5">
                              <UserCheck className="size-3 text-blue-600" />
                              <span className="font-semibold text-foreground">{broadcast.issuedBy.name}</span>
                              <span className="opacity-75">({broadcast.issuedBy.role})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. Urgent Safety Grievances Section */}
          {(activeTab === "all" || activeTab === "grievances") && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Urgent Safety Grievances ({criticalAlerts.length})</span>
              </div>

              {criticalAlerts.length === 0 ? (
                <div className="p-5 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  No critical grievances or severe hazards active in your zone.
                </div>
              ) : (
                criticalAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    onClick={() => {
                      onSelectIncident(alert);
                      onOpenChange(false);
                    }}
                    className="relative p-3 rounded-xl border border-border bg-card hover:border-blue-400 dark:hover:border-blue-700 cursor-pointer transition-all space-y-1.5 shadow-2xs hover:shadow-xs group"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleDismissGrievance(alert._id, e)}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Dismiss alert"
                    >
                      <X className="size-3.5" />
                    </button>
                    <div className="flex items-center justify-between pr-6">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate">
                        {getCategoryIcon(alert.category)}
                        <span className="truncate">{alert.title}</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                      <span className="truncate max-w-[220px]">
                        📍 {alert.address || "Society vicinity"}
                      </span>
                      <span className="flex items-center gap-1 shrink-0 font-semibold text-blue-600 hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
