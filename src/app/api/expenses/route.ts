import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";
import { expenseSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const vehicleId = searchParams.get("vehicleId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const filter: Record<string, unknown> = {};
  if (category && category !== "all") filter.category = category;
  if (vehicleId) {
    if (vehicleId === "general") filter.vehicleId = null;
    else if (vehicleId !== "all") filter.vehicleId = vehicleId;
  }
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dateFilter.$lte = to;
    }
    filter.date = dateFilter;
  }

  const [data, total, totalAgg] = await Promise.all([
    Expense.find(filter)
      .populate("vehicleId", "brand model plate")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: -1 })
      .lean(),
    Expense.countDocuments(filter),
    Expense.aggregate([{ $match: filter }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
  ]);

  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    totalAmount: totalAgg[0]?.sum ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = { ...parsed.data, vehicleId: parsed.data.vehicleId || null };
    const expense = await Expense.create(data);
    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
