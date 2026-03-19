import mongoose, { Schema, models, model } from "mongoose";
import type { ExpenseCategory } from "@/types";

export interface IExpenseDocument {
  vehicleId: mongoose.Types.ObjectId | null;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  receipt: string;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", default: null },
    category: {
      type: String,
      enum: ["fuel", "repair", "insurance", "tax", "parking", "other"],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    receipt: { type: String },
  },
  { timestamps: true }
);

ExpenseSchema.index({ vehicleId: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ date: 1 });

export default models.Expense || model<IExpenseDocument>("Expense", ExpenseSchema);
