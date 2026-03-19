import mongoose, { Schema, models, model } from "mongoose";
import type { PaymentMethod } from "@/types";

export interface IPaymentDocument {
  invoiceId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: Date;
  notes: string;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["cash", "card", "transfer", "cheque"],
      required: true,
    },
    reference: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ clientId: 1 });
PaymentSchema.index({ date: 1 });

export default models.Payment || model<IPaymentDocument>("Payment", PaymentSchema);
