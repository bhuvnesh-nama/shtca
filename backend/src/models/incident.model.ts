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
  department?: string;
  ward?: string;
  pincode?: string;
  landmark?: string;
  assignedOfficer?: {
    name: string;
    designation: string;
    phone?: string;
    assignedAt: Date;
  };
  actionTakenReport?: {
    actionSummary: string;
    resolvedBy: string;
    completionDate?: Date;
    afterMedia?: string[];
  };
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
  assignedAuthority?: {
    officeId?: string;
    tier: "apex_central" | "zonal_ward" | "local_society";
    name: string;
    office: string;
    jurisdictionType: "Arterial Infrastructure" | "Zonal Sector Public Works" | "Housing Society & Colony";
    distanceKm?: number;
    routingReason: string;
    contactNumber?: string;
  };
  comments?: Array<{
    author: string;
    role: string;
    message: string;
    createdAt: Date;
  }>;
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
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: "Municipal Public Works Department",
    },
    pincode: {
      type: String,
      trim: true,
      default: "110092",
    },
    landmark: {
      type: String,
      trim: true,
    },
    assignedOfficer: {
      name: { type: String, trim: true },
      designation: { type: String, trim: true },
      phone: { type: String, trim: true },
      assignedAt: { type: Date, default: Date.now },
    },
    actionTakenReport: {
      actionSummary: { type: String, trim: true },
      resolvedBy: { type: String, trim: true },
      completionDate: { type: Date },
      afterMedia: [{ type: String }],
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
      role: { type: String, trim: true, default: "Municipal Field Officer / Junior Engineer" },
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
      default: "Ward 42 - Anand Vihar Zone",
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
    assignedAuthority: {
      officeId: { type: String, trim: true },
      tier: { type: String, enum: ["apex_central", "zonal_ward", "local_society"] },
      name: { type: String, trim: true },
      office: { type: String, trim: true },
      jurisdictionType: { type: String, trim: true },
      distanceKm: { type: Number },
      routingReason: { type: String, trim: true },
      contactNumber: { type: String, trim: true },
    },
    comments: [
      {
        author: { type: String, trim: true, required: true },
        role: { type: String, trim: true, default: "Resident" },
        message: { type: String, trim: true, required: true },
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
