import { Router } from "express";
import { upload } from "../middlewares/upload.middleware";
import { uploadMedia } from "../controllers/upload.controller";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", optionalAuthMiddleware, upload.single("image"), uploadMedia);

export default router;

