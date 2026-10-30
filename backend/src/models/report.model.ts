import { Schema, model, Document, Types } from "mongoose";

export interface IReport extends Document {
  incident?: Types.ObjectId;
  user?: Types.ObjectId;
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
  title: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  address?: string;
  department?: string;
  ward?: string;
  pincode?: string;
  landmark?: string;
  complainantPhone?: string;
  media: string[];
  status: "submitted" | "linked" | "under_review" | "resolved" | "rejected";
  reporterName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    incident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
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
    department: {
      type: String,
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    complainantPhone: {
      type: String,
      trim: true,
    },
    media: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["submitted", "linked", "under_review", "resolved", "rejected"],
      default: "submitted",
    },
    reporterName: {
      type: String,
      default: "Anonymous Citizen",
    },
  },
  { timestamps: true }
);

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ incident: 1 });
reportSchema.index({ createdAt: -1 });

const Report = model<IReport>("Report", reportSchema);

export default Report;
