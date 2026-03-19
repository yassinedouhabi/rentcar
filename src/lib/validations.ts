import { z } from "zod";

// Vehicle schemas
export const vehicleSchema = z.object({
  brand: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  plate: z.string().min(1, "La plaque est requise"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  fuel: z.enum(["Diesel", "Essence", "Hybride", "Electrique"]).default("Diesel"),
  mileage: z.number().min(0).default(0),
  dailyRate: z.number().min(0, "Le tarif journalier doit être positif"),
  status: z.enum(["available", "rented", "reserved", "maintenance"]).default("available"),
  vin: z.string().optional(),
  insuranceExpiry: z.string().or(z.date()).optional(),
  technicalInspection: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const vehicleUpdateSchema = vehicleSchema.partial();

// Client schemas
export const clientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  cin: z.string().optional(),
  passport: z.string().optional(),
  drivingLicense: z.string().min(1, "Le permis de conduire est requis"),
  licenseExpiry: z.string().or(z.date()).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().or(z.date()).optional(),
  emergencyContact: z.string().optional(),
  clientType: z.enum(["regular", "vip", "blacklisted"]).default("regular"),
  notes: z.string().optional(),
});

export const clientUpdateSchema = clientSchema.partial();

// Reservation schemas
export const reservationSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: z.enum(["pending", "confirmed", "active", "completed", "cancelled"]).default("pending"),
  dailyRate: z.number().min(0),
  totalDays: z.number().int().min(1),
  totalPrice: z.number().min(0),
  deposit: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const reservationUpdateSchema = reservationSchema.partial();

// Contract schemas
export const contractSchema = z.object({
  reservationId: z.string().min(1, "La réservation est requise"),
  clientId: z.string().min(1, "Le client est requis"),
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  contractNumber: z.string().min(1),
  signedAt: z.string().or(z.date()).optional(),
  mileageOut: z.number().min(0).default(0),
  mileageIn: z.number().min(0).default(0),
  fuelLevelOut: z.enum(["full", "3/4", "1/2", "1/4", "empty"]).default("full"),
  fuelLevelIn: z.enum(["full", "3/4", "1/2", "1/4", "empty"]).default("full"),
  damageReportOut: z.string().optional(),
  damageReportIn: z.string().optional(),
  status: z.enum(["active", "completed", "disputed"]).default("active"),
});

export const contractUpdateSchema = contractSchema.partial();

// Invoice schemas
export const invoiceSchema = z.object({
  contractId: z.string().min(1, "Le contrat est requis"),
  clientId: z.string().min(1, "Le client est requis"),
  invoiceNumber: z.string().min(1),
  amount: z.number().min(0),
  tax: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  dueDate: z.string().or(z.date()).optional(),
  paidAt: z.string().or(z.date()).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const invoiceUpdateSchema = invoiceSchema.partial();

// Payment schemas
export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "La facture est requise"),
  clientId: z.string().min(1, "Le client est requis"),
  amount: z.number().min(0, "Le montant doit être positif"),
  method: z.enum(["cash", "card", "transfer", "cheque"]),
  reference: z.string().optional(),
  date: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const paymentUpdateSchema = paymentSchema.partial();

// Expense schemas
export const expenseSchema = z.object({
  vehicleId: z.string().optional().nullable(),
  category: z.enum(["fuel", "repair", "insurance", "tax", "parking", "other"]),
  amount: z.number().min(0, "Le montant doit être positif"),
  description: z.string().min(1, "La description est requise"),
  date: z.string().or(z.date()),
  receipt: z.string().optional(),
});

export const expenseUpdateSchema = expenseSchema.partial();

// Maintenance schemas
export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Le véhicule est requis"),
  type: z.enum(["oil_change", "tires", "brakes", "inspection", "repair", "other"]),
  description: z.string().optional(),
  cost: z.number().min(0).default(0),
  date: z.string().or(z.date()),
  nextDue: z.string().or(z.date()).optional(),
  status: z.enum(["scheduled", "in_progress", "completed"]).default("scheduled"),
});

export const maintenanceUpdateSchema = maintenanceSchema.partial();
