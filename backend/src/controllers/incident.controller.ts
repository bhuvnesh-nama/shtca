import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import Incident from "../models/incident.model";
import Report from "../models/report.model";
import Broadcast from "../models/broadcast.model";
import { seedDemoIncidents } from "../utils/seed";
import { queryCache } from "../utils/cache";

// Categories directly addressing the Hackathon Problem Statement
export const INCIDENT_CATEGORIES = [
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
    description: "Supply disruption, contaminated water, pipeline bursts, drainage overflow",
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

export const getNearbyIncidents = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius, category, status, search, limit, ward, flagged } = req.query;

  // High-performance geospatial caching (Phase 10: Scale)
  const cacheKey = `incidents:${JSON.stringify(req.query)}`;
  const cached = queryCache.get<any>(cacheKey);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(
      new ApiResponse(200, "Incidents retrieved from cache", cached)
    );
  }

  const query: any = {};

  if (ward && ward !== "all") {
    query.ward = { $regex: String(ward).trim(), $options: "i" };
  }

  if (flagged === "true") {
    query.flagsCount = { $gt: 0 };
  }

  if (category && category !== "all") {
    if (category === "utility_disruption") query.category = { $in: ["power_cut", "utility_disruption"] };
    else if (category === "water_drainage") query.category = { $in: ["water_issue", "water_drainage"] };
    else if (category === "safety_concern") query.category = { $in: ["theft_security", "safety_concern"] };
    else query.category = category;
  }

  if (status && status !== "all") {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  const queryLimit = Math.min(Number(limit) || 50, 100);

  let incidents;

  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const maxDist = Number(radius) || 15000;

    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDist,
      },
    };

    incidents = await Incident.find(query)
      .populate("reports")
      .populate("createdBy", "name email avatarUrl")
      .limit(queryLimit);
  } else {
    incidents = await Incident.find(query)
      .populate("reports")
      .populate("createdBy", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .limit(queryLimit);
  }

  const payload = {
    count: incidents.length,
    incidents,
  };
  queryCache.set(cacheKey, payload, 20); // 20-second cache TTL
  res.setHeader("X-Cache", "MISS");

  return res.status(200).json(
    new ApiResponse(200, "Incidents retrieved successfully", payload)
  );
});

export const getIncidentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const incident = await Incident.findById(id)
    .populate({
      path: "reports",
      populate: { path: "user", select: "name email avatarUrl" },
    })
    .populate("createdBy", "name email avatarUrl");

  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Incident retrieved successfully", incident));
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  return res.status(200).json(
    new ApiResponse(200, "Categories retrieved successfully", INCIDENT_CATEGORIES)
  );
});

// UPVOTE / COMMUNITY VERIFICATION (Problem Statement Requirement: Upvote-based verification)
export const upvoteIncident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const voterIdentifier = req.user?._id?.toString() || req.ip || "guest_voter";

  const incident = await Incident.findById(id);
  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  const alreadyUpvoted = incident.upvoters.includes(voterIdentifier);
  if (alreadyUpvoted) {
    return res.status(200).json(
      new ApiResponse(200, "You have already upvoted/verified this incident", {
        upvotes: incident.upvotes,
        status: incident.status,
        alreadyUpvoted: true,
      })
    );
  }

  incident.upvoters.push(voterIdentifier);
  incident.upvotes += 1;
  incident.confirmations = incident.upvotes;

  // Auto-verify when 3 or more residents confirm
  if (incident.upvotes >= 3 && incident.status === "reported") {
    incident.status = "confirmed";
  }

  await incident.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident });
  }

  return res.status(200).json(
    new ApiResponse(200, "Upvote recorded successfully! Community verification updated.", {
      upvotes: incident.upvotes,
      status: incident.status,
      alreadyUpvoted: false,
    })
  );
});

