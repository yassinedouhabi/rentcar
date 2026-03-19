import mongoose, { Schema, models, model } from "mongoose";
import type { ContractStatus, FuelLevel } from "@/types";

export interface IContractDocument {
  reservationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  contractNumber: string;
  signedAt: Date;
  mileageOut: number;
  mileageIn: number;
  fuelLevelOut: FuelLevel;
  fuelLevelIn: FuelLevel;
  damageReportOut: string;
  damageReportIn: string;
  status: ContractStatus;
}

const ContractSchema = new Schema<IContractDocument>(
  {
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    contractNumber: { type: String, required: true, unique: true },
    signedAt: { type: Date, default: Date.now },
    mileageOut: { type: Number, default: 0 },
    mileageIn: { type: Number, default: 0 },
    fuelLevelOut: {
      type: String,
      enum: ["full", "3/4", "1/2", "1/4", "empty"],
      default: "full",
    },
    fuelLevelIn: {
      type: String,
      enum: ["full", "3/4", "1/2", "1/4", "empty"],
      default: "full",
    },
    damageReportOut: { type: String },
    damageReportIn: { type: String },
    status: {
      type: String,
      enum: ["active", "completed", "disputed"],
      default: "active",
    },
  },
  { timestamps: true }
);

ContractSchema.index({ contractNumber: 1 });
ContractSchema.index({ clientId: 1 });
ContractSchema.index({ vehicleId: 1 });
ContractSchema.index({ status: 1 });

export default models.Contract || model<IContractDocument>("Contract", ContractSchema);
