import mongoose, { Schema, models, model } from "mongoose";
import type { ReservationStatus } from "@/types";

export interface IReservationDocument {
  clientId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  dailyRate: number;
  totalDays: number;
  totalPrice: number;
  deposit: number;
  notes: string;
}

const ReservationSchema = new Schema<IReservationDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
    },
    dailyRate: { type: Number, required: true },
    totalDays: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

ReservationSchema.index({ clientId: 1 });
ReservationSchema.index({ vehicleId: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ startDate: 1, endDate: 1 });

export default models.Reservation || model<IReservationDocument>("Reservation", ReservationSchema);
