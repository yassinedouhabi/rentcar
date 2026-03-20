import mongoose, { Schema, models, model } from "mongoose";

export interface ISettingsDocument {
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  agencyEmail: string;
  agencyLogo: string;
  currency: string;
  defaultLanguage: string;
  taxRate: number;
  lateReturnPenaltyRate: number;
  invoiceNotes: string;
  invoicePrefix: string;
  contractPrefix: string;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    agencyName:              { type: String, default: "RentCAR" },
    agencyAddress:           { type: String, default: "" },
    agencyPhone:             { type: String, default: "" },
    agencyEmail:             { type: String, default: "" },
    agencyLogo:              { type: String, default: "" },
    currency:                { type: String, default: "MAD" },
    defaultLanguage:         { type: String, default: "fr" },
    taxRate:                 { type: Number, default: 0, min: 0, max: 100 },
    lateReturnPenaltyRate:   { type: Number, default: 0, min: 0 },
    invoiceNotes:            { type: String, default: "" },
    invoicePrefix:           { type: String, default: "INV" },
    contractPrefix:          { type: String, default: "RC" },
  },
  { timestamps: true }
);

export default models.Settings || model<ISettingsDocument>("Settings", SettingsSchema);
