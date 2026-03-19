import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import { clientSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const searchFilter: Record<string, unknown> = {};
  if (search) {
    searchFilter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { cin: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const filter: Record<string, unknown> = { ...searchFilter };
  if (type && type !== "all") filter.clientType = type;

  const [data, total, typeAgg] = await Promise.all([
    Client.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Client.countDocuments(filter),
    Client.aggregate([
      { $match: searchFilter },
      { $group: { _id: "$clientType", count: { $sum: 1 } } },
    ]),
  ]);

  const typeCounts: Record<string, number> = { all: 0, regular: 0, vip: 0, blacklisted: 0 };
  for (const t of typeAgg) {
    typeCounts[t._id] = t.count;
    typeCounts.all += t.count;
  }

  return NextResponse.json({ success: true, data, total, page, limit, typeCounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }
    const client = await Client.create(parsed.data);
    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
