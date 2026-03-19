"use client";

import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IVehicle, IReservation } from "@/types";
import type { PopulatedContract } from "@/hooks/use-contracts";

interface ContractDetailProps {
  contract: PopulatedContract | null;
  open: boolean;
  onClose: () => void;
  onReturn: (contract: PopulatedContract) => void;
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-4">
      {children}
    </p>
  );
}

export function ContractDetail({ contract, open, onClose, onReturn }: ContractDetailProps) {
  const t = useTranslations("contract");
  const tc = useTranslations("common");

  if (!contract) return null;

  const client = typeof contract.clientId === "string" ? null : contract.clientId as unknown as IClient;
  const vehicle = typeof contract.vehicleId === "string" ? null : contract.vehicleId as unknown as IVehicle;
  const reservation = typeof contract.reservationId === "string" ? null : contract.reservationId as unknown as IReservation;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <div className="flex items-center gap-3">
            <SheetTitle className="font-mono">{contract.contractNumber}</SheetTitle>
            <StatusBadge status={contract.status} label={t(`statuses.${contract.status}` as Parameters<typeof t>[0])} />
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-1">
          {/* Client */}
          <SectionTitle>{t("client")}</SectionTitle>
          {client ? (
            <>
              <DetailRow label="Name" value={`${client.firstName} ${client.lastName}`} />
              <DetailRow label="Phone" value={
                <a href={`tel:${client.phone}`} className="text-primary hover:underline">{client.phone}</a>
              } />
              {client.email && (
                <DetailRow label="Email" value={
                  <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                } />
              )}
              {client.cin && <DetailRow label="CIN" value={<span className="font-mono">{client.cin}</span>} />}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}

          <Separator className="my-3" />

          {/* Vehicle */}
          <SectionTitle>{t("vehicle")}</SectionTitle>
          {vehicle ? (
            <>
              <DetailRow label="Vehicle" value={`${vehicle.brand} ${vehicle.model}`} />
              <DetailRow label="Plate" value={<span className="font-mono">{vehicle.plate}</span>} />
              {vehicle.color && <DetailRow label="Color" value={vehicle.color} />}
              {vehicle.fuel && <DetailRow label="Fuel" value={vehicle.fuel} />}
              <DetailRow label="Daily rate" value={formatCurrency(vehicle.dailyRate)} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}

          <Separator className="my-3" />

          {/* Reservation */}
          {reservation && (
            <>
              <SectionTitle>{t("reservation")}</SectionTitle>
              <DetailRow label="Start" value={formatDateShort(reservation.startDate)} />
              <DetailRow label="End" value={formatDateShort(reservation.endDate)} />
              <DetailRow label="Days" value={`${reservation.totalDays ?? "—"} day(s)`} />
              <DetailRow label="Total" value={
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(reservation.totalPrice)}
                </span>
              } />
              {reservation.deposit != null && reservation.deposit > 0 && (
                <DetailRow label="Deposit" value={formatCurrency(reservation.deposit)} />
              )}
              <Separator className="my-3" />
            </>
          )}

          {/* Pickup */}
          <SectionTitle>{t("pickupInfo")}</SectionTitle>
          <DetailRow label={t("signedAt")} value={contract.signedAt ? formatDateShort(contract.signedAt) : "—"} />
          <DetailRow label={t("mileageOut")} value={
            contract.mileageOut != null ? `${contract.mileageOut.toLocaleString()} km` : "—"
          } />
          <DetailRow label={t("fuelLevelOut")} value={
            contract.fuelLevelOut ? t(`fuelLevels.${contract.fuelLevelOut}` as Parameters<typeof t>[0]) : "—"
          } />
          {contract.damageReportOut && (
            <div className="py-1.5">
              <p className="text-sm text-muted-foreground mb-1">{t("damageReportOut")}</p>
              <p className="text-sm bg-muted/50 rounded p-2">{contract.damageReportOut}</p>
            </div>
          )}

          {/* Return (only if completed/disputed) */}
          {(contract.status === "completed" || contract.status === "disputed") && (
            <>
              <Separator className="my-3" />
              <SectionTitle>{t("returnInfo")}</SectionTitle>
              <DetailRow label={t("mileageIn")} value={
                contract.mileageIn != null ? `${contract.mileageIn.toLocaleString()} km` : "—"
              } />
              {contract.mileageOut != null && contract.mileageIn != null && contract.mileageIn > contract.mileageOut && (
                <DetailRow label={t("extraKm")} value={
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {(contract.mileageIn - contract.mileageOut).toLocaleString()} km
                  </span>
                } />
              )}
              <DetailRow label={t("fuelLevelIn")} value={
                contract.fuelLevelIn ? t(`fuelLevels.${contract.fuelLevelIn}` as Parameters<typeof t>[0]) : "—"
              } />
              {contract.damageReportIn && (
                <div className="py-1.5">
                  <p className="text-sm text-muted-foreground mb-1">{t("damageReportIn")}</p>
                  <p className="text-sm bg-muted/50 rounded p-2">{contract.damageReportIn}</p>
                </div>
              )}
            </>
          )}

          {/* Action button */}
          {contract.status === "active" && (
            <>
              <Separator className="my-4" />
              <button
                onClick={() => onReturn(contract)}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t("returnVehicle")}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
