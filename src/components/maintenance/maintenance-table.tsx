"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MaintenanceForm } from "./maintenance-form";
import { MaintenanceDetail } from "./maintenance-detail";
import { useMaintenance } from "@/hooks/use-maintenance";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { IMaintenance, IVehicle, MaintenanceType, MaintenanceStatus } from "@/types";

type StatusTab = "all" | MaintenanceStatus;
const PAGE_SIZE = 20;

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const TYPE_STYLES: Record<MaintenanceType, string> = {
  oil_change: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  tires: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  brakes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  inspection: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  repair: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-muted text-muted-foreground",
};

function vehicleLabel(vehicleId: IMaintenance["vehicleId"]): { label: string; plate: string } {
  if (typeof vehicleId === "object" && vehicleId) {
    const v = vehicleId as IVehicle;
    return { label: `${v.brand} ${v.model}`, plate: v.plate };
  }
  return { label: "—", plate: "" };
}

function isNextDueSoon(record: IMaintenance): boolean {
  if (!record.nextDue || record.status === "completed") return false;
  return new Date(record.nextDue) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export function MaintenanceTable() {
  const t = useTranslations("maintenance");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [page, setPage] = useState(1);

  const [selectedRecord, setSelectedRecord] = useState<IMaintenance | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<IMaintenance | null | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IMaintenance | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { records, total, totalCost, isLoading, refresh } = useMaintenance({
    status: statusTab === "all" ? undefined : statusTab,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleOpenAdd = () => {
    setEditRecord(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (r: IMaintenance) => {
    setEditRecord(r);
    setDetailOpen(false);
    setFormOpen(true);
  };

  const handleOpenDetail = (r: IMaintenance) => {
    setSelectedRecord(r);
    setDetailOpen(true);
  };

  const handleFormSuccess = () => {
    refresh();
    toast.success(editRecord ? tc("editSuccess") : tc("addSuccess"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/maintenance/${deleteTarget._id}`, { method: "DELETE" });
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

  const tabs: { value: StatusTab; label: string }[] = [
    { value: "all", label: tc("all") },
    { value: "scheduled", label: t("statuses.scheduled") },
    { value: "in_progress", label: t("statuses.in_progress") },
    { value: "completed", label: t("statuses.completed") },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("maintenance")}
        subtitle={t("subtitle", { count: total })}
        action={
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addNew")}
          </Button>
        }
      />

      {/* Total cost summary */}
      <div className="rounded-lg border p-4 flex items-center justify-between bg-muted/30">
        <span className="text-sm text-muted-foreground">{t("totalCost")}</span>
        <span className="text-lg font-semibold tabular-nums">
          {isLoading ? "—" : formatCurrency(totalCost)}
        </span>
      </div>

      {/* Status tabs */}
      <Tabs
        value={statusTab}
        onValueChange={(v) => { setStatusTab(v as StatusTab); setPage(1); }}
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("vehicle")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead className="text-right">{t("cost")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("nextDue")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="w-24">{tc("actions")}</TableHead>
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
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 p-0">
                  <EmptyState
                    icon={Wrench}
                    title={t("notFound")}
                    description={t("notFoundDesc")}
                    action={
                      <Button size="sm" onClick={handleOpenAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("addNew")}
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => {
                const { label, plate } = vehicleLabel(r.vehicleId);
                const dueSoon = isNextDueSoon(r);
                return (
                  <TableRow
                    key={r._id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleOpenDetail(r)}
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{plate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[r.type]}`}>
                        {t(`types.${r.type}` as Parameters<typeof t>[0])}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                      {r.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-sm">
                      {formatCurrency(r.cost)}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                    <TableCell className="text-sm">
                      {r.nextDue ? (
                        <span className={`flex items-center gap-1 ${dueSoon ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>
                          {dueSoon && <AlertTriangle className="w-3.5 h-3.5" />}
                          {formatDate(r.nextDue)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                        {t(`statuses.${r.status}` as Parameters<typeof t>[0])}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleOpenEdit(r)}
                        >
                          {tc("edit")}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(r)}
                        >
                          {tc("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
        ) : records.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={t("notFound")}
            description={t("notFoundDesc")}
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="w-4 h-4 mr-2" />
                {t("addNew")}
              </Button>
            }
          />
        ) : (
          records.map((r) => {
            const { label, plate } = vehicleLabel(r.vehicleId);
            const dueSoon = isNextDueSoon(r);
            return (
              <Card key={r._id} className="cursor-pointer" onClick={() => handleOpenDetail(r)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[r.type]}`}>
                          {t(`types.${r.type}` as Parameters<typeof t>[0])}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                          {t(`statuses.${r.status}` as Parameters<typeof t>[0])}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{plate}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.description}</p>
                      )}
                      {r.nextDue && (
                        <p className={`text-xs mt-0.5 flex items-center gap-1 ${dueSoon ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                          {dueSoon && <AlertTriangle className="w-3 h-3" />}
                          {t("nextDue")}: {formatDate(r.nextDue)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-semibold tabular-nums text-sm">{formatCurrency(r.cost)}</span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleOpenEdit(r)}>
                          {tc("edit")}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)}>
                          {tc("delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
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

      <MaintenanceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        record={editRecord}
      />

      <MaintenanceDetail
        record={selectedRecord}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => selectedRecord && handleOpenEdit(selectedRecord)}
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
