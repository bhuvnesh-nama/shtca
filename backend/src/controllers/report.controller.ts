import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import Report from "../models/report.model";
import Incident from "../models/incident.model";
import { queryCache } from "../utils/cache";
import { resolveNearestAuthority } from "../utils/authorityRouting";

export const checkNearbyDuplicates = asyncHandler(async (req: Request, res: Response) => {
  const { category, lat, lng, radius } = req.query;

  if (!category || !lat || !lng) {
    return res.status(200).json(
      new ApiResponse(200, "No duplicate check performed", { hasNearbyDuplicate: false })
    );
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  const maxDist = Number(radius) || 250; // 250m duplicate detection radius

  const nearbyIncident = await Incident.findOne({
    category,
    status: { $nin: ["resolved_verified", "closed_unverified", "rejected"] },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDist,
      },
    },
  });

  if (nearbyIncident) {
    return res.status(200).json(
      new ApiResponse(200, "Nearby matching incident found for clustering", {
        hasNearbyDuplicate: true,
        incident: nearbyIncident,
      })
    );
  }

  return res.status(200).json(
    new ApiResponse(200, "No nearby matching incident found", {
      hasNearbyDuplicate: false,
    })
  );
});

const DEPARTMENT_MAP: Record<string, string> = {
  power_cut: "Power Distribution & Street Lighting Discom",
  water_issue: "Water Works & Sewerage Distribution Board",
  road_hazard: "Public Works & Road Infrastructure (PWD)",
  sanitation: "Solid Waste & Public Sanitation Cell",
  stray_animals: "Veterinary & Animal Welfare Unit",
  theft_security: "Resident Vigilance & Estate Security Cell",
  utility_disruption: "Public Utilities & Maintenance Services",
  water_drainage: "Stormwater Drainage & Flood Control",
  safety_concern: "Civil Defense & Emergency Safety",
  other: "Central Grievance Redressal Cell",
};

export const submitReport = asyncHandler(async (req: Request, res: Response) => {
  const {
    category,
    title,
    description,
    latitude,
    longitude,
    address,
    media,
    forceNew,
    department,
    ward,
    pincode,
    landmark,
    reporterName,
    complainantPhone,
  } = req.body;

  if (!category || !title || !description) {
    throw new ApiError(400, "Category, title, and description are required");
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new ApiError(400, "Valid latitude and longitude are required");
  }

  const mediaUrls: string[] = Array.isArray(media) ? media : [];
  const assignedAuth = resolveNearestAuthority(lat, lng, category, "medium", title, description);
  const resolvedDept = department || DEPARTMENT_MAP[category] || "General Civic Redressal Cell";
  const resolvedWard = ward || assignedAuth.name || assignedAuth.office;
  const resolvedPincode = pincode || (lat >= 26.0 && lat <= 27.5 && lng >= 75.0 && lng <= 76.5 ? "302017" : "110092");
  const resolvedLandmark = landmark || "";
  const resolvedReporter = reporterName || req.user?.name || "Resident Complainant";

  // 1. Create Report
  const report = new Report({
    user: req.user?._id,
    reporterName: resolvedReporter,
    complainantPhone: complainantPhone || "",
    category,
    department: resolvedDept,
    ward: resolvedWard,
    pincode: resolvedPincode,
    landmark: resolvedLandmark,
    title,
    description,
    location: {
      type: "Point",
      coordinates: [lng, lat],
    },
    address: address || "",
    media: mediaUrls,
    status: "submitted",
  });

  await report.save();

  // 2. Incident Creation:
  // If user explicitly chose to merge into an existing incident (via linkToIncidentId):
  let incident = null;
  let isNewIncident = true;

  if (req.body.linkToIncidentId && !forceNew) {
    incident = await Incident.findById(req.body.linkToIncidentId);
    if (incident) {
      isNewIncident = false;
      incident.reports.push(report._id as any);
      incident.reportCount = incident.reports.length;
      incident.upvotes += 1;
      incident.confirmations = incident.upvotes;
      if (mediaUrls.length > 0) {
        incident.media = Array.from(new Set([...incident.media, ...mediaUrls]));
      }
      await incident.save();
      report.incident = incident._id as any;
      report.status = "linked";
      await report.save();
    }
  }

  // Always create a new tracked Incident ticket when citizen lodges a grievance
  if (isNewIncident) {
    const isJaipur = lat >= 26.0 && lat <= 27.5 && lng >= 75.0 && lng <= 76.5;
    const prefix = isJaipur ? "JPR-" : "CIVIC-";
    const generatedRef = prefix + new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000);

    incident = new Incident({
      title,
      category,
      department: resolvedDept,
      ward: resolvedWard,
      pincode: resolvedPincode,
      landmark: resolvedLandmark,
      complaintRef: generatedRef,
      description,
      status: "reported",
      severity: "medium",
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      address: address || "",
      media: mediaUrls,
      assignedAuthority: assignedAuth,
      comments: [
        {
          author: resolvedReporter,
          role: "Resident Complainant",
          message: "Grievance lodged via citizen portal. Nearest authority dispatched automatically.",
          createdAt: new Date(),
        },
      ],
      reports: [report._id],
      reportCount: 1,
      upvotes: 1,
      confirmations: 1,
      createdBy: req.user?._id,
    });

    await incident.save();
    report.incident = incident._id as any;
    await report.save();
  }

  // Invalidate query cache on new report / clustering (Phase 10: Scale & Performance)
  queryCache.invalidate();

  // 3. Emit live socket event
  const io = req.app.get("io");
  if (io) {
    io.emit(isNewIncident ? "incident:new" : "incident:updated", {
      incident,
      report,
    });
  }

  return res.status(201).json(
    new ApiResponse(201, "Report submitted successfully", {
      report,
      incident,
      isNewIncident,
    })
  );
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const { incidentId } = req.query;
  const filter: any = {};
  if (incidentId) {
    filter.incident = incidentId;
  }

  const reports = await Report.find(filter)
    .populate("user", "name email avatarUrl")
    .sort({ createdAt: -1 })
    .limit(50);

  return res
    .status(200)
    .json(new ApiResponse(200, "Reports fetched successfully", reports));
});
