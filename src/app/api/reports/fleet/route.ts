import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Contract from "@/models/Contract";
import Maintenance from "@/models/Maintenance";
import Invoice from "@/models/Invoice";

function parseRange(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear(), 0, 1);
  const end = to
    ? new Date(to + "T23:59:59")
    : new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { start, end } = parseRange(req);
  const periodDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vehicles, contracts, maintenanceRecords, invoices] = await Promise.all([
    Vehicle.find().lean(),
    Contract.find({ status: "completed", signedAt: { $gte: start, $lte: end } })
      .populate("vehicleId", "brand model plate")
      .populate("reservationId", "totalDays")
      .lean(),
    Maintenance.find({ date: { $gte: start, $lte: end } }).lean(),
    Invoice.find({ status: "paid", paidAt: { $gte: start, $lte: end } })
      .populate({ path: "contractId", select: "vehicleId" })
      .lean(),
  ]) as [any[], any[], any[], any[]]; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Revenue per vehicle from paid invoices
  const vehicleRevenueMap = new Map<string, number>();
  for (const inv of invoices) {
    const vid = String((inv.contractId as any)?.vehicleId);
    if (!vid || vid === "null" || vid === "undefined") continue;
    vehicleRevenueMap.set(vid, (vehicleRevenueMap.get(vid) ?? 0) + (inv.totalAmount ?? 0));
  }

  // Maintenance cost per vehicle
  const maintenanceCostMap = new Map<string, number>();
  for (const m of maintenanceRecords) {
    const vid = String(m.vehicleId);
    maintenanceCostMap.set(vid, (maintenanceCostMap.get(vid) ?? 0) + (m.cost ?? 0));
  }

  // Contract stats per vehicle
  const statsMap = new Map<string, { rentalsCount: number; totalDays: number; kmDriven: number }>();
  for (const c of contracts) {
    const v = (c.vehicleId as any);
    if (!v) continue;
    const id = String(v._id);
    if (!statsMap.has(id)) statsMap.set(id, { rentalsCount: 0, totalDays: 0, kmDriven: 0 });
    const s = statsMap.get(id)!;
    s.rentalsCount += 1;
    s.totalDays += (c.reservationId as any)?.totalDays ?? 0;
    if (c.mileageIn != null && c.mileageOut != null && c.mileageIn > c.mileageOut) {
      s.kmDriven += c.mileageIn - c.mileageOut;
    }
  }

  const fleet = (vehicles as any[]).map((v) => {
    const id = String(v._id);
    const stats = statsMap.get(id) ?? { rentalsCount: 0, totalDays: 0, kmDriven: 0 };
    const revenue = vehicleRevenueMap.get(id) ?? 0;
    const maintenanceCost = maintenanceCostMap.get(id) ?? 0;
    const utilizationRate = Math.min(100, Math.round((stats.totalDays / periodDays) * 1000) / 10);
    return {
      vehicleId: id,
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      status: v.status,
      rentalsCount: stats.rentalsCount,
      totalDays: stats.totalDays,
      kmDriven: stats.kmDriven,
      revenue,
      maintenanceCost,
      utilizationRate,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = fleet.reduce((s, v) => s + v.revenue, 0);
  const totalMaintenanceCost = fleet.reduce((s, v) => s + v.maintenanceCost, 0);
  const avgUtilization = fleet.length > 0
    ? Math.round((fleet.reduce((s, v) => s + v.utilizationRate, 0) / fleet.length) * 10) / 10
    : 0;

  return NextResponse.json({
    success: true,
    data: {
      fleet,
      totalRevenue,
      totalMaintenanceCost,
      avgUtilization,
      periodDays,
      from: start.toISOString(),
      to: end.toISOString(),
    },
  });
}
