import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Reservation from "@/models/Reservation";
import Invoice from "@/models/Invoice";
import AuditLog from "@/models/AuditLog";
import Maintenance from "@/models/Maintenance";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    fleetByStatus,
    activeRentals,
    pendingInvoices,
    totalRevenue,
    currentMonthRevenue,
    lastMonthRevenue,
    revenueByMonth,
    recentActivity,
    insuranceAlerts,
    overdueReturns,
    maintenanceAlerts,
    recentVehicles,
  ] = await Promise.all([
    Vehicle.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Reservation.countDocuments({ status: "active" }),
    Invoice.aggregate([
      { $match: { status: { $in: ["sent", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "paid", paidAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "paid", paidAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Invoice.aggregate([
      { $match: { status: "paid", paidAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    AuditLog.find().sort({ timestamp: -1 }).limit(10).lean(),
    Vehicle.find({ insuranceExpiry: { $lte: thirtyDaysFromNow, $gte: now } })
      .select("brand model plate insuranceExpiry")
      .lean(),
    Reservation.find({ status: "active", endDate: { $lt: now } })
      .populate("vehicleId", "brand model plate")
      .populate("clientId", "firstName lastName")
      .lean(),
    Maintenance.find({
      status: { $in: ["scheduled", "in_progress"] },
      nextDue: { $lte: now },
    })
      .populate("vehicleId", "brand model plate")
      .lean(),
    Vehicle.find().sort({ createdAt: -1 }).limit(5).select("brand model plate status dailyRate").lean(),
  ]);

  // Fleet status map
  const fleetStatusMap: Record<string, number> = {};
  for (const item of fleetByStatus) {
    fleetStatusMap[item._id] = item.count;
  }
  const totalVehicles = Object.values(fleetStatusMap).reduce((a, b) => a + b, 0);

  // Revenue change %
  const currentRevenue = currentMonthRevenue[0]?.total ?? 0;
  const prevRevenue = lastMonthRevenue[0]?.total ?? 0;
  const revenueChange =
    prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;

  // Last 6 months labels
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const found = revenueByMonth.find(
      (r: any) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1
    );
    return { month: monthNames[d.getMonth()], revenue: found?.revenue ?? 0 };
  });

  // Alerts
  const alerts: Array<{
    type: "warning" | "danger" | "info";
    key: string;
    message: string;
    days?: number;
  }> = [];

  for (const v of insuranceAlerts) {
    const days = Math.ceil(
      (new Date((v as any).insuranceExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    alerts.push({
      type: days <= 7 ? "danger" : "warning",
      key: "insuranceExpiring",
      message: `${(v as any).brand} ${(v as any).model} (${(v as any).plate})`,
      days,
    });
  }

  for (const r of overdueReturns) {
    const vehicle = (r as any).vehicleId;
    const daysOverdue = Math.ceil(
      (now.getTime() - new Date((r as any).endDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    alerts.push({
      type: "danger",
      key: "overdueReturn",
      message: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "—",
      days: daysOverdue,
    });
  }

  for (const m of maintenanceAlerts) {
    const vehicle = (m as any).vehicleId;
    alerts.push({
      type: "warning",
      key: "maintenanceDue",
      message: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "—",
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      totalRevenue: totalRevenue[0]?.total ?? 0,
      currentMonthRevenue: currentRevenue,
      revenueChange,
      activeRentals,
      availableVehicles: fleetStatusMap["available"] ?? 0,
      totalVehicles,
      pendingPaymentsAmount: pendingInvoices[0]?.total ?? 0,
      pendingPaymentsCount: pendingInvoices[0]?.count ?? 0,
      fleetByStatus: {
        available: fleetStatusMap["available"] ?? 0,
        rented: fleetStatusMap["rented"] ?? 0,
        reserved: fleetStatusMap["reserved"] ?? 0,
        maintenance: fleetStatusMap["maintenance"] ?? 0,
      },
      revenueByMonth: last6Months,
      recentActivity: recentActivity.map((log: any) => ({
        id: log._id.toString(),
        action: log.action as string,
        entity: log.entity as string,
        details: log.details,
        timestamp: log.timestamp,
      })),
      alerts,
      recentVehicles: recentVehicles.map((v: any) => ({
        id: v._id.toString(),
        brand: v.brand,
        model: v.model,
        plate: v.plate,
        status: v.status,
        dailyRate: v.dailyRate,
      })),
    },
  });
}
