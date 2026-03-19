import mongoose, { Schema, models, model } from "mongoose";
import type { InvoiceStatus } from "@/types";

export interface IInvoiceDocument {
  contractId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  lateFees: number;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt: Date;
  paymentMethod: string;
  notes: string;
}

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    lateFees: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    paymentMethod: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });

export default models.Invoice || model<IInvoiceDocument>("Invoice", InvoiceSchema);
