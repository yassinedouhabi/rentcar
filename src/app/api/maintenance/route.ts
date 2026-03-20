import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import Vehicle from "@/models/Vehicle";
import Contract from "@/models/Contract";
import { maintenanceSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const filter: Record<string, unknown> = {};
  if (vehicleId && vehicleId !== "all") filter.vehicleId = vehicleId;
  if (status && status !== "all") filter.status = status;
  if (type && type !== "all") filter.type = type;

  const [data, total, costAgg] = await Promise.all([
    Maintenance.find(filter)
      .populate("vehicleId", "brand model plate status")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: -1 })
      .lean(),
    Maintenance.countDocuments(filter),
    Maintenance.aggregate([
      { $match: filter },
      { $group: { _id: null, sum: { $sum: "$cost" } } },
    ]),
  ]);

  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    totalCost: costAgg[0]?.sum ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = maintenanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.status === "in_progress") {
      const vehicle = await Vehicle.findById(data.vehicleId);
      if (!vehicle) {
        return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
      }
      if (vehicle.status === "rented") {
        return NextResponse.json({ success: false, error: "VEHICLE_RENTED" }, { status: 422 });
      }
      await Vehicle.findByIdAndUpdate(data.vehicleId, { status: "maintenance" });
    }

    const maintenance = await Maintenance.create(data);
    const populated = await Maintenance.findById(maintenance._id)
      .populate("vehicleId", "brand model plate status")
      .lean();

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
