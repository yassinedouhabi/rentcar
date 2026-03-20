import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

function parseRange(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const now = new Date();
  const start = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const end = to
    ? new Date(to + "T23:59:59")
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { start, end } = parseRange(req);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoices = await Invoice.find({
    status: "paid",
    paidAt: { $gte: start, $lte: end },
  })
    .populate("clientId", "firstName lastName")
    .populate({ path: "contractId", populate: { path: "vehicleId", select: "brand model plate" } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .lean() as any[];

  // By month
  const monthMap = new Map<string, { label: string; revenue: number; count: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const inv of invoices) {
    const d = new Date(inv.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) monthMap.set(key, { label: key, revenue: 0, count: 0 });
    const entry = monthMap.get(key)!;
    entry.revenue += inv.totalAmount ?? 0;
    entry.count += 1;
  }
  const byPeriod = Array.from(monthMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  // By vehicle
  const vehicleMap = new Map<
    string,
    { vehicleId: string; brand: string; model: string; plate: string; revenue: number; count: number }
  >();
  for (const inv of invoices) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (inv.contractId as any)?.vehicleId;
    if (!v) continue;
    const id = String(v._id);
    if (!vehicleMap.has(id))
      vehicleMap.set(id, { vehicleId: id, brand: v.brand, model: v.model, plate: v.plate, revenue: 0, count: 0 });
    const entry = vehicleMap.get(id)!;
    entry.revenue += inv.totalAmount ?? 0;
    entry.count += 1;
  }
  const byVehicle = Array.from(vehicleMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // By client
  const clientMap = new Map<
    string,
    { clientId: string; firstName: string; lastName: string; revenue: number; count: number }
  >();
  for (const inv of invoices) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = inv.clientId as any;
    if (!c?._id) continue;
    const id = String(c._id);
    if (!clientMap.has(id))
      clientMap.set(id, { clientId: id, firstName: c.firstName, lastName: c.lastName, revenue: 0, count: 0 });
    const entry = clientMap.get(id)!;
    entry.revenue += inv.totalAmount ?? 0;
    entry.count += 1;
  }
  const byClient = Array.from(clientMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const total = invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const count = invoices.length;

  return NextResponse.json({
    success: true,
    data: {
      byPeriod,
      byVehicle,
      byClient,
      total,
      averagePerRental: count > 0 ? total / count : 0,
      count,
      from: start.toISOString(),
      to: end.toISOString(),
    },
  });
}
