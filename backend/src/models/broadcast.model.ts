import { Schema, model, Document } from "mongoose";

export interface IBroadcast extends Document {
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  category: string;
  ward: string;
  issuedBy: {
    name: string;
    role: string;
  };
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const broadcastSchema = new Schema<IBroadcast>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ["critical", "warning", "info"],
      default: "warning",
    },
    category: {
      type: String,
      default: "civic_notice",
      trim: true,
    },
    ward: {
      type: String,
      default: "all",
      trim: true,
    },
    issuedBy: {
      name: { type: String, default: "RWA Safety Council" },
      role: { type: String, default: "Municipal & Society Authority" },
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

broadcastSchema.index({ isActive: 1, ward: 1, createdAt: -1 });

const Broadcast = model<IBroadcast>("Broadcast", broadcastSchema);

export default Broadcast;

