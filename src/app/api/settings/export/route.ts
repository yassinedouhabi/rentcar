import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Client from "@/models/Client";
import Reservation from "@/models/Reservation";
import Contract from "@/models/Contract";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import Expense from "@/models/Expense";
import Maintenance from "@/models/Maintenance";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const [vehicles, clients, reservations, contracts, invoices, payments, expenses, maintenance] =
    await Promise.all([
      Vehicle.find().lean(),
      Client.find().lean(),
      Reservation.find().lean(),
      Contract.find().lean(),
      Invoice.find().lean(),
      Payment.find().lean(),
      Expense.find().lean(),
      Maintenance.find().lean(),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    vehicles,
    clients,
    reservations,
    contracts,
    invoices,
    payments,
    expenses,
    maintenance,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="rentcar-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
