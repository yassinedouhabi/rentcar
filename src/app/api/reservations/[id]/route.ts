import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Reservation from "@/models/Reservation";
import Vehicle from "@/models/Vehicle";
import Contract from "@/models/Contract";
import { reservationUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const reservation = await Reservation.findById(id)
    .populate("clientId", "firstName lastName phone email cin")
    .populate("vehicleId", "brand model plate dailyRate fuel color")
    .lean();
  if (!reservation) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: reservation });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = reservationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const existing = await Reservation.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const newStatus = parsed.data.status;
    const oldStatus = existing.status;
    const vehicleId = existing.vehicleId.toString();

    // Status transition: update vehicle status accordingly
    if (newStatus && newStatus !== oldStatus) {
      const vehicleUpdates: Record<string, string> = {
        confirmed: "reserved",
        active: "rented",
        completed: "available",
        cancelled: "available",
      };
      const nextVehicleStatus = vehicleUpdates[newStatus];
      if (nextVehicleStatus) {
        // Only revert to available if vehicle was reserved by this reservation
        if (newStatus === "cancelled" && oldStatus === "pending") {
          // pending → cancelled: vehicle was never reserved, no change needed
        } else {
          await Vehicle.findByIdAndUpdate(vehicleId, { status: nextVehicleStatus });
        }
      }
    }

    const reservation = await Reservation.findByIdAndUpdate(id, parsed.data, { new: true })
      .populate("clientId", "firstName lastName phone email cin")
      .populate("vehicleId", "brand model plate dailyRate fuel color")
      .lean();

    return NextResponse.json({ success: true, data: reservation });
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

  // Block deletion if a contract already exists
  const contractExists = await Contract.exists({ reservationId: id });
  if (contractExists) {
    return NextResponse.json(
      { success: false, error: "Cannot delete a reservation with an existing contract" },
      { status: 409 }
    );
  }

  const reservation = await Reservation.findById(id);
  if (!reservation) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Revert vehicle status if reservation was active/confirmed
  if (["confirmed", "active"].includes(reservation.status)) {
    await Vehicle.findByIdAndUpdate(reservation.vehicleId, { status: "available" });
  }

  await reservation.deleteOne();
  return NextResponse.json({ success: true, data: null });
}
