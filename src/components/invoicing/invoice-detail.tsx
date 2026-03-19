"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentForm } from "@/components/payments/payment-form";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IContract, IPayment, PaymentMethod } from "@/types";
import type { PopulatedInvoice } from "@/hooks/use-invoices";

interface InvoiceDetailProps {
  invoice: PopulatedInvoice | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

const METHOD_ICONS: Record<string, string> = {
  cash: "💵",
  card: "💳",
  transfer: "🏦",
  cheque: "📄",
};

export function InvoiceDetail({ invoice, open, onClose, onRefresh }: InvoiceDetailProps) {
  const t = useTranslations("invoice");
  const tp = useTranslations("payment");
  const tc = useTranslations("common");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!invoice) return null;

  const client = typeof invoice.clientId === "string" ? null : invoice.clientId as unknown as IClient;
  const contract = typeof invoice.contractId === "string" ? null : invoice.contractId as unknown as IContract;
  const payments = (invoice.payments ?? []) as IPayment[];
  const paidAmount = invoice.paidAmount ?? 0;
  const remaining = Math.max(0, invoice.totalAmount - paidAmount);

  async function changeStatus(newStatus: string) {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(tc("editSuccess"));
        onRefresh();
        onClose();
      } else {
        let msg = tc("errorOccurred");
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        toast.error(msg);
      }
    } catch {
      toast.error(tc("errorOccurred"));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pr-8">
            <div className="flex items-center gap-3 flex-wrap">
              <SheetTitle className="font-mono">{invoice.invoiceNumber}</SheetTitle>
              <StatusBadge status={invoice.status} label={t(`statuses.${invoice.status}` as Parameters<typeof t>[0])} />
            </div>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-1">
            {/* Client */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
              {t("client")}
            </p>
            {client ? (
              <>
                <Row label="Name" value={`${client.firstName} ${client.lastName}`} />
                <Row label="Phone" value={
                  <a href={`tel:${client.phone}`} className="text-primary hover:underline">{client.phone}</a>
                } />
                {client.email && (
                  <Row label="Email" value={
                    <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                  } />
                )}
              </>
            ) : <p className="text-sm text-muted-foreground">—</p>}

            <Separator className="my-3" />

            {/* Contract reference */}
            {contract && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {t("contract")}
                </p>
                <Row label={t("contractNumber")} value={<span className="font-mono">{(contract as IContract & { contractNumber?: string }).contractNumber}</span>} />
                <Separator className="my-3" />
              </>
            )}

            {/* Line items */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("lineItems")}
            </p>
            <Row label={t("rentalPeriod")} value={formatCurrency(invoice.amount)} />
            {(invoice.lateFees ?? 0) > 0 && (
              <Row label={t("lateFees")} value={
                <span className="text-amber-600 dark:text-amber-400">{formatCurrency(invoice.lateFees ?? 0)}</span>
              } />
            )}
            {invoice.tax > 0 && (
              <Row label={t("tax")} value={formatCurrency(invoice.tax)} />
            )}
            <div className="flex items-center justify-between py-1.5 border-t mt-1">
              <span className="text-sm font-bold">{t("totalAmount")}</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>

            <Separator className="my-3" />

            {/* Payment summary */}
            <Row label={t("paidAmount")} value={
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {formatCurrency(paidAmount)}
              </span>
            } />
            <div className="flex items-center justify-between py-1.5">
              <span className="text-sm font-semibold">{t("remainingBalance")}</span>
              <span className={`text-sm font-bold ${remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {formatCurrency(remaining)}
              </span>
            </div>

            {/* Due date */}
            {invoice.dueDate && (
              <Row label={t("dueDate")} value={formatDateShort(invoice.dueDate)} />
            )}
            {invoice.paidAt && (
              <Row label={t("paidAt")} value={formatDateShort(invoice.paidAt)} />
            )}
            {invoice.notes && (
              <Row label={t("notes")} value={invoice.notes} />
            )}

            <Separator className="my-3" />

            {/* Payment history */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("paymentHistory")}
            </p>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">{t("noPayments")}</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{METHOD_ICONS[p.method as string] ?? "💰"}</span>
                      <div>
                        <p className="font-medium">{tp(`methods.${p.method as PaymentMethod}` as Parameters<typeof tp>[0])}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateShort(p.date)}
                          {p.reference && ` · ${p.reference}`}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {(invoice.status === "draft" || invoice.status === "sent" || invoice.status === "overdue") && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-col gap-2">
                  {invoice.status === "draft" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => changeStatus("sent")}
                    >
                      {t("markAsSent")}
                    </Button>
                  )}
                  {(invoice.status === "sent" || invoice.status === "overdue") && remaining > 0 && (
                    <Button
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => setPaymentOpen(true)}
                    >
                      {t("recordPayment")}
                    </Button>
                  )}
                  {["draft", "sent", "overdue"].includes(invoice.status) && (
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      disabled={actionLoading}
                      onClick={() => changeStatus("cancelled")}
                    >
                      Cancel invoice
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PaymentForm
        invoice={paymentOpen ? invoice : null}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => {
          onRefresh();
          setPaymentOpen(false);
          onClose();
        }}
      />
    </>
  );
}
