"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Plus, Search, Car } from "lucide-react";
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
import { VehicleForm } from "./vehicle-form";
import { VehicleDetail } from "./vehicle-detail";
import { getVehicleColumns } from "./columns";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import type { IVehicle, VehicleStatus } from "@/types";

const STATUS_TABS = ["all", "available", "rented", "reserved", "maintenance"] as const;
const PAGE_SIZE = 20;

export function VehicleTable() {
  const t = useTranslations("vehicle");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [detailVehicle, setDetailVehicle] = useState<IVehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<IVehicle | null | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IVehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { vehicles, total, statusCounts, isLoading, refresh } = useVehicles({
    search: debouncedSearch,
    status: statusFilter,
    page,
    limit: PAGE_SIZE,
  });

  const statusLabel = useCallback(
    (status: VehicleStatus) => t(`statuses.${status}` as Parameters<typeof t>[0]),
    [t]
  );

  const handleOpenAdd = () => {
    setEditVehicle(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (v: IVehicle) => {
    setDetailVehicle(null);
    setEditVehicle(v);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    refresh();
    toast.success(editVehicle ? tc("editSuccess") : tc("addSuccess"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${deleteTarget._id}`, { method: "DELETE" });
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

  const columns = getVehicleColumns({
    onView: setDetailVehicle,
    onEdit: handleOpenEdit,
    onDelete: setDeleteTarget,
    statusLabel,
    t: (key) => {
      const map: Record<string, string> = {
        brand: t("brand"), model: t("model"), plate: t("plate"),
        fuel: t("fuel"), mileage: t("mileage"), dailyRate: t("dailyRate"),
        status: t("status"), insuranceExpiry: t("insuranceExpiry"),
        viewDetails: t("viewDetails"), edit: t("edit"), delete: tc("delete"),
      };
      return map[key] ?? key;
    },
  });

  const table = useReactTable({
    data: vehicles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("vehicles")}
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
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          {STATUS_TABS.map((s) => {
            const count = statusCounts[s] ?? 0;
            const label = s === "all" ? tc("all") : statusLabel(s as VehicleStatus);
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
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 p-0">
                  <EmptyState
                    icon={Car}
                    title={search || statusFilter !== "all" ? tc("noResults") : t("notFound")}
                    description={search || statusFilter !== "all" ? tc("noResultsDesc") : t("notFoundDesc")}
                    action={
                      !search && statusFilter === "all" ? (
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDetailVehicle(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title={search || statusFilter !== "all" ? tc("noResults") : t("notFound")}
            description={search || statusFilter !== "all" ? tc("noResultsDesc") : t("notFoundDesc")}
            action={
              !search && statusFilter === "all" ? (
                <Button size="sm" onClick={handleOpenAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addNew")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          vehicles.map((v) => (
            <Card
              key={v._id}
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setDetailVehicle(v)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {v.brand} {v.model}
                      {v.year && <span className="text-muted-foreground font-normal"> · {v.year}</span>}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{v.plate}</p>
                    <p className="text-sm font-semibold mt-1 tabular-nums">{formatCurrency(v.dailyRate)}/j</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={v.status} label={statusLabel(v.status)} />
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleOpenEdit(v)}>
                        {tc("edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(v)}
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
      <VehicleDetail
        vehicle={detailVehicle}
        open={!!detailVehicle}
        onClose={() => setDetailVehicle(null)}
        onEdit={handleOpenEdit}
      />

      <VehicleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        vehicle={editVehicle}
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
