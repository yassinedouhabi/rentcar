import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Reservation from "@/models/Reservation";
import Maintenance from "@/models/Maintenance";
import Invoice from "@/models/Invoice";
import Client from "@/models/Client";

export interface IAlert {
  id: string;
  type: "info" | "warning" | "danger";
  titleKey: string;
  messageParams: Record<string, string | number>;
  entity: "vehicle" | "reservation" | "maintenance" | "invoice" | "client";
  entityId: string;
  href: string;
  date: string;
}

const SEVERITY_ORDER: Record<string, number> = { danger: 0, warning: 1, info: 2 };

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const alerts: IAlert[] = [];

  // 1. Insurance expiring within 30 days
  const insuranceExpiring = await Vehicle.find({
    insuranceExpiry: { $gte: now, $lte: in30 },
  }).lean();

  for (const v of insuranceExpiring) {
    const days = Math.ceil(
      (new Date(v.insuranceExpiry as Date).getTime() - now.getTime()) / 86400000
    );
    alerts.push({
      id: `insurance-${v._id}`,
      type: "warning",
      titleKey: "insurance.title",
      messageParams: { vehicle: `${v.brand} ${v.model}`, plate: String(v.plate), days },
      entity: "vehicle",
      entityId: String(v._id),
      href: "/vehicles",
      date: new Date(v.insuranceExpiry as Date).toISOString(),
    });
  }

  // 2. Technical inspection due within 30 days
  const inspectionDue = await Vehicle.find({
    technicalInspection: { $gte: now, $lte: in30 },
  }).lean();

  for (const v of inspectionDue) {
    const days = Math.ceil(
      (new Date(v.technicalInspection as Date).getTime() - now.getTime()) / 86400000
    );
    alerts.push({
      id: `inspection-${v._id}`,
      type: "warning",
      titleKey: "inspection.title",
      messageParams: { vehicle: `${v.brand} ${v.model}`, plate: String(v.plate), days },
      entity: "vehicle",
      entityId: String(v._id),
      href: "/vehicles",
      date: new Date(v.technicalInspection as Date).toISOString(),
    });
  }

  // 3. Overdue returns: active reservations past end date
  const overdueReservations = await Reservation.find({
    status: "active",
    endDate: { $lt: now },
  })
    .populate("clientId", "firstName lastName")
    .populate("vehicleId", "brand model plate")
    .lean();

  for (const r of overdueReservations) {
    const days = Math.ceil((now.getTime() - new Date(r.endDate).getTime()) / 86400000);
    const vehicle = r.vehicleId as any;
    const client = r.clientId as any;
    alerts.push({
      id: `overdue-${r._id}`,
      type: "danger",
      titleKey: "overdueReturn.title",
      messageParams: {
        vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}` : "",
        client: client ? `${client.firstName} ${client.lastName}` : "",
        days,
      },
      entity: "reservation",
      entityId: String(r._id),
      href: "/reservations",
      date: new Date(r.endDate).toISOString(),
    });
  }

  // 4. Maintenance overdue
  const maintenanceOverdue = await Maintenance.find({
    nextDue: { $lt: now },
    status: { $ne: "completed" },
  })
    .populate("vehicleId", "brand model plate")
    .lean();

  for (const m of maintenanceOverdue) {
    const days = Math.ceil((now.getTime() - new Date(m.nextDue as Date).getTime()) / 86400000);
    const vehicle = m.vehicleId as any;
    alerts.push({
      id: `maintenance-${m._id}`,
      type: "danger",
      titleKey: "maintenanceOverdue.title",
      messageParams: {
        vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}` : "",
        plate: vehicle?.plate ?? "",
        days,
      },
      entity: "maintenance",
      entityId: String(m._id),
      href: "/maintenance",
      date: new Date(m.nextDue as Date).toISOString(),
    });
  }

  // 5. Unpaid invoices past due date
  const unpaidInvoices = await Invoice.find({
    status: "sent",
    dueDate: { $lt: now },
  }).lean();

  for (const inv of unpaidInvoices) {
    const days = Math.ceil((now.getTime() - new Date(inv.dueDate as Date).getTime()) / 86400000);
    alerts.push({
      id: `invoice-${inv._id}`,
      type: "danger",
      titleKey: "unpaidInvoice.title",
      messageParams: { number: String(inv.invoiceNumber), days },
      entity: "invoice",
      entityId: String(inv._id),
      href: "/invoicing",
      date: new Date(inv.dueDate as Date).toISOString(),
    });
  }

  // 6. Driving license expiring within 60 days
  const licenseExpiring = await Client.find({
    licenseExpiry: { $gte: now, $lte: in60 },
    clientType: { $ne: "blacklisted" },
  }).lean();

  for (const c of licenseExpiring) {
    const days = Math.ceil(
      (new Date(c.licenseExpiry as Date).getTime() - now.getTime()) / 86400000
    );
    alerts.push({
      id: `license-${c._id}`,
      type: "info",
      titleKey: "licenseExpiring.title",
      messageParams: {
        client: `${c.firstName} ${c.lastName}`,
        days,
      },
      entity: "client",
      entityId: String(c._id),
      href: "/clients",
      date: new Date(c.licenseExpiry as Date).toISOString(),
    });
  }

  alerts.sort((a, b) => SEVERITY_ORDER[a.type] - SEVERITY_ORDER[b.type]);

  return NextResponse.json({ success: true, data: alerts, total: alerts.length });
}
