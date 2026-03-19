"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IVehicle, IReservation } from "@/types";
import type { PopulatedContract } from "@/hooks/use-contracts";

const FUEL_LEVELS = ["full", "3/4", "1/2", "1/4", "empty"] as const;

interface ReturnFormProps {
  contract: PopulatedContract | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReturnForm({ contract, open, onClose, onSuccess }: ReturnFormProps) {
  const t = useTranslations("contract");
  const tc = useTranslations("common");

  const [mileageIn, setMileageIn] = useState("0");
  const [fuelLevelIn, setFuelLevelIn] = useState<typeof FUEL_LEVELS[number]>("full");
  const [damageReportIn, setDamageReportIn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !contract) return;
    setMileageIn(String(contract.mileageOut ?? 0));
    setFuelLevelIn((contract.fuelLevelOut as typeof FUEL_LEVELS[number]) ?? "full");
    setDamageReportIn("");
  }, [open, contract]);

  if (!contract) return null;

  const client = typeof contract.clientId === "string" ? null : contract.clientId as unknown as IClient;
  const vehicle = typeof contract.vehicleId === "string" ? null : contract.vehicleId as unknown as IVehicle;
  const reservation = typeof contract.reservationId === "string" ? null : contract.reservationId as unknown as IReservation;

  const mileageInNum = parseInt(mileageIn) || 0;
  const extraKm = Math.max(0, mileageInNum - (contract.mileageOut ?? 0));

  // Late return calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = reservation?.endDate ? new Date(reservation.endDate) : null;
  if (endDate) endDate.setHours(0, 0, 0, 0);
  const lateDays = endDate && today > endDate
    ? Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const vehicleTyped = typeof contract.vehicleId === "string" ? null : contract.vehicleId as unknown as IVehicle;
  const dailyRate = vehicleTyped?.dailyRate ?? 0;
  const extraCost = lateDays * dailyRate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contract) return;
    if (mileageInNum < (contract.mileageOut ?? 0)) {
      toast.error("Mileage in cannot be less than mileage out");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contract._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          mileageIn: mileageInNum,
          fuelLevelIn,
          damageReportIn: damageReportIn || undefined,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        let msg = tc("errorOccurred");
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        toast.error(msg);
      }
    } catch {
      toast.error(tc("errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{t("returnVehicle")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-5">
          {/* Contract info */}
          <div className="rounded-lg bg-muted/50 border p-3 space-y-1 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("reservationInfo")}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-muted-foreground">{t("contractNumber")}</span>
              <span className="font-mono font-semibold">{contract.contractNumber}</span>
              {client && (
                <>
                  <span className="text-muted-foreground">{t("client")}</span>
                  <span className="font-medium">{client.firstName} {client.lastName}</span>
                </>
              )}
              {vehicle && (
                <>
                  <span className="text-muted-foreground">{t("vehicle")}</span>
                  <span className="font-medium">{vehicle.brand} {vehicle.model} · <span className="font-mono">{vehicle.plate}</span></span>
                </>
              )}
              {reservation && (
                <>
                  <span className="text-muted-foreground">End date</span>
                  <span className="font-medium">{formatDateShort(reservation.endDate)}</span>
                </>
              )}
              <span className="text-muted-foreground">{t("mileageOut")}</span>
              <span className="font-medium font-mono">{contract.mileageOut?.toLocaleString()} km</span>
            </div>
          </div>

          {/* Late return warning */}
          {lateDays > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  {t("lateReturnWarning", { days: lateDays })}
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  {t("extraCost")}: <span className="font-semibold">{formatCurrency(extraCost)}</span>
                  {" "}({lateDays} {t("lateDays", { days: lateDays })} × {formatCurrency(dailyRate)})
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Return details */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("returnInfo")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mileageIn">{t("mileageIn")} (km)</Label>
                <Input
                  id="mileageIn"
                  type="number"
                  min={contract.mileageOut ?? 0}
                  className="mt-1"
                  value={mileageIn}
                  onChange={(e) => setMileageIn(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-end">
                {extraKm > 0 && (
                  <p className="text-xs text-muted-foreground pb-2">
                    {t("extraKm")}: <span className="font-semibold text-foreground">{extraKm.toLocaleString()} km</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>{t("fuelLevelIn")}</Label>
              <Select value={fuelLevelIn} onValueChange={(v) => setFuelLevelIn(v as typeof FUEL_LEVELS[number])}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_LEVELS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t(`fuelLevels.${f}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="damageReportIn">{t("damageReportIn")}</Label>
              <Textarea
                id="damageReportIn"
                className="mt-1 resize-none"
                rows={3}
                placeholder="Note any damage on return..."
                value={damageReportIn}
                onChange={(e) => setDamageReportIn(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : t("returnVehicle")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
