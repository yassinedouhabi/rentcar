"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Users, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { ClientForm } from "./client-form";
import { ClientDetail } from "./client-detail";
import { useClients } from "@/hooks/use-clients";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import type { IClient, ClientType } from "@/types";

const TYPE_TABS = ["all", "regular", "vip", "blacklisted"] as const;
const PAGE_SIZE = 24;

export function ClientGrid() {
  const t = useTranslations("client");
  const tc = useTranslations("common");
  const tp = useTranslations("pages");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [detailClient, setDetailClient] = useState<IClient | null>(null);
  const [editClient, setEditClient] = useState<IClient | null | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IClient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { clients, total, typeCounts, isLoading, refresh } = useClients({
    search: debouncedSearch,
    type: typeFilter,
    page,
    limit: PAGE_SIZE,
  });

  const typeLabel = useCallback(
    (type: ClientType) => t(`types.${type}` as Parameters<typeof t>[0]),
    [t]
  );

  const handleOpenAdd = () => {
    setEditClient(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (c: IClient) => {
    setDetailClient(null);
    setEditClient(c);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    refresh();
    toast.success(editClient ? tc("editSuccess") : tc("addSuccess"));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteTarget._id}`, { method: "DELETE" });
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

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilter = !!search || typeFilter !== "all";

  return (
    <div className="space-y-5">
      <PageHeader
        title={tp("clients")}
        subtitle={t("subtitle", { count: total })}
        action={
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {t("addNew")}
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {/* Type tabs */}
      <Tabs value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          {TYPE_TABS.map((type) => {
            const count = typeCounts[type] ?? 0;
            const label = type === "all" ? tc("all") : typeLabel(type as ClientType);
            return (
              <TabsTrigger
                key={type}
                value={type}
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => {
            const initials = `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
            return (
              <div
                key={c._id}
                className="rounded-xl border bg-card p-4 flex flex-col gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setDetailClient(c)}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <Avatar size="lg" className="w-11 h-11 flex-shrink-0">
                    <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {c.firstName} {c.lastName}
                    </p>
                    {c.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {c.city}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    status={c.clientType}
                    label={typeLabel(c.clientType)}
                  />
                </div>

                {/* Contact info */}
                <div className="space-y-1">
                  <p className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.phone}</span>
                  </p>
                  {c.email && (
                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t("totalRentals")}</p>
                    <p className="text-sm font-semibold tabular-nums">{c.totalRentals ?? 0}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t("totalSpent")}</p>
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(c.totalSpent ?? 0)}</p>
                  </div>
                  {c.cin && (
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("cin")}</p>
                      <p className="text-xs font-mono font-medium truncate">{c.cin}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  className="flex gap-1 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-7 text-xs"
                    onClick={() => handleOpenEdit(c)}
                  >
                    {tc("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(c)}
                  >
                    {tc("delete")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
      <ClientDetail
        client={detailClient}
        open={!!detailClient}
        onClose={() => setDetailClient(null)}
        onEdit={handleOpenEdit}
      />

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        client={editClient}
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
