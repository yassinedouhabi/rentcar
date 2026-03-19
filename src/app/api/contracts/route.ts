import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Contract from "@/models/Contract";
import Reservation from "@/models/Reservation";
import Vehicle from "@/models/Vehicle";
import Invoice from "@/models/Invoice";

async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RC-${year}-`;
  const last = await Contract.findOne(
    { contractNumber: { $regex: `^${prefix}` } },
    { contractNumber: 1 },
    { sort: { contractNumber: -1 } }
  ).lean();
  if (!last) return `${prefix}0001`;
  const seq = parseInt((last.contractNumber as string).replace(prefix, ""), 10);
  return `${prefix}${String(seq + 1).padStart(4, "0")}`;
}

const POPULATE_OPTS = [
  { path: "clientId", select: "firstName lastName phone email cin" },
  { path: "vehicleId", select: "brand model plate dailyRate mileage fuel color" },
  { path: "reservationId", select: "startDate endDate totalPrice totalDays dailyRate deposit status" },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const noInvoice = searchParams.get("noInvoice") === "true";

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;

  // Exclude contracts that already have an invoice
  if (noInvoice) {
    const invoicedIds = await Invoice.distinct("contractId");
    filter._id = { $nin: invoicedIds };
  }

  if (search) {
    filter.$or = [
      { contractNumber: { $regex: search, $options: "i" } },
    ];
  }

  const [data, total, statusAgg] = await Promise.all([
    Contract.find(filter)
      .populate(POPULATE_OPTS)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Contract.countDocuments(filter),
    Contract.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  // Post-populate search by client name
  let filtered = data as unknown as Record<string, unknown>[];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((c: Record<string, unknown>) => {
      const client = c.clientId as Record<string, string> | null;
      const vehicle = c.vehicleId as Record<string, string> | null;
      return (
        (c.contractNumber as string)?.toLowerCase().includes(s) ||
        client?.firstName?.toLowerCase().includes(s) ||
        client?.lastName?.toLowerCase().includes(s) ||
        vehicle?.brand?.toLowerCase().includes(s) ||
        vehicle?.model?.toLowerCase().includes(s) ||
        vehicle?.plate?.toLowerCase().includes(s)
      );
    });
  }

  const statusCounts: Record<string, number> = { all: 0, active: 0, completed: 0, disputed: 0 };
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
    const { reservationId, signedAt, mileageOut, fuelLevelOut, damageReportOut } = await req.json();

    if (!reservationId) {
      return NextResponse.json({ success: false, error: "reservationId is required" }, { status: 400 });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }
    if (reservation.status !== "confirmed") {
      return NextResponse.json({ success: false, error: "Reservation must be confirmed" }, { status: 409 });
    }

    // Check no contract already exists for this reservation
    const existing = await Contract.exists({ reservationId });
    if (existing) {
      return NextResponse.json({ success: false, error: "Contract already exists for this reservation" }, { status: 409 });
    }

    const contractNumber = await generateContractNumber();

    const contract = await Contract.create({
      reservationId,
      clientId: reservation.clientId,
      vehicleId: reservation.vehicleId,
      contractNumber,
      signedAt: signedAt ? new Date(signedAt) : new Date(),
      mileageOut: mileageOut ?? 0,
      fuelLevelOut: fuelLevelOut ?? "full",
      damageReportOut: damageReportOut ?? "",
      status: "active",
    });

    // Transition reservation → active, vehicle → rented
    await Promise.all([
      Reservation.findByIdAndUpdate(reservationId, { status: "active" }),
      Vehicle.findByIdAndUpdate(reservation.vehicleId, { status: "rented" }),
    ]);

    const populated = await Contract.findById(contract._id).populate(POPULATE_OPTS).lean();
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
