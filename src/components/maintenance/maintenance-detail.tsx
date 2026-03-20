"use client";

import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Car, Wrench, Calendar, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IMaintenance, IVehicle, MaintenanceType, MaintenanceStatus } from "@/types";

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const TYPE_STYLES: Record<MaintenanceType, string> = {
  oil_change: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  tires: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  brakes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  inspection: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  repair: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-muted text-muted-foreground",
};

interface MaintenanceDetailProps {
  record: IMaintenance | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function MaintenanceDetail({ record, open, onClose, onEdit }: MaintenanceDetailProps) {
  const t = useTranslations("maintenance");
  const tc = useTranslations("common");

  if (!record) return null;

  const vehicle = record.vehicleId && typeof record.vehicleId === "object"
    ? (record.vehicleId as IVehicle)
    : null;

  const nextDueSoon =
    record.nextDue &&
    record.status !== "completed" &&
    new Date(record.nextDue) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{t("viewDetails")}</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 mt-4 space-y-5">
          {/* Vehicle */}
          {vehicle && (
            <div className="rounded-lg border p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Car className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
              </div>
            </div>
          )}

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("type")}</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[record.type]}`}>
                <Wrench className="w-3 h-3 mr-1.5" />
                {t(`types.${record.type}` as Parameters<typeof t>[0])}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("status")}</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[record.status]}`}>
                {t(`statuses.${record.status}` as Parameters<typeof t>[0])}
              </span>
            </div>
          </div>

          {/* Description */}
          {record.description && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("description")}</p>
              <p className="text-sm">{record.description}</p>
            </div>
          )}

          {/* Cost */}
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("cost")}</p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(record.cost)}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t("date")}
              </p>
              <p className="text-sm font-medium">{formatDate(record.date)}</p>
            </div>
            {record.nextDue && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  {nextDueSoon && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                  {t("nextDue")}
                </p>
                <p className={`text-sm font-medium ${nextDueSoon ? "text-amber-600 dark:text-amber-400" : ""}`}>
                  {formatDate(record.nextDue)}
                </p>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            {tc("edit")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
