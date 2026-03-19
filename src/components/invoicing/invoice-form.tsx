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
import type { IClient, IReservation } from "@/types";
import type { PopulatedContract } from "@/hooks/use-contracts";

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceForm({ open, onClose, onSuccess }: InvoiceFormProps) {
  const t = useTranslations("invoice");
  const tc = useTranslations("common");

  const [contracts, setContracts] = useState<PopulatedContract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = contracts.find((c) => c._id === selectedId);

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setTaxRate("0");
    setNotes("");
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split("T")[0]);

    setContractsLoading(true);
    fetch("/api/contracts?status=completed&noInvoice=true&limit=100")
      .then((r) => r.json())
      .then((json) => { if (json.success) setContracts(json.data); })
      .catch(() => {})
      .finally(() => setContractsLoading(false));
  }, [open]);

  // Compute preview amounts
  const reservation = selected
    ? (typeof selected.reservationId === "string" ? null : selected.reservationId as unknown as IReservation)
    : null;
  const baseAmount = reservation?.totalPrice ?? 0;
  const taxRateNum = parseFloat(taxRate) || 0;

  // Estimate late fees (same logic as API: contract.updatedAt vs reservation.endDate)
  let estimatedLateFees = 0;
  if (selected && reservation) {
    const endDate = new Date(reservation.endDate);
    const completedAt = new Date(selected.updatedAt as string);
    endDate.setHours(0, 0, 0, 0);
    completedAt.setHours(0, 0, 0, 0);
    const lateDays = Math.max(0, Math.floor((completedAt.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)));
    estimatedLateFees = lateDays * (reservation.dailyRate ?? 0);
  }

  const subtotal = baseAmount + estimatedLateFees;
  const taxAmount = Math.round(subtotal * (taxRateNum / 100));
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: selectedId,
          taxRate: taxRateNum,
          dueDate,
          notes: notes || undefined,
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

  const client = selected
    ? (typeof selected.clientId === "string" ? null : selected.clientId as unknown as IClient)
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{t("createFrom")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-5">
          {/* Contract selector */}
          <div>
            <Label className="mb-1 block">{t("contract")} *</Label>
            {contractsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {tc("loading")}
              </div>
            ) : (
              <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")} disabled={contracts.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    contracts.length === 0 ? t("noEligibleContracts") : t("selectContract")
                  } />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((c) => {
                    const cl = typeof c.clientId === "string" ? null : c.clientId as unknown as IClient;
                    const label = cl
                      ? `${c.contractNumber} — ${cl.firstName} ${cl.lastName}`
                      : c.contractNumber;
                    return <SelectItem key={c._id} value={c._id}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Contract info */}
          {selected && client && reservation && (
            <div className="rounded-lg bg-muted/50 border p-3 space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("contractInfo")}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">{t("client")}</span>
                <span className="font-medium">{client.firstName} {client.lastName}</span>
                <span className="text-muted-foreground">Period</span>
                <span className="font-medium">
                  {formatDateShort(reservation.startDate)} → {formatDateShort(reservation.endDate)}
                </span>
                <span className="text-muted-foreground">Days</span>
                <span className="font-medium">{reservation.totalDays ?? "—"} day(s)</span>
                <span className="text-muted-foreground">Daily rate</span>
                <span className="font-medium">{formatCurrency(reservation.dailyRate ?? 0)}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Invoice settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="inv-due">{t("dueDate")}</Label>
                <Input
                  id="inv-due"
                  type="date"
                  className="mt-1"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="inv-tax">{t("taxRate")}</Label>
                <Input
                  id="inv-tax"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="inv-notes">{t("notes")} (opt.)</Label>
              <Textarea
                id="inv-notes"
                className="mt-1 resize-none"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Total preview */}
          {selected && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {t("lineItems")}
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("rentalPeriod")}</span>
                <span>{formatCurrency(baseAmount)}</span>
              </div>
              {estimatedLateFees > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("lateFees")}</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatCurrency(estimatedLateFees)}</span>
                </div>
              )}
              {taxRateNum > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("tax")} ({taxRateNum}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold text-base">
                <span>{t("totalAmount")}</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !selectedId}>
              {isSubmitting ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
