import React from "react";
import type { HealthScoreData } from "@/types/incident";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Zap,
  Droplets,
  ShieldAlert,
  Dog,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface HealthScoreWidgetProps {
  data: HealthScoreData | null;
  loading?: boolean;
}

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({
  data,
  loading = false,
}) => {
  if (loading || !data) {
    return (
      <Card className="border-border bg-card/60 backdrop-blur p-4 animate-pulse">
        <div className="h-16 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded-sm" />
            <div className="h-3 w-48 bg-muted rounded-sm" />
          </div>
          <div className="h-12 w-12 rounded-full bg-muted" />
        </div>
      </Card>
    );
  }

  const { score, label, activeCount, resolvedCount, categoryCounts } = data;

  const getScoreColor = (s: number) => {
    if (s >= 85) return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40";
    if (s >= 70) return "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-50 dark:bg-blue-950/40";
    if (s >= 50) return "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-950/40";
    return "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-50 dark:bg-rose-950/40";
  };

  return (
    <Card className="border-border bg-card shadow-xs overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left score pill & title */}
          <div className="flex items-center gap-3.5">
            <div
              className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border font-bold shadow-xs ${getScoreColor(
                score
              )}`}
            >
              <span className="text-xl leading-none">{score}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
                Score
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Activity className="size-4 text-blue-600" />
                  Neighbourhood Safety & Health Index
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Bonus Feature
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {label} • {activeCount} active issue{activeCount === 1 ? "" : "s"} reported
              </p>
            </div>
          </div>

          {/* Right: Quick category badges */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-muted/60 text-foreground border border-border">
              <Zap className="size-3 text-amber-500" />
              Power: <strong>{categoryCounts.power_cut || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-muted/60 text-foreground border border-border">
              <Droplets className="size-3 text-blue-500" />
              Water: <strong>{categoryCounts.water_issue || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-muted/60 text-foreground border border-border">
              <ShieldAlert className="size-3 text-rose-500" />
              Security: <strong>{categoryCounts.theft_security || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-muted/60 text-foreground border border-border">
              <Dog className="size-3 text-orange-500" />
              Animals: <strong>{categoryCounts.stray_animals || 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-muted/60 text-foreground border border-border">
              <AlertTriangle className="size-3 text-yellow-600" />
              Roads: <strong>{categoryCounts.road_hazard || 0}</strong>
            </span>
            {resolvedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                <CheckCircle2 className="size-3 text-emerald-600" />
                {resolvedCount} Resolved
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

