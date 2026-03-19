"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { usePayments } from "@/hooks/use-payments";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IInvoice, PaymentMethod } from "@/types";
import type { PopulatedPayment } from "@/hooks/use-payments";

const METHODS = ["cash", "card", "transfer", "cheque"] as const;
const PAGE_SIZE = 20;

export function PaymentTable() {
  const t = useTranslations("payment");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { payments, total, isLoading } = usePayments({
    search: debouncedSearch,
    method: methodFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilter = !!search || !!methodFilter || !!dateFrom || !!dateTo;

  function clientName(p: PopulatedPayment) {
    const c = p.clientId as IClient;
    return typeof c === "string" ? "—" : `${c.firstName} ${c.lastName}`;
  }
  function invoiceNumber(p: PopulatedPayment) {
    const inv = p.invoiceId as IInvoice;
    return typeof inv === "string" ? "—" : inv.invoiceNumber;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("payments")}
        subtitle={t("subtitle", { count: total })}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v === "all" ? "" : (v ?? "")); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t("method")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("all")}</SelectItem>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`methods.${m}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-36"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-36"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && payments.length === 0 && (
        <EmptyState
          title={t("notFound")}
          description={hasFilter ? tc("noResultsDesc") : t("notFoundDesc")}
        />
      )}

      {/* Desktop table */}
      {!isLoading && payments.length > 0 && (
        <>
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("invoice")}</TableHead>
                  <TableHead>{t("client")}</TableHead>
                  <TableHead>{t("method")}</TableHead>
                  <TableHead>{t("reference")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateShort(p.date)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold">
                      {invoiceNumber(p)}
                    </TableCell>
                    <TableCell className="font-medium">{clientName(p)}</TableCell>
                    <TableCell className="text-sm">
                      {t(`methods.${p.method as PaymentMethod}` as Parameters<typeof t>[0])}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.reference || "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => (
              <Card key={p._id}>
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{invoiceNumber(p)}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{clientName(p)}</span>
                    <span>{t(`methods.${p.method as PaymentMethod}` as Parameters<typeof t>[0])}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDateShort(p.date)}</span>
                    {p.reference && <span className="font-mono">{p.reference}</span>}
                  </div>
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
    </div>
  );
}
