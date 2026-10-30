import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import path from "path";
import setUpSocket from "./utils/socket";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

setUpSocket(io);
app.set("io", io);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance Latency Tracking Middleware (Phase 10: Scale & Metrics)
import { queryCache } from "./utils/cache";
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    queryCache.recordLatency(duration);
  });
  next();
});

// Serve static assets from public folder
app.use("/public", express.static(path.join(process.cwd(), "public")));

// Importing routes
import authRouter from "./routes/auth.route";
import reportRouter from "./routes/report.route";
import incidentRouter from "./routes/incident.route";
import uploadRouter from "./routes/upload.route";

// Applying routes
app.use("/api/auth", authRouter);
app.use("/api/reports", reportRouter);
app.use("/api/incidents", incidentRouter);
app.use("/api/upload", uploadRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("EXPRESS ERROR 💥:", err.name, err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

export default server;
