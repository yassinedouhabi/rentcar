import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Reservation from "@/models/Reservation";
import Contract from "@/models/Contract";
import Maintenance from "@/models/Maintenance";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseRange(searchParams: URLSearchParams): { firstDay: Date; lastDay: Date } {
  // Prefer explicit from/to params
  const fromParam = searchParams.get("from");
  const toParam   = searchParams.get("to");

  if (fromParam && toParam) {
    const [fy, fm, fd] = fromParam.split("-").map(Number);
    const [ty, tm, td] = toParam.split("-").map(Number);
    const firstDay = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
    const lastDay  = new Date(ty, tm - 1, td, 23, 59, 59, 999);
    return { firstDay, lastDay };
  }

  // Fall back to ?month=YYYY-MM
  const monthParam = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = monthParam.split("-");
  const year  = parseInt(yearStr);
  const month = parseInt(monthStr);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0, 23, 59, 59, 999);
  return { firstDay, lastDay };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const { firstDay, lastDay } = parseRange(searchParams);

  const today = new Date();

  const [vehicles, reservations, contracts, maintenanceRecords] = await Promise.all([
    Vehicle.find({}).sort({ brand: 1, model: 1 }).lean(),

    Reservation.find({
      startDate: { $lte: lastDay },
      endDate:   { $gte: firstDay },
      status:    { $in: ["pending", "confirmed"] },
    })
      .populate("clientId", "firstName lastName")
      .lean(),

    Contract.find({ status: { $in: ["active", "completed", "disputed"] } })
      .populate("clientId",      "firstName lastName")
      .populate("reservationId", "startDate endDate")
      .lean(),

    Maintenance.find({
      status: { $ne: "completed" },
      $or: [
        { date: { $gte: firstDay, $lte: lastDay } },
        { status: "in_progress", date: { $lte: lastDay } },
      ],
    }).lean(),
  ]);

  // Filter contracts whose reservation overlaps the range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredContracts = (contracts as any[]).filter((c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = c.reservationId as any;
    if (!res?.startDate || !res?.endDate) return false;
    return new Date(res.startDate) <= lastDay && new Date(res.endDate) >= firstDay;
  });

  // Build per-vehicle bookings map
  const bookingsMap: Record<string, object[]> = {};
  for (const v of vehicles) {
    bookingsMap[v._id.toString()] = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of reservations as any[]) {
    const vid = r.vehicleId?.toString();
    if (!bookingsMap[vid]) continue;
    const client = r.clientId;
    bookingsMap[vid].push({
      id:         r._id.toString(),
      startDate:  toDateStr(new Date(r.startDate)),
      endDate:    toDateStr(new Date(r.endDate)),
      status:     r.status,
      clientName: client ? `${client.firstName} ${client.lastName}` : "",
      type:       "reservation",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of filteredContracts as any[]) {
    const vid = c.vehicleId?.toString();
    if (!bookingsMap[vid]) continue;
    const client = c.clientId;
    const res    = c.reservationId;
    bookingsMap[vid].push({
      id:         c._id.toString(),
      startDate:  toDateStr(new Date(res.startDate)),
      endDate:    toDateStr(new Date(res.endDate)),
      status:     c.status,
      clientName: client ? `${client.firstName} ${client.lastName}` : "",
      type:       "contract",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const m of maintenanceRecords as any[]) {
    const vid = m.vehicleId?.toString();
    if (!bookingsMap[vid]) continue;
    const endDate =
      m.status === "in_progress"
        ? today < lastDay ? today : lastDay
        : new Date(m.date);
    bookingsMap[vid].push({
      id:         m._id.toString(),
      startDate:  toDateStr(new Date(m.date)),
      endDate:    toDateStr(endDate),
      status:     m.status,
      clientName: "",
      type:       "maintenance",
    });
  }

  const result = vehicles.map((v) => ({
    vehicleId:   v._id.toString(),
    vehicleName: `${v.brand} ${v.model}`,
    plate:       v.plate,
    status:      v.status,
    bookings:    bookingsMap[v._id.toString()] ?? [],
  }));

  return NextResponse.json({
    success: true,
    data: {
      from:     toDateStr(firstDay),
      to:       toDateStr(lastDay),
      vehicles: result,
    },
  });
}
