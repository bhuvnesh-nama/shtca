export type IncidentCategory =
  | "power_cut"
  | "water_issue"
  | "theft_security"
  | "stray_animals"
  | "road_hazard"
  | "sanitation"
  | "utility_disruption"
  | "water_drainage"
  | "safety_concern"
  | "other";

export type IncidentStatus =
  | "reported"
  | "under_review"
  | "confirmed"
  | "action_pending"
  | "resolution_submitted"
  | "resolved_verified"
  | "closed_unverified"
  | "rejected"
  | "reopened";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface GeoLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ReportItem {
  _id: string;
  incident?: string;
  category: IncidentCategory;
  title: string;
  description: string;
  location: GeoLocation;
  address?: string;
  media: string[];
  status: string;
  reporterName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentItem {
  _id: string;
  title: string;
  category: IncidentCategory;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  location: GeoLocation;
  address?: string;
  media: string[];
  resolutionMedia?: string[];
  resolutionNote?: string;
  complaintRef?: string;
  resolvedAt?: string;
  reopenedAt?: string;
  reopenReason?: string;
  inspectedBy?: {
    name: string;
    role: string;
    inspectedAt: string;
    notes?: string;
  };
  trustScore?: number;
  ward?: string;
  flagsCount?: number;
  flags?: Array<{ identifier: string; reason: string; createdAt: string }>;
  reports: ReportItem[] | string[];
  reportCount: number;
  upvotes: number;
  upvoters?: string[];
  confirmations: number;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: IncidentCategory;
  name: string;
  description: string;
  icon: string;
  severity: IncidentSeverity;
}

export interface HealthScoreData {
  score: number;
  grade: string;
  label: string;
  activeCount: number;
  resolvedCount: number;
  categoryCounts: Record<string, number>;
}

export interface HotspotItem {
  address: string;
  count: number;
  active: number;
  primaryCategory: string;
}

export interface WardBenchmarkItem {
  ward: string;
  total: number;
  resolved: number;
  active: number;
  healthScore: number;
}

export interface AnalyticsData {
  totalIncidents: number;
  totalReports: number;
  activeCount: number;
  confirmedCount: number;
  resolvedCount: number;
  resolutionRate: number;
  totalUpvotes: number;
  clusteredIncidentsCount: number;
  duplicateReportsSaved: number;
  categoryStats: Record<string, { count: number; resolved: number }>;
  hotspots?: HotspotItem[];
  avgResolutionHours?: number;
  wardBenchmarks?: WardBenchmarkItem[];
}

export interface BroadcastItem {
  _id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  category: string;
  ward: string;
  issuedBy: {
    name: string;
    role: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  hitRatePct: number;
  cachedKeysCount: number;
  avgQueryLatencyMs: number;
  memoryUsageMb: number;
  indexStatus: string;
  serverUptimeSec: number;
}

export const CATEGORIES_CONFIG: CategoryInfo[] = [
  {
    id: "power_cut",
    name: "Power Cut & Electrical",
    description: "Outages, transformer sparks, phase failures, voltage fluctuations",
    icon: "Zap",
    severity: "high",
  },
  {
    id: "water_issue",
    name: "Water Supply & Leakage",
    description: "Supply disruption, contaminated water, pipeline bursts, overflow",
    icon: "Droplets",
    severity: "medium",
  },
  {
    id: "theft_security",
    name: "Theft & Security",
    description: "Break-ins, vehicle theft, suspicious trespassing, security breaches",
    icon: "ShieldAlert",
    severity: "critical",
  },
  {
    id: "stray_animals",
    name: "Stray Animals Hazard",
    description: "Aggressive stray dogs, rabies risk, monkey menace, animal obstruction",
    icon: "Dog",
    severity: "medium",
  },
  {
    id: "road_hazard",
    name: "Road Hazards & Potholes",
    description: "Deep potholes, open manholes, damaged pathways, fallen trees",
    icon: "AlertTriangle",
    severity: "high",
  },
  {
    id: "sanitation",
    name: "Sanitation & Waste",
    description: "Garbage accumulation, overflowing bins, uncollected society waste",
    icon: "Trash2",
    severity: "low",
  },
  {
    id: "other",
    name: "Other Local Issue",
    description: "Other non-emergency neighbourhood or society issues",
    icon: "HelpCircle",
    severity: "low",
  },
];
