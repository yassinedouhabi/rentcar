import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Invoice from "@/models/Invoice";
import Client from "@/models/Client";

const POPULATE_OPTS = [
  { path: "invoiceId", select: "invoiceNumber totalAmount status" },
  { path: "clientId", select: "firstName lastName phone" },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");
  const clientId = searchParams.get("clientId");
  const method = searchParams.get("method");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const filter: Record<string, unknown> = {};
  if (invoiceId) filter.invoiceId = invoiceId;
  if (clientId) filter.clientId = clientId;
  if (method) filter.method = method;
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      dateFilter.$lte = d;
    }
    filter.date = dateFilter;
  }

  const [data, total] = await Promise.all([
    Payment.find(filter)
      .populate(POPULATE_OPTS)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: -1, createdAt: -1 })
      .lean(),
    Payment.countDocuments(filter),
  ]);

  // Post-populate search
  let filtered = data as unknown as Record<string, unknown>[];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((p) => {
      const inv = p.invoiceId as Record<string, string> | null;
      const cl = p.clientId as Record<string, string> | null;
      return (
        inv?.invoiceNumber?.toLowerCase().includes(s) ||
        cl?.firstName?.toLowerCase().includes(s) ||
        cl?.lastName?.toLowerCase().includes(s) ||
        (p.reference as string)?.toLowerCase().includes(s)
      );
    });
  }

  return NextResponse.json({ success: true, data: filtered, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { invoiceId, amount, method, reference, date, notes } = await req.json();

    if (!invoiceId || !amount || !method) {
      return NextResponse.json({ success: false, error: "invoiceId, amount, and method are required" }, { status: 400 });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }
    if (["paid", "cancelled"].includes(invoice.status)) {
      return NextResponse.json({ success: false, error: `Invoice is already ${invoice.status}` }, { status: 409 });
    }

    const payment = await Payment.create({
      invoiceId,
      clientId: invoice.clientId,
      amount,
      method,
      reference: reference || "",
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
    });

    // Recompute total paid
    const allPayments = await Payment.find({ invoiceId }).lean();
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // Mark fully paid
    if (totalPaid >= invoice.totalAmount) {
      invoice.status = "paid";
      invoice.paidAt = new Date();
      await invoice.save();

      // Update client stats — only on first full payment
      await Client.findByIdAndUpdate(invoice.clientId, {
        $inc: { totalSpent: invoice.totalAmount, totalRentals: 1 },
      });
    }

    const populated = await Payment.findById(payment._id).populate(POPULATE_OPTS).lean();
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