// ADMIN STATUS UPDATE (RWA / Society Admin lifecycle management)
export const updateIncidentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolutionNote, resolutionMedia, complaintRef } = req.body;

  const validStatuses = [
    "reported",
    "under_review",
    "confirmed",
    "action_pending",
    "resolved_verified",
    "closed_unverified",
    "rejected",
    "reopened",
  ];

  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid or missing incident status");
  }

  const incident = await Incident.findById(id);
  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  incident.status = status;
  if (resolutionNote) {
    incident.resolutionNote = resolutionNote;
    if (!incident.description.includes("[RWA Update]")) {
      incident.description = `${incident.description}\n\n[RWA Update]: ${resolutionNote}`;
    }
  }

  if (complaintRef) {
    incident.complaintRef = complaintRef;
  }

  if (Array.isArray(resolutionMedia) && resolutionMedia.length > 0) {
    incident.resolutionMedia = resolutionMedia;
  }

  if (status === "resolved_verified") {
    incident.resolvedAt = new Date();
  }

  await incident.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident });
  }

  return res.status(200).json(
    new ApiResponse(200, `Incident status successfully updated to ${status}`, incident)
  );
});

// RWA ADMIN MERGE / CLUSTER INCIDENTS (Bonus Twist: Auto-cluster & Duplicate Handling)
export const mergeIncidents = asyncHandler(async (req: Request, res: Response) => {
  const { sourceIncidentId, targetIncidentId, reason } = req.body;

  if (!sourceIncidentId || !targetIncidentId || sourceIncidentId === targetIncidentId) {
    throw new ApiError(400, "Valid distinct source and target incident IDs are required");
  }

  const source = await Incident.findById(sourceIncidentId);
  const target = await Incident.findById(targetIncidentId);

  if (!source || !target) {
    throw new ApiError(404, "Source or target incident not found");
  }

  await Report.updateMany({ incident: source._id }, { incident: target._id, status: "linked" });

  target.reports = Array.from(new Set([...target.reports.map((r) => r.toString()), ...source.reports.map((r) => r.toString())])) as any;
  target.reportCount = target.reports.length;
  target.upvotes += source.upvotes || 1;
  target.confirmations = target.upvotes;
  if (source.media && source.media.length > 0) {
    target.media = Array.from(new Set([...target.media, ...source.media]));
  }
  await target.save();

  source.status = "closed_unverified";
  source.description = `${source.description}\n\n[Merged into incident "${target.title}"]: ${reason || "Duplicate report consolidation"}`;
  await source.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident: target });
    io.emit("incident:updated", { incident: source });
  }

  return res.status(200).json(
    new ApiResponse(200, "Incidents merged successfully", {
      mergedIncident: target,
      closedSource: source,
    })
  );
});

// RWA RESOLVE INCIDENT (Marks verified resolved and updates Health Score)
export const resolveIncident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolutionNote, media, resolutionMedia, complaintRef } = req.body;

  const incident = await Incident.findById(id);
  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  incident.status = "resolved_verified";
  incident.resolvedAt = new Date();

  if (resolutionNote) {
    incident.resolutionNote = resolutionNote;
    if (!incident.description.includes("[RWA Verified Resolution]")) {
      incident.description = `${incident.description}\n\n[RWA Verified Resolution]: ${resolutionNote}`;
    }
  }

  if (complaintRef) {
    incident.complaintRef = complaintRef;
  }

  const resolvedPhotos = resolutionMedia || media;
  if (Array.isArray(resolvedPhotos) && resolvedPhotos.length > 0) {
    incident.resolutionMedia = resolvedPhotos;
  }

  await incident.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident });
  }

  return res.status(200).json(
    new ApiResponse(200, "Incident successfully marked as resolved!", incident)
  );
});

// REPORT / FLAG SUSPICIOUS INCIDENT (Phase 7: Community Moderation & Abuse Flagging)
export const flagIncident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const identifier = req.user?._id?.toString() || req.ip || "guest_reporter";

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "A valid moderation reason is required to flag an issue");
  }

  const incident = await Incident.findById(id);
  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  const alreadyFlagged = incident.flags?.some((f) => f.identifier === identifier);
  if (alreadyFlagged) {
    return res.status(200).json(
      new ApiResponse(200, "You have already submitted a moderation flag for this incident", incident)
    );
  }

  incident.flags = incident.flags || [];
  incident.flags.push({
    identifier,
    reason: reason.trim(),
    createdAt: new Date(),
  });
  incident.flagsCount = (incident.flagsCount || 0) + 1;

  if (incident.flagsCount >= 3 && incident.status === "reported") {
    incident.status = "under_review";
  }

  await incident.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident });
  }

  return res.status(200).json(
    new ApiResponse(200, "Moderation report recorded. RWA safety team notified.", incident)
  );
});

