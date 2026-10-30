import { Router } from "express";
import {
  getNearbyIncidents,
  getIncidentById,
  getCategories,
  upvoteIncident,
  updateIncidentStatus,
  mergeIncidents,
  resolveIncident,
  flagIncident,
  dismissFlags,
  reopenIncident,
  fieldVerifyIncident,
  getHealthScore,
  getIncidentAnalytics,
  simulateDemoScenario,
  getActiveBroadcasts,
  createBroadcast,
  dismissBroadcast,
  triggerSosEmergency,
  getPerformanceMetrics,
} from "../controllers/incident.controller";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/health-score", getHealthScore);
router.get("/analytics", getIncidentAnalytics);
router.get("/performance", getPerformanceMetrics);
router.get("/broadcasts", getActiveBroadcasts);
router.post("/broadcasts", optionalAuthMiddleware, createBroadcast);
router.delete("/broadcasts/:id", optionalAuthMiddleware, dismissBroadcast);
router.post("/sos", optionalAuthMiddleware, triggerSosEmergency);
router.post("/simulate", simulateDemoScenario);
router.get("/categories", getCategories);
router.get("/", getNearbyIncidents);
router.get("/:id", getIncidentById);
router.post("/:id/upvote", optionalAuthMiddleware, upvoteIncident);
router.patch("/:id/status", optionalAuthMiddleware, updateIncidentStatus);
router.post("/:id/resolve", optionalAuthMiddleware, resolveIncident);
router.post("/:id/flag", optionalAuthMiddleware, flagIncident);
router.post("/:id/dismiss-flags", optionalAuthMiddleware, dismissFlags);
router.post("/:id/reopen", optionalAuthMiddleware, reopenIncident);
router.post("/:id/field-verify", optionalAuthMiddleware, fieldVerifyIncident);
router.post("/merge", optionalAuthMiddleware, mergeIncidents);

export default router;
