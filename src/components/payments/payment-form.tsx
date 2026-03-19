"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { PopulatedInvoice } from "@/hooks/use-invoices";

const METHODS = ["cash", "card", "transfer", "cheque"] as const;

interface PaymentFormProps {
  invoice: PopulatedInvoice | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentForm({ invoice, open, onClose, onSuccess }: PaymentFormProps) {
  const t = useTranslations("payment");
  const tc = useTranslations("common");

  const remaining = invoice ? (invoice.totalAmount - (invoice.paidAmount ?? 0)) : 0;

  const [amount, setAmount] = useState("0");
  const [method, setMethod] = useState<typeof METHODS[number]>("cash");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !invoice) return;
    setAmount(String(Math.max(0, remaining)));
    setMethod("cash");
    setReference("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  }, [open, invoice, remaining]);

  if (!invoice) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice._id,
          amount: amountNum,
          method,
          reference: reference || undefined,
          date,
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("recordPayment")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice context */}
          <div className="rounded-lg bg-muted/50 border p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("forInvoice")}</span>
              <span className="font-mono font-semibold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{tc("amount")} paid</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(invoice.paidAmount ?? 0)}
              </span>
            </div>
            <Separator className="my-1" />
            <div className="flex items-center justify-between font-semibold">
              <span>Remaining</span>
              <span className={remaining <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                {formatCurrency(Math.max(0, remaining))}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="pay-amount">{t("amount")}</Label>
            <Input
              id="pay-amount"
              type="number"
              min="0.01"
              step="0.01"
              className="mt-1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Method */}
          <div>
            <Label>{t("method")}</Label>
            <Select value={method} onValueChange={(v) => setMethod((v ?? "cash") as typeof METHODS[number])}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`methods.${m}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <Label htmlFor="pay-date">{t("date")}</Label>
              <Input
                id="pay-date"
                type="date"
                className="mt-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {/* Reference */}
            <div>
              <Label htmlFor="pay-ref">{t("reference")} (opt.)</Label>
              <Input
                id="pay-ref"
                className="mt-1"
                placeholder="#REF..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="pay-notes">{t("notes")} (opt.)</Label>
            <Textarea
              id="pay-notes"
              className="mt-1 resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : t("recordPayment")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
