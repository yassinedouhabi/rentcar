"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, CalendarDays } from "lucide-react";
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
import { ReservationForm } from "./reservation-form";
import { ReservationDetail } from "./reservation-detail";
import { useReservations } from "@/hooks/use-reservations";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IVehicle, ReservationStatus } from "@/types";
import type { PopulatedReservation } from "@/hooks/use-reservations";

const STATUS_TABS = ["all", "pending", "confirmed", "active", "completed", "cancelled"] as const;
const PAGE_SIZE = 20;

export function ReservationTable() {
  const t = useTranslations("reservation");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [page, setPage] = useState(1);

  const [detailReservation, setDetailReservation] = useState<PopulatedReservation | null>(null);
  const [editReservation, setEditReservation] = useState<PopulatedReservation | null | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PopulatedReservation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { reservations, total, statusCounts, isLoading, refresh } = useReservations({
    search: debouncedSearch,
    status: statusFilter,
    startFrom,
    startTo,
    page,
    limit: PAGE_SIZE,
  });

  const handleOpenAdd = () => {
    setEditReservation(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (r: PopulatedReservation) => {
    setDetailReservation(null);
    setEditReservation(r);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    refresh();
    toast.success(editReservation ? tc("editSuccess") : tc("addSuccess"));
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(tc("editSuccess"));
        refresh();
        setDetailReservation(null);
      } else {
        toast.error(tc("errorOccurred"));
      }
    } catch {
      toast.error(tc("errorOccurred"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reservations/${deleteTarget._id}`, { method: "DELETE" });
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
  const hasFilter = !!search || statusFilter !== "all" || !!startFrom || !!startTo;

  function clientName(r: PopulatedReservation) {
    const c = r.clientId as IClient;
    return typeof c === "string" ? "—" : `${c.firstName} ${c.lastName}`;
  }
  function clientPhone(r: PopulatedReservation) {
    const c = r.clientId as IClient;
    return typeof c === "string" ? "" : c.phone;
  }
  function vehicleName(r: PopulatedReservation) {
    const v = r.vehicleId as IVehicle;
    return typeof v === "string" ? "—" : `${v.brand} ${v.model}`;
  }
  function vehiclePlate(r: PopulatedReservation) {
    const v = r.vehicleId as IVehicle;
    return typeof v === "string" ? "" : v.plate;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("reservations")}
        subtitle={t("subtitle", { count: total })}
        action={
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addNew")}
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={startFrom}
            onChange={(e) => { setStartFrom(e.target.value); setPage(1); }}
            className="w-36 text-xs"
            title={t("startDate")}
          />
          <span className="text-muted-foreground text-xs">→</span>
          <Input
            type="date"
            value={startTo}
            onChange={(e) => { setStartTo(e.target.value); setPage(1); }}
            className="w-36 text-xs"
            title={t("endDate")}
          />
        </div>
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          {STATUS_TABS.map((s) => {
            const count = statusCounts[s] ?? 0;
            const label = s === "all" ? tc("all") : t(`statuses.${s}` as Parameters<typeof t>[0]);
            return (
              <TabsTrigger
                key={s}
                value={s}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm border"
              >
                {label}
                {!isLoading && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("client")}</TableHead>
              <TableHead>{t("vehicle")}</TableHead>
              <TableHead>{t("startDate")}</TableHead>
              <TableHead>{t("endDate")}</TableHead>
              <TableHead>{t("totalDays")}</TableHead>
              <TableHead>{t("totalPrice")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead className="w-20">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 p-0">
                  <EmptyState
                    icon={CalendarDays}
                    title={hasFilter ? tc("noResults") : t("notFound")}
                    description={hasFilter ? tc("noResultsDesc") : t("notFoundDesc")}
                    action={
                      !hasFilter ? (
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
              reservations.map((r) => (
                <TableRow
                  key={r._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailReservation(r)}
                >
                  <TableCell>
                    <p className="font-medium text-sm">{clientName(r)}</p>
                    <p className="text-xs text-muted-foreground">{clientPhone(r)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{vehicleName(r)}</p>
                    <p className="text-xs font-mono text-muted-foreground">{vehiclePlate(r)}</p>
                  </TableCell>
                  <TableCell className="text-sm">{formatDateShort(r.startDate)}</TableCell>
                  <TableCell className="text-sm">{formatDateShort(r.endDate)}</TableCell>
                  <TableCell className="text-sm tabular-nums">{r.totalDays}</TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(r.totalPrice)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={r.status}
                      label={t(`statuses.${r.status}` as Parameters<typeof t>[0])}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(r)}
                    >
                      {tc("delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={hasFilter ? tc("noResults") : t("notFound")}
            description={hasFilter ? tc("noResultsDesc") : t("notFoundDesc")}
          />
        ) : (
          reservations.map((r) => (
            <Card key={r._id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setDetailReservation(r)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{clientName(r)}</p>
                    <p className="text-xs text-muted-foreground font-mono">{vehicleName(r)} · {vehiclePlate(r)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateShort(r.startDate)} → {formatDateShort(r.endDate)} · {r.totalDays}d
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                      {formatCurrency(r.totalPrice)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge
                      status={r.status}
                      label={t(`statuses.${r.status}` as Parameters<typeof t>[0])}
                    />
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleOpenEdit(r)}>
                        {tc("edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(r)}
                      >
                        {tc("delete")}
                      </Button>
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

      {/* Sheets & Dialogs */}
      <ReservationDetail
        reservation={detailReservation}
        open={!!detailReservation}
        onClose={() => setDetailReservation(null)}
        onEdit={handleOpenEdit}
        onStatusChange={handleStatusChange}
      />

      <ReservationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        reservation={editReservation}
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
