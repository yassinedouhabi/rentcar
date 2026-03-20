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
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  await dbConnect();
  const { id } = await params;

  const doc = await DocumentModel.findById(id).lean();
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const bucket = getGridFSBucket();

  const stream = new ReadableStream({
    start(controller) {
      const download = bucket.openDownloadStream(new ObjectId(doc.gridfsId));
      download.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      download.on("end", () => controller.close());
      download.on("error", (err) => controller.error(err));
    },
  });

  const inline = doc.mimeType.startsWith("image/") || doc.mimeType === "application/pdf";
  const disposition = inline
    ? `inline; filename="${encodeURIComponent(doc.fileName)}"`
    : `attachment; filename="${encodeURIComponent(doc.fileName)}"`;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.fileSize),
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
