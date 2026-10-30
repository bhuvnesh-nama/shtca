import { useState, useEffect, useCallback, useRef } from "react";
import { CitizenNavbar } from "@/components/citizen/CitizenNavbar";
import { CitizenBottomNav } from "@/components/citizen/CitizenBottomNav";
import { IncidentMap } from "@/components/citizen/IncidentMap";
import { IncidentList } from "@/components/citizen/IncidentList";
import { IncidentDetailDialog } from "@/components/citizen/IncidentDetailDialog";
import { AlertsDrawer } from "@/components/citizen/AlertsDrawer";
import { SosEmergencyDialog } from "@/components/citizen/SosEmergencyDialog";
import { incidentService } from "@/services/incidentService";
import type { IncidentItem } from "@/types/incident";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Map, ListFilter, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

function Home() {
  const navigate = useNavigate();

  // State
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"split" | "map" | "list">("split");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard] = useState("all");

  // Location
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<[number, number] | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

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

      const data = await incidentService.getNearbyIncidents(params);
      setIncidents(data);
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
        (err) => {
          console.log("Device location not available / permission dismissed:", err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Socket.IO Realtime connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ""
      ? import.meta.env.VITE_API_BASE_URL
      : (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");
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
    });

    socket.on("incident:updated", ({ incident }) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === incident._id ? incident : i))
      );
    });

    socket.on("incident:refresh", () => {
      fetchIncidentsRef.current();
      toast.info("Environment refreshed with clean sample data");
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
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.info("Acquiring GPS location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        toast.success("Map centered on your real location");
      },
      (err) => toast.error("Could not obtain location: " + err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
  const totalAlertCount = criticalCount + broadcastCount;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-24 sm:pb-8">
      {/* 1. Public Civic Portal Header */}
      <CitizenNavbar
        onOpenReportModal={() => navigate("/report")}
        onOpenAlerts={() => setAlertsDrawerOpen(true)}
        onOpenSos={() => setSosDialogOpen(true)}
        alertCount={totalAlertCount}
        isConnectedLive={isLiveConnected}
        onSearchGrievance={(query) => {
          setSearchQuery(query);
          if (query.trim()) {
            toast.info(`Searching: "${query}"`);
          }
        }}
        onSelectIncident={(incident) => {
          setSelectedIncident(incident);
          setDetailModalOpen(true);
        }}
      />

      {/* 2. Main Civic Redressal Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Civic Grievances View Switcher & Feed Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-b pb-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Public Grievances Feed
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time geo-tagged civic grievances and field inspection updates
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
                onClick={() => setActiveTab("split")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "split"
                    ? "bg-[#003366] text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="View Map and Grievance List side-by-side"
              >
                <Layers className="size-3.5" /> Split View
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "list"
                    ? "bg-[#003366] text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="View Full Public Grievances List"
              >
                <ListFilter className="size-3.5" /> List Only
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "map"
                    ? "bg-[#003366] text-white shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="View Full-Screen GIS Map"
              >
                <Map className="size-3.5" /> Full Map
              </button>
            </div>
          </div>
        </div>

        {/* Layout: Responsive Dual View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Filterable Grievances List */}
          <div
            className={`${
              activeTab === "map"
                ? "hidden"
                : activeTab === "list"
                ? "col-span-12 max-w-4xl mx-auto w-full"
                : "col-span-12 lg:col-span-5"
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
            className={`${
              activeTab === "list"
                ? "hidden"
                : activeTab === "map"
                ? "col-span-12 w-full"
                : "col-span-12 lg:col-span-7"
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
                heightClass={
                  activeTab === "map"
                    ? "h-[calc(100vh-210px)] min-h-[620px]"
                    : "h-[calc(100vh-240px)] min-h-[580px]"
                }
                activeCategory={categoryFilter}
                onSelectCategory={setCategoryFilter}
                onIncidentUpdated={(updated) => {
                  setSelectedIncident(updated);
                  setIncidents((prev) =>
                    prev.map((item) => (item._id === updated._id ? updated : item))
                  );
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 4. Mobile Bottom Navigation */}
      <CitizenBottomNav
        currentTab={activeTab === "list" ? "list" : "map"}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenReportModal={() => navigate("/report")}
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
        onBroadcastCountChange={setBroadcastCount}
      />

      {/* 8. Resident Emergency SOS Panic Beacon Modal */}
      <SosEmergencyDialog
        open={sosDialogOpen}
        onOpenChange={setSosDialogOpen}
        userLocation={userLocation}
      />
    </div>
  );
}

export default Home;
