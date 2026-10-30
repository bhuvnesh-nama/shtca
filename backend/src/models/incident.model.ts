import { Schema, model, Document, Types } from "mongoose";

export interface IIncident extends Document {
  title: string;
  category:
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
  description: string;
  status:
    | "reported"
    | "under_review"
    | "confirmed"
    | "action_pending"
    | "resolution_submitted"
    | "resolved_verified"
    | "closed_unverified"
    | "rejected"
    | "reopened";
  severity: "low" | "medium" | "high" | "critical";
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string;
  media: string[];
  resolutionMedia?: string[];
  resolutionNote?: string;
  complaintRef?: string;
  resolvedAt?: Date;
  reopenedAt?: Date;
  reopenReason?: string;
  inspectedBy?: {
    name: string;
    role: string;
    inspectedAt: Date;
    notes?: string;
  };
  trustScore?: number;
  ward?: string;
  flagsCount: number;
  flags: Array<{ identifier: string; reason: string; createdAt: Date }>;
  reports: Types.ObjectId[];
  reportCount: number;
  upvotes: number;
  upvoters: string[];
  confirmations: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "power_cut",
        "water_issue",
        "theft_security",
        "stray_animals",
        "road_hazard",
        "sanitation",
        "utility_disruption",
        "water_drainage",
        "safety_concern",
        "other",
      ],
      default: "other",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "reported",
        "under_review",
        "confirmed",
        "action_pending",
        "resolution_submitted",
        "resolved_verified",
        "closed_unverified",
        "rejected",
        "reopened",
      ],
      default: "reported",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    address: {
      type: String,
      trim: true,
    },
    media: [
      {
        type: String,
      },
    ],
    resolutionMedia: [
      {
        type: String,
      },
    ],
    resolutionNote: {
      type: String,
      trim: true,
    },
    complaintRef: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    reopenedAt: {
      type: Date,
    },
    reopenReason: {
      type: String,
      trim: true,
    },
    inspectedBy: {
      name: { type: String, trim: true },
      role: { type: String, trim: true, default: "RWA Field Marshal" },
      inspectedAt: { type: Date, default: Date.now },
      notes: { type: String, trim: true },
    },
    trustScore: {
      type: Number,
      default: 90,
    },
    ward: {
      type: String,
      trim: true,
      default: "Greenwood Society",
    },
    flagsCount: {
      type: Number,
      default: 0,
    },
    flags: [
      {
        identifier: { type: String, required: true },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    reports: [
      {
        type: Schema.Types.ObjectId,
        ref: "Report",
      },
    ],
    reportCount: {
      type: Number,
      default: 1,
    },
    upvotes: {
      type: Number,
      default: 1,
    },
    upvoters: [
      {
        type: String,
      },
    ],
    confirmations: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

incidentSchema.index({ location: "2dsphere" });
incidentSchema.index({ category: 1, status: 1 });
incidentSchema.index({ createdAt: -1 });

const Incident = model<IIncident>("Incident", incidentSchema);

export default Incident;
