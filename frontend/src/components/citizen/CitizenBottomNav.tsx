import React from "react";
import { useNavigate } from "react-router-dom";
import { Map, List, PlusCircle, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitizenBottomNavProps {
  currentTab: "map" | "list";
  onTabChange: (tab: "map" | "list") => void;
  onOpenReportModal?: () => void;
  onOpenDashboard: () => void;
  incidentCount: number;
}

export const CitizenBottomNav: React.FC<CitizenBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenReportModal,
  onOpenDashboard,
  incidentCount,
}) => {
  const navigate = useNavigate();

  const handleReportClick = () => {
    if (onOpenReportModal) {
      onOpenReportModal();
    } else {
      navigate("/report");
    }
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border px-3 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onTabChange("map")}
        className={cn(
          "flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg transition-colors",
          currentTab === "map"
            ? "text-blue-600 dark:text-blue-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Map className="size-5" />
        <span>Map View</span>
      </button>

      {/* Center Report button */}
      <button
        onClick={handleReportClick}
        className="flex flex-col items-center gap-1 -mt-4 group"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md group-active:scale-95 transition-transform">
          <PlusCircle className="size-6" />
        </div>
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
          Report
        </span>
      </button>

      <button
        onClick={() => onTabChange("list")}
        className={cn(
          "flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg transition-colors relative",
          currentTab === "list"
            ? "text-blue-600 dark:text-blue-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="size-5" />
        <span>Incidents</span>
        {incidentCount > 0 && (
          <span className="absolute top-0 right-2 size-4 rounded-full bg-blue-600 text-[9px] text-white flex items-center justify-center">
            {incidentCount > 99 ? "99+" : incidentCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenDashboard}
        className="flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg text-muted-foreground hover:text-foreground"
      >
        <LayoutDashboard className="size-5" />
        <span>Overview</span>
      </button>
    </nav>
  );
};

