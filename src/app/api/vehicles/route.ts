import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import { vehicleSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  // Base search filter (applied before status count aggregation)
  const searchFilter: Record<string, unknown> = {};
  if (search) {
    searchFilter.$or = [
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
      { plate: { $regex: search, $options: "i" } },
    ];
  }

  // Full filter (search + status)
  const filter: Record<string, unknown> = { ...searchFilter };
  if (status && status !== "all") filter.status = status;

  const [data, total, statusAgg] = await Promise.all([
    Vehicle.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Vehicle.countDocuments(filter),
    Vehicle.aggregate([
      { $match: searchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts: Record<string, number> = { all: 0, available: 0, rented: 0, reserved: 0, maintenance: 0 };
  for (const s of statusAgg) {
    statusCounts[s._id] = s.count;
    statusCounts.all += s.count;
  }

  return NextResponse.json({ success: true, data, total, page, limit, statusCounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }
    const vehicle = await Vehicle.create(parsed.data);
    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    const status = msg.includes("duplicate") ? 409 : 400;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
