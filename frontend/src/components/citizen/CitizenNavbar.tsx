import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { logoutUser } from "@/features/auth/authThunk";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PlusCircle,
  LogOut,
  Bell,
  ShieldAlert,
  Search,
  ExternalLink,
  FileCheck,
} from "lucide-react";
import { incidentService } from "@/services/incidentService";
import type { IncidentItem } from "@/types/incident";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "./StatusBadge";

interface CitizenNavbarProps {
  onOpenReportModal?: () => void;
  onOpenAlerts?: () => void;
  onOpenSos?: () => void;
  alertCount?: number;
  isConnectedLive?: boolean;
  onSearchGrievance?: (query: string) => void;
  onSelectIncident?: (incident: IncidentItem) => void;
}

export const CitizenNavbar: React.FC<CitizenNavbarProps> = ({
  onOpenReportModal,
  onOpenAlerts,
  onOpenSos,
  alertCount = 0,
  isConnectedLive = true,
  onSearchGrievance,
  onSelectIncident,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // Track Grievance Dialog state
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [trackResults, setTrackResults] = useState<IncidentItem[] | null>(null);

  const handleReportClick = () => {
    if (onOpenReportModal) {
      onOpenReportModal();
    } else {
      navigate("/report");
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingIdInput.trim();
    if (!query) {
      toast.error("Please enter a Tracking ID (e.g. MCD-2026-XXXX)");
      return;
    }

    setIsSearching(true);
    try {
      const results = await incidentService.getNearbyIncidents({ search: query });
      setTrackResults(results);
      if (results.length === 0) {
        toast.info(`No grievances found matching: "${query}"`);
      } else {
        if (onSearchGrievance) {
          onSearchGrievance(query);
        }
      }
    } catch {
      toast.error("Failed to retrieve grievance status");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs">
      {/* Top National Tricolor Accent Strip */}
      <div className="h-1 w-full flex shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white border-y border-slate-200" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Main Public Civic Navigation Bar */}
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-3 sm:px-6 gap-3">
        {/* Left: Brand Identity */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/logo.png"
            alt="SHTCA Logo"
            className="size-10 rounded-lg object-contain bg-white p-0.5 border border-border shadow-xs shrink-0"
          />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 whitespace-nowrap leading-none">
              <span className="font-extrabold tracking-tight text-lg text-[#003366] dark:text-blue-400">
                SHTCA
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap leading-tight hidden sm:block mt-0.5 font-medium">
              Civic Grievance & Redressal Portal
            </span>
          </div>
        </Link>

        {/* Center: Quick Track & Realtime Live Status */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTrackDialogOpen(true)}
            className="h-9 px-3 text-xs font-semibold border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 hover:bg-blue-100 gap-1.5 shadow-2xs shrink-0"
            title="Track Grievance by Tracking ID"
          >
            <Search className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Track Grievance</span>
            <span className="sm:hidden text-xs">Track</span>
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Sync Status Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border ${
              isConnectedLive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
            title={isConnectedLive ? "Real-time WebSocket Live Sync active" : "Connecting to Civic Live Sync..."}
          >
            <span
              className={`size-1.5 rounded-full ${
                isConnectedLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>{isConnectedLive ? "Live Sync" : "Syncing"}</span>
          </div>

          {/* Emergency SOS Button */}
          {onOpenSos && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSos}
              className="h-9 px-2.5 rounded-lg border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold gap-1.5 shadow-2xs shrink-0"
              title="Urgent Civic Emergency"
            >
              <ShieldAlert className="size-3.5 text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">Emergency SOS</span>
              <span className="sm:hidden font-mono">112</span>
            </Button>
          )}

          {/* Civic Advisories Bell */}
          {onOpenAlerts && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAlerts}
              className="relative size-9 p-0 rounded-lg border-border hover:bg-muted shrink-0"
              title="View Civic Advisories"
            >
              <Bell className="size-4 text-foreground" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-bounce">
                  {alertCount}
                </span>
              )}
            </Button>
          )}

          {/* Primary Action: File Grievance */}
          <Button
            size="sm"
            onClick={handleReportClick}
            className="bg-[#003366] hover:bg-[#002244] text-white gap-1.5 font-semibold shadow-sm h-9 px-3.5 shrink-0"
          >
            <PlusCircle className="size-4 text-amber-400" />
            <span className="hidden sm:inline">Register Grievance</span>
            <span className="sm:hidden">Report</span>
          </Button>

          {/* Citizen Account Dropdown / Sign In */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-9 rounded-full p-0 shrink-0">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-[#003366] text-white font-semibold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground leading-none truncate">{user.email}</p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                    Verified Citizen
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600 cursor-pointer">
                  <LogOut className="size-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 text-xs font-semibold border-border hover:bg-muted"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Official Grievance Tracking Dialog */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="max-w-lg p-5">
          <div className="h-1 -mx-5 -mt-5 mb-3 flex">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Search className="size-4 text-[#003366] dark:text-blue-400" />
              <span>Track Civic Grievance Status</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter your Grievance Tracking ID (e.g. MCD-2026-08491) to view realtime inspection and Action Taken Reports.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTrackSubmit} className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder="MCD-2026-XXXX or keyword"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="font-mono text-xs uppercase"
              />
              <Button
                type="submit"
                disabled={isSearching}
                className="bg-[#003366] hover:bg-[#002244] text-white text-xs font-semibold shrink-0"
              >
                {isSearching ? <Spinner className="size-3.5" /> : <Search className="size-3.5 mr-1" />}
                Track
              </Button>
            </div>
          </form>

          {trackResults !== null && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
              {trackResults.length === 0 ? (
                <div className="p-4 text-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  No grievance records found with this tracking ID. Please verify your reference number.
                </div>
              ) : (
                trackResults.map((inc) => (
                  <div
                    key={inc._id}
                    className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors text-xs space-y-1.5 cursor-pointer"
                    onClick={() => {
                      if (onSelectIncident) {
                        onSelectIncident(inc);
                        setTrackDialogOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="font-mono font-bold text-[11px] text-[#003366] dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-sm">
                        {inc.complaintRef || "MCD-2026-PENDING"}
                      </span>
                      <StatusBadge status={inc.status} />
                    </div>

                    <p className="font-semibold text-foreground text-xs leading-snug">
                      {inc.title}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      <span>{inc.department || "Civic Department"}</span>
                      <span className="flex items-center gap-1 text-[#003366] dark:text-blue-300 font-medium">
                        <FileCheck className="size-3" />
                        View Full Details
                        <ExternalLink className="size-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
};
