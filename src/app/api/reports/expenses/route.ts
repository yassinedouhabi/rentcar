import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";
import Invoice from "@/models/Invoice";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear(), 0, 1);
  const end = to ? new Date(to + "T23:59:59") : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [expenses, invoices] = await Promise.all([
    Expense.find({ date: { $gte: start, $lte: end } })
      .populate("vehicleId", "brand model plate")
      .lean() as Promise<any[]>,
    Invoice.find({ status: "paid", paidAt: { $gte: start, $lte: end } }).lean() as Promise<any[]>,
  ]);

  // By category
  const categoryMap = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const cat = e.category ?? "other";
    if (!categoryMap.has(cat)) categoryMap.set(cat, { total: 0, count: 0 });
    const entry = categoryMap.get(cat)!;
    entry.total += e.amount ?? 0;
    entry.count += 1;
  }
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);

  // By vehicle
  const vehicleMap = new Map<
    string,
    { vehicleId: string; brand: string; model: string; plate: string; total: number }
  >();
  for (const e of expenses) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = e.vehicleId as any;
    if (!v?._id) continue;
    const id = String(v._id);
    if (!vehicleMap.has(id))
      vehicleMap.set(id, { vehicleId: id, brand: v.brand, model: v.model, plate: v.plate, total: 0 });
    vehicleMap.get(id)!.total += e.amount ?? 0;
  }
  const byVehicle = Array.from(vehicleMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // By month
  const monthMap = new Map<string, number>();
  for (const e of expenses) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + (e.amount ?? 0));
  }
  const byMonth = Array.from(monthMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalRevenue = invoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 1000) / 10 : 0;

  return NextResponse.json({
    success: true,
    data: {
      byCategory,
      byVehicle,
      byMonth,
      totalExpenses,
      totalRevenue,
      profit,
      profitMargin,
      count: expenses.length,
      from: start.toISOString(),
      to: end.toISOString(),
    },
  });
}
