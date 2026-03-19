import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Reservation from "@/models/Reservation";
import Vehicle from "@/models/Vehicle";
import { reservationSchema } from "@/lib/validations";

function calculateDays(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

async function hasOverlap(vehicleId: string, startDate: Date, endDate: Date, excludeId?: string) {
  const filter: Record<string, unknown> = {
    vehicleId,
    status: { $nin: ["cancelled", "completed"] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  const count = await Reservation.countDocuments(filter);
  return count > 0;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const startFrom = searchParams.get("startFrom");
  const startTo = searchParams.get("startTo");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (startFrom || startTo) {
    const dateFilter: Record<string, Date> = {};
    if (startFrom) dateFilter.$gte = new Date(startFrom);
    if (startTo) dateFilter.$lte = new Date(startTo);
    filter.startDate = dateFilter;
  }

  const [data, total, statusAgg] = await Promise.all([
    Reservation.find(filter)
      .populate("clientId", "firstName lastName phone")
      .populate("vehicleId", "brand model plate")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Reservation.countDocuments(filter),
    Reservation.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  // Apply search filter post-populate (name-based search)
  let filtered = data as unknown as Record<string, unknown>[];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((r: Record<string, unknown>) => {
      const c = r.clientId as Record<string, string> | null;
      const v = r.vehicleId as Record<string, string> | null;
      return (
        c?.firstName?.toLowerCase().includes(s) ||
        c?.lastName?.toLowerCase().includes(s) ||
        v?.brand?.toLowerCase().includes(s) ||
        v?.model?.toLowerCase().includes(s) ||
        v?.plate?.toLowerCase().includes(s)
      );
    });
  }

  const statusCounts: Record<string, number> = {
    all: 0, pending: 0, confirmed: 0, active: 0, completed: 0, cancelled: 0,
  };
  for (const s of statusAgg) {
    statusCounts[s._id] = s.count;
    statusCounts.all += s.count;
  }

  return NextResponse.json({ success: true, data: filtered, total, page, limit, statusCounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();

    // Auto-calculate days and total
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid dates" }, { status: 400 });
    }
    const totalDays = calculateDays(startDate, endDate);
    const totalPrice = totalDays * (body.dailyRate ?? 0);
    body.totalDays = totalDays;
    body.totalPrice = totalPrice;

    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    // Availability check
    const overlap = await hasOverlap(parsed.data.vehicleId, startDate, endDate);
    if (overlap) {
      return NextResponse.json({ success: false, error: "Vehicle not available for selected dates" }, { status: 409 });
    }

    const reservation = await Reservation.create(parsed.data);

    // If creating directly as confirmed, set vehicle to reserved
    if (parsed.data.status === "confirmed") {
      await Vehicle.findByIdAndUpdate(parsed.data.vehicleId, { status: "reserved" });
    }

    return NextResponse.json({ success: true, data: reservation }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
