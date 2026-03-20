import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import Client from "@/models/Client";
import Reservation from "@/models/Reservation";

export async function POST() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  // Check if data already exists
  const existingVehicles = await Vehicle.countDocuments();
  if (existingVehicles > 0)
    return NextResponse.json({ success: false, error: "already_seeded" }, { status: 400 });

  const now = new Date();

  const vehicles = await Vehicle.insertMany([
    { brand: "Dacia", model: "Logan", plate: "12345-A-1", year: 2021, color: "Blanc", fuel: "Diesel", mileage: 45000, dailyRate: 250, status: "available" },
    { brand: "Renault", model: "Clio", plate: "23456-B-2", year: 2022, color: "Gris", fuel: "Essence", mileage: 28000, dailyRate: 300, status: "available" },
    { brand: "Dacia", model: "Duster", plate: "34567-C-3", year: 2020, color: "Rouge", fuel: "Diesel", mileage: 62000, dailyRate: 400, status: "available" },
    { brand: "Hyundai", model: "i10", plate: "45678-D-4", year: 2023, color: "Bleu", fuel: "Essence", mileage: 12000, dailyRate: 220, status: "available" },
    { brand: "Volkswagen", model: "Polo", plate: "56789-E-5", year: 2021, color: "Noir", fuel: "Diesel", mileage: 38000, dailyRate: 350, status: "maintenance" },
  ]);

  const clients = await Client.insertMany([
    { firstName: "Mohammed", lastName: "Alami", phone: "0661234567", cin: "AB123456", drivingLicense: "12345678", licenseExpiry: new Date("2027-06-15"), city: "Casablanca", nationality: "Marocaine", clientType: "regular", totalRentals: 3, totalSpent: 2700 },
    { firstName: "Fatima", lastName: "Benali", phone: "0672345678", cin: "CD234567", drivingLicense: "23456789", licenseExpiry: new Date("2026-03-20"), city: "Rabat", nationality: "Marocaine", clientType: "vip", totalRentals: 8, totalSpent: 9600 },
    { firstName: "Karim", lastName: "El Fassi", phone: "0683456789", cin: "EF345678", drivingLicense: "34567890", licenseExpiry: new Date("2025-12-01"), city: "Fès", nationality: "Marocaine", clientType: "regular", totalRentals: 1, totalSpent: 750 },
    { firstName: "Zineb", lastName: "Tazi", phone: "0694567890", cin: "GH456789", drivingLicense: "45678901", licenseExpiry: new Date("2028-09-10"), city: "Marrakech", nationality: "Marocaine", clientType: "regular", totalRentals: 2, totalSpent: 1400 },
    { firstName: "Omar", lastName: "Idrissi", phone: "0605678901", passport: "AB1234567", drivingLicense: "56789012", licenseExpiry: new Date("2026-07-25"), city: "Tanger", nationality: "Française", clientType: "regular", totalRentals: 1, totalSpent: 1200 },
  ]);

  // Create a few upcoming reservations
  const startDate1 = new Date(now);
  startDate1.setDate(startDate1.getDate() + 3);
  const endDate1 = new Date(startDate1);
  endDate1.setDate(endDate1.getDate() + 5);

  const startDate2 = new Date(now);
  startDate2.setDate(startDate2.getDate() + 7);
  const endDate2 = new Date(startDate2);
  endDate2.setDate(endDate2.getDate() + 3);

  await Reservation.insertMany([
    {
      clientId: clients[0]._id,
      vehicleId: vehicles[1]._id,
      startDate: startDate1,
      endDate: endDate1,
      status: "confirmed",
      dailyRate: 300,
      totalDays: 5,
      totalPrice: 1500,
      deposit: 500,
    },
    {
      clientId: clients[1]._id,
      vehicleId: vehicles[2]._id,
      startDate: startDate2,
      endDate: endDate2,
      status: "pending",
      dailyRate: 400,
      totalDays: 3,
      totalPrice: 1200,
      deposit: 400,
    },
  ]);

  return NextResponse.json({
    success: true,
    data: {
      vehicles: vehicles.length,
      clients: clients.length,
      reservations: 2,
    },
  });
}
