"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RevenueReport } from "@/components/reports/revenue-report";
import { FleetReport } from "@/components/reports/fleet-report";
import { ClientReport } from "@/components/reports/client-report";
import { ExpenseReport } from "@/components/reports/expense-report";
import { ExportButton } from "@/components/reports/export-button";
import { formatCurrency } from "@/lib/utils";

type Preset = "3m" | "6m" | "year" | "lastyear";

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "3m": {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 3);
      return { from: fmt(from), to: fmt(now) };
    }
    case "6m": {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 6);
      return { from: fmt(from), to: fmt(now) };
    }
    case "year":
      return {
        from: `${now.getFullYear()}-01-01`,
        to: `${now.getFullYear()}-12-31`,
      };
    case "lastyear":
      return {
        from: `${now.getFullYear() - 1}-01-01`,
        to: `${now.getFullYear() - 1}-12-31`,
      };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

function buildQuery(from: string, to: string) {
  return `?from=${from}&to=${to}`;
}

export default function ReportsPage() {
  const t = useTranslations("report");
  const [preset, setPreset] = useState<Preset>("year");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [useCustom, setUseCustom] = useState(false);

  const range = useCustom && custom.from && custom.to ? custom : getPresetRange(preset);
  const query = buildQuery(range.from, range.to);

  const { data: revenueData, isLoading: revenueLoading } = useSWR(
    `/api/reports/revenue${query}`,
    fetcher,
    { keepPreviousData: true }
  );
  const { data: fleetData, isLoading: fleetLoading } = useSWR(
    `/api/reports/fleet${query}`,
    fetcher,
    { keepPreviousData: true }
  );
  const { data: clientData, isLoading: clientLoading } = useSWR(
    `/api/reports/clients${query}`,
    fetcher,
    { keepPreviousData: true }
  );
  const { data: expenseData, isLoading: expenseLoading } = useSWR(
    `/api/reports/expenses${query}`,
    fetcher,
    { keepPreviousData: true }
  );

  const handlePreset = useCallback((p: Preset) => {
    setPreset(p);
    setUseCustom(false);
  }, []);

  const handleApplyCustom = useCallback(() => {
    if (custom.from && custom.to) setUseCustom(true);
  }, [custom]);

  const rangeLabel = `${range.from} → ${range.to}`;

  // Export data helpers
  const revenueExportData = revenueData ? {
    kpis: [
      { label: t("revenue.total"), value: formatCurrency(revenueData.total) },
      { label: t("revenue.count"), value: String(revenueData.count) },
      { label: t("revenue.average"), value: formatCurrency(revenueData.averagePerRental) },
    ],
    headers: ["Véhicule", "Immatriculation", "Revenus", "Locations"],
    rows: (revenueData.byVehicle ?? []).map((v: { brand: string; model: string; plate: string; revenue: number; count: number }) => ({
      cells: [`${v.brand} ${v.model}`, v.plate, formatCurrency(v.revenue), String(v.count)],
    })),
  } : { kpis: [], headers: [], rows: [] };

  const fleetExportData = fleetData ? {
    kpis: [
      { label: t("fleet.totalRevenue"), value: formatCurrency(fleetData.totalRevenue) },
      { label: t("fleet.avgUtilization"), value: `${fleetData.avgUtilization}%` },
      { label: t("fleet.maintenanceCost"), value: formatCurrency(fleetData.totalMaintenanceCost) },
    ],
    headers: ["Véhicule", "Plaque", "Locations", "Revenus", "Utilisation"],
    rows: (fleetData.fleet ?? []).map((v: { brand: string; model: string; plate: string; rentalsCount: number; revenue: number; utilizationRate: number }) => ({
      cells: [`${v.brand} ${v.model}`, v.plate, String(v.rentalsCount), formatCurrency(v.revenue), `${v.utilizationRate}%`],
    })),
  } : { kpis: [], headers: [], rows: [] };

  const clientExportData = clientData ? {
    kpis: [
      { label: t("clients.total"), value: String(clientData.totalClients) },
      { label: t("clients.newThisMonth"), value: String(clientData.newThisMonth) },
      { label: t("clients.newInRange"), value: String(clientData.newInRange) },
    ],
    headers: ["Client", "Type", "Locations", "Total dépensé"],
    rows: (clientData.topClients ?? []).map((c: { firstName: string; lastName: string; clientType: string; totalRentals: number; totalSpent: number }) => ({
      cells: [`${c.firstName} ${c.lastName}`, c.clientType, String(c.totalRentals), formatCurrency(c.totalSpent)],
    })),
  } : { kpis: [], headers: [], rows: [] };

  const expenseExportData = expenseData ? {
    kpis: [
      { label: t("expenses.total"), value: formatCurrency(expenseData.totalExpenses) },
      { label: t("expenses.revenue"), value: formatCurrency(expenseData.totalRevenue) },
      { label: t("expenses.profit"), value: formatCurrency(expenseData.profit) },
      { label: t("expenses.margin"), value: `${expenseData.profitMargin}%` },
    ],
    headers: ["Catégorie", "Nb", "Total"],
    rows: (expenseData.byCategory ?? []).map((c: { category: string; count: number; total: number }) => ({
      cells: [c.category, String(c.count), formatCurrency(c.total)],
    })),
  } : { kpis: [], headers: [], rows: [] };

  return (
    <div className="space-y-4">
      {/* Date range controls */}
      <div className="flex flex-wrap items-center gap-2">
        {(["3m", "6m", "year", "lastyear"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePreset(p)}
            className={`h-8 px-3 rounded-md text-xs font-medium transition-colors border ${
              !useCustom && preset === p
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {t(`period.${p}`)}
          </button>
        ))}

        {/* Custom range */}
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="date"
            value={custom.from}
            onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
            className="h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <input
            type="date"
            value={custom.to}
            onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
            className="h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground"
          />
          <button
            onClick={handleApplyCustom}
            disabled={!custom.from || !custom.to}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40"
          >
            {t("apply")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="revenue">{t("tabs.revenue")}</TabsTrigger>
          <TabsTrigger value="fleet">{t("tabs.fleet")}</TabsTrigger>
          <TabsTrigger value="clients">{t("tabs.clients")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("tabs.expenses")}</TabsTrigger>
        </TabsList>

        {/* Revenue tab */}
        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
            <ExportButton
              title={t("tabs.revenue")}
              subtitle={rangeLabel}
              kpis={revenueExportData.kpis}
              tableHeaders={revenueExportData.headers}
              tableRows={revenueExportData.rows}
              filename={`revenus-${range.from}-${range.to}.pdf`}
              disabled={revenueLoading || !revenueData}
            />
          </div>
          <RevenueReport data={revenueData ?? null} loading={revenueLoading} />
        </TabsContent>

        {/* Fleet tab */}
        <TabsContent value="fleet" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
            <ExportButton
              title={t("tabs.fleet")}
              subtitle={rangeLabel}
              kpis={fleetExportData.kpis}
              tableHeaders={fleetExportData.headers}
              tableRows={fleetExportData.rows}
              filename={`flotte-${range.from}-${range.to}.pdf`}
              disabled={fleetLoading || !fleetData}
            />
          </div>
          <FleetReport data={fleetData ?? null} loading={fleetLoading} />
        </TabsContent>

        {/* Clients tab */}
        <TabsContent value="clients" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
            <ExportButton
              title={t("tabs.clients")}
              subtitle={rangeLabel}
              kpis={clientExportData.kpis}
              tableHeaders={clientExportData.headers}
              tableRows={clientExportData.rows}
              filename={`clients-${range.from}-${range.to}.pdf`}
              disabled={clientLoading || !clientData}
            />
          </div>
          <ClientReport data={clientData ?? null} loading={clientLoading} />
        </TabsContent>

        {/* Expenses tab */}
        <TabsContent value="expenses" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{rangeLabel}</p>
            <ExportButton
              title={t("tabs.expenses")}
              subtitle={rangeLabel}
              kpis={expenseExportData.kpis}
              tableHeaders={expenseExportData.headers}
              tableRows={expenseExportData.rows}
              filename={`depenses-${range.from}-${range.to}.pdf`}
              disabled={expenseLoading || !expenseData}
            />
          </div>
          <ExpenseReport data={expenseData ?? null} loading={expenseLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
