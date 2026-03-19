"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { InvoiceForm } from "./invoice-form";
import { InvoiceDetail } from "./invoice-detail";
import { useInvoices } from "@/hooks/use-invoices";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient } from "@/types";
import type { PopulatedInvoice } from "@/hooks/use-invoices";

const STATUS_TABS = ["all", "draft", "sent", "paid", "overdue", "cancelled"] as const;
const PAGE_SIZE = 20;

export function InvoiceTable() {
  const t = useTranslations("invoice");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<PopulatedInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PopulatedInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { invoices, total, statusCounts, isLoading, refresh } = useInvoices({
    search: debouncedSearch,
    status: statusFilter,
    page,
    limit: PAGE_SIZE,
  });

  const handleFormSuccess = () => {
    refresh();
    toast.success(tc("addSuccess"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deleteTarget._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(tc("deleteSuccess"));
        refresh();
      } else {
        let msg = tc("errorOccurred");
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        toast.error(msg);
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilter = !!search || statusFilter !== "all";

  function clientName(inv: PopulatedInvoice) {
    const c = inv.clientId as IClient;
    return typeof c === "string" ? "—" : `${c.firstName} ${c.lastName}`;
  }

  // Fetch fresh invoice for detail view (includes payments)
  async function openDetail(inv: PopulatedInvoice) {
    try {
      const res = await fetch(`/api/invoices/${inv._id}`);
      const json = await res.json();
      if (json.success) setDetailInvoice(json.data);
      else setDetailInvoice(inv);
    } catch {
      setDetailInvoice(inv);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("invoicing")}
        subtitle={t("subtitle", { count: total })}
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addNew")}
          </Button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
        <TabsList className="h-auto flex-wrap gap-1">
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {s === "all" ? tc("all") : t(`statuses.${s}` as Parameters<typeof t>[0])}
              <span className="ml-1.5 text-muted-foreground">{statusCounts[s] ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && invoices.length === 0 && (
        <EmptyState
          title={t("notFound")}
          description={hasFilter ? tc("noResultsDesc") : t("notFoundDesc")}
          action={!hasFilter ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addNew")}
            </Button>
          ) : undefined}
        />
      )}

      {/* Desktop table */}
      {!isLoading && invoices.length > 0 && (
        <>
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("client")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                  <TableHead className="text-right">{t("tax")}</TableHead>
                  <TableHead className="text-right">{t("totalAmount")}</TableHead>
                  <TableHead>{t("dueDate")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv._id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openDetail(inv)}
                  >
                    <TableCell className="font-mono text-sm font-semibold">{inv.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{clientName(inv)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {inv.tax > 0 ? formatCurrency(inv.tax) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.dueDate ? formatDateShort(inv.dueDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} label={t(`statuses.${inv.status}` as Parameters<typeof t>[0])} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(inv)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {inv.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(inv)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {invoices.map((inv) => (
              <Card
                key={inv._id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => openDetail(inv)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{inv.invoiceNumber}</span>
                    <StatusBadge status={inv.status} label={t(`statuses.${inv.status}` as Parameters<typeof t>[0])} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{clientName(inv)}</span>
                    <span className="font-bold">{formatCurrency(inv.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{inv.dueDate ? `Due: ${formatDateShort(inv.dueDate)}` : "No due date"}</span>
                    {(inv.paidAmount ?? 0) > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Paid: {formatCurrency(inv.paidAmount ?? 0)}
                      </span>
                    )}
                  </div>
                  {inv.status === "draft" && (
                    <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(inv)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
              <span>{tc("page")} {page} / {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {tc("previous")}
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {tc("next")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <InvoiceForm open={formOpen} onClose={() => setFormOpen(false)} onSuccess={handleFormSuccess} />

      <InvoiceDetail
        invoice={detailInvoice}
        open={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        onRefresh={() => {
          refresh();
          if (detailInvoice) openDetail(detailInvoice);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={tc("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
