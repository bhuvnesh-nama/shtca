import React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, PlusCircle, User, LogOut, Radio, Building2, Bell, FlaskConical, Globe, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CitizenNavbarProps {
  onOpenReportModal?: () => void;
  onOpenAlerts?: () => void;
  onOpenDemoLab?: () => void;
  onOpenSos?: () => void;
  alertCount?: number;
  isConnectedLive?: boolean;
  selectedWard?: string;
  onSelectWard?: (ward: string) => void;
}

export const CitizenNavbar: React.FC<CitizenNavbarProps> = ({
  onOpenReportModal,
  onOpenAlerts,
  onOpenDemoLab,
  onOpenSos,
  alertCount = 0,
  isConnectedLive = true,
  selectedWard = "all",
  onSelectWard,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { language, toggleLanguage, t } = useLanguage();

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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Society Indicator */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20">
              <Shield className="size-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-foreground text-lg leading-none flex items-center gap-1.5">
                {t.appName === "HyperNet" ? (
                  <>Hyper<span className="text-blue-600">Net</span></>
                ) : (
                  <span className="text-blue-600">{t.appName}</span>
                )}
              </span>
              <p className="text-[11px] text-muted-foreground leading-tight hidden sm:block">
                {t.brandSubtitle}
              </p>
            </div>
          </Link>

          {/* Society / Ward Operating Area Selector (Phase 7 Pilot Boundary) */}
          <div className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-blue-200/70 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ml-2 shadow-2xs">
            <Building2 className="size-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedWard}
              onChange={(e) => onSelectWard?.(e.target.value)}
              className="bg-transparent text-xs font-semibold text-blue-900 dark:text-blue-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">{t.allPilotWards}</option>
              <option value="Greenwood">Central Greenwood Society</option>
              <option value="Palm">Palm Heights Residency</option>
              <option value="Royal">Royal Meadows Enclave</option>
            </select>
          </div>

          {/* Realtime Live Indicator */}
          <div
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-border/80 bg-muted/40"
            title={isConnectedLive ? "Realtime live WebSocket active" : "Reconnecting to live feed..."}
          >
            <Radio
              className={`size-3 ${
                isConnectedLive ? "text-emerald-500 animate-pulse" : "text-amber-500"
              }`}
            />
            <span className="font-medium text-muted-foreground hidden lg:inline">
              {isConnectedLive ? t.liveSync : t.connecting}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Phase 10: Language Switcher Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="h-9 px-2 sm:px-2.5 rounded-lg border-border hover:bg-muted text-xs font-bold gap-1 shadow-2xs"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="size-3.5 text-blue-600" />
            <span className="font-semibold">{language === "en" ? "हिन्दी" : "EN"}</span>
          </Button>

          {/* Phase 10: Emergency SOS Beacon Button */}
          {onOpenSos && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSos}
              className="h-9 px-2 sm:px-2.5 rounded-lg border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold gap-1 shadow-2xs"
              title="Urgent Citizen SOS Panic Alert"
            >
              <ShieldAlert className="size-3.5 text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">{t.emergencySos}</span>
              <span className="sm:hidden">SOS</span>
            </Button>
          )}

          {/* Demo Simulation Lab Shortcut for Hackathon Judges */}
          {onOpenDemoLab && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDemoLab}
              className="h-9 px-2 sm:px-2.5 rounded-lg border-indigo-300/80 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold gap-1 shadow-2xs"
              title="Open Hackathon Demo Simulation Lab"
            >
              <FlaskConical className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{t.demoLab}</span>
            </Button>
          )}

          {/* Notification Alerts Bell */}
          {onOpenAlerts && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAlerts}
              className="relative size-9 p-0 rounded-lg border-border hover:bg-muted"
              title="View safety alerts"
            >
              <Bell className="size-4 text-foreground" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-bounce">
                  {alertCount}
                </span>
              )}
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleReportClick}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold shadow-sm h-9"
          >
            <PlusCircle className="size-4" />
            <span className="hidden sm:inline">{t.reportHazard}</span>
            <span className="sm:hidden">{language === "hi" ? "दर्ज करें" : "Report"}</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-9 rounded-full p-0">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-blue-600/10 text-blue-600 font-semibold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground leading-none truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                  <User className="size-4 mr-2" />
                  RWA Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600 cursor-pointer">
                  <LogOut className="size-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
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
    </header>
  );
};
