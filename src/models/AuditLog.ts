import mongoose, { Schema, models, model } from "mongoose";

export interface IAuditLogDocument {
  action: "create" | "update" | "delete";
  entity: string;
  entityId: mongoose.Types.ObjectId;
  details: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
    },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default models.AuditLog || model<IAuditLogDocument>("AuditLog", AuditLogSchema);
