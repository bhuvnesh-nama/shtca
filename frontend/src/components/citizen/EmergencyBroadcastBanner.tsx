import React, { useState, useEffect } from "react";
import type { BroadcastItem } from "@/types/incident";
import { incidentService } from "@/services/incidentService";
import { AlertTriangle, Info, X, Radio, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";

interface EmergencyBroadcastBannerProps {
  ward?: string;
}

export const EmergencyBroadcastBanner: React.FC<EmergencyBroadcastBannerProps> = ({ ward = "all" }) => {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // Fetch active broadcasts
    incidentService.getBroadcasts(ward).then((data) => {
      setBroadcasts(data || []);
    }).catch((err) => {
      console.warn("Failed to load broadcasts:", err);
    });

    // Listen to real-time broadcasts
    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const socket = io(socketUrl, { withCredentials: true });

    socket.on("broadcast:new", ({ broadcast }: { broadcast: BroadcastItem }) => {
      setBroadcasts((prev) => [broadcast, ...prev.filter((b) => b._id !== broadcast._id)]);
    });

    socket.on("broadcast:dismissed", ({ id }: { id: string }) => {
      setBroadcasts((prev) => prev.filter((b) => b._id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, [ward]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const visibleBroadcasts = broadcasts.filter((b) => !dismissedIds.has(b._id));

  if (visibleBroadcasts.length === 0) return null;

  return (
    <div className="w-full space-y-2 mb-3">
      {visibleBroadcasts.map((broadcast) => {
        const isCritical = broadcast.severity === "critical";
        const isWarning = broadcast.severity === "warning";

        const bgClass = isCritical
          ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100"
          : isWarning
          ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100"
          : "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100";

        const badgeClass = isCritical
          ? "bg-rose-600 text-white"
          : isWarning
          ? "bg-amber-500 text-white"
          : "bg-blue-600 text-white";

        const IconComponent = isCritical ? ShieldAlert : isWarning ? AlertTriangle : Info;

        return (
          <div
            key={broadcast._id}
            role="alert"
            className={`relative rounded-xl border p-3 sm:p-4 shadow-sm transition-all duration-200 ${bgClass}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isCritical
                    ? "bg-rose-600/10 text-rose-600 animate-pulse"
                    : isWarning
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-blue-600/10 text-blue-600"
                }`}
              >
                <IconComponent className="size-5" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
                    {isCritical
                      ? "CRITICAL ALERT"
                      : isWarning
                      ? "OFFICIAL ADVISORY"
                      : "CIVIC NOTICE"}
                  </span>

                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Radio className="size-3 text-emerald-500 animate-pulse" />
                    {broadcast.ward === "all"
                      ? "All Zones & Wards"
                      : broadcast.ward}
                  </span>

                  <span className="text-[11px] text-muted-foreground/80">
                    • {new Date(broadcast.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  {broadcast.title}
                </h4>
                <p className="text-xs sm:text-sm text-foreground/80 mt-0.5 leading-relaxed">
                  {broadcast.message}
                </p>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                  <span>
                    Issued by:{" "}
                    <strong className="text-foreground">{broadcast.issuedBy?.name}</strong> (
                    {broadcast.issuedBy?.role})
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(broadcast._id)}
                className="absolute top-2 right-2 size-7 p-0 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                title="Dismiss banner"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
