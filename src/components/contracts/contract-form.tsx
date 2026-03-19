"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IVehicle, IReservation } from "@/types";

interface ConfirmedReservation extends IReservation {
  clientId: IClient;
  vehicleId: IVehicle;
}

interface ContractFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FUEL_LEVELS = ["full", "3/4", "1/2", "1/4", "empty"] as const;

export function ContractForm({ open, onClose, onSuccess }: ContractFormProps) {
  const t = useTranslations("contract");
  const tc = useTranslations("common");

  const [reservations, setReservations] = useState<ConfirmedReservation[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [selectedResId, setSelectedResId] = useState("");
  const [signedAt, setSignedAt] = useState(new Date().toISOString().split("T")[0]);
  const [mileageOut, setMileageOut] = useState("0");
  const [fuelLevelOut, setFuelLevelOut] = useState<typeof FUEL_LEVELS[number]>("full");
  const [damageReportOut, setDamageReportOut] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRes = reservations.find((r) => r._id === selectedResId);

  // Fetch confirmed reservations on open
  useEffect(() => {
    if (!open) return;
    setSelectedResId("");
    setSignedAt(new Date().toISOString().split("T")[0]);
    setMileageOut("0");
    setFuelLevelOut("full");
    setDamageReportOut("");

    setResLoading(true);
    fetch("/api/reservations?status=confirmed&limit=100")
      .then((r) => r.json())
      .then((json) => { if (json.success) setReservations(json.data); })
      .catch(() => {})
      .finally(() => setResLoading(false));
  }, [open]);

  // Pre-fill mileage when reservation changes
  useEffect(() => {
    if (!selectedRes) return;
    const v = selectedRes.vehicleId as IVehicle;
    if (typeof v !== "string" && v.mileage != null) {
      setMileageOut(String(v.mileage));
    }
  }, [selectedRes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: selectedResId,
          signedAt,
          mileageOut: parseInt(mileageOut) || 0,
          fuelLevelOut,
          damageReportOut: damageReportOut || undefined,
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

  const client = selectedRes?.clientId as IClient | undefined;
  const vehicle = selectedRes?.vehicleId as IVehicle | undefined;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{t("createFrom")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-5">
          {/* Reservation selector */}
          <div>
            <Label className="mb-1 block">{t("reservation")} *</Label>
            {resLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : (
              <Select value={selectedResId} onValueChange={(v) => setSelectedResId(v ?? "")} disabled={reservations.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    reservations.length === 0 ? t("noConfirmedReservations") : t("selectReservation")
                  } />
                </SelectTrigger>
                <SelectContent>
                  {reservations.map((r) => {
                    const c = r.clientId as IClient;
                    const v = r.vehicleId as IVehicle;
                    const label = typeof c !== "string" && typeof v !== "string"
                      ? `${c.firstName} ${c.lastName} — ${v.brand} ${v.model} (${formatDateShort(r.startDate)})`
                      : r._id;
                    return <SelectItem key={r._id} value={r._id}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reservation info (read-only) */}
          {selectedRes && client && vehicle && (
            <div className="rounded-lg bg-muted/50 border p-3 space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("reservationInfo")}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">{t("client")}</span>
                <span className="font-medium">{client.firstName} {client.lastName}</span>
                <span className="text-muted-foreground">{t("vehicle")}</span>
                <span className="font-medium">{vehicle.brand} {vehicle.model} · <span className="font-mono">{vehicle.plate}</span></span>
                <span className="text-muted-foreground">Start</span>
                <span className="font-medium">{formatDateShort(selectedRes.startDate)}</span>
                <span className="text-muted-foreground">End</span>
                <span className="font-medium">{formatDateShort(selectedRes.endDate)}</span>
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedRes.totalPrice)}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Pickup details */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("pickupInfo")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="signedAt">{t("signedAt")}</Label>
                <Input
                  id="signedAt"
                  type="date"
                  className="mt-1"
                  value={signedAt}
                  onChange={(e) => setSignedAt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mileageOut">{t("mileageOut")} (km)</Label>
                <Input
                  id="mileageOut"
                  type="number"
                  min="0"
                  className="mt-1"
                  value={mileageOut}
                  onChange={(e) => setMileageOut(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>{t("fuelLevelOut")}</Label>
              <Select value={fuelLevelOut} onValueChange={(v) => setFuelLevelOut(v as typeof FUEL_LEVELS[number])}>
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
              <Label htmlFor="damageReportOut">{t("damageReportOut")}</Label>
              <Textarea
                id="damageReportOut"
                className="mt-1 resize-none"
                rows={3}
                placeholder="Note any existing damage..."
                value={damageReportOut}
                onChange={(e) => setDamageReportOut(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !selectedResId}>
              {isSubmitting ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
