import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import { getGridFSBucket } from "@/lib/gridfs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const doc = await DocumentModel.findById(id).lean();
  if (!doc) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: { ...doc, fileUrl: `/api/documents/${doc._id}/download` },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const doc = await DocumentModel.findById(id).lean();
  if (!doc) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  try {
    const bucket = getGridFSBucket();
    await bucket.delete(new ObjectId(doc.gridfsId));
  } catch {
    // GridFS file may already be gone — still remove the metadata record
  }

  await DocumentModel.deleteOne({ _id: id });
  return NextResponse.json({ success: true });
}
