export type VehicleStatus = "available" | "rented" | "reserved" | "maintenance";
export type FuelType = "Diesel" | "Essence" | "Hybride" | "Electrique";
export type ClientType = "regular" | "vip" | "blacklisted";
export type ReservationStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled";
export type ContractStatus = "active" | "completed" | "disputed";
export type FuelLevel = "full" | "3/4" | "1/2" | "1/4" | "empty";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "cash" | "card" | "transfer" | "cheque";
export type ExpenseCategory = "fuel" | "repair" | "insurance" | "tax" | "parking" | "other";
export type MaintenanceType = "oil_change" | "tires" | "brakes" | "inspection" | "repair" | "other";
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed";

export interface IVehicle {
  _id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  fuel: FuelType;
  mileage: number;
  dailyRate: number;
  status: VehicleStatus;
  vin: string;
  insuranceExpiry: Date | string;
  technicalInspection: Date | string;
  notes: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IClient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  cin: string;
  passport: string;
  drivingLicense: string;
  licenseExpiry: Date | string;
  address: string;
  city: string;
  nationality: string;
  dateOfBirth: Date | string;
  emergencyContact: string;
  clientType: ClientType;
  totalRentals: number;
  totalSpent: number;
  notes: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IReservation {
  _id: string;
  clientId: string | IClient;
  vehicleId: string | IVehicle;
  startDate: Date | string;
  endDate: Date | string;
  status: ReservationStatus;
  dailyRate: number;
  totalDays: number;
  totalPrice: number;
  deposit: number;
  notes: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IContract {
  _id: string;
  reservationId: string | IReservation;
  clientId: string | IClient;
  vehicleId: string | IVehicle;
  contractNumber: string;
  signedAt: Date | string;
  mileageOut: number;
  mileageIn: number;
  fuelLevelOut: FuelLevel;
  fuelLevelIn: FuelLevel;
  damageReportOut: string;
  damageReportIn: string;
  status: ContractStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IInvoice {
  _id: string;
  contractId: string | IContract;
  clientId: string | IClient;
  invoiceNumber: string;
  amount: number;
  lateFees: number;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date | string;
  paidAt: Date | string;
  paymentMethod: string;
  notes: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPayment {
  _id: string;
  invoiceId: string | IInvoice;
  clientId: string | IClient;
  amount: number;
  method: PaymentMethod;
  reference: string;
  date: Date | string;
  notes: string;
  createdAt: Date | string;
}

export interface IExpense {
  _id: string;
  vehicleId: string | IVehicle | null;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date | string;
  receipt: string;
  createdAt: Date | string;
}

export interface IMaintenance {
  _id: string;
  vehicleId: string | IVehicle;
  type: MaintenanceType;
  description: string;
  cost: number;
  date: Date | string;
  nextDue: Date | string;
  status: MaintenanceStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type DocumentCategory = "id_copy" | "contract" | "receipt" | "photo" | "other";
export type DocumentEntityType = "client" | "vehicle" | "contract";

export interface IDocument {
  _id: string;
  entityType: DocumentEntityType;
  entityId: string;
  fileName: string;
  gridfsId: string;
  fileUrl: string; // computed by API: /api/documents/:id/download
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  uploadedAt: Date | string;
}

export interface ISettings {
  _id: string;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
  agencyEmail: string;
  agencyLogo: string;
  currency: string;
  defaultLanguage: string;
  taxRate: number;
  lateReturnPenaltyRate: number;
  invoiceNotes: string;
  invoicePrefix: string;
  contractPrefix: string;
  updatedAt: Date | string;
}

export interface IAuditLog {
  _id: string;
  action: "create" | "update" | "delete";
  entity: string;
  entityId: string;
  details: Record<string, unknown>;
  timestamp: Date | string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  total?: number;
  page?: number;
  limit?: number;
}