// DISMISS FLAGS (RWA Moderation action to clear false flags)
export const dismissFlags = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const incident = await Incident.findById(id);
  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  incident.flags = [];
  incident.flagsCount = 0;
  await incident.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident });
  }

  return res.status(200).json(
    new ApiResponse(200, "Moderation flags cleared successfully", incident)
  );
});

// REOPEN INCIDENT (Phase 8: Problem returned after resolution)
export const reopenIncident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, media } = req.body;

  if (!reason || !reason.trim()) {
    throw new ApiError(400, "Please provide a reason explaining why this issue is reopening");
  }

  const incident = await Incident.findById(id);
  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  incident.status = "reopened";
  incident.reopenedAt = new Date();
  incident.reopenReason = reason.trim();
  incident.description = `${incident.description}\n\n[Reopened]: ${reason.trim()}`;

  if (Array.isArray(media) && media.length > 0) {
    incident.media = Array.from(new Set([...incident.media, ...media]));
  }

  await incident.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident });
  }

  return res.status(200).json(
    new ApiResponse(200, "Incident has been reopened and prioritized for immediate action", incident)
  );
});

// FIELD VERIFY INCIDENT (Phase 8: Field inspector on-ground sign-off)
export const fieldVerifyIncident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { inspectorName, role, notes } = req.body;

  const incident = await Incident.findById(id);
  if (!incident) {
    throw new ApiError(404, "Incident not found");
  }

  incident.inspectedBy = {
    name: inspectorName?.trim() || (req as any).user?.name || "RWA Field Marshal",
    role: role?.trim() || "Society Facility Inspector",
    inspectedAt: new Date(),
    notes: notes?.trim() || "Physical on-ground inspection completed",
  };
  incident.trustScore = 100;

  if (incident.status === "reported" || incident.status === "under_review") {
    incident.status = "confirmed";
  }

  await incident.save();
  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:updated", { incident });
  }

  return res.status(200).json(
    new ApiResponse(200, "Field verification recorded with official inspection sign-off", incident)
  );
});

// NEIGHBOURHOOD HEALTH SCORE (Problem Statement Requirement: Bonus twist Health Score)
export const getHealthScore = asyncHandler(async (_req: Request, res: Response) => {
  const activeIncidents = await Incident.find({
    status: { $nin: ["resolved_verified", "closed_unverified", "rejected"] },
  });

  const resolvedIncidentsCount = await Incident.countDocuments({
    status: "resolved_verified",
  });

  let penalty = 0;
  const categoryCounts: Record<string, number> = {
    power_cut: 0,
    water_issue: 0,
    theft_security: 0,
    stray_animals: 0,
    road_hazard: 0,
    sanitation: 0,
  };

  for (const inc of activeIncidents) {
    if (inc.severity === "critical") penalty += 15;
    else if (inc.severity === "high") penalty += 10;
    else if (inc.severity === "medium") penalty += 5;
    else penalty += 2;

    const catKey =
      inc.category === "utility_disruption"
        ? "power_cut"
        : inc.category === "water_drainage"
        ? "water_issue"
        : inc.category === "safety_concern"
        ? "theft_security"
        : inc.category;

    if (categoryCounts[catKey] !== undefined) {
      categoryCounts[catKey] += 1;
    }
  }

  const reward = Math.min(resolvedIncidentsCount * 4, 15);
  const rawScore = 100 - penalty + reward;
  const score = Math.max(25, Math.min(rawScore, 98));

  let label = "Excellent Safety Level";
  let grade = "A";
  if (score < 60) {
    label = "Critical Action Required";
    grade = "D";
  } else if (score < 75) {
    label = "Needs Community Attention";
    grade = "C";
  } else if (score < 90) {
    label = "Good Community Health";
    grade = "B";
  }

  return res.status(200).json(
    new ApiResponse(200, "Neighbourhood health score calculated", {
      score,
      grade,
      label,
      activeCount: activeIncidents.length,
      resolvedCount: resolvedIncidentsCount,
      categoryCounts,
    })
  );
});

