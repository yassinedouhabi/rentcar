import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import Contract from "@/models/Contract";
import Reservation from "@/models/Reservation";
import Payment from "@/models/Payment";

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await Invoice.findOne(
    { invoiceNumber: { $regex: `^${prefix}` } },
    { invoiceNumber: 1 },
    { sort: { invoiceNumber: -1 } }
  ).lean();
  if (!last) return `${prefix}0001`;
  const seq = parseInt((last.invoiceNumber as string).replace(prefix, ""), 10);
  return `${prefix}${String(seq + 1).padStart(4, "0")}`;
}

const POPULATE_OPTS = [
  { path: "clientId", select: "firstName lastName phone email cin" },
  { path: "contractId", select: "contractNumber signedAt mileageOut mileageIn reservationId" },
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

  // Auto-flag overdue invoices before returning results
  const now = new Date();
  await Invoice.updateMany(
    { status: "sent", dueDate: { $lt: now } },
    { $set: { status: "overdue" } }
  );

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (search) {
    filter.$or = [{ invoiceNumber: { $regex: search, $options: "i" } }];
  }

  const [data, total, statusAgg] = await Promise.all([
    Invoice.find(filter)
      .populate(POPULATE_OPTS)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Invoice.countDocuments(filter),
    Invoice.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  // Post-populate search by client name / invoice number
  let filtered = data as unknown as Record<string, unknown>[];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter((inv) => {
      const client = inv.clientId as Record<string, string> | null;
      const contract = inv.contractId as Record<string, string> | null;
      return (
        (inv.invoiceNumber as string)?.toLowerCase().includes(s) ||
        client?.firstName?.toLowerCase().includes(s) ||
        client?.lastName?.toLowerCase().includes(s) ||
        contract?.contractNumber?.toLowerCase().includes(s)
      );
    });
  }

  // Compute paidAmount for each invoice via Payment aggregation
  const invoiceIds = filtered.map((inv) => (inv as Record<string, unknown>)._id);
  const paymentAgg = await Payment.aggregate([
    { $match: { invoiceId: { $in: invoiceIds } } },
    { $group: { _id: "$invoiceId", paidAmount: { $sum: "$amount" } } },
  ]);
  const paidMap = new Map(paymentAgg.map((p) => [String(p._id), p.paidAmount]));
  const withPaid = filtered.map((inv) => ({
    ...inv,
    paidAmount: paidMap.get(String((inv as Record<string, unknown>)._id)) ?? 0,
  }));

  const statusCounts: Record<string, number> = { all: 0, draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
  for (const s of statusAgg) {
    statusCounts[s._id] = s.count;
    statusCounts.all += s.count;
  }

  return NextResponse.json({ success: true, data: withPaid, total: filtered.length, page, limit, statusCounts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { contractId, taxRate = 0, dueDate, notes } = await req.json();

    if (!contractId) {
      return NextResponse.json({ success: false, error: "contractId is required" }, { status: 400 });
    }

    const contract = await Contract.findById(contractId).lean();
    if (!contract) {
      return NextResponse.json({ success: false, error: "Contract not found" }, { status: 404 });
    }
    if (contract.status !== "completed") {
      return NextResponse.json({ success: false, error: "Contract must be completed" }, { status: 409 });
    }

    // Check no existing invoice for this contract
    const existing = await Invoice.exists({ contractId });
    if (existing) {
      return NextResponse.json({ success: false, error: "Invoice already exists for this contract" }, { status: 409 });
    }

    // Get reservation for pricing
    const reservation = await Reservation.findById(contract.reservationId).lean();
    if (!reservation) {
      return NextResponse.json({ success: false, error: "Reservation not found" }, { status: 404 });
    }

    // Calculate late fees: compare contract completion date to reservation endDate
    const endDate = new Date(reservation.endDate);
    const completedAt = new Date(contract.updatedAt as Date);
    endDate.setHours(0, 0, 0, 0);
    completedAt.setHours(0, 0, 0, 0);
    const lateDays = Math.max(0, Math.floor((completedAt.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)));
    const lateFees = lateDays * (reservation.dailyRate ?? 0);

    const amount = reservation.totalPrice ?? 0;
    const tax = Math.round((amount + lateFees) * (taxRate / 100));
    const totalAmount = amount + lateFees + tax;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      contractId,
      clientId: contract.clientId,
      invoiceNumber,
      amount,
      lateFees,
      tax,
      totalAmount,
      status: "draft",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes || "",
    });

    const populated = await Invoice.findById(invoice._id).populate(POPULATE_OPTS).lean();
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
