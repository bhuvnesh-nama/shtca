import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { incidentService } from "@/services/incidentService";
import { toast } from "sonner";
import {
  Sparkles,
  Layers,
  ThumbsUp,
  CheckCircle2,
  RotateCcw,
  FlaskConical,
} from "lucide-react";

interface DemoSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionCompleted: () => void;
}

export const DemoSimulatorDialog: React.FC<DemoSimulatorDialogProps> = ({
  open,
  onOpenChange,
  onActionCompleted,
}) => {
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const handleSimulate = async (scenario: string, label: string) => {
    setRunningAction(scenario);
    try {
      const res = await incidentService.simulateScenario(scenario);
      toast.success(res.message || `${label} simulated successfully!`);
      onActionCompleted();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Simulation failed");
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <FlaskConical className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Hackathon Demo Simulation Lab
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Trigger real-time scenarios in 1-click to test duplicate auto-clustering, upvote verification, and RWA resolution broadcasts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* Scenario 1: Duplicate Auto-Clustering */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <Layers className="size-3.5 text-blue-600" />
                Simulate Duplicate Report (Auto-Cluster)
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Posts an independent report from Flat C-302 within 50m of an existing hazard. Demonstrates automatic clustering without duplicate map pins.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleSimulate("duplicate_cluster", "Duplicate Cluster")}
              disabled={!!runningAction}
              className="shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {runningAction === "duplicate_cluster" ? <Spinner className="size-3" /> : "Simulate"}
            </Button>
          </div>

          {/* Scenario 2: Community Upvote Surge */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <ThumbsUp className="size-3.5 text-blue-600" />
                Simulate Upvote Surge (Community Verification)
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Submits 3 distinct resident confirmations to cross the threshold, auto-promoting incident status to <span className="font-semibold text-emerald-600">"Community Confirmed"</span>.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleSimulate("upvote_surge", "Upvote Surge")}
              disabled={!!runningAction}
              className="shrink-0 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {runningAction === "upvote_surge" ? <Spinner className="size-3" /> : "Simulate"}
            </Button>
          </div>

          {/* Scenario 3: RWA Resolution Action */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Simulate RWA Resolution Action
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Marks an active hazard as resolved with technician verification notes and demonstrates instant Neighbourhood Health Score improvement.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleSimulate("rwa_resolve", "RWA Resolution")}
              disabled={!!runningAction}
              className="shrink-0 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {runningAction === "rwa_resolve" ? <Spinner className="size-3" /> : "Simulate"}
            </Button>
          </div>

          {/* Scenario 4: Clean Demo Data Reset */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <RotateCcw className="size-3.5 text-muted-foreground" />
                Reset Demo Environment
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Clears live changes and resets clean baseline problem-statement incidents across Greenwood Residency.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSimulate("reset_seed", "Environment Reset")}
              disabled={!!runningAction}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              {runningAction === "reset_seed" ? <Spinner className="size-3" /> : "Reset"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t mt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-indigo-500" />
            Live WebSocket events broadcast automatically
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