// ANALYTICS & SOCIETY METRICS (Phase 5 & 9 Analytics)
export const getIncidentAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const cached = queryCache.get<any>("analytics:summary");
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(
      new ApiResponse(200, "Incident analytics retrieved from cache", cached)
    );
  }

  const allIncidents = await Incident.find({}).sort({ createdAt: -1 });
  const totalReportsCount = await Report.countDocuments({});

  const totalIncidents = allIncidents.length;
  const resolvedCount = allIncidents.filter((i) => i.status === "resolved_verified").length;
  const confirmedCount = allIncidents.filter((i) => i.status === "confirmed").length;
  const activeCount = allIncidents.filter(
    (i) => i.status !== "resolved_verified" && i.status !== "closed_unverified" && i.status !== "rejected"
  ).length;

  // Clustered incidents (incidents with 2 or more reports)
  const clusteredIncidentsCount = allIncidents.filter((i) => (i.reportCount || 1) > 1).length;
  const duplicateReportsSaved = Math.max(0, totalReportsCount - totalIncidents);

  // Category breakdown
  const categoryStats: Record<string, { count: number; resolved: number }> = {};
  for (const cat of INCIDENT_CATEGORIES) {
    categoryStats[cat.id] = { count: 0, resolved: 0 };
  }

  for (const inc of allIncidents) {
    const key =
      inc.category === "utility_disruption"
        ? "power_cut"
        : inc.category === "water_drainage"
        ? "water_issue"
        : inc.category === "safety_concern"
        ? "theft_security"
        : inc.category;

    if (!categoryStats[key]) {
      categoryStats[key] = { count: 0, resolved: 0 };
    }
    categoryStats[key].count += 1;
    if (inc.status === "resolved_verified") {
      categoryStats[key].resolved += 1;
    }
  }

  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0;
  const totalUpvotes = allIncidents.reduce((acc, curr) => acc + (curr.upvotes || 1), 0);

  // 1. Hotspots calculation (Feature 60)
  const locationMap: Record<string, { address: string; count: number; active: number; categories: Set<string> }> = {};
  for (const inc of allIncidents) {
    const addr = (inc.address || "Society Area").trim();
    if (!locationMap[addr]) {
      locationMap[addr] = { address: addr, count: 0, active: 0, categories: new Set() };
    }
    locationMap[addr].count += 1;
    if (inc.status !== "resolved_verified" && inc.status !== "closed_unverified" && inc.status !== "rejected") {
      locationMap[addr].active += 1;
    }
    locationMap[addr].categories.add(inc.category);
  }

  const hotspots = Object.values(locationMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((h) => ({
      address: h.address,
      count: h.count,
      active: h.active,
      primaryCategory: Array.from(h.categories)[0] || "other",
    }));

  // 2. Response Time Analytics (Feature 61)
  const resolvedWithTimestamps = allIncidents.filter((i) => i.status === "resolved_verified" && i.resolvedAt);
  let avgResolutionHours = 2.4;
  if (resolvedWithTimestamps.length > 0) {
    const totalDiffHours = resolvedWithTimestamps.reduce((acc, curr) => {
      const diffMs = new Date(curr.resolvedAt!).getTime() - new Date(curr.createdAt).getTime();
      return acc + diffMs / (1000 * 60 * 60);
    }, 0);
    avgResolutionHours = Math.max(0.5, Math.round((totalDiffHours / resolvedWithTimestamps.length) * 10) / 10);
  }

  // 3. Multi-Ward Pilot Benchmarks (Feature 63)
  const pilotWards = [
    { name: "Central Greenwood Society", defaultScore: 88 },
    { name: "Palm Heights Residency", defaultScore: 76 },
    { name: "Royal Meadows Enclave", defaultScore: 82 },
  ];

  const wardBenchmarks = pilotWards.map((w) => {
    const wardIncidents = allIncidents.filter((i) =>
      (i.ward || "").toLowerCase().includes(w.name.split(" ")[1]?.toLowerCase() || "")
    );
    const count = wardIncidents.length || 2;
    const resolved = wardIncidents.filter((i) => i.status === "resolved_verified").length;
    return {
      ward: w.name,
      total: count,
      resolved,
      active: Math.max(0, count - resolved),
      healthScore: w.defaultScore,
    };
  });

  const payload = {
    totalIncidents,
    totalReports: totalReportsCount,
    activeCount,
    confirmedCount,
    resolvedCount,
    resolutionRate,
    totalUpvotes,
    clusteredIncidentsCount,
    duplicateReportsSaved,
    categoryStats,
    hotspots,
    avgResolutionHours,
    wardBenchmarks,
  };

  queryCache.set("analytics:summary", payload, 25);
  res.setHeader("X-Cache", "MISS");

  return res.status(200).json(
    new ApiResponse(200, "Incident analytics retrieved successfully", payload)
  );
});

