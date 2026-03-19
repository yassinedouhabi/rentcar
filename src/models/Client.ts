import mongoose, { Schema, models, model } from "mongoose";
import type { ClientType } from "@/types";

export interface IClientDocument {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  cin: string;
  passport: string;
  drivingLicense: string;
  licenseExpiry: Date;
  address: string;
  city: string;
  nationality: string;
  dateOfBirth: Date;
  emergencyContact: string;
  clientType: ClientType;
  totalRentals: number;
  totalSpent: number;
  notes: string;
}

const ClientSchema = new Schema<IClientDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    cin: { type: String, trim: true, uppercase: true },
    passport: { type: String, trim: true, uppercase: true },
    drivingLicense: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date },
    address: { type: String },
    city: { type: String, trim: true },
    nationality: { type: String, trim: true },
    dateOfBirth: { type: Date },
    emergencyContact: { type: String, trim: true },
    clientType: {
      type: String,
      enum: ["regular", "vip", "blacklisted"],
      default: "regular",
    },
    totalRentals: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

ClientSchema.index({ phone: 1 });
ClientSchema.index({ cin: 1 });
ClientSchema.index({ clientType: 1 });
ClientSchema.index({ lastName: 1, firstName: 1 });

export default models.Client || model<IClientDocument>("Client", ClientSchema);
