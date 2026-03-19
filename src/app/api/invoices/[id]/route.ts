import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import Client from "@/models/Client";

type Params = { params: Promise<{ id: string }> };

const POPULATE_OPTS = [
  { path: "clientId", select: "firstName lastName phone email cin" },
  { path: "contractId", select: "contractNumber signedAt mileageOut mileageIn reservationId" },
];

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const [invoice, payments] = await Promise.all([
    Invoice.findById(id).populate(POPULATE_OPTS).lean(),
    Payment.find({ invoiceId: id }).sort({ date: -1 }).lean(),
  ]);

  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({ success: true, data: { ...invoice, paidAmount, payments } });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();
    const invoice = await Invoice.findById(id);
    if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    if (invoice.status === "cancelled") {
      return NextResponse.json({ success: false, error: "Cannot modify a cancelled invoice" }, { status: 409 });
    }

    // Mark as sent
    if (body.status === "sent" && invoice.status === "draft") {
      invoice.status = "sent";
      await invoice.save();
    }
    // Mark as overdue
    else if (body.status === "overdue" && invoice.status === "sent") {
      invoice.status = "overdue";
      await invoice.save();
    }
    // Cancel
    else if (body.status === "cancelled" && ["draft", "sent", "overdue"].includes(invoice.status)) {
      invoice.status = "cancelled";
      await invoice.save();
    }
    // General update (dueDate, notes)
    else if (!body.status) {
      if (body.dueDate !== undefined) invoice.dueDate = body.dueDate ? new Date(body.dueDate) : undefined;
      if (body.notes !== undefined) invoice.notes = body.notes;
      await invoice.save();
    } else {
      return NextResponse.json(
        { success: false, error: `Invalid status transition: ${invoice.status} → ${body.status}` },
        { status: 400 }
      );
    }

    const updated = await Invoice.findById(id).populate(POPULATE_OPTS).lean();
    const payments = await Payment.find({ invoiceId: id }).sort({ date: -1 }).lean();
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({ success: true, data: { ...updated, paidAmount, payments } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const invoice = await Invoice.findById(id);
  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (invoice.status !== "draft") {
    return NextResponse.json({ success: false, error: "Only draft invoices can be deleted" }, { status: 409 });
  }

  // Check no payments exist
  const paymentCount = await Payment.countDocuments({ invoiceId: id });
  if (paymentCount > 0) {
    return NextResponse.json({ success: false, error: "Cannot delete invoice with payments" }, { status: 409 });
  }

  await invoice.deleteOne();
  return NextResponse.json({ success: true, data: null });
}

// Suppress unused import warning — Client model must be registered before population
void Client;
