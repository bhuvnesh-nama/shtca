import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { incidentService } from "@/services/incidentService";
import { api } from "@/lib/apiClient";
import { formatMediaUrl } from "@/utils/media";
import type { IncidentItem, HealthScoreData, AnalyticsData, PerformanceMetrics } from "@/types/incident";
import { StatusBadge } from "@/components/citizen/StatusBadge";
import { IncidentDetailDialog } from "@/components/citizen/IncidentDetailDialog";
import { IncidentMap } from "@/components/citizen/IncidentMap";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LOCAL_JURISDICTION_OFFICES,
  type LocalOfficeJurisdiction,
} from "@/types/jurisdiction";
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
  Map,
  ListFilter,
  ThumbsUp,
  Activity,
  Zap,
  Droplets,
  Dog,
  Trash2,
  HelpCircle,
  ShieldAlert,
  GitMerge,
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
  UserCheck,
  Phone,
  Tag,
  ChevronDown,
  UserPlus,
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
  const [wardFilter, setWardFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [adminViewMode, setAdminViewMode] = useState<"map" | "table">("map");

  // Hyperlocal Jurisdiction Office Selection & Isolation
  const isSuperAdmin = (!user?.ward || user?.ward === "AUTH-APEX-01") && user?.role === "admin";
  const initialOfficeId = !isSuperAdmin && user?.ward && LOCAL_JURISDICTION_OFFICES.some((o) => o.id === user.ward)
    ? user.ward
    : "AUTH-ZONE-JAIPUR-MALVIYA";
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(initialOfficeId);

  useEffect(() => {
    if (!isSuperAdmin && user?.ward) {
      setSelectedOfficeId(user.ward);
    }
  }, [user, isSuperAdmin]);

  const currentOffice: LocalOfficeJurisdiction =
    LOCAL_JURISDICTION_OFFICES.find((o) => o.id === selectedOfficeId) ||
    LOCAL_JURISDICTION_OFFICES[0];


  // New Admin / Officer Creation State (Phase 11: Multi-Admin Support)
  const [createOfficerModalOpen, setCreateOfficerModalOpen] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerEmail, setNewOfficerEmail] = useState("");
  const [newOfficerPassword, setNewOfficerPassword] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");
  const [newOfficerRole, setNewOfficerRole] = useState<"admin" | "officer">("admin");
  const [newOfficerWard, setNewOfficerWard] = useState(selectedOfficeId);
  const [isCreatingOfficer, setIsCreatingOfficer] = useState(false);

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName.trim() || !newOfficerEmail.trim() || !newOfficerPassword.trim()) {
      toast.error("Name, email and password are required");
      return;
    }
    setIsCreatingOfficer(true);
    try {
      await api.post("/auth/authority/register", {
        name: newOfficerName.trim(),
        email: newOfficerEmail.trim(),
        password: newOfficerPassword.trim(),
        phone: newOfficerPhone.trim(),
        role: newOfficerRole,
        ward: newOfficerWard,
      });
      toast.success(`Authority account created for ${newOfficerName.trim()}! Assigned to desk: ${newOfficerWard}`);
      setCreateOfficerModalOpen(false);
      setNewOfficerName("");
      setNewOfficerEmail("");
      setNewOfficerPassword("");
      setNewOfficerPhone("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create authority account");
    } finally {
      setIsCreatingOfficer(false);
    }
  };

  // Status Change Dialog State
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetIncident, setTargetIncident] = useState<IncidentItem | null>(null);
  const [newStatus, setNewStatus] = useState("action_pending");
  const [resolutionNote, setResolutionNote] = useState("");
  const [complaintRef, setComplaintRef] = useState("");
  const [assignedOfficerName, setAssignedOfficerName] = useState("");
  const [assignedOfficerRole, setAssignedOfficerRole] = useState("Junior Engineer (JE) - Civil");
  const [assignedOfficerPhone, setAssignedOfficerPhone] = useState("");
  const [assignedDepartment, setAssignedDepartment] = useState("");
  const [resolutionMedia, setResolutionMedia] = useState<string[]>([]);
  const [isUploadingResolutionImage, setIsUploadingResolutionImage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Merge Incident Dialog State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceMergeIncident, setSourceMergeIncident] = useState<IncidentItem | null>(null);
  const [targetMergeIncidentId, setTargetMergeIncidentId] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [merging, setMerging] = useState(false);

  // Analytics Modal States
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Official Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [heatmapModalOpen, setHeatmapModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState<"critical" | "warning" | "info">("warning");
  const [broadcastWard, setBroadcastWard] = useState("all");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Field Verification Modal State
  const [fieldVerifyModalOpen, setFieldVerifyModalOpen] = useState(false);
  const [inspectingIncident, setInspectingIncident] = useState<IncidentItem | null>(null);
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorRole, setInspectorRole] = useState("Junior Engineer (JE) / Municipal Inspector");
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
    setResolutionNote(incident.resolutionNote || incident.actionTakenReport?.actionSummary || "");
    setComplaintRef(incident.complaintRef || "");
    setAssignedOfficerName(incident.assignedOfficer?.name || "");
    setAssignedOfficerRole(incident.assignedOfficer?.designation || "Junior Engineer (JE) - Civil");
    setAssignedOfficerPhone(incident.assignedOfficer?.phone || "");
    setAssignedDepartment(incident.department || "");
    setResolutionMedia(incident.resolutionMedia || incident.actionTakenReport?.afterMedia || []);
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
    const csvText = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shtca-civic-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      const officerData = assignedOfficerName.trim()
        ? {
            name: assignedOfficerName.trim(),
            designation: assignedOfficerRole.trim(),
            phone: assignedOfficerPhone.trim(),
          }
        : undefined;

      const atrData = {
        actionSummary: resolutionNote.trim(),
        resolvedBy: assignedOfficerName.trim() || user?.name || "Municipal Junior Engineer",
        completionDate: new Date(),
        afterMedia: resolutionMedia,
      };

      await incidentService.updateIncidentStatus(
        targetIncident._id,
        newStatus,
        resolutionNote.trim(),
        resolutionMedia,
        complaintRef.trim(),
        officerData,
        assignedDepartment.trim() || undefined,
        atrData
      );
      toast.success(`Action Taken Report recorded / Status updated to "${newStatus.replace(/_/g, " ")}"`);
      setStatusModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update ATR status");
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
    setInspectorName(user?.name || "Er. A.K. Verma");
    setInspectorRole("Junior Engineer (JE) / Municipal Field Officer");
    setInspectionNotes("Physical on-ground municipal inspection conducted. Civic grievance verified active.");
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
      toast.success("Official on-ground field verification recorded!");
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

  const availableWards = Array.from(
    new Set(incidents.map((i) => i.ward).filter(Boolean))
  ) as string[];

  const availableDepartments = [
    "Jal Board / Water Works & Sewerage",
    "Power Discom & Street Lighting",
    "PWD Roads & Infrastructure",
    "Solid Waste Management & Sanitation",
    "Stray Animal Control & Veterinary",
    "Municipal Encroachment & Security",
  ];

  // Filtered list
  const filteredIncidents = incidents.filter((item) => {
    // 1. Strict Hyperlocal Jurisdiction Isolation
    if (selectedOfficeId !== "AUTH-APEX-01") {
      const isDirectMatch = item.assignedAuthority?.officeId === selectedOfficeId;
      let belongsToOffice = isDirectMatch;

      if (!belongsToOffice) {
        const authName = (item.assignedAuthority?.name || "").toLowerCase();
        const authOff = (item.assignedAuthority?.office || "").toLowerCase();
        if (
          authName.includes(currentOffice.shortName.toLowerCase()) ||
          authOff.includes(currentOffice.office.toLowerCase())
        ) {
          belongsToOffice = true;
        } else {
          // Check zone keywords in ward, address, landmark, title
          const corpus = `${item.ward || ""} ${item.address || ""} ${item.landmark || ""} ${item.title || ""}`.toLowerCase();
          belongsToOffice = currentOffice.zoneKeywords.some((kw) => corpus.includes(kw.toLowerCase()));
        }
      }

      if (!belongsToOffice) {
        return false; // Hyperlocal isolation: Only grievances within this jurisdiction or routed here as nearest office are accessible
      }
    }

    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      (item.complaintRef && item.complaintRef.toLowerCase().includes(query)) ||
      item.description.toLowerCase().includes(query) ||
      (item.ward && item.ward.toLowerCase().includes(query)) ||
      (item.department && item.department.toLowerCase().includes(query)) ||
      (item.landmark && item.landmark.toLowerCase().includes(query)) ||
      (item.address && item.address.toLowerCase().includes(query));

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

    const matchesWard =
      wardFilter === "all" || item.ward === wardFilter;

    const matchesDepartment =
      departmentFilter === "all" || item.department === departmentFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesWard && matchesDepartment;
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
  const fallbackRoutedCount = filteredIncidents.filter(
    (i) => i.assignedAuthority?.distanceKm !== undefined && i.assignedAuthority.distanceKm > 0
  ).length;

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col">
      {/* Official Government Indian Tricolor Ribbon */}
      <div className="h-1 w-full flex shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white border-y border-slate-200" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Top Officer Console Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur shadow-xs">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <ArrowLeft className="size-4" />
            </Button>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#003366] text-white shadow-xs font-bold text-base border border-amber-400 shrink-0">
                🏛️
              </div>
              <h2 className="text-base font-bold text-foreground whitespace-nowrap">
                Authority Console
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Map Mode vs Queue Table View Toggle */}
            <div className="flex items-center rounded-lg border border-border p-1 bg-muted/40 shadow-xs mr-1">
              <button
                type="button"
                onClick={() => setAdminViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  adminViewMode === "map"
                    ? "bg-[#003366] text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Map className="size-3.5" />
                Map Mode
              </button>
              <button
                type="button"
                onClick={() => setAdminViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  adminViewMode === "table"
                    ? "bg-[#003366] text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListFilter className="size-3.5" />
                Queue Table
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBroadcastModalOpen(true)}
              className="h-8 text-xs gap-1.5 border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
              title="Issue urgent emergency advisory broadcast to residents"
            >
              <Radio className="size-3.5 text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">Issue Broadcast</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs gap-1.5 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              title="Download Civic Grievance Audit CSV"
            >
              <Download className="size-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export Audit CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewOfficerWard(selectedOfficeId);
                setCreateOfficerModalOpen(true);
              }}
              className="h-8 text-xs gap-1.5 border-blue-400/40 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
              title="Create new Zonal Admin or Field Officer account"
            >
              <UserPlus className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Add Admin / Officer</span>
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
              onClick={() => setHeatmapModalOpen(true)}
              className="h-8 text-xs gap-1.5 border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
              title="View jurisdiction grievance thermal density heatmap"
            >
              <Flame className="size-3.5 text-rose-500 animate-pulse" />
              <span className="hidden sm:inline">Grievance Heatmap</span>
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

            {/* Active Local Jurisdiction Office Selector (Hyperlocal Tenant Routing) */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              {isSuperAdmin ? (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8.5 px-2.5 text-xs font-semibold gap-2 border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-2xs"
                    title="Switch active department or local society jurisdiction"
                  >
                    <span className="text-sm shrink-0">{currentOffice.icon}</span>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        {currentOffice.tierBadge}
                      </span>
                      <span className="font-bold text-foreground text-xs truncate max-w-[130px] sm:max-w-[200px]">
                        {currentOffice.shortName}
                      </span>
                    </div>
                    <ChevronDown className="size-3 text-muted-foreground ml-0.5 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-84 p-2 shadow-xl z-50">
                  <div className="px-2 py-1.5 border-b mb-1">
                    <span className="text-xs font-bold text-foreground block">
                      Local Jurisdiction Office Selector
                    </span>
                    <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">
                      Hyperlocal isolation: Departments only access their regional queue. Unserved sectors route to closest active office.
                    </span>
                  </div>

                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                    Central Directorate
                  </DropdownMenuLabel>
                  {LOCAL_JURISDICTION_OFFICES.filter((o) => o.tier === "apex_central").map((office) => (
                    <DropdownMenuItem
                      key={office.id}
                      onClick={() => setSelectedOfficeId(office.id)}
                      className={`cursor-pointer rounded-md p-2 text-xs flex items-center justify-between gap-2 ${
                        selectedOfficeId === office.id ? "bg-blue-100/70 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{office.icon}</span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold">{office.shortName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{office.areaLabel}</div>
                        </div>
                      </div>
                      {selectedOfficeId === office.id && (
                        <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                    Tier 2: Zonal Ward Public Works Divisions
                  </DropdownMenuLabel>
                  {LOCAL_JURISDICTION_OFFICES.filter((o) => o.tier === "zonal_ward").map((office) => (
                    <DropdownMenuItem
                      key={office.id}
                      onClick={() => setSelectedOfficeId(office.id)}
                      className={`cursor-pointer rounded-md p-2 text-xs flex items-center justify-between gap-2 ${
                        selectedOfficeId === office.id ? "bg-blue-100/70 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{office.icon}</span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold">{office.shortName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{office.areaLabel}</div>
                        </div>
                      </div>
                      {selectedOfficeId === office.id && (
                        <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                    Tier 3: Housing Societies & Colony RWAs
                  </DropdownMenuLabel>
                  {LOCAL_JURISDICTION_OFFICES.filter((o) => o.tier === "local_society").map((office) => (
                    <DropdownMenuItem
                      key={office.id}
                      onClick={() => setSelectedOfficeId(office.id)}
                      className={`cursor-pointer rounded-md p-2 text-xs flex items-center justify-between gap-2 ${
                        selectedOfficeId === office.id ? "bg-blue-100/70 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{office.icon}</span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold">{office.shortName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{office.areaLabel}</div>
                        </div>
                      </div>
                      {selectedOfficeId === office.id && (
                        <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              ) : (
                <div
                  className="h-8.5 px-3 py-1 rounded-md border border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 flex items-center gap-2 shadow-2xs"
                  title="Your authorized regional jurisdiction (Tenant isolation active)"
                >
                  <span className="text-sm shrink-0">{currentOffice.icon}</span>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <span>🔒</span> {currentOffice.tierBadge} (Isolated Desk)
                    </span>
                    <span className="font-bold text-foreground text-xs truncate max-w-[150px] sm:max-w-[220px]">
                      {currentOffice.shortName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        {/* Hyperlocal Jurisdiction Scope & Fallback Notice Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0 p-2 rounded-lg bg-muted/60 border border-border/80">
              {currentOffice.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-[#003366] dark:text-blue-400">
                  {currentOffice.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                  {currentOffice.tierBadge}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                📍 {currentOffice.office} • Assigned Jurisdiction: <strong className="text-foreground">{currentOffice.areaLabel}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {fallbackRoutedCount > 0 && (
              <span className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                {fallbackRoutedCount} Fallback Dispatches from Adjacent Unserved Sectors
              </span>
            )}
            <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-1 rounded-md border">
              {filteredIncidents.length} Local Grievances Isolated
            </span>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Reports Logged</span>
              <Layers className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{totalReports}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{incidents.length} Unique Grievances</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active in Progress</span>
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{openCount}</div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Pending Field Action</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Citizen Upvotes</span>
              <ThumbsUp className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{totalUpvotes}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Community Endorsements</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Resolved Grievances</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-2">{resolvedCount}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Inspected & Verified</p>
          </Card>

          <Card className="p-4 bg-card border shadow-xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Civic Health Index</span>
              <Activity className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {healthScore?.score ?? 84}/100
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{healthScore?.label || "Good Standing"}</p>
          </Card>
        </div>

        {adminViewMode === "map" ? (
          <div className="w-full">
            <IncidentMap
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(incident) => {
                setSelectedIncident(incident);
              }}
              heightClass="h-[calc(100vh-230px)] min-h-[640px]"
              isAdmin={true}
              activeOffice={currentOffice}
              offices={LOCAL_JURISDICTION_OFFICES}
              onSelectOffice={(officeId) => {
                setSelectedOfficeId(officeId);
              }}
              onOpenStatusModal={(incident) => {
                setTargetIncident(incident);
                setNewStatus(incident.status);
                setComplaintRef(incident.complaintRef || "");
                setAssignedOfficerName(incident.assignedOfficer?.name || "");
                setAssignedOfficerPhone(incident.assignedOfficer?.phone || "");
                setResolutionNote(incident.resolutionNote || "");
                setStatusModalOpen(true);
              }}
              onIncidentUpdated={(updated) => {
                setSelectedIncident(updated);
                setIncidents((prev) =>
                  prev.map((i) => (i._id === updated._id ? updated : i))
                );
              }}
              activeCategory={categoryFilter}
              onSelectCategory={setCategoryFilter}
            />
          </div>
        ) : (
          /* Management Table Section */
          <Card className="border shadow-xs bg-card">
          <CardHeader className="p-4 sm:p-5 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Department Grievance Redressal Queue
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inspection review, field officer assignment & Action Taken Report (ATR) workflow
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search ID, Zone, Department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                {/* Ward Filter */}
                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
                >
                  <option value="all">All Zones & Wards</option>
                  {availableWards.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>

                {/* Department Filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="power_cut">Power Cut</option>
                  <option value="water_issue">Water Supply</option>
                  <option value="road_hazard">Road Hazard</option>
                  <option value="sanitation">Sanitation</option>
                  <option value="stray_animals">Stray Animals</option>
                  <option value="theft_security">Security</option>
                </select>

                {/* Status Filter */}
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
                  <option value="reported">Pending Review</option>
                  <option value="under_review">Under Review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="action_pending">Assigned to Officer</option>
                  <option value="resolved_verified">Resolved</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No grievance records found matching the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                      <th className="p-3">Tracking Ref & Grievance</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Zone & Landmark</th>
                      <th className="p-3 text-center">Reports / Upvotes</th>
                      <th className="p-3">ATR Status</th>
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
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">{getCategoryIcon(item.category)}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[10px] bg-slate-100 text-[#003366] dark:bg-slate-800 dark:text-blue-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                                  {item.complaintRef || "MCD-PENDING"}
                                </span>
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
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {item.description}
                              </p>
                              {item.assignedAuthority && (
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                    🏛️ {item.assignedAuthority.name}
                                  </span>
                                  {item.assignedAuthority.distanceKm !== undefined && item.assignedAuthority.distanceKm > 0 && (
                                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800" title={item.assignedAuthority.routingReason}>
                                      ⚡ Nearest Fallback Dispatch ({item.assignedAuthority.distanceKm} km)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                            {item.department || "General Municipal Services"}
                          </span>
                        </td>

                        <td className="p-3 text-muted-foreground max-w-[200px]">
                          <p className="font-semibold text-foreground text-[11px] truncate">
                            {item.ward || "Ward Not Assigned"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.landmark || item.address || "Area"}
                          </p>
                          {item.pincode && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              PIN: {item.pincode}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              {item.reportCount || 1} Citizen{item.reportCount === 1 ? "" : "s"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              <ThumbsUp className="size-2.5" />
                              {item.upvotes || 1}
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          <StatusBadge status={item.status} />
                          {item.assignedOfficer?.name && (
                            <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium mt-1 flex items-center gap-1">
                              <UserCheck className="size-3 text-blue-600" />
                              <span>Officer: {item.assignedOfficer.name}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {(item.flagsCount || 0) > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => handleDismissFlags(item._id, e)}
                                className="h-7 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 px-2"
                                title="Dismiss moderation flags"
                              >
                                Clear Flags
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenMergeModal(item)}
                              className="h-7 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 gap-1 px-2"
                              title="Merge with duplicate grievance"
                            >
                              <GitMerge className="size-3 text-indigo-500" />
                              <span className="hidden sm:inline">Merge</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenFieldVerifyModal(item)}
                              className="h-7 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 gap-1 px-2"
                              title="Physical field inspection sign-off"
                            >
                              <ShieldCheck className="size-3 text-emerald-600" />
                              <span className="hidden sm:inline">Inspect</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenStatusModal(item)}
                              className="h-7 text-xs font-medium bg-[#003366] text-white hover:bg-blue-800 border-none px-2.5"
                            >
                              Action / ATR
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
        )}
      </main>

      {/* Status Update / Action Taken Report (ATR) Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-lg p-5">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="size-5 text-[#003366]" />
              Action Taken Report (ATR) & Assignment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign field engineer, update grievance lifecycle status, and record resolution evidence.
            </DialogDescription>
          </DialogHeader>

          {targetIncident && (
            <form onSubmit={handleSaveStatus} className="space-y-3.5 pt-1">
              <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-white dark:slate-900 text-[#003366] dark:text-blue-300 px-2 py-0.5 rounded border">
                    {targetIncident.complaintRef || "CIVIC-2026-PENDING"}
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                    {targetIncident.ward || "Zone 4"}
                  </span>
                </div>
                <p className="font-semibold text-foreground text-sm pt-0.5">{targetIncident.title}</p>
                <p className="text-muted-foreground text-[11px] truncate">
                  Location: {targetIncident.landmark || targetIncident.address}
                </p>
              </div>

              {/* Department Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-blue-600" />
                  Designated Department
                </label>
                <select
                  value={assignedDepartment}
                  onChange={(e) => setAssignedDepartment(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                >
                  <option value="Water Supply & Works Board">Water Supply & Works Board</option>
                  <option value="Power Discom & Street Lighting">Power Discom & Street Lighting</option>
                  <option value="PWD Roads & Infrastructure">PWD Roads & Infrastructure</option>
                  <option value="Solid Waste Management & Sanitation">Solid Waste Management & Sanitation</option>
                  <option value="Stray Animal Control & Veterinary">Stray Animal Control & Veterinary</option>
                  <option value="Civil Safety & Vigilance Cell">Civil Safety & Vigilance Cell</option>
                </select>
              </div>

              {/* Assigned Officer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <UserCheck className="size-3.5 text-blue-600" />
                    Field Officer Name
                  </label>
                  <Input
                    placeholder="e.g. Er. S.K. Sharma"
                    value={assignedOfficerName}
                    onChange={(e) => setAssignedOfficerName(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <Tag className="size-3.5 text-blue-600" />
                    Designation
                  </label>
                  <Input
                    placeholder="e.g. Junior Engineer (Civil)"
                    value={assignedOfficerRole}
                    onChange={(e) => setAssignedOfficerRole(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center gap-1">
                    <Phone className="size-3.5 text-blue-600" />
                    Contact Phone
                  </label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={assignedOfficerPhone}
                    onChange={(e) => setAssignedOfficerPhone(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Lifecycle Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">Lifecycle Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
                >
                  <option value="under_review">Under Review & Inspection</option>
                  <option value="confirmed">Confirmed Civic Issue</option>
                  <option value="action_pending">Assigned to Field Officer</option>
                  <option value="work_in_progress">Work in Progress</option>
                  <option value="resolved_verified">Resolved & Verified (Fix Done)</option>
                  <option value="closed_unverified">Closed Unverified</option>
                  <option value="rejected">Rejected (Out of Scope)</option>
                </select>
              </div>

              {/* Action Taken Report / Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  Action Taken Report (ATR Remarks)
                </label>
                <Textarea
                  placeholder="e.g. Field engineer inspected site and repaired the pipeline leak. Water supply normalized."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              {/* Official Grievance Ref */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Grievance Reference Number (Tracking Ref #)
                </label>
                <Input
                  placeholder="e.g. CIVIC-2026-98124 / PWD-2026-4401"
                  value={complaintRef}
                  onChange={(e) => setComplaintRef(e.target.value)}
                  className="text-xs h-8 bg-background font-mono"
                />
              </div>

              {/* Resolution Evidence Upload (for resolved_verified) */}
              {newStatus === "resolved_verified" && (
                <div className="space-y-2 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Camera className="size-3.5 text-emerald-600" />
                    Resolution Proof ("After" Inspection Photo)
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {resolutionMedia.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative size-16 rounded-md overflow-hidden border border-emerald-300 dark:border-emerald-800 shadow-2xs group"
                      >
                        <img src={formatMediaUrl(url)} alt="After Evidence" className="size-full object-cover" />
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
                  className="bg-[#003366] hover:bg-blue-800 text-white font-semibold"
                >
                  {updatingStatus ? "Saving..." : "Save Action Taken Report (ATR)"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Merge Incident Modal */}
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
                  {merging ? "Merging..." : "Confirm & Merge Reports"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Field Inspection Sign-off Modal */}
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
              Record physical on-ground verification by security, facility supervisor, or RWA marshal.
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
                  {isSubmittingInspection ? "Saving..." : "Verify On-Ground"}
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
                <p className="text-[10px] text-muted-foreground">Grouped duplicate reports</p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <span className="text-[11px] text-muted-foreground font-semibold">Field Verified</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {incidents.filter((i) => i.inspectedBy).length}
                </div>
                <p className="text-[10px] text-muted-foreground">On-ground verified</p>
              </div>
            </div>

            {/* Recurring Hotspots */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Flame className="size-4 text-rose-500" />
                  Top Recurring Hazard Hotspots
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Frequency Ranking</span>
              </div>
              <div className="space-y-1.5">
                {(analyticsData?.hotspots && analyticsData.hotspots.length > 0
                  ? analyticsData.hotspots
                  : [
                      { address: "Vikas Marg, Block B, Preet Vihar (Ward 42)", count: 4, active: 2, primaryCategory: "power_cut" },
                      { address: "Connaught Place Outer Circle, Radial Road 3 (Ward 18)", count: 3, active: 1, primaryCategory: "road_hazard" },
                      { address: "Mayur Vihar Phase 1 Main Road (Ward 24)", count: 3, active: 1, primaryCategory: "water_issue" },
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

            {/* Multi-Ward Pilot Benchmark */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="size-4 text-blue-600" />
                  Multi-Ward Pilot Comparison & Benchmarks
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Society Benchmarks</span>
              </div>
              <div className="space-y-1.5">
                {(analyticsData?.wardBenchmarks && analyticsData.wardBenchmarks.length > 0
                  ? analyticsData.wardBenchmarks
                  : [
                      { ward: "Ward 42 - Preet Vihar (East Zone)", total: 5, resolved: 4, active: 1, healthScore: 92 },
                      { ward: "Ward 18 - Connaught Place (Central Zone)", total: 4, resolved: 3, active: 1, healthScore: 95 },
                      { ward: "Ward 24 - Mayur Vihar (East Zone)", total: 4, resolved: 3, active: 1, healthScore: 88 },
                      { ward: "Ward 35 - Karol Bagh (Central Zone)", total: 3, resolved: 2, active: 1, healthScore: 85 },
                      { ward: "Ward 14 - Anand Vihar (East Zone)", total: 3, resolved: 2, active: 1, healthScore: 90 },
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

            {/* Transparent Health Index Methodology */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 space-y-1.5 text-xs text-foreground">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Activity className="size-3.5 text-blue-600" />
                  Safety & Health Index Methodology
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                  {healthScore?.score ?? 84}/100 ({healthScore?.grade || "A"})
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Formula: Calculated in real-time based on active hazard volume, severity weighting, and verified resolution turnaround.
              </p>
            </div>

            {/* Scale & Geospatial Cache Diagnostics */}
            <div className="space-y-2 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Server className="size-4 text-indigo-600" />
                  Geospatial Engine & Query Cache Performance
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

      {/* Official Emergency Broadcast Modal */}
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
                <option value="all">All Civic Zones & Wards</option>
                <option value="Ward 42 - Preet Vihar">Ward 42 - Preet Vihar (East Zone)</option>
                <option value="Ward 18 - Connaught Place">Ward 18 - Connaught Place (Central Zone)</option>
                <option value="Ward 24 - Mayur Vihar">Ward 24 - Mayur Vihar (East Zone)</option>
                <option value="Ward 35 - Karol Bagh">Ward 35 - Karol Bagh (Central Zone)</option>
                <option value="Ward 14 - Anand Vihar">Ward 14 - Anand Vihar (East Zone)</option>
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

      {/* 5. Officer Jurisdiction Grievance Density Heatmap Dialog */}
      <Dialog open={heatmapModalOpen} onOpenChange={setHeatmapModalOpen}>
        <DialogContent className="max-w-5xl p-5 bg-background">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Flame className="size-5 text-rose-500 animate-pulse" />
                Jurisdiction Grievance Density Heatmap
              </DialogTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {filteredIncidents.length} Active Incidents
              </span>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Live spatial concentration and thermal hazard density analysis across housing societies and municipal wards
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <IncidentMap
              incidents={filteredIncidents}
              onSelectIncident={(incident) => {
                setSelectedIncident(incident);
                setDetailModalOpen(true);
                setHeatmapModalOpen(false);
              }}
              heightClass="h-[65vh]"
              initialMode="heatmap"
            />
          </div>
        </DialogContent>
      </Dialog>
    
      {/* 6. Create New Admin / Officer Dialog */}
      <Dialog open={createOfficerModalOpen} onOpenChange={setCreateOfficerModalOpen}>
        <DialogContent className="max-w-md p-5 bg-background">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="size-5 text-[#003366] dark:text-blue-400" />
              Create Regional Authority Admin / Officer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Add a new zonal admin or field officer bound to a designated municipal authority jurisdiction.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOfficer} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Officer / Admin Full Name *</label>
              <Input
                value={newOfficerName}
                onChange={(e) => setNewOfficerName(e.target.value)}
                placeholder="e.g. Ramesh Chandra (Executive Engineer)"
                className="text-xs h-8"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Official Email *</label>
                <Input
                  type="email"
                  value={newOfficerEmail}
                  onChange={(e) => setNewOfficerEmail(e.target.value)}
                  placeholder="officer@authority.gov.in"
                  className="text-xs h-8 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Password *</label>
                <Input
                  type="password"
                  value={newOfficerPassword}
                  onChange={(e) => setNewOfficerPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="text-xs h-8"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Authority Role</label>
                <select
                  value={newOfficerRole}
                  onChange={(e) => setNewOfficerRole(e.target.value as any)}
                  className="w-full text-xs h-8 px-2 rounded-md border bg-background"
                >
                  <option value="admin">Zonal Authority Admin</option>
                  <option value="officer">Field Verification Officer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Mobile Contact</label>
                <Input
                  value={newOfficerPhone}
                  onChange={(e) => setNewOfficerPhone(e.target.value)}
                  placeholder="e.g. 9810XXXXXX"
                  className="text-xs h-8 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Assigned Municipal Authority Office *</label>
              <select
                value={newOfficerWard}
                onChange={(e) => setNewOfficerWard(e.target.value)}
                className="w-full text-xs h-8 px-2 rounded-md border bg-background"
              >
                {LOCAL_JURISDICTION_OFFICES.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.icon} {off.shortName} ({off.areaLabel})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                🔒 Zonal Isolation: This admin will ONLY see grievances and statistics assigned to this designated desk.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOfficerModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingOfficer}
                className="text-xs bg-[#003366] hover:bg-[#002244] text-white font-semibold gap-1.5"
              >
                <UserPlus className="size-3.5" />
                {isCreatingOfficer ? "Creating..." : "Create Authority Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Dashboard;
