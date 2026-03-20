"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button as ActionButton } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExpenseForm } from "./expense-form";
import { useExpenses } from "@/hooks/use-expenses";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IExpense, IVehicle, ExpenseCategory } from "@/types";

const CATEGORIES: ExpenseCategory[] = ["fuel", "repair", "insurance", "tax", "parking", "other"];
const PAGE_SIZE = 20;

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  fuel: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  repair: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  insurance: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  tax: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  parking: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  other: "bg-muted text-muted-foreground",
};

function CategoryBadge({ category, label }: { category: ExpenseCategory; label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category]}`}
    >
      {label}
    </span>
  );
}

function vehicleLabel(vehicleId: IExpense["vehicleId"]): string {
  if (!vehicleId) return "—";
  if (typeof vehicleId === "object") {
    const v = vehicleId as IVehicle;
    return `${v.brand} ${v.model} (${v.plate})`;
  }
  return String(vehicleId);
}

export function ExpenseTable() {
  const t = useTranslations("expense");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [editExpense, setEditExpense] = useState<IExpense | null | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IExpense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { expenses, total, totalAmount, isLoading, refresh } = useExpenses({
    category: categoryFilter,
    dateFrom,
    dateTo,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleOpenAdd = () => {
    setEditExpense(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (e: IExpense) => {
    setEditExpense(e);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    refresh();
    toast.success(editExpense ? tc("editSuccess") : tc("addSuccess"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteTarget._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(tc("deleteSuccess"));
        refresh();
      } else {
        toast.error(tc("errorOccurred"));
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const hasFilters = categoryFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("expenses")}
        subtitle={t("subtitle", { count: total })}
        action={
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addNew")}
          </Button>
        }
      />

      {/* Summary card */}
      <div className="rounded-lg border p-4 flex items-center justify-between bg-muted/30">
        <span className="text-sm text-muted-foreground">{t("totalExpenses")}</span>
        <span className="text-lg font-semibold tabular-nums text-destructive">
          {isLoading ? "—" : formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-48">
          <Select
            value={categoryFilter}
            onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}
          >
            <SelectTrigger>
              <SelectValue placeholder={tc("all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc("all")}</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`categories.${c}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("dateFrom")}</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="flex-1"
          />
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("dateTo")}</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="flex-1"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("date")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{tc("description")}</TableHead>
              <TableHead>{t("vehicle")}</TableHead>
              <TableHead className="text-right">{t("amount")}</TableHead>
              <TableHead className="w-20">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 p-0">
                  <EmptyState
                    icon={Receipt}
                    title={hasFilters ? tc("noResults") : t("notFound")}
                    description={hasFilters ? tc("noResultsDesc") : t("notFoundDesc")}
                    action={
                      !hasFilters ? (
                        <Button size="sm" onClick={handleOpenAdd}>
                          <Plus className="w-4 h-4 mr-2" />
                          {t("addNew")}
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((e) => (
                <TableRow key={e._id} className="hover:bg-muted/50">
                  <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell>
                    <CategoryBadge
                      category={e.category}
                      label={t(`categories.${e.category}` as Parameters<typeof t>[0])}
                    />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{e.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {vehicleLabel(e.vehicleId) === "—" ? (
                      <span className="text-xs italic">{t("noVehicle")}</span>
                    ) : (
                      vehicleLabel(e.vehicleId)
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-destructive">
                    {formatCurrency(e.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleOpenEdit(e)}
                      >
                        {tc("edit")}
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(e)}
                      >
                        {tc("delete")}
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasFilters ? tc("noResults") : t("notFound")}
            description={hasFilters ? tc("noResultsDesc") : t("notFoundDesc")}
            action={
              !hasFilters ? (
                <Button size="sm" onClick={handleOpenAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addNew")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          expenses.map((e) => (
            <Card key={e._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryBadge
                        category={e.category}
                        label={t(`categories.${e.category}` as Parameters<typeof t>[0])}
                      />
                      <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                    </div>
                    <p className="text-sm truncate">{e.description}</p>
                    {e.vehicleId && (
                      <p className="text-xs text-muted-foreground mt-0.5">{vehicleLabel(e.vehicleId)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-semibold tabular-nums text-destructive text-sm">
                      {formatCurrency(e.amount)}
                    </span>
                    <div className="flex gap-1">
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleOpenEdit(e)}
                      >
                        {tc("edit")}
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(e)}
                      >
                        {tc("delete")}
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {tc("showing", {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, total),
              total,
            })}
          </span>
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

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        expense={editExpense}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        description={t("deleteConfirmDesc")}
        loading={deleting}
      />
    </div>
  );
}
