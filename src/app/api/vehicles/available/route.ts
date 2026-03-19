import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Reservation from "@/models/Reservation";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const excludeReservationId = searchParams.get("excludeReservationId");

  if (!startDateParam || !endDateParam) {
    return NextResponse.json({ success: false, error: "startDate and endDate are required" }, { status: 400 });
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ success: false, error: "Invalid dates" }, { status: 400 });
  }

  // Find vehicles with overlapping reservations
  const overlapFilter: Record<string, unknown> = {
    status: { $nin: ["cancelled", "completed"] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  if (excludeReservationId) {
    overlapFilter._id = { $ne: excludeReservationId };
  }

  const bookedReservations = await Reservation.find(overlapFilter).select("vehicleId").lean();
  const bookedVehicleIds = bookedReservations.map((r) => r.vehicleId.toString());

  // Return vehicles not booked and not in maintenance
  const vehicles = await Vehicle.find({
    _id: { $nin: bookedVehicleIds },
    status: { $ne: "maintenance" },
  })
    .select("brand model plate dailyRate fuel color status year")
    .sort({ brand: 1, model: 1 })
    .lean();

  return NextResponse.json({ success: true, data: vehicles });
}
