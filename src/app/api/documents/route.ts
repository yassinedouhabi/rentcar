import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import { getGridFSBucket } from "@/lib/gridfs";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function withFileUrl<T extends { _id: unknown }>(doc: T) {
  return { ...doc, fileUrl: `/api/documents/${doc._id}/download` };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const filter: Record<string, unknown> = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  if (category && category !== "all") filter.category = category;

  const [data, total] = await Promise.all([
    DocumentModel.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ uploadedAt: -1 })
      .lean(),
    DocumentModel.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: data.map(withFileUrl),
    total,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const entityType = formData.get("entityType") as string;
  const entityId = formData.get("entityId") as string;
  const category = (formData.get("category") as string) || "other";

  if (!file)
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  if (!entityType || !entityId)
    return NextResponse.json({ success: false, error: "entityType and entityId are required" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ success: false, error: "File exceeds 5 MB limit" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ success: false, error: "File type not allowed" }, { status: 400 });

  const bucket = getGridFSBucket();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const gridfsId = await new Promise<import("mongodb").ObjectId>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: { mimeType: file.type, entityType, entityId },
    });
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
    uploadStream.on("finish", () => resolve(uploadStream.id as import("mongodb").ObjectId));
    uploadStream.on("error", reject);
  });

  const doc = await DocumentModel.create({
    entityType,
    entityId,
    fileName: file.name,
    gridfsId,
    fileSize: file.size,
    mimeType: file.type,
    category,
    uploadedAt: new Date(),
  });

  return NextResponse.json({ success: true, data: withFileUrl(doc.toObject()) }, { status: 201 });
}
