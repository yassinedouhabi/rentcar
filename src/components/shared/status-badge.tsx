import type { VehicleStatus, ReservationStatus, ContractStatus, InvoiceStatus, MaintenanceStatus } from "@/types";

type AnyStatus = VehicleStatus | ReservationStatus | ContractStatus | InvoiceStatus | MaintenanceStatus | string;

const STATUS_STYLES: Record<string, string> = {
  // Vehicle
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rented: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  reserved: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  maintenance: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Reservation
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Invoice
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Contract
  disputed: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  // Maintenance
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  // Client types
  regular: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  vip: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  blacklisted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface StatusBadgeProps {
  status: AnyStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  );
}
