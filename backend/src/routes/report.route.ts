import { Router } from "express";
import { submitReport, getReports, checkNearbyDuplicates } from "../controllers/report.controller";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/check-duplicate", checkNearbyDuplicates);
router.post("/", optionalAuthMiddleware, submitReport);
router.get("/", getReports);

export default router;
