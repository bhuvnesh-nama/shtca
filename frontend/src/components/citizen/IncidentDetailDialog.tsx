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
  ShieldAlert,
  Flag,
  AlertOctagon,
  RotateCcw,
  Printer,
  Copy,
  Check,
  Wrench,
  UserCheck,
  PhoneCall,
  Clock,
  Building2,
  FileText,
  QrCode,
} from "lucide-react";
import { incidentService } from "@/services/incidentService";
import { formatMediaUrl } from "@/utils/media";
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
  const [copiedRef, setCopiedRef] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopening, setReopening] = useState(false);

  // Sync and fetch full populated details whenever dialog opens
  useEffect(() => {
    if (initialIncident && open) {
      setIncident(initialIncident);
      setHasUpvoted(false);

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

  const handleCopyRef = () => {
    const ref = incident.complaintRef || "MCD-2026-PENDING";
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    toast.success(`Tracking reference copied: ${ref}`);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleUpvote = async () => {
    if (hasUpvoted) {
      toast.info("You have already verified this grievance.");
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
      toast.error(err?.response?.data?.message || "Failed to upvote grievance");
    } finally {
      setUpvoting(false);
    }
  };

  const handleShare = async () => {
    const text = `🚨 [Civic Grievance Alert]\nRef: ${incident.complaintRef || "CIVIC-2026"}\nCategory: ${incident.category.replace("_", " ").toUpperCase()}\nTitle: ${incident.title}\nDepartment: ${incident.department || "Civic Authority"}\nWard: ${incident.ward || "Zone 4"}\nStatus: ${incident.status.replace("_", " ")}\nTrack Live: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `CivicDesk: ${incident.title}`,
          text,
          url: window.location.href,
        });
        toast.success("Grievance details shared successfully");
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Grievance alert details copied to clipboard!");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

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
      toast.success("Grievance has been reopened and prioritized for immediate action");
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
      toast.error(err?.response?.data?.message || "Failed to reopen grievance");
    } finally {
      setReopening(false);
    }
  };

  const reports = (Array.isArray(incident.reports) ? incident.reports : []) as ReportItem[];
  const isCluster = (incident.reportCount || reports.length) > 1;

  // Progression Stepper logic
  const isResolved = incident.status === "resolved_verified";
  const isInProgress = incident.status === "action_pending" || incident.status === "resolution_submitted" || isResolved;
  const hasOfficer = Boolean(incident.assignedOfficer?.name);
  const isUnderReview = incident.status === "under_review" || incident.status === "confirmed" || hasOfficer || isInProgress || isResolved;

  const timelineSteps = [
    {
      label: "Registered",
      sub: "Complaint Logged",
      date: incident.createdAt ? new Date(incident.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "",
      done: true,
      active: incident.status === "reported",
    },
    {
      label: "Under Review",
      sub: "Verified",
      date: isUnderReview ? "Verified" : "",
      done: isUnderReview,
      active: incident.status === "under_review" || incident.status === "confirmed",
    },
    {
      label: "Officer Assigned",
      sub: "Assigned for Action",
      date: incident.assignedOfficer?.assignedAt ? new Date(incident.assignedOfficer.assignedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : (hasOfficer ? "Assigned" : ""),
      done: hasOfficer || isInProgress || isResolved,
      active: hasOfficer && !isInProgress && !isResolved,
    },
    {
      label: "In Progress",
      sub: "Field Execution",
      date: isInProgress ? "Active" : "",
      done: isResolved,
      active: incident.status === "action_pending" || incident.status === "resolution_submitted",
    },
    {
      label: "Resolved",
      sub: "Redressal Verified",
      date: incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "",
      done: isResolved,
      active: isResolved,
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {/* Top Indian Tricolor Strip */}
          <div className="h-1 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-3 flex">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-[#FFFFFF]" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          <DialogHeader className="text-left space-y-2">
            {/* Top Bar with Tracking Reference and Print Receipt */}
            <div className="flex items-center justify-between gap-2 flex-wrap border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#003366] dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2.5 py-1 rounded-sm border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  {incident.complaintRef || "CIVIC-2026-PENDING"}
                </span>

                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted"
                  title="Copy Tracking Reference"
                >
                  {copiedRef ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReceiptModalOpen(true)}
                  className="h-8 px-2.5 text-xs font-semibold border-[#003366]/40 hover:bg-[#003366]/10 text-[#003366] dark:text-blue-300 gap-1.5"
                >
                  <Printer className="size-3.5" />
                  <span>Print Receipt</span>
                </Button>

                <StatusBadge status={incident.status} />
              </div>
            </div>

            <DialogTitle className="text-xl font-bold text-foreground leading-snug pt-1">
              {incident.title}
            </DialogTitle>

            {/* Official Authority & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-muted/40 border text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                  <Building2 className="size-3 text-[#003366] dark:text-blue-400" />
                  <span>Designated Department:</span>
                </div>
                <p className="font-semibold text-foreground text-xs pl-4">
                  {incident.department || "Public Works & Civic Engineering Cell"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                  <MapPin className="size-3 text-rose-500" />
                  <span>Municipal Jurisdiction:</span>
                </div>
                <p className="font-semibold text-foreground text-xs pl-4">
                  {incident.assignedAuthority?.name || incident.ward || "Zonal Municipal Desk"}
                </p>
              </div>

              {incident.landmark && (
                <div className="space-y-0.5 sm:col-span-2 pt-1 border-t border-border/60">
                  <span className="text-muted-foreground text-[11px]">Landmark: </span>
                  <span className="font-medium text-foreground">{incident.landmark}</span>
                  {incident.pincode && (
                    <span className="font-mono text-muted-foreground ml-2">({incident.pincode})</span>
                  )}
                </div>
              )}
            </div>

            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 text-muted-foreground" />
                {incident.address || "Local civic area"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                Registered: {new Date(incident.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Grievance Lifecycle Progression Stepper */}
          <div className="my-3 p-3.5 rounded-xl border bg-[#003366]/5 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#003366] dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="size-3.5" />
                Grievance Redressal Timeline
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {incident.complaintRef || "CIVIC-2026"}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-1">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step.done
                        ? "bg-emerald-600 text-white"
                        : step.active
                        ? "bg-[#003366] text-white ring-2 ring-blue-400 ring-offset-1 animate-pulse"
                        : "bg-muted text-muted-foreground border"
                    }`}
                  >
                    {step.done ? <Check className="size-3.5" /> : idx + 1}
                  </div>
                  <span className="text-[10px] font-bold text-foreground mt-1 line-clamp-1 leading-tight">
                    {step.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground line-clamp-1">
                    {step.sub}
                  </span>
                  {step.date && (
                    <span className="text-[8px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      {step.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Field Officer Card */}
          {incident.assignedOfficer && (
            <div className="rounded-xl border border-blue-300 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 p-3 space-y-1 my-1 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <UserCheck className="size-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      Field Officer Assigned
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {incident.assignedOfficer.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {incident.assignedOfficer.designation} • {incident.department || "Civic Field Office"}
                    </p>
                  </div>
                </div>

                {incident.assignedOfficer.phone && (
                  <a
                    href={`tel:${incident.assignedOfficer.phone}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#003366] text-white text-xs font-semibold hover:bg-[#002244] shadow-xs"
                  >
                    <PhoneCall className="size-3" />
                    <span>Call Officer</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Official Action Taken Report (ATR) Card */}
          {(incident.actionTakenReport || incident.status === "resolved_verified") && (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 p-4 space-y-3 my-1 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                      Action Taken Report (ATR)
                    </span>
                    {incident.complaintRef && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                        Resolution Ref #{incident.complaintRef}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                    {incident.actionTakenReport?.actionSummary ||
                      incident.resolutionNote ||
                      "Field engineer and maintenance team inspected the location and completed the required redressal work."}
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    Resolved by: <strong>{incident.actionTakenReport?.resolvedBy || incident.assignedOfficer?.name || "Field Officer"}</strong>
                    {incident.actionTakenReport?.completionDate && (
                      <span> • Date: {new Date(incident.actionTakenReport.completionDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Before & After Visual Comparison */}
              {((incident.actionTakenReport?.afterMedia && incident.actionTakenReport.afterMedia.length > 0) ||
                (incident.resolutionMedia && incident.resolutionMedia.length > 0)) && (
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                    <Wrench className="size-3.5" />
                    Inspection & Resolution Photos (Before & After)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                        Before Fix
                      </span>
                      <div className="h-32 rounded-lg overflow-hidden border border-rose-300 dark:border-rose-900 bg-muted">
                        {incident.media && incident.media[0] ? (
                          <img
                            src={formatMediaUrl(incident.media[0])}
                            alt="Before Resolution"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-[10px] text-muted-foreground">
                            No photo attached
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        After Fix
                      </span>
                      <div className="h-32 rounded-lg overflow-hidden border border-emerald-400 dark:border-emerald-700 bg-muted">
                        <img
                          src={formatMediaUrl(
                            (incident.actionTakenReport?.afterMedia && incident.actionTakenReport.afterMedia[0]) ||
                              (incident.resolutionMedia && incident.resolutionMedia[0]) ||
                              ""
                          )}
                          alt="After Resolution"
                          className="size-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Re-Open Action for Citizens if problem returned */}
              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Has the issue returned on the ground?
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReopenModalOpen(true)}
                  className="h-7 text-xs border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 gap-1 font-semibold"
                >
                  <RotateCcw className="size-3 text-rose-600" />
                  <span>Re-Open Grievance</span>
                </Button>
              </div>
            </div>
          )}

          {/* Description / Summary */}
          <div className="space-y-1 my-2">
            <span className="text-xs font-semibold text-foreground">Grievance Description</span>
            <p className="text-xs text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-lg border whitespace-pre-line">
              {incident.description}
            </p>
          </div>

          {/* Linked Reports Timeline */}
          <div className="space-y-2.5 my-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-blue-600" />
                Citizen Reports ({incident.reportCount || reports.length || 1})
              </span>
              {isCluster && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                  Clustered Incident ({incident.reportCount || reports.length || 1})
                </span>
              )}
            </div>

            {loadingDetails ? (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Spinner className="size-3.5" /> Loading details...
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {reports.length > 0 ? (
                  reports.map((rep, idx) => (
                    <div
                      key={rep._id || idx}
                      className="text-xs p-2.5 rounded-lg border border-border/80 bg-background/60 space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-1">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <User className="size-3 text-blue-600" />
                          {rep.reporterName || "Citizen"}
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

                      <p className="text-foreground/90 font-medium text-xs">{rep.title}</p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {rep.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-muted/20 border text-xs text-muted-foreground flex items-center gap-2">
                    <ShieldAlert className="size-4 text-blue-600" />
                    <span>Original complaint submitted by citizen.</span>
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
                    : "bg-[#003366] hover:bg-[#002244] text-white"
                }`}
              >
                <ThumbsUp className="size-3.5" />
                {hasUpvoted ? "Verified" : "Upvote"} ({incident.upvotes || 1})
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                title="Share grievance details"
              >
                <Share2 className="size-3.5 text-blue-600" />
                <span>Share</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFlagModalOpen(true)}
                className="text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Report issue"
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
      </Dialog>

      {/* Official Printable Grievance Acknowledgment Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-xl p-6 bg-white text-slate-900 border-2 border-[#003366]">
          {/* Top Indian Tricolor Strip */}
          <div className="h-1.5 -mx-6 -mt-6 mb-4 flex">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-[#FFFFFF] border-y border-slate-200" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          <div className="text-center space-y-1 border-b-2 border-[#003366] pb-3">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="size-6 text-[#003366]" />
              <h2 className="text-base font-extrabold uppercase tracking-wide text-[#003366]">
                Civic Grievance & Redressal Authority
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Public Grievance Redressal Slip • Official Record
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              (CivicDesk Integrated Central Grievance Redressal System)
            </p>
          </div>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded border border-slate-300">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Grievance Tracking ID
                </span>
                <p className="font-mono text-sm font-extrabold text-[#003366]">
                  {incident.complaintRef || "CIVIC-2026-PENDING"}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
                <p className="font-bold text-xs uppercase text-slate-800">
                  {incident.status.replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Date Registered</span>
                <p className="font-semibold text-slate-900">
                  {new Date(incident.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Department</span>
                <p className="font-semibold text-slate-900">
                  {incident.department || "Public Works & Civic Cell"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Municipal Jurisdiction</span>
                <p className="font-semibold text-slate-900">
                  {incident.assignedAuthority?.name || incident.ward || "Zonal Municipal Desk"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Landmark</span>
                <p className="font-semibold text-slate-900">
                  {incident.landmark || incident.address || "Local area"}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Grievance Subject & Description</span>
              <p className="font-bold text-slate-900">{incident.title}</p>
              <p className="text-[11px] text-slate-700 leading-snug">{incident.description}</p>
            </div>

            {incident.assignedOfficer && (
              <div className="p-2 rounded border border-blue-200 bg-blue-50 text-[11px]">
                <span className="font-bold text-blue-900">Assigned Field Officer: </span>
                <span className="font-semibold">{incident.assignedOfficer.name}</span> ({incident.assignedOfficer.designation})
                {incident.assignedOfficer.phone && <span> • Contact: {incident.assignedOfficer.phone}</span>}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <QrCode className="size-8 text-[#003366]" />
                <div>
                  <p className="font-bold text-[#003366]">Computer Generated Acknowledgment Receipt</p>
                  <p>National Emergency Helpline: 112 • Central Civic Helpdesk</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold uppercase text-[#003366]">Central Redressal Operations</p>
                <p className="text-[9px]">Valid without physical signature</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReceiptModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="bg-[#003366] hover:bg-[#002244] text-white text-xs font-semibold gap-1.5"
            >
              <Printer className="size-3.5" />
              <span>Print / Download PDF</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Community Moderation Report Modal */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <AlertOctagon className="size-5 text-rose-600" />
              Report Inaccurate or Inappropriate Grievance
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              If this complaint contains incorrect information, false alarm, or inappropriate content, report it for review.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFlagSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Select Reason
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
              >
                <option value="False Alarm / Hazard Does Not Exist">
                  Issue does not exist on the ground
                </option>
                <option value="Resolved Already / Outdated Information">
                  Already resolved / Outdated information
                </option>
                <option value="Duplicate Photo / Stolen or Reused Image">
                  Duplicate or irrelevant photo
                </option>
                <option value="Spam, Advertisement, or Inappropriate Content">
                  Spam, advertising, or inappropriate content
                </option>
              </select>
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

      {/* Re-Open Grievance Dialog */}
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <RotateCcw className="size-5 text-rose-600" />
              Re-Open Grievance
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              If the problem has returned after resolution (e.g. pipeline leaking again, street light failed again), provide details to reopen the grievance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReopenSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Current Ground Situation Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. The water pipeline started leaking again at the repaired joint."
                rows={3}
                required
                className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden resize-none"
              />
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
                {reopening ? "Reopening..." : "Reopen Grievance"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
