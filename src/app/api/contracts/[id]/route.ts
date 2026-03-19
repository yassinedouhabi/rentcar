import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Contract from "@/models/Contract";
import Reservation from "@/models/Reservation";
import Vehicle from "@/models/Vehicle";

type Params = { params: Promise<{ id: string }> };

const POPULATE_OPTS = [
  { path: "clientId", select: "firstName lastName phone email cin" },
  { path: "vehicleId", select: "brand model plate dailyRate mileage fuel color" },
  { path: "reservationId", select: "startDate endDate totalPrice totalDays dailyRate deposit status" },
];

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const contract = await Contract.findById(id).populate(POPULATE_OPTS).lean();
  if (!contract) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: contract });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();
    const contract = await Contract.findById(id);
    if (!contract) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // Return workflow: completing a contract
    if (body.status === "completed" && contract.status === "active") {
      const { mileageIn, fuelLevelIn, damageReportIn } = body;

      if (mileageIn !== undefined && mileageIn < contract.mileageOut) {
        return NextResponse.json(
          { success: false, error: "Mileage in cannot be less than mileage out" },
          { status: 400 }
        );
      }

      // Update vehicle: available + new mileage
      await Promise.all([
        Vehicle.findByIdAndUpdate(contract.vehicleId, {
          status: "available",
          ...(mileageIn !== undefined && { mileage: mileageIn }),
        }),
        Reservation.findByIdAndUpdate(contract.reservationId, { status: "completed" }),
      ]);

      const updated = await Contract.findByIdAndUpdate(
        id,
        {
          status: "completed",
          mileageIn: mileageIn ?? contract.mileageIn,
          fuelLevelIn: fuelLevelIn ?? contract.fuelLevelIn,
          damageReportIn: damageReportIn ?? contract.damageReportIn,
        },
        { new: true }
      )
        .populate(POPULATE_OPTS)
        .lean();

      return NextResponse.json({ success: true, data: updated });
    }

    // General update (e.g. disputed)
    const updated = await Contract.findByIdAndUpdate(id, body, { new: true })
      .populate(POPULATE_OPTS)
      .lean();

    return NextResponse.json({ success: true, data: updated });
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

  const contract = await Contract.findById(id);
  if (!contract) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (contract.status === "completed") {
    return NextResponse.json({ success: false, error: "Cannot delete a completed contract" }, { status: 409 });
  }

  // Revert reservation → confirmed, vehicle → reserved
  await Promise.all([
    Reservation.findByIdAndUpdate(contract.reservationId, { status: "confirmed" }),
    Vehicle.findByIdAndUpdate(contract.vehicleId, { status: "reserved" }),
  ]);

  await contract.deleteOne();
  return NextResponse.json({ success: true, data: null });
}
