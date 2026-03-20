import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import Vehicle from "@/models/Vehicle";
import Contract from "@/models/Contract";
import { maintenanceUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const maintenance = await Maintenance.findById(id)
    .populate("vehicleId", "brand model plate status year color fuel mileage dailyRate")
    .lean();

  if (!maintenance) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: maintenance });
}

async function restoreVehicleIfNeeded(vehicleId: string, excludeId: string) {
  const otherActive = await Maintenance.findOne({
    _id: { $ne: excludeId },
    vehicleId,
    status: "in_progress",
  });
  if (!otherActive) {
    const activeContract = await Contract.findOne({ vehicleId, status: "active" });
    if (!activeContract) {
      await Vehicle.findByIdAndUpdate(vehicleId, { status: "available" });
    }
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = maintenanceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await Maintenance.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const newData = parsed.data;
    const prevStatus = existing.status;
    const newStatus = newData.status ?? prevStatus;
    const vehicleId = (newData.vehicleId ?? existing.vehicleId).toString();

    // Transitioning to in_progress → set vehicle to maintenance
    if (newStatus === "in_progress" && prevStatus !== "in_progress") {
      const vehicle = await Vehicle.findById(vehicleId);
      if (vehicle?.status === "rented") {
        return NextResponse.json({ success: false, error: "VEHICLE_RENTED" }, { status: 422 });
      }
      await Vehicle.findByIdAndUpdate(vehicleId, { status: "maintenance" });
    }

    // Completing → restore vehicle if no other active maintenance/contracts
    if (newStatus === "completed" && prevStatus !== "completed") {
      await restoreVehicleIfNeeded(vehicleId, id);
    }

    // Reverting from in_progress → restore vehicle
    if (prevStatus === "in_progress" && newStatus !== "in_progress" && newStatus !== "completed") {
      await restoreVehicleIfNeeded(vehicleId, id);
    }

    const updated = await Maintenance.findByIdAndUpdate(id, newData, {
      new: true,
      runValidators: true,
    })
      .populate("vehicleId", "brand model plate status")
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

  const maintenance = await Maintenance.findById(id);
  if (!maintenance) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (maintenance.status === "in_progress") {
    await restoreVehicleIfNeeded(maintenance.vehicleId.toString(), id);
  }

  await maintenance.deleteOne();
  return NextResponse.json({ success: true, data: null });
}
