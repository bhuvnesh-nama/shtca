import { useState, useEffect, useCallback, useRef } from "react";
import { NoticeBanner } from "@/components/citizen/NoticeBanner";
import { CitizenNavbar } from "@/components/citizen/CitizenNavbar";
import { CitizenBottomNav } from "@/components/citizen/CitizenBottomNav";
import { IncidentMap } from "@/components/citizen/IncidentMap";
import { IncidentList } from "@/components/citizen/IncidentList";
import { HealthScoreWidget } from "@/components/citizen/HealthScoreWidget";
import { IncidentDetailDialog } from "@/components/citizen/IncidentDetailDialog";
import { AlertsDrawer } from "@/components/citizen/AlertsDrawer";
import { DemoSimulatorDialog } from "@/components/citizen/DemoSimulatorDialog";
import { EmergencyBroadcastBanner } from "@/components/citizen/EmergencyBroadcastBanner";
import { SosEmergencyDialog } from "@/components/citizen/SosEmergencyDialog";
import { useLanguage } from "@/context/LanguageContext";
import { incidentService } from "@/services/incidentService";
import type { IncidentItem, HealthScoreData } from "@/types/incident";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Map, ListFilter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  // State
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [demoLabOpen, setDemoLabOpen] = useState(false);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState("all");

  // Location
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<[number, number] | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const handleWardChange = (ward: string) => {
    setSelectedWard(ward);
    if (ward === "Greenwood") {
      setUserLocation([28.6304, 77.2177]);
      toast.info("Filtered for Central Greenwood Society");
    } else if (ward === "Palm") {
      setUserLocation([28.5355, 77.3910]);
      toast.info("Filtered for Palm Heights Residency");
    } else if (ward === "Royal") {
      setUserLocation([28.4595, 77.0266]);
      toast.info("Filtered for Royal Meadows Enclave");
    } else {
      toast.info("Viewing all community areas");
    }
  };

  // Fetch Incidents
  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (selectedWard !== "all") params.ward = selectedWard;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (userLocation) {
        params.lat = userLocation[0];
        params.lng = userLocation[1];
        params.radius = 15000;
      }

      const [data, health] = await Promise.all([
        incidentService.getNearbyIncidents(params),
        incidentService.getHealthScore(),
      ]);
      setIncidents(data);
      setHealthScore(health);
    } catch (error: any) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, selectedWard, searchQuery, userLocation]);

  const fetchIncidentsRef = useRef(fetchIncidents);
  useEffect(() => {
    fetchIncidentsRef.current = fetchIncidents;
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Request browser location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setPickedLocation(coords);
        },
        () => {
          const fallbackCoords: [number, number] = [28.6139, 77.209];
          setUserLocation(fallbackCoords);
          setPickedLocation(fallbackCoords);
        },
        { timeout: 8000 }
      );
    }
  }, []);

  // Socket.IO Realtime connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setIsLiveConnected(true);
    });

    socket.on("disconnect", () => {
      setIsLiveConnected(false);
    });

    socket.on("incident:new", ({ incident }) => {
      setIncidents((prev) => [incident, ...prev.filter((i) => i._id !== incident._id)]);
      toast.info(`New alert reported nearby: "${incident.title}"`);
      incidentService.getHealthScore().then(setHealthScore).catch(() => {});
    });

    socket.on("incident:updated", ({ incident }) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === incident._id ? incident : i))
      );
      incidentService.getHealthScore().then(setHealthScore).catch(() => {});
    });

    socket.on("incident:refresh", () => {
      fetchIncidentsRef.current();
      toast.info("Demo environment re-seeded with clean sample data");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handlers
  const handleSelectIncident = (incident: IncidentItem) => {
    setSelectedIncident(incident);
    setDetailModalOpen(true);
  };

  const handleLocationPick = (lat: number, lng: number) => {
    setPickedLocation([lat, lng]);
    setIsPickingLocation(false);
    navigate(`/report?lat=${lat}&lng=${lng}`);
  };

  const handleDetectUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        toast.success("Map centered on your location");
      },
      (err) => toast.error("Could not obtain location: " + err.message)
    );
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await incidentService.upvoteIncident(id);
      toast.success(res.message || "Upvote recorded!");
      setIncidents((prev) =>
        prev.map((item) =>
          item._id === id
            ? {
                ...item,
                upvotes: res.data?.upvotes ?? item.upvotes + 1,
                status: res.data?.status ?? item.status,
              }
            : item
        )
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upvote");
    }
  };

  const criticalCount = incidents.filter(
    (i) => i.severity === "critical" || i.severity === "high"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-24 sm:pb-8">
      {/* 1. Public Notice Banner */}
      <NoticeBanner />

      {/* 2. Top Navbar with Alerts Bell */}
      <CitizenNavbar
        onOpenReportModal={() => navigate("/report")}
        onOpenAlerts={() => setAlertsDrawerOpen(true)}
        onOpenDemoLab={() => setDemoLabOpen(true)}
        onOpenSos={() => setSosDialogOpen(true)}
        alertCount={criticalCount}
        isConnectedLive={isLiveConnected}
        selectedWard={selectedWard}
        onSelectWard={handleWardChange}
      />

      {/* 3. Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Phase 10: Official Emergency Broadcast & SOS Alerts Banner */}
        <EmergencyBroadcastBanner ward={selectedWard} />

        {/* Bonus Twist: Neighbourhood Health Score Widget */}
        <HealthScoreWidget data={healthScore} loading={loading} />

        {/* Desktop View Switcher Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {language === "hi"
                ? "स्थानीय समुदाय सुरक्षा एवं समस्या समाधान लाइव फ़ीड"
                : "Neighbourhood Safety & Hazards Live Feed"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {language === "hi"
                ? "बिजली कटौती, जल आपूर्ति, सड़क गड्ढे, आवारा पशु एवं सुरक्षा अलर्ट"
                : "Community reported power cuts, water issues, road hazards, stray animals & security alerts"}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIncidents}
              className="h-8 text-xs gap-1.5"
              title="Refresh incidents"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Desktop tab toggle */}
            <div className="hidden sm:flex items-center rounded-lg border border-border p-1 bg-muted/30">
              <button
                onClick={() => setActiveTab("map")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "map"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Map className="size-3.5" /> Split Map
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListFilter className="size-3.5" /> List Only
              </button>
            </div>
          </div>
        </div>

        {/* Layout: Responsive Dual View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Filterable List */}
          <div
            className={`lg:col-span-5 ${
              activeTab === "list" ? "block" : "hidden sm:block"
            }`}
          >
            <div className="bg-card border rounded-xl p-3 sm:p-4 shadow-xs">
              <IncidentList
                incidents={incidents}
                selectedCategory={categoryFilter}
                onSelectCategory={setCategoryFilter}
                selectedStatus={statusFilter}
                onSelectStatus={setStatusFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectIncident={handleSelectIncident}
                selectedIncident={selectedIncident}
                onOpenReportModal={() => navigate("/report")}
                onUpvoteIncident={handleUpvote}
              />
            </div>
          </div>

          {/* Right Column: Interactive Map */}
          <div
            className={`lg:col-span-7 ${
              activeTab === "map" ? "block" : "hidden sm:block"
            }`}
          >
            <div className="sticky top-20">
              <IncidentMap
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={handleSelectIncident}
                userLocation={userLocation}
                onDetectLocation={handleDetectUserLocation}
                isPickingLocation={isPickingLocation}
                pickedLocation={pickedLocation}
                onLocationPick={handleLocationPick}
                heightClass="h-[calc(100vh-250px)] sm:h-[70vh]"
              />
            </div>
          </div>
        </div>
      </main>

      {/* 4. Mobile Bottom Navigation */}
      <CitizenBottomNav
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReportModal={() => navigate("/report")}
        onOpenDashboard={() => navigate("/dashboard")}
        incidentCount={incidents.length}
      />

      {/* 5. Incident Details Dialog Modal */}
      <IncidentDetailDialog
        incident={selectedIncident}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onIncidentUpdated={(updated) => {
          setSelectedIncident(updated);
          setIncidents((prev) =>
            prev.map((item) => (item._id === updated._id ? updated : item))
          );
        }}
      />

      {/* 7. Safety Alerts & Push Notification Drawer */}
      <AlertsDrawer
        open={alertsDrawerOpen}
        onOpenChange={setAlertsDrawerOpen}
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
      />

      {/* 8. Hackathon Demo Simulation Lab Modal */}
      <DemoSimulatorDialog
        open={demoLabOpen}
        onOpenChange={setDemoLabOpen}
        onActionCompleted={fetchIncidents}
      />

      {/* 9. Phase 10: Resident Emergency SOS Panic Beacon Modal */}
      <SosEmergencyDialog
        open={sosDialogOpen}
        onOpenChange={setSosDialogOpen}
        userLocation={userLocation}
      />
    </div>
  );
}

export default Home;
