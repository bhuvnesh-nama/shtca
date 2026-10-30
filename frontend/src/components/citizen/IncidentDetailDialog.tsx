import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { IncidentItem, ReportItem } from "@/types/incident";
import {
  MapPin,
  Layers,
  ThumbsUp,
  User,
  Calendar,
  CheckCircle,
  Share2,
  ExternalLink,
  ShieldAlert,
  Flag,
  AlertOctagon,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { incidentService } from "@/services/incidentService";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface IncidentDetailDialogProps {
  incident: IncidentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncidentUpdated?: (updated: IncidentItem) => void;
}

export const IncidentDetailDialog: React.FC<IncidentDetailDialogProps> = ({
  incident: initialIncident,
  open,
  onOpenChange,
  onIncidentUpdated,
}) => {
  const [incident, setIncident] = useState<IncidentItem | null>(initialIncident);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("False Alarm / Issue Does Not Exist");
  const [flagging, setFlagging] = useState(false);

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    setFlagging(true);
    try {
      const res = await incidentService.flagIncident(incident._id, flagReason);
      toast.success(res.message || "Moderation report recorded");
      setFlagModalOpen(false);
      const updated = res.data || {
        ...incident,
        flagsCount: (incident.flagsCount || 0) + 1,
      };
      setIncident(updated);
      if (onIncidentUpdated) {
        onIncidentUpdated(updated);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit moderation report");
    } finally {
      setFlagging(false);
    }
  };

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopening, setReopening] = useState(false);

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    if (!reopenReason.trim()) {
      toast.error("Please explain what problem returned on the ground");
      return;
    }
    setReopening(true);
    try {
      const res = await incidentService.reopenIncident(incident._id, reopenReason.trim());
      toast.success("Incident has been reopened and prioritized for immediate action");
      setReopenModalOpen(false);
      setReopenReason("");
      const updated = res.data || {
        ...incident,
        status: "reopened",
        reopenReason: reopenReason.trim(),
        reopenedAt: new Date().toISOString(),
      };
      setIncident(updated);
      if (onIncidentUpdated) {
        onIncidentUpdated(updated);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reopen incident");
    } finally {
      setReopening(false);
    }
  };

  // Sync and fetch full populated details whenever dialog opens
  useEffect(() => {
    if (initialIncident && open) {
      setIncident(initialIncident);
      setHasUpvoted(false);

      // Fetch fresh populated reports
      setLoadingDetails(true);
      incidentService
        .getIncidentById(initialIncident._id)
        .then((fresh) => {
          if (fresh) setIncident(fresh);
        })
        .catch((err) => {
          console.error("Failed to fetch full incident details:", err);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [initialIncident, open]);

  if (!incident) return null;

  const handleUpvote = async () => {
    if (hasUpvoted) {
      toast.info("You have already verified this incident.");
      return;
    }

    setUpvoting(true);
    try {
      const res = await incidentService.upvoteIncident(incident._id);
      setHasUpvoted(true);
      toast.success(res.message || "Upvote recorded! Community credibility updated.");
      const updated: IncidentItem = {
        ...incident,
        upvotes: res.data?.upvotes ?? incident.upvotes + 1,
        status: res.data?.status ?? incident.status,
      };
      setIncident(updated);
      if (onIncidentUpdated) {
        onIncidentUpdated(updated);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upvote incident");
    } finally {
      setUpvoting(false);
    }
  };

  const handleShare = async () => {
    const text = `🚨 [HyperNet Incident Alert]\nCategory: ${incident.category.replace(
      "_",
      " "
    ).toUpperCase()}\nTitle: ${incident.title}\nLocation: ${
      incident.address || "Society area"
    }\nStatus: ${incident.status.replace("_", " ")}\nVerify on live map: ${
      window.location.origin
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `HyperNet: ${incident.title}`,
          text,
          url: window.location.href,
        });
        toast.success("Alert shared successfully");
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Incident alert details copied to clipboard!");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const reports = (Array.isArray(incident.reports) ? incident.reports : []) as ReportItem[];
  const isCommunityVerified = (incident.upvotes || 0) >= 3;
  const isCluster = (incident.reportCount || reports.length) > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-sm">
              {incident.category.replace("_", " ")}
            </span>
            <div className="flex items-center gap-2">
              {isCommunityVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  <CheckCircle className="size-3 text-emerald-500" /> Community Verified
                </span>
              )}
              <StatusBadge status={incident.status} />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-foreground leading-snug">
            {incident.title}
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-muted-foreground" />
              {incident.address || "Local neighbourhood area"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-muted-foreground" />
              {new Date(incident.createdAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Media Gallery if any */}
        {incident.media && incident.media.length > 0 && (
          <div className="space-y-1.5 my-2">
            <span className="text-xs font-semibold text-muted-foreground">Photo Evidence</span>
            <div className="grid grid-cols-2 gap-2">
              {incident.media.map((imgUrl, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden border border-border bg-muted max-h-48 group relative"
                >
                  <img
                    src={imgUrl}
                    alt={`Incident evidence ${i + 1}`}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-1 right-1 p-1 bg-black/60 rounded text-white text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="size-3" /> Full
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verified Resolution Banner if Resolved */}
        {incident.status === "resolved_verified" && (
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 space-y-2.5 my-1 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    Verified Resolution Completed
                  </span>
                  {incident.complaintRef && (
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                      Ref #{incident.complaintRef}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  This hazard has been inspected and resolved on site by the Society Maintenance & RWA operations team.
                </p>
                {incident.resolvedAt && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                    Resolved: {new Date(incident.resolvedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                )}
              </div>
            </div>

            {/* Before & After Visual Verification Comparison (Feature 41) */}
            {incident.resolutionMedia && incident.resolutionMedia.length > 0 && (
              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  🔍 Before & After Evidence Comparison
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase">
                      Before (Hazard)
                    </span>
                    <div className="h-32 rounded-lg overflow-hidden border border-rose-300 dark:border-rose-900 bg-muted">
                      {incident.media && incident.media[0] ? (
                        <img
                          src={incident.media[0]}
                          alt="Before Resolution"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[10px] text-muted-foreground">
                          No initial photo
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                      After (Resolved)
                    </span>
                    <div className="h-32 rounded-lg overflow-hidden border border-emerald-400 dark:border-emerald-700 bg-muted">
                      <img
                        src={incident.resolutionMedia[0]}
                        alt="After Resolution"
                        className="size-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Re-Open Action for Residents if problem returned */}
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Did this issue reoccur after resolution?
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReopenModalOpen(true)}
                className="h-7 text-xs border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 gap-1 font-semibold"
              >
                <RotateCcw className="size-3 text-rose-600" />
                <span>Re-Open Issue</span>
              </Button>
            </div>
          </div>
        )}

        {/* Reopened Incident Urgent Banner (Feature 45) */}
        {incident.status === "reopened" && (
          <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 p-3.5 space-y-1.5 my-1 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <RotateCcw className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                    ⚠️ Hazard Reopened by Community
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100">
                    Priority Escalated
                  </span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  {incident.reopenReason || "This hazard resurfaced on the ground and has been reopened for emergency maintenance."}
                </p>
                {incident.reopenedAt && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400">
                    Reopened on: {new Date(incident.reopenedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Official Field Inspection Stamp (Feature 42) */}
        {incident.inspectedBy && (
          <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 p-3 flex items-start gap-2.5 my-1 shadow-2xs">
            <ShieldCheck className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-blue-900 dark:text-blue-200">
                  On-Ground Field Verification Stamp
                </span>
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-sm bg-blue-100 dark:bg-blue-900/60">
                  {incident.trustScore || 100}% Signal Trust
                </span>
              </div>
              <p className="text-blue-800 dark:text-blue-300 leading-snug">
                Inspected by <strong>{incident.inspectedBy.name}</strong> ({incident.inspectedBy.role})
              </p>
              {incident.inspectedBy.notes && (
                <p className="text-muted-foreground text-[11px] italic">
                  "{incident.inspectedBy.notes}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Description / Summary */}
        <div className="space-y-1 my-2">
          <span className="text-xs font-semibold text-foreground">Incident Summary</span>
          <p className="text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-lg border whitespace-pre-line">
            {incident.description}
          </p>
        </div>

        {/* Clustered Reports Timeline (Bonus Twist 1) */}
        <div className="space-y-2.5 my-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-blue-600" />
              Clustered Resident Reports ({incident.reportCount || reports.length || 1})
            </span>
            {isCluster && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                ⚡ Auto-Clustered Duplicate Group
              </span>
            )}
          </div>

          {loadingDetails ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Spinner className="size-3.5" /> Loading clustered report logs...
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {reports.length > 0 ? (
                reports.map((rep, idx) => (
                  <div
                    key={rep._id || idx}
                    className="text-xs p-3 rounded-lg border border-border/80 bg-background/60 space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-1">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        <User className="size-3 text-blue-600" />
                        {rep.reporterName || "Local Resident"}
                      </span>
                      <span className="text-[10px] font-mono">
                        {new Date(rep.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-foreground/90 font-medium">{rep.title}</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {rep.description}
                    </p>

                    {rep.address && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground italic">
                        <MapPin className="size-2.5" />
                        {rep.address}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-muted/20 border text-xs text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="size-4 text-blue-600" />
                  <span>Initial citizen report logged for this incident.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleUpvote}
              disabled={upvoting || hasUpvoted}
              className={`text-xs gap-1.5 font-semibold shadow-xs ${
                hasUpvoted
                  ? "bg-emerald-600 text-white hover:bg-emerald-600 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <ThumbsUp className="size-3.5" />
              {hasUpvoted ? "Verified by You" : "Upvote & Verify"} ({incident.upvotes || 1})
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="text-xs gap-1 text-muted-foreground hover:text-foreground"
              title="Share alert with housing society or neighbours"
            >
              <Share2 className="size-3.5 text-blue-600" />
              <span>Share Alert</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFlagModalOpen(true)}
              className="text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Report inaccuracy or inappropriate submission"
            >
              <Flag className="size-3.5 text-rose-500" />
              <span className="hidden sm:inline">Report Issue</span>
            </Button>
          </div>

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

      {/* Community Moderation Report Modal */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <AlertOctagon className="size-5 text-rose-600" />
              Report Issue to Society Moderation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Flag suspicious, spam, or misleading reports. Society admins review all flags to preserve community safety feed integrity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFlagSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Select Reason for Report
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
              >
                <option value="False Alarm / Hazard Does Not Exist">
                  False Alarm / Hazard Does Not Exist on Ground
                </option>
                <option value="Resolved Already / Outdated Information">
                  Resolved Already / Outdated Information
                </option>
                <option value="Duplicate Photo / Stolen or Reused Image">
                  Duplicate Photo / Stolen or Reused Image
                </option>
                <option value="Spam, Advertisement, or Inappropriate Content">
                  Spam, Advertisement, or Inappropriate Content
                </option>
                <option value="Private Property or Harassment Concern">
                  Private Property or Harassment Concern
                </option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300">
              Note: Incidents receiving multiple corroborating flags from verified residents are automatically escalated to <strong>Under Review</strong> status.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFlagModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={flagging}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {flagging ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Re-Open Incident Dialog (Feature 45) */}
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <RotateCcw className="size-5 text-rose-600" />
              Re-Open Incident for Action
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              If the hazard was not completely fixed or resurfaced (e.g. water leak returned, transformer sparking again), reopening immediately alerts the RWA operations queue.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReopenSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Describe Current Situation / Return of Issue <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Water pipeline joint broke again after maintenance team left; basement is flooding."
                rows={3}
                required
                className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden resize-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300">
              ⚡ Reopening will adjust the neighbourhood health score and notify maintenance staff immediately.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReopenModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={reopening}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {reopening ? "Reopening..." : "Confirm Re-Open"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