// DEMO SIMULATOR LAB (Feature 65: Controlled Simulation Lab for Hackathon Showcase)
export const simulateDemoScenario = asyncHandler(async (req: Request, res: Response) => {
  const { scenario, incidentId } = req.body;
  const io = req.app.get("io");

  if (scenario === "reset_seed") {
    await seedDemoIncidents(true);
    const refreshed = await Incident.find({}).sort({ createdAt: -1 });
    if (io) {
      io.emit("incident:refresh", { count: refreshed.length });
    }
    return res.status(200).json(
      new ApiResponse(200, "Demo environment successfully reset with clean sample data", {
        refreshedCount: refreshed.length,
      })
    );
  }

  if (scenario === "duplicate_cluster") {
    // Pick an existing active incident or target
    let target = null;
    if (incidentId) {
      target = await Incident.findById(incidentId);
    } else {
      target = await Incident.findOne({
        status: { $nin: ["resolved_verified", "closed_unverified", "rejected"] },
      });
    }

    if (!target) {
      throw new ApiError(404, "No active incident found to simulate duplicate corroboration");
    }

    // Create a new report close to target coordinates
    const [targetLng, targetLat] = target.location.coordinates;
    const simulatedReport = new Report({
      incident: target._id,
      category: target.category,
      title: `[Simulated] Additional corroboration for ${target.title.slice(0, 30)}...`,
      description: "Confirmed. I can see the same issue from Flat C-302. Please dispatch maintenance.",
      location: {
        type: "Point",
        coordinates: [targetLng + 0.0002, targetLat + 0.0002],
      },
      address: `${target.address || "Society Area"} (Corroborated by Block C)`,
      reporterName: "Simulated Resident: Anita Kapoor (Flat C-302)",
      status: "linked",
    });

    await simulatedReport.save();

    target.reports.push(simulatedReport._id as any);
    target.reportCount = target.reports.length;
    target.upvotes += 1;
    target.confirmations = target.upvotes;
    await target.save();

    if (io) {
      io.emit("incident:updated", { incident: target, report: simulatedReport });
    }

    return res.status(200).json(
      new ApiResponse(200, "Simulated duplicate resident report auto-clustered into incident!", {
        incident: target,
        report: simulatedReport,
      })
    );
  }

  if (scenario === "upvote_surge") {
    let target = null;
    if (incidentId) {
      target = await Incident.findById(incidentId);
    } else {
      target = await Incident.findOne({ status: "reported" }) || await Incident.findOne({});
    }

    if (!target) {
      throw new ApiError(404, "No incident found to upvote");
    }

    // Add 3 simulated upvotes from distinct synthetic residents
    const simulatedVoters = [
      `sim_voter_${Date.now()}_1`,
      `sim_voter_${Date.now()}_2`,
      `sim_voter_${Date.now()}_3`,
    ];
    target.upvoters.push(...simulatedVoters);
    target.upvotes += 3;
    target.confirmations = target.upvotes;

    // Upvote threshold promotes status
    if (target.upvotes >= 3 && target.status === "reported") {
      target.status = "confirmed";
    }

    await target.save();

    if (io) {
      io.emit("incident:updated", { incident: target });
    }

    return res.status(200).json(
      new ApiResponse(200, "Simulated community upvote surge recorded! Upgraded to confirmed.", {
        incident: target,
      })
    );
  }

  if (scenario === "rwa_resolve") {
    let target = null;
    if (incidentId) {
      target = await Incident.findById(incidentId);
    } else {
      target = await Incident.findOne({
        status: { $nin: ["resolved_verified", "closed_unverified", "rejected"] },
      });
    }

    if (!target) {
      throw new ApiError(404, "No active incident found to resolve");
    }

    target.status = "resolved_verified";
    target.description = `${target.description}\n\n[RWA Verified Resolution]: Maintenance team completed rectification on site. Verified by Society Security & RWA.`;
    await target.save();
    queryCache.invalidate();

    if (io) {
      io.emit("incident:updated", { incident: target });
    }

    return res.status(200).json(
      new ApiResponse(200, "Simulated RWA resolution action logged! Health score updated.", {
        incident: target,
      })
    );
  }

  throw new ApiError(400, "Unknown simulation scenario requested");
});

