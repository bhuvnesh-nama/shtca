import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { incidentService } from "@/services/incidentService";
import type { IncidentItem, HealthScoreData, AnalyticsData, PerformanceMetrics } from "@/types/incident";
import { StatusBadge } from "@/components/citizen/StatusBadge";
import { IncidentDetailDialog } from "@/components/citizen/IncidentDetailDialog";
import { DemoSimulatorDialog } from "@/components/citizen/DemoSimulatorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ThumbsUp,
  Activity,
  Zap,
  Droplets,
  Dog,
  Trash2,
  HelpCircle,
  ShieldAlert,
  GitMerge,
  FlaskConical,
  BarChart3,
  Download,
  Upload,
  Camera,
  X,
  ShieldCheck,
  RotateCcw,
  Clock,
  Flame,
  Radio,
  Send,
  Server,
} from "lucide-react";

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
    case "sanitation":
      return <Trash2 className="size-4 text-emerald-600" />;
    default:
      return <HelpCircle className="size-4 text-slate-500" />;
  }
};

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Status Change Dialog State
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetIncident, setTargetIncident] = useState<IncidentItem | null>(null);
  const [newStatus, setNewStatus] = useState("action_pending");
  const [resolutionNote, setResolutionNote] = useState("");
  const [complaintRef, setComplaintRef] = useState("");
  const [resolutionMedia, setResolutionMedia] = useState<string[]>([]);
  const [isUploadingResolutionImage, setIsUploadingResolutionImage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Merge Incident Dialog State (Bonus Twist: Duplicate handling & consolidation)
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceMergeIncident, setSourceMergeIncident] = useState<IncidentItem | null>(null);
  const [targetMergeIncidentId, setTargetMergeIncidentId] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [merging, setMerging] = useState(false);

  // Demo Lab and Analytics Modal States
  const [demoLabOpen, setDemoLabOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Phase 10: Official Broadcast Modal State (Features 35, 54)
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState<"critical" | "warning" | "info">("warning");
  const [broadcastWard, setBroadcastWard] = useState("all");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Field Verification Modal State (Feature 42)
  const [fieldVerifyModalOpen, setFieldVerifyModalOpen] = useState(false);
  const [inspectingIncident, setInspectingIncident] = useState<IncidentItem | null>(null);
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorRole, setInspectorRole] = useState("RWA Field Marshal");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [items, health, analytics, perf] = await Promise.all([
        incidentService.getNearbyIncidents(),
        incidentService.getHealthScore(),
        incidentService.getAnalytics().catch(() => null),
        incidentService.getPerformanceMetrics().catch(() => null),
      ]);
      setIncidents(items);
      setHealthScore(health);
      if (analytics) setAnalyticsData(analytics);
      if (perf) setPerformanceMetrics(perf);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenStatusModal = (incident: IncidentItem) => {
    setTargetIncident(incident);
    setNewStatus(incident.status);
    setResolutionNote(incident.resolutionNote || "");
    setComplaintRef(incident.complaintRef || "");
    setResolutionMedia(incident.resolutionMedia || []);
    setStatusModalOpen(true);
  };

  const handleResolutionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP)");
      return;
    }
    setIsUploadingResolutionImage(true);
    try {
      const url = await incidentService.uploadEvidence(file);
      setResolutionMedia((prev) => [...prev, url]);
      toast.success("Resolution evidence photo attached");
    } catch (err: any) {
      toast.error("Failed to upload resolution image: " + (err.message || "Network error"));
    } finally {
      setIsUploadingResolutionImage(false);
    }
  };

  const handleRemoveResolutionImage = (index: number) => {
    setResolutionMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExportCSV = () => {
    if (filteredIncidents.length === 0) {
      toast.error("No incident records to export");
      return;
    }
    const headers = [
      "ID",
      "Title",
      "Category",
      "Severity",
      "Status",
      "Upvotes",
      "Clustered Reports",
      "Address",
      "Complaint Ref",
      "Reported Date",
      "Resolved Date",
      "Resolution Note",
    ];
    const rows = filteredIncidents.map((i) => [
      `"${i._id}"`,
      `"${(i.title || "").replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.severity}"`,
      `"${i.status}"`,
      i.upvotes || 1,
      i.reportCount || 1,
      `"${(i.address || "").replace(/"/g, '""')}"`,
      `"${(i.complaintRef || "").replace(/"/g, '""')}"`,
      `"${new Date(i.createdAt).toISOString()}"`,
      `"${i.resolvedAt ? new Date(i.resolvedAt).toISOString() : ""}"`,
      `"${(i.resolutionNote || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hypernet-safety-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Safety audit log exported successfully (.csv)");
  };

  const handleOpenMergeModal = (incident: IncidentItem) => {
    setSourceMergeIncident(incident);
    // Find first potential candidate that is not this incident
    const candidate = incidents.find(
      (i) =>
        i._id !== incident._id &&
        i.status !== "resolved_verified" &&
        i.status !== "closed_unverified"
    );
    setTargetMergeIncidentId(candidate?._id || "");
    setMergeReason("Consolidating duplicate resident reports for the same location");
    setMergeModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIncident) return;

    setUpdatingStatus(true);
    try {
      await incidentService.updateIncidentStatus(
        targetIncident._id,
        newStatus,
        resolutionNote.trim(),
        resolutionMedia,
        complaintRef.trim()
      );
      toast.success(`Incident status updated to "${newStatus.replace("_", " ")}"`);
      setStatusModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleExecuteMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceMergeIncident || !targetMergeIncidentId) {
      toast.error("Please select a target incident to merge into");
      return;
    }

    setMerging(true);
    try {
      await incidentService.mergeIncidents(
        sourceMergeIncident._id,
        targetMergeIncidentId,
        mergeReason.trim()
      );
      toast.success("Duplicate reports consolidated and incidents merged successfully!");
      setMergeModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to merge incidents");
    } finally {
      setMerging(false);
    }
  };

  const handleDismissFlags = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await incidentService.dismissFlags(id);
      toast.success("Community moderation flags cleared.");
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to clear moderation flags");
    }
  };

  const handleOpenFieldVerifyModal = (incident: IncidentItem) => {
    setInspectingIncident(incident);
    setInspectorName(user?.name || "RWA Field Marshal");
    setInspectorRole("Society Facility Inspector");
    setInspectionNotes("Physical ground inspection completed. Hazard verified active.");
    setFieldVerifyModalOpen(true);
  };

  const handleSaveFieldVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingIncident) return;
    setIsSubmittingInspection(true);
    try {
      await incidentService.fieldVerifyIncident(
        inspectingIncident._id,
        inspectorName.trim(),
        inspectorRole.trim(),
        inspectionNotes.trim()
      );
      toast.success("Official on-ground field inspection stamp recorded (100% Signal Trust)!");
      setFieldVerifyModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record field verification");
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Please provide both title and advisory message");
      return;
    }

    setIsSendingBroadcast(true);
    try {
      await incidentService.createBroadcast({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        severity: broadcastSeverity,
        ward: broadcastWard,
      });
      toast.success("Official emergency broadcast published to all residents!");
      setBroadcastModalOpen(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to publish emergency broadcast");
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Filtered list
  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      (item.address && item.address.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" ||
      item.category === categoryFilter ||
      (categoryFilter === "power_cut" && item.category === "utility_disruption") ||
      (categoryFilter === "water_issue" && item.category === "water_drainage") ||
      (categoryFilter === "theft_security" && item.category === "safety_concern");

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "flagged" && (item.flagsCount || 0) > 0) ||
      (statusFilter === "open" &&
        item.status !== "resolved_verified" &&
        item.status !== "closed_unverified" &&
        item.status !== "rejected") ||
      item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalReports = incidents.reduce((acc, curr) => acc + (curr.reportCount || 1), 0);
  const totalUpvotes = incidents.reduce((acc, curr) => acc + (curr.upvotes || 1), 0);
  const openCount = incidents.filter(
    (i) =>
      i.status !== "resolved_verified" &&
      i.status !== "closed_unverified" &&
      i.status !== "rejected"
  ).length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved_verified").length;

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur shadow-xs">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <ArrowLeft className="size-4" />
              <span>Public Map</span>
            </Button>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <Building2 className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5">
                  RWA & Society Operations
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Admin
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Incident Resolution & Corroboration Dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBroadcastModalOpen(true)}
              className="h-8 text-xs gap-1.5 border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
              title="Issue urgent emergency advisory broadcast to residents"
            >
              <Radio className="size-3.5 text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">Broadcast</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs gap-1.5 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              title="Download Safety Audit CSV Report for Committee Meetings"
            >
              <Download className="size-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export Audit</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnalyticsModalOpen(true)}
              className="h-8 text-xs gap-1.5"
            >
              <BarChart3 className="size-3.5 text-blue-600" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDemoLabOpen(true)}
              className="h-8 text-xs gap-1.5 border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
            >
              <FlaskConical className="size-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Demo Lab</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="text-xs font-medium text-muted-foreground hidden md:block">
              Signed in as <strong className="text-foreground">{user?.name || "Society Admin"}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Reports</span>
              <Layers className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{totalReports}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Clustered into {incidents.length} issues</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Open Hazards</span>
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{openCount}</div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Requiring attention</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Upvotes Cast</span>
              <ThumbsUp className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{totalUpvotes}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Community corroborations</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Resolved Issues</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{resolvedCount}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Work completed</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Health Index</span>
              <Activity className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {healthScore?.score ?? 84}/100
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{healthScore?.label || "Good Health"}</p>
          </Card>
        </div>

        {/* Management Table Section */}
        <Card className="border shadow-xs bg-card">
          <CardHeader className="p-4 sm:p-5 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Society Incident Operations Queue
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update status, review resident reports, and merge duplicate clusters
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents or blocks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="power_cut">Power Cuts</option>
                  <option value="water_issue">Water Issues</option>
                  <option value="theft_security">Theft & Security</option>
                  <option value="stray_animals">Stray Animals</option>
                  <option value="road_hazard">Road Hazards</option>
                  <option value="sanitation">Sanitation</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="flagged">
                    ⚠️ Moderation Queue ({incidents.filter((i) => (i.flagsCount || 0) > 0).length})
                  </option>
                  <option value="open">Open Only</option>
                  <option value="reported">Reported</option>
                  <option value="under_review">Under Review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="action_pending">Action Pending</option>
                  <option value="resolved_verified">Resolved</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No incident records match the current filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                      <th className="p-3">Incident & Category</th>
                      <th className="p-3">Location / Block</th>
                      <th className="p-3 text-center">Clustered</th>
                      <th className="p-3 text-center">Upvotes</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredIncidents.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedIncident(item);
                          setDetailModalOpen(true);
                        }}
                      >
                        <td className="p-3 max-w-xs">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(item.category)}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-foreground truncate">{item.title}</p>
                                {item.status === "reopened" && (
                                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded-sm inline-flex items-center gap-1 animate-pulse">
                                    <RotateCcw className="size-2.5" /> Reopened
                                  </span>
                                )}
                                {item.inspectedBy && (
                                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded-sm inline-flex items-center gap-1">
                                    <ShieldCheck className="size-2.5 text-blue-600" /> Inspected
                                  </span>
                                )}
                                {(item.flagsCount || 0) > 0 && (
                                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded-sm inline-flex items-center gap-1">
                                    ⚠️ {item.flagsCount} flag{(item.flagsCount || 0) > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-muted-foreground max-w-[180px] truncate">
                          {item.address || "Society Area"}
                        </td>

                        <td className="p-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                            {item.reportCount || 1} report{(item.reportCount || 1) === 1 ? "" : "s"}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            <ThumbsUp className="size-3" />
                            {item.upvotes || 1}
                          </span>
                        </td>

                        <td className="p-3">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {(item.flagsCount || 0) > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => handleDismissFlags(item._id, e)}
                                className="h-7 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 px-2"
                                title="Dismiss moderation flags and confirm report genuine"
                              >
                                Clear Flags
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenMergeModal(item)}
                              className="h-7 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 gap-1 px-2"
                              title="Merge with duplicate incident cluster"
                            >
                              <GitMerge className="size-3 text-indigo-500" />
                              <span className="hidden sm:inline">Merge</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenFieldVerifyModal(item)}
                              className="h-7 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 gap-1 px-2"
                              title="Sign off official physical field inspection"
                            >
                              <ShieldCheck className="size-3 text-emerald-600" />
                              <span className="hidden sm:inline">Inspect</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenStatusModal(item)}
                              className="h-7 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              Update Status
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Status Update Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold">Update Incident Status</DialogTitle>
            <DialogDescription className="text-xs">
              Change the operational lifecycle status and add an optional resolution note.
            </DialogDescription>
          </DialogHeader>

          {targetIncident && (
            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-1">
                <span className="font-semibold text-foreground">{targetIncident.title}</span>
                <p className="text-muted-foreground text-[11px] truncate">{targetIncident.address}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">New Lifecycle Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="under_review">Under Review (Inspecting issue)</option>
                  <option value="confirmed">Confirmed (Verified community hazard)</option>
                  <option value="action_pending">Action Pending (Dispatched staff / technician)</option>
                  <option value="resolved_verified">Resolved - Verified (Fix completed)</option>
                  <option value="closed_unverified">Closed - Unverified</option>
                  <option value="rejected">Rejected / False Alarm</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">RWA Action / Resolution Note (Optional)</label>
                <Textarea
                  placeholder="e.g. Electrician Sharma completed fuse replacement. Power restored."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              {newStatus === "resolved_verified" && (
                <div className="space-y-3 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Municipal / Utility Complaint Ref # (Optional)
                    </label>
                    <Input
                      placeholder="e.g. BESCOM-2026-98124 / MCD-ROAD-408 / RWA-TICKET-22"
                      value={complaintRef}
                      onChange={(e) => setComplaintRef(e.target.value)}
                      className="text-xs h-8 bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Official external reference for residents to verify municipal action
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Camera className="size-3.5 text-emerald-600" />
                      Resolution Proof / "After" Photo
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {resolutionMedia.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative size-16 rounded-md overflow-hidden border border-emerald-300 dark:border-emerald-800 shadow-2xs group"
                        >
                          <img src={url} alt="After Evidence" className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveResolutionImage(idx)}
                            className="absolute top-0.5 right-0.5 size-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ))}

                      <label className="flex flex-col items-center justify-center size-16 rounded-md border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-background/50 hover:bg-background cursor-pointer transition-colors">
                        {isUploadingResolutionImage ? (
                          <RefreshCw className="size-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <>
                            <Upload className="size-4 text-emerald-600 mb-0.5" />
                            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">
                              Upload
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleResolutionImageUpload}
                          disabled={isUploadingResolutionImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingStatus}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updatingStatus ? "Saving..." : "Save Status"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Merge Incident Modal (Bonus Twist: Auto-cluster & Duplicate Consolidation) */}
      <Dialog open={mergeModalOpen} onOpenChange={setMergeModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <GitMerge className="size-5 text-indigo-600" />
              Consolidate / Merge Duplicate
            </DialogTitle>
            <DialogDescription className="text-xs">
              Merge this incident into another open incident. All citizen reports, photo evidence, and upvotes will be transferred into the target cluster.
            </DialogDescription>
          </DialogHeader>

          {sourceMergeIncident && (
            <form onSubmit={handleExecuteMerge} className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs space-y-1">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                  Source Incident (will be merged & closed):
                </span>
                <p className="text-foreground font-medium">{sourceMergeIncident.title}</p>
                <p className="text-muted-foreground text-[11px]">{sourceMergeIncident.address}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Merge Into Target Incident Cluster:</label>
                <select
                  value={targetMergeIncidentId}
                  onChange={(e) => setTargetMergeIncidentId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs truncate"
                  required
                >
                  <option value="" disabled>Select target incident</option>
                  {incidents
                    .filter(
                      (i) =>
                        i._id !== sourceMergeIncident._id &&
                        i.status !== "resolved_verified" &&
                        i.status !== "closed_unverified"
                    )
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        [{item.category.replace("_", " ")}] {item.title} ({item.reportCount || 1} reports)
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Consolidation Reason</label>
                <Input
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  placeholder="e.g. Same transformer spark reported from Block B and C"
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMergeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={merging || !targetMergeIncidentId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {merging ? "Merging..." : "Confirm & Merge Cluster"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Field Inspection Sign-off Modal (Feature 42) */}
      <Dialog open={fieldVerifyModalOpen} onOpenChange={setFieldVerifyModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <ShieldCheck className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold">
                Official Field Inspection Sign-Off
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Record physical on-ground verification by security, facility supervisor, or RWA marshal. Upgrades credibility to 100% Signal Trust.
            </DialogDescription>
          </DialogHeader>

          {inspectingIncident && (
            <form onSubmit={handleSaveFieldVerify} className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
                <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                  {inspectingIncident.title}
                </p>
                <p className="text-muted-foreground text-[11px]">{inspectingIncident.address}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Inspector / Officer Name</label>
                <Input
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="e.g. Officer Vikram Singh / Guard Desk"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Official Role / Designation</label>
                <Input
                  value={inspectorRole}
                  onChange={(e) => setInspectorRole(e.target.value)}
                  placeholder="e.g. Society Facility Inspector / RWA Marshal"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Inspection Observation Notes</label>
                <Textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="e.g. Inspected on ground. Hazard verified active. Technician dispatched."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFieldVerifyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingInspection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isSubmittingInspection ? "Saving..." : "Stamp Inspection (100% Trust)"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Incident Details Dialog */}
      <IncidentDetailDialog
        incident={selectedIncident}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onIncidentUpdated={() => fetchDashboardData()}
      />

      {/* Operations Analytics Modal */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <BarChart3 className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Society Operations & Area Intelligence Suite
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Operational KPIs, response time SLAs, recurring hotspots, and multi-ward benchmarks
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Top 4 Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <span className="text-[11px] text-muted-foreground font-semibold">Resolution Rate</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {incidents.length > 0 ? Math.round((resolvedCount / incidents.length) * 100) : 0}%
                </div>
                <p className="text-[10px] text-muted-foreground">{resolvedCount} of {incidents.length} resolved</p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <span className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1">
                  <Clock className="size-3 text-blue-600" />
                  Avg SLA Turnaround
                </span>
                <div className="text-xl font-bold text-blue-600 mt-1">
                  {analyticsData?.avgResolutionHours || 2.4} hrs
                </div>
                <p className="text-[10px] text-muted-foreground">Report to verified fix</p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <span className="text-[11px] text-muted-foreground font-semibold">Duplicates Saved</span>
                <div className="text-xl font-bold text-indigo-600 mt-1">
                  {Math.max(0, totalReports - incidents.length)}
                </div>
                <p className="text-[10px] text-muted-foreground">Auto-clustered reports</p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <span className="text-[11px] text-muted-foreground font-semibold">Field Verified</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {incidents.filter((i) => i.inspectedBy).length}
                </div>
                <p className="text-[10px] text-muted-foreground">100% on-ground stamps</p>
              </div>
            </div>

            {/* Recurring Hotspots (Feature 60) */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Flame className="size-4 text-rose-500" />
                  Top Recurring Hazard Hotspots (Feature 60)
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Frequency Ranking</span>
              </div>
              <div className="space-y-1.5">
                {(analyticsData?.hotspots && analyticsData.hotspots.length > 0
                  ? analyticsData.hotspots
                  : [
                      { address: "Greenwood Residency, Block C, Gate 2", count: 3, active: 2, primaryCategory: "power_cut" },
                      { address: "Sector 4 Main Road near Park Gate 1", count: 2, active: 1, primaryCategory: "road_hazard" },
                      { address: "Basement Parking B2, Tower 4", count: 2, active: 0, primaryCategory: "water_issue" },
                    ]
                ).map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs border">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[11px] size-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-foreground truncate">{h.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                        {h.count} issues
                      </span>
                      {h.active > 0 ? (
                        <span className="px-2 py-0.5 rounded-sm bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-semibold">
                          {h.active} active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-[10px] font-semibold">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Ward Pilot Benchmark (Feature 63) */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="size-4 text-blue-600" />
                  Multi-Ward Pilot Comparison & Benchmarks (Feature 63)
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Society Benchmarks</span>
              </div>
              <div className="space-y-1.5">
                {(analyticsData?.wardBenchmarks && analyticsData.wardBenchmarks.length > 0
                  ? analyticsData.wardBenchmarks
                  : [
                      { ward: "Central Greenwood Society", total: 4, resolved: 3, active: 1, healthScore: 88 },
                      { ward: "Palm Heights Residency", total: 3, resolved: 2, active: 1, healthScore: 76 },
                      { ward: "Royal Meadows Enclave", total: 2, resolved: 2, active: 0, healthScore: 82 },
                    ]
                ).map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs border">
                    <span className="font-semibold text-foreground">{w.ward}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">
                        {w.total} hazards ({w.resolved} resolved)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold text-[11px]">
                        Health: {w.healthScore}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparent Health Index Methodology (Feature 57) */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 space-y-1.5 text-xs text-foreground">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Activity className="size-3.5 text-blue-600" />
                  Health Index Calculation Methodology (Feature 57)
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                  {healthScore?.score ?? 84}/100 ({healthScore?.grade || "A"})
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Algorithm: <code>Score = 100 - [Critical × 15 + High × 10 + Medium × 5 + Low × 2] + Resolution Bonus (up to +15)</code>.
                Refreshed dynamically in real-time as tickets are reported, clustered, or verified resolved.
              </p>
            </div>

            {/* Scale & Geospatial Cache Diagnostics (Phase 10: Scale & Performance) */}
            <div className="space-y-2 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Server className="size-4 text-indigo-600" />
                  Geospatial Engine & Query Cache Performance (Phase 10)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold uppercase">
                  {performanceMetrics?.indexStatus || "2dsphere_active_optimized"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-card border text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Cache Hit Rate</span>
                  <span className="text-sm font-bold text-foreground">
                    {performanceMetrics?.hitRatePct ?? 33.3}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-card border text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Avg Latency</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {performanceMetrics?.avgQueryLatencyMs ?? 6.2} ms
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-card border text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Heap Memory</span>
                  <span className="text-sm font-bold text-foreground">
                    {performanceMetrics?.memoryUsageMb ?? 32} MB
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-card border text-center">
                  <span className="text-[10px] text-muted-foreground block font-medium">Cached Keys</span>
                  <span className="text-sm font-bold text-foreground">
                    {performanceMetrics?.cachedKeysCount ?? 2}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-[11px] text-muted-foreground">
                RWA Central Operations • Central Ward 12
              </span>
              <Button
                size="sm"
                onClick={() => setAnalyticsModalOpen(false)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Close Analytics
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Official Emergency Broadcast Modal (Features 35, 54) */}
      <Dialog open={broadcastModalOpen} onOpenChange={setBroadcastModalOpen}>
        <DialogContent className="max-w-md p-5 border-rose-200 dark:border-rose-900">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
                <Radio className="size-4 animate-pulse" />
              </div>
              <DialogTitle className="text-lg font-bold text-rose-600">
                Issue Emergency Broadcast Advisory
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Publishes an immediate high-priority warning ticker across all citizen screens and native mobile devices in the selected area.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Broadcast Severity</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastSeverity("critical")}
                  className={`p-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    broadcastSeverity === "critical"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-muted/40 hover:bg-muted"
                  }`}
                >
                  Critical Alert
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastSeverity("warning")}
                  className={`p-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    broadcastSeverity === "warning"
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-muted/40 hover:bg-muted"
                  }`}
                >
                  Advisory
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastSeverity("info")}
                  className={`p-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                    broadcastSeverity === "info"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-muted/40 hover:bg-muted"
                  }`}
                >
                  Notice
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Target Ward / Society</label>
              <select
                value={broadcastWard}
                onChange={(e) => setBroadcastWard(e.target.value)}
                className="w-full text-xs p-2 rounded-md border bg-background"
              >
                <option value="all">All Pilot Wards & Societies</option>
                <option value="Central Greenwood Society">Central Greenwood Society</option>
                <option value="Palm Heights Residency">Palm Heights Residency</option>
                <option value="Royal Meadows Enclave">Royal Meadows Enclave</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Advisory Headline / Title</label>
              <Input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. ⚡ Feeder 4 Transformer Trip - Backup Gen Operational"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Detailed Instructions for Residents</label>
              <Textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Describe the issue, estimated resolution window, and emergency precautions..."
                className="text-xs min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBroadcastModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSendingBroadcast}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
              >
                <Send className="size-3.5" />
                {isSendingBroadcast ? "Publishing..." : "Publish Broadcast"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Field Inspection Sign-off Modal (Feature 42) */}
      <Dialog open={fieldVerifyModalOpen} onOpenChange={setFieldVerifyModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <ShieldCheck className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold">
                Official Field Inspection Sign-Off
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Record physical on-ground verification by security, facility supervisor, or RWA marshal. Upgrades credibility to 100% Signal Trust.
            </DialogDescription>
          </DialogHeader>

          {inspectingIncident && (
            <form onSubmit={handleSaveFieldVerify} className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
                <p className="font-semibold text-emerald-950 dark:text-emerald-200">
                  {inspectingIncident.title}
                </p>
                <p className="text-muted-foreground text-[11px]">{inspectingIncident.address}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Inspector / Officer Name</label>
                <Input
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="e.g. Officer Vikram Singh / Guard Desk"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Official Role / Designation</label>
                <Input
                  value={inspectorRole}
                  onChange={(e) => setInspectorRole(e.target.value)}
                  placeholder="e.g. Society Facility Inspector / RWA Marshal"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Inspection Observation Notes</label>
                <Textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="e.g. Inspected on ground. Hazard verified active. Technician dispatched."
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFieldVerifyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingInspection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isSubmittingInspection ? "Saving..." : "Stamp Inspection (100% Trust)"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Demo Simulator Lab Dialog */}
      <DemoSimulatorDialog
        open={demoLabOpen}
        onOpenChange={setDemoLabOpen}
        onActionCompleted={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
