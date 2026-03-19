"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, User, Car, CalendarDays, Banknote } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IVehicle } from "@/types";
import type { PopulatedReservation } from "@/hooks/use-reservations";

interface ReservationDetailProps {
  reservation: PopulatedReservation | null;
  open: boolean;
  onClose: () => void;
  onEdit: (r: PopulatedReservation) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export function ReservationDetail({ reservation, open, onClose, onEdit, onStatusChange }: ReservationDetailProps) {
  const t = useTranslations("reservation");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);

  if (!reservation) return null;

  const client = typeof reservation.clientId === "string" ? null : reservation.clientId as unknown as IClient;
  const vehicle = typeof reservation.vehicleId === "string" ? null : reservation.vehicleId as unknown as IVehicle;

  async function handleStatus(newStatus: string) {
    setLoading(true);
    try {
      await onStatusChange(reservation!._id, newStatus);
    } finally {
      setLoading(false);
    }
  }

  const { status } = reservation;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pr-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base">
                {client ? `${client.firstName} ${client.lastName}` : "—"}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}` : "—"}
              </p>
            </div>
            <StatusBadge
              status={status}
              label={t(`statuses.${status}` as Parameters<typeof t>[0])}
            />
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* Client */}
          {client && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {t("client")}
              </p>
              <div className="divide-y divide-border/50">
                <DetailRow label={tc("general")} value={`${client.firstName} ${client.lastName}`} />
                <DetailRow label="Phone" value={client.phone} />
                {client.email && <DetailRow label="Email" value={client.email} />}
                {client.cin && <DetailRow label="CIN" value={<span className="font-mono text-xs">{client.cin}</span>} />}
              </div>
            </div>
          )}

          <Separator />

          {/* Vehicle */}
          {vehicle && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> {t("vehicle")}
              </p>
              <div className="divide-y divide-border/50">
                <DetailRow label="Vehicle" value={`${vehicle.brand} ${vehicle.model}`} />
                <DetailRow label="Plate" value={<span className="font-mono">{vehicle.plate}</span>} />
                <DetailRow label={t("dailyRate")} value={formatCurrency(vehicle.dailyRate)} />
              </div>
            </div>
          )}

          <Separator />

          {/* Dates */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Dates
            </p>
            <div className="divide-y divide-border/50">
              <DetailRow label={t("startDate")} value={formatDateShort(reservation.startDate)} />
              <DetailRow label={t("endDate")} value={formatDateShort(reservation.endDate)} />
              <DetailRow label={t("totalDays")} value={`${reservation.totalDays} day(s)`} />
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" /> {tc("financial")}
            </p>
            <div className="divide-y divide-border/50">
              <DetailRow label={t("dailyRate")} value={formatCurrency(reservation.dailyRate)} />
              <DetailRow
                label={t("totalPrice")}
                value={
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatCurrency(reservation.totalPrice)}
                  </span>
                }
              />
              {(reservation.deposit ?? 0) > 0 && (
                <DetailRow label={t("deposit")} value={formatCurrency(reservation.deposit)} />
              )}
            </div>
          </div>

          {reservation.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {tc("notes")}
                </p>
                <p className="text-sm">{reservation.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Action buttons by status */}
          <div className="space-y-2">
            {status === "pending" && (
              <Button className="w-full" onClick={() => handleStatus("confirmed")} disabled={loading}>
                {t("confirmAction")}
              </Button>
            )}
            {status === "confirmed" && (
              <Button className="w-full" onClick={() => handleStatus("active")} disabled={loading}>
                {t("startAction")}
              </Button>
            )}
            {status === "active" && (
              <Button className="w-full" onClick={() => handleStatus("completed")} disabled={loading}>
                {t("completeAction")}
              </Button>
            )}
            {(status === "pending" || status === "confirmed") && (
              <Button variant="destructive" className="w-full" onClick={() => handleStatus("cancelled")} disabled={loading}>
                {t("cancelAction")}
              </Button>
            )}
            {(status === "pending" || status === "confirmed") && (
              <Button variant="outline" className="w-full" onClick={() => onEdit(reservation)} disabled={loading}>
                <Pencil className="w-4 h-4 mr-2" />
                {tc("edit")}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
