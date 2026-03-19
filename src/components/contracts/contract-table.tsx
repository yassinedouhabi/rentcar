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
import { ContractForm } from "./contract-form";
import { ContractDetail } from "./contract-detail";
import { ReturnForm } from "./return-form";
import { useContracts } from "@/hooks/use-contracts";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient, IVehicle } from "@/types";
import type { PopulatedContract } from "@/hooks/use-contracts";

const STATUS_TABS = ["all", "active", "completed", "disputed"] as const;
const PAGE_SIZE = 20;

export function ContractTable() {
  const t = useTranslations("contract");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [detailContract, setDetailContract] = useState<PopulatedContract | null>(null);
  const [returnContract, setReturnContract] = useState<PopulatedContract | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PopulatedContract | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { contracts, total, statusCounts, isLoading, refresh } = useContracts({
    search: debouncedSearch,
    status: statusFilter,
    page,
    limit: PAGE_SIZE,
  });

  const handleFormSuccess = () => {
    refresh();
    toast.success(tc("addSuccess"));
  };

  const handleReturnSuccess = () => {
    refresh();
    toast.success(tc("editSuccess"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contracts/${deleteTarget._id}`, { method: "DELETE" });
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

  function clientName(c: PopulatedContract) {
    const cl = c.clientId as IClient;
    return typeof cl === "string" ? "—" : `${cl.firstName} ${cl.lastName}`;
  }
  function vehicleName(c: PopulatedContract) {
    const v = c.vehicleId as IVehicle;
    return typeof v === "string" ? "—" : `${v.brand} ${v.model}`;
  }
  function vehiclePlate(c: PopulatedContract) {
    const v = c.vehicleId as IVehicle;
    return typeof v === "string" ? "" : v.plate;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("contracts")}
        subtitle={t("subtitle", { count: total })}
        action={
          <Button onClick={() => setFormOpen(true)}>
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
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
        <TabsList className="h-auto flex-wrap gap-1">
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {s === "all" ? tc("all") : t(`statuses.${s}` as Parameters<typeof t>[0])}
              <span className="ml-1.5 text-muted-foreground">
                {statusCounts[s] ?? 0}
              </span>
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
      {!isLoading && contracts.length === 0 && (
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
      {!isLoading && contracts.length > 0 && (
        <>
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("contractNumber")}</TableHead>
                  <TableHead>{t("client")}</TableHead>
                  <TableHead>{t("vehicle")}</TableHead>
                  <TableHead>{t("signedAt")}</TableHead>
                  <TableHead>{t("mileageOut")}</TableHead>
                  <TableHead>{t("mileageIn")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow
                    key={c._id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setDetailContract(c)}
                  >
                    <TableCell className="font-mono text-sm font-semibold">{c.contractNumber}</TableCell>
                    <TableCell className="font-medium">{clientName(c)}</TableCell>
                    <TableCell>
                      <span>{vehicleName(c)}</span>
                      {vehiclePlate(c) && (
                        <span className="ml-2 text-xs font-mono text-muted-foreground">{vehiclePlate(c)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.signedAt ? formatDateShort(c.signedAt) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.mileageOut != null ? `${c.mileageOut.toLocaleString()} km` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.mileageIn != null ? `${c.mileageIn.toLocaleString()} km` : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} label={t(`statuses.${c.status}` as Parameters<typeof t>[0])} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDetailContract(c)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {c.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(c)}
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
            {contracts.map((c) => (
              <Card
                key={c._id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setDetailContract(c)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{c.contractNumber}</span>
                    <StatusBadge status={c.status} label={t(`statuses.${c.status}` as Parameters<typeof t>[0])} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{clientName(c)}</span>
                    <span className="text-muted-foreground">{vehicleName(c)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.signedAt ? formatDateShort(c.signedAt) : "—"}</span>
                    <span className="font-mono">
                      {c.mileageOut != null ? `Out: ${c.mileageOut.toLocaleString()} km` : ""}
                      {c.mileageIn != null ? ` · In: ${c.mileageIn.toLocaleString()} km` : ""}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    {c.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => setReturnContract(c)}>
                        {t("returnVehicle")}
                      </Button>
                    )}
                    {c.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
              <span>
                {tc("page")} {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {tc("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {tc("next")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sheets */}
      <ContractForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ContractDetail
        contract={detailContract}
        open={!!detailContract}
        onClose={() => setDetailContract(null)}
        onReturn={(c) => {
          setDetailContract(null);
          setReturnContract(c);
        }}
      />

      <ReturnForm
        contract={returnContract}
        open={!!returnContract}
        onClose={() => setReturnContract(null)}
        onSuccess={handleReturnSuccess}
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
