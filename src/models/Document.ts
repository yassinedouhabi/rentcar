import mongoose, { Schema, Document } from "mongoose";

export type DocumentCategory = "id_copy" | "contract" | "receipt" | "photo" | "other";
export type DocumentEntityType = "client" | "vehicle" | "contract";

export interface IDocument extends Document {
  entityType: DocumentEntityType;
  entityId: mongoose.Types.ObjectId;
  fileName: string;
  gridfsId: mongoose.Types.ObjectId;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  uploadedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  entityType: { type: String, enum: ["client", "vehicle", "contract"], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  fileName: { type: String, required: true },
  gridfsId: { type: Schema.Types.ObjectId, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  category: {
    type: String,
    enum: ["id_copy", "contract", "receipt", "photo", "other"],
    default: "other",
  },
  uploadedAt: { type: Date, default: Date.now },
});

DocumentSchema.index({ entityType: 1, entityId: 1 });
DocumentSchema.index({ category: 1 });

export default mongoose.models.Document ||
  mongoose.model<IDocument>("Document", DocumentSchema);
