import React from "react";
import type { IncidentItem, IncidentCategory } from "@/types/incident";
import { CATEGORIES_CONFIG } from "@/types/incident";
import { StatusBadge } from "./StatusBadge";
import { formatMediaUrl } from "@/utils/media";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Clock,
  Layers,
  AlertTriangle,
  Droplets,
  Trash2,
  Zap,
  ShieldAlert,
  Dog,
  HelpCircle,
  ThumbsUp,
  CheckCircle,
} from "lucide-react";

interface IncidentListProps {
  incidents: IncidentItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectIncident: (incident: IncidentItem) => void;
  selectedIncident?: IncidentItem | null;
  onOpenReportModal: () => void;
  onUpvoteIncident?: (id: string, e: React.MouseEvent) => void;
}

const getCategoryIcon = (category: IncidentCategory | string) => {
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

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  onSelectIncident,
  selectedIncident,
  onOpenReportModal,
  onUpvoteIncident,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Search & Status Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by issue, block or street..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => onSelectStatus(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="reported">Reported</option>
          <option value="under_review">Under Review</option>
          <option value="confirmed">Community Confirmed</option>
          <option value="action_pending">Action Pending</option>
          <option value="resolved_verified">Resolved</option>
        </select>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onSelectCategory("all")}
          className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white border-blue-600 font-semibold"
              : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
          }`}
        >
          All Issues ({incidents.length})
        </button>
        {CATEGORIES_CONFIG.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              selectedCategory === cat.id
                ? "bg-blue-600 text-white border-blue-600 font-semibold"
                : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
            }`}
          >
            {getCategoryIcon(cat.id)}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Incident Cards */}
      <div className="flex flex-col gap-2.5">
        {incidents.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-0 space-y-3">
              <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                <HelpCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-base">No active incidents here</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  No open hazards found for this filter in your society/ward. Report an issue to alert neighbours.
                </p>
              </div>
              <Button size="sm" onClick={onOpenReportModal} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                Report Issue
              </Button>
            </CardContent>
          </Card>
        ) : (
          incidents.map((incident) => {
            const isSelected = selectedIncident?._id === incident._id;
            const hasMedia = incident.media && incident.media.length > 0;
            const isCommunityVerified = (incident.upvotes || 0) >= 3;

            return (
              <Card
                key={incident._id}
                onClick={() => onSelectIncident(incident)}
                className={`cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-800 ${
                  isSelected ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20" : ""
                }`}
              >
                <CardContent className="p-3.5 flex gap-3">
                  {hasMedia ? (
                    <div className="size-16 sm:size-20 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                      <img
                        src={formatMediaUrl(incident.media[0])}
                        alt={incident.title}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-col flex-1 min-w-0 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {incident.complaintRef && (
                            <span className="font-mono text-[10px] font-bold text-[#003366] dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-sm border border-blue-200 dark:border-blue-900">
                              {incident.complaintRef}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400">
                            {getCategoryIcon(incident.category)}
                            <span className="truncate">{incident.category.replace("_", " ")}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {isCommunityVerified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
                              <CheckCircle className="size-3 text-emerald-500" /> Confirmed
                            </span>
                          )}
                          <StatusBadge status={incident.status} />
                        </div>
                      </div>

                      <h4 className="font-semibold text-foreground text-sm leading-snug line-clamp-1 mb-0.5">
                        {incident.title}
                      </h4>
                      {incident.department && (
                        <p className="text-[10px] font-medium text-muted-foreground truncate mb-1">
                          {incident.department}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {incident.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{incident.address || "Local neighbourhood area"}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Upvote / Corroborate Button */}
                        {onUpvoteIncident && (
                          <button
                            type="button"
                            onClick={(e) => onUpvoteIncident(incident._id, e)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-background hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-[11px] shadow-2xs transition-colors"
                            title="Upvote / Verify this incident"
                          >
                            <ThumbsUp className="size-3" />
                            <span>{incident.upvotes || 1}</span>
                          </button>
                        )}

                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                          <Layers className="size-3" />
                          {incident.reportCount || 1}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTimeAgo(incident.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
