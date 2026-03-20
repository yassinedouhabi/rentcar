import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const now = new Date();
  const start = from ? new Date(from) : new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
  const end = to ? new Date(to + "T23:59:59") : now;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allClients, newClients] = await Promise.all([
    Client.find().lean() as Promise<any[]>,
    Client.find({ createdAt: { $gte: start, $lte: end } }).lean() as Promise<any[]>,
  ]);

  // Top clients by total spent
  const topClients = [...allClients]
    .sort((a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0))
    .slice(0, 10)
    .map((c) => ({
      clientId: String(c._id),
      firstName: c.firstName,
      lastName: c.lastName,
      clientType: c.clientType,
      totalRentals: c.totalRentals ?? 0,
      totalSpent: c.totalSpent ?? 0,
      city: c.city ?? null,
    }));

  // By client type
  const typeMap = new Map<string, number>();
  for (const c of allClients) {
    const t = c.clientType ?? "regular";
    typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
  }
  const byType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

  // New clients per month in range
  const monthMap = new Map<string, number>();
  for (const c of newClients) {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const newPerMonth = Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const newThisMonth = monthMap.get(thisMonthKey) ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      topClients,
      byType,
      newPerMonth,
      totalClients: allClients.length,
      newThisMonth,
      newInRange: newClients.length,
      from: start.toISOString(),
      to: end.toISOString(),
    },
  });
}
