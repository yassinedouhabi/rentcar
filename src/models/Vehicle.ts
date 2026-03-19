import mongoose, { Schema, models, model } from "mongoose";
import type { VehicleStatus, FuelType } from "@/types";

export interface IVehicleDocument {
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  fuel: FuelType;
  mileage: number;
  dailyRate: number;
  status: VehicleStatus;
  vin: string;
  insuranceExpiry: Date;
  technicalInspection: Date;
  notes: string;
}

const VehicleSchema = new Schema<IVehicleDocument>(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    plate: { type: String, required: true, unique: true, trim: true, uppercase: true },
    year: { type: Number },
    color: { type: String, trim: true },
    fuel: {
      type: String,
      enum: ["Diesel", "Essence", "Hybride", "Electrique"],
      default: "Diesel",
    },
    mileage: { type: Number, default: 0 },
    dailyRate: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["available", "rented", "reserved", "maintenance"],
      default: "available",
    },
    vin: { type: String, trim: true },
    insuranceExpiry: { type: Date },
    technicalInspection: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

VehicleSchema.index({ status: 1 });
VehicleSchema.index({ brand: 1, model: 1 });

export default models.Vehicle || model<IVehicleDocument>("Vehicle", VehicleSchema);
