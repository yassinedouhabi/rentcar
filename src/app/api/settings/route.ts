import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB base64 limit

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  // Singleton: return existing doc or create with defaults
  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = (await Settings.create({})).toObject();
  }

  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const body = await req.json();

  // Guard logo size
  if (body.agencyLogo && typeof body.agencyLogo === "string") {
    const byteLen = Buffer.byteLength(body.agencyLogo, "utf8");
    if (byteLen > LOGO_MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: "Logo too large (max 2 MB)" },
        { status: 400 }
      );
    }
  }

  // Only allow known fields
  const allowed = [
    "agencyName", "agencyAddress", "agencyPhone", "agencyEmail", "agencyLogo",
    "currency", "defaultLanguage", "taxRate", "lateReturnPenaltyRate",
    "invoiceNotes", "invoicePrefix", "contractPrefix",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({ success: true, data: settings });
}
