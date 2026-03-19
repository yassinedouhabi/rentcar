import mongoose, { Schema, models, model } from "mongoose";
import type { MaintenanceType, MaintenanceStatus } from "@/types";

export interface IMaintenanceDocument {
  vehicleId: mongoose.Types.ObjectId;
  type: MaintenanceType;
  description: string;
  cost: number;
  date: Date;
  nextDue: Date;
  status: MaintenanceStatus;
}

const MaintenanceSchema = new Schema<IMaintenanceDocument>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    type: {
      type: String,
      enum: ["oil_change", "tires", "brakes", "inspection", "repair", "other"],
      required: true,
    },
    description: { type: String },
    cost: { type: Number, default: 0 },
    date: { type: Date, required: true },
    nextDue: { type: Date },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

MaintenanceSchema.index({ vehicleId: 1 });
MaintenanceSchema.index({ status: 1 });
MaintenanceSchema.index({ date: 1 });
MaintenanceSchema.index({ nextDue: 1 });

export default models.Maintenance || model<IMaintenanceDocument>("Maintenance", MaintenanceSchema);
