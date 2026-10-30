import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import Report from "../models/report.model";
import Incident from "../models/incident.model";
import { queryCache } from "../utils/cache";

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

export const submitReport = asyncHandler(async (req: Request, res: Response) => {
  const { category, title, description, latitude, longitude, address, media, forceNew } = req.body;

  if (!category || !title || !description) {
    throw new ApiError(400, "Category, title, and description are required");
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new ApiError(400, "Valid latitude and longitude are required");
  }

  const mediaUrls: string[] = Array.isArray(media) ? media : [];

  // 1. Create Report
  const report = new Report({
    user: req.user?._id,
    reporterName: req.user?.name || "Anonymous Resident",
    category,
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

  // 2. Auto-cluster: check for nearby open incident of same category within 200m (unless user explicitly forced new)
  let incident = null;
  if (!forceNew) {
    incident = await Incident.findOne({
      category,
      status: { $nin: ["resolved_verified", "closed_unverified", "rejected"] },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 200,
        },
      },
    });
  }

  let isNewIncident = false;

  if (incident) {
    // Auto-cluster with existing incident
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
  } else {
    // Create new Incident
    isNewIncident = true;
    incident = new Incident({
      title,
      category,
      description,
      status: "reported",
      severity: "medium",
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      address: address || "",
      media: mediaUrls,
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