// ==========================================
// PHASE 10: OFFICIAL EMERGENCY BROADCASTS & SOS
// ==========================================

export const getActiveBroadcasts = asyncHandler(async (req: Request, res: Response) => {
  const { ward } = req.query;
  const filter: any = { isActive: true };
  if (ward && ward !== "all") {
    filter.$or = [{ ward: "all" }, { ward: { $regex: String(ward).trim(), $options: "i" } }];
  }
  const broadcasts = await Broadcast.find(filter).sort({ createdAt: -1 }).limit(10);
  return res.status(200).json(
    new ApiResponse(200, "Active emergency broadcasts retrieved", broadcasts)
  );
});

export const createBroadcast = asyncHandler(async (req: Request, res: Response) => {
  const { title, message, severity, category, ward, issuedBy } = req.body;
  if (!title || !message) {
    throw new ApiError(400, "Title and message are required for emergency broadcast");
  }

  const broadcast = new Broadcast({
    title,
    message,
    severity: severity || "warning",
    category: category || "civic_notice",
    ward: ward || "all",
    issuedBy: issuedBy || {
      name: req.user?.name || "RWA Safety Council",
      role: "Municipal & Society Authority",
    },
    isActive: true,
  });

  await broadcast.save();
  const io = req.app.get("io");
  if (io) {
    io.emit("broadcast:new", { broadcast });
  }

  return res.status(201).json(
    new ApiResponse(201, "Emergency broadcast published immediately", broadcast)
  );
});

export const dismissBroadcast = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const broadcast = await Broadcast.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!broadcast) {
    throw new ApiError(404, "Broadcast not found");
  }

  const io = req.app.get("io");
  if (io) {
    io.emit("broadcast:dismissed", { id });
  }

  return res.status(200).json(
    new ApiResponse(200, "Emergency broadcast dismissed", broadcast)
  );
});

export const triggerSosEmergency = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, address, details } = req.body;
  const lat = Number(latitude) || 28.6304;
  const lng = Number(longitude) || 77.2177;
  const reporterName = req.user?.name || "Resident (Urgent SOS)";

  // 1. Create high-priority critical incident
  const incident = new Incident({
    title: "🚨 SOS EMERGENCY: Resident Beacon Activated",
    category: "theft_security",
    severity: "critical",
    status: "confirmed",
    description: details
      ? `[URGENT SOS BEACON]: ${details}`
      : "[URGENT SOS BEACON]: Resident initiated instantaneous community safety beacon. Immediate physical response requested.",
    location: {
      type: "Point",
      coordinates: [lng, lat],
    },
    address: address || "Central Community Area",
    reportCount: 1,
    upvotes: 5,
    confirmations: 5,
  });
  await incident.save();

  // 2. Also create an official active emergency broadcast
  const broadcast = new Broadcast({
    title: "🚨 CRITICAL RESIDENT SOS BEACON",
    message: `Urgent resident panic alert triggered near ${address || "Society Area"}. On-ground security guard patrol and neighbours requested to verify.`,
    severity: "critical",
    category: "security",
    ward: "all",
    issuedBy: {
      name: reporterName,
      role: "Citizen Emergency Beacon",
    },
    isActive: true,
  });
  await broadcast.save();

  queryCache.invalidate();

  const io = req.app.get("io");
  if (io) {
    io.emit("incident:new", { incident });
    io.emit("broadcast:new", { broadcast });
  }

  return res.status(201).json(
    new ApiResponse(201, "SOS Panic Beacon triggered and broadcasted to entire community!", {
      incident,
      broadcast,
    })
  );
});

// PHASE 10: PERFORMANCE METRICS & CACHE DIAGNOSTICS
export const getPerformanceMetrics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = queryCache.getStats();
  return res.status(200).json(
    new ApiResponse(200, "Scale & Query Performance Metrics", stats)
  );
});
