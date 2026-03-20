"use client";

import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface FleetVehicle {
  vehicleId: string;
  brand: string;
  model: string;
  plate: string;
  status: string;
  rentalsCount: number;
  totalDays: number;
  kmDriven: number;
  revenue: number;
  maintenanceCost: number;
  utilizationRate: number;
}

interface FleetData {
  fleet: FleetVehicle[];
  totalRevenue: number;
  totalMaintenanceCost: number;
  avgUtilization: number;
  periodDays: number;
}

interface Props {
  data: FleetData | null;
  loading: boolean;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const UTIL_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

function utilColor(rate: number) {
  if (rate >= 70) return UTIL_COLORS[0];
  if (rate >= 40) return UTIL_COLORS[1];
  if (rate >= 15) return UTIL_COLORS[2];
  return UTIL_COLORS[3];
}

export function FleetReport({ data, loading }: Props) {
  const t = useTranslations("report");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg border border-border bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground text-sm">{t("noData")}</p>;

  const chartData = [...data.fleet]
    .sort((a, b) => b.utilizationRate - a.utilizationRate)
    .map((v) => ({
      name: `${v.brand} ${v.model}`,
      plate: v.plate,
      rate: v.utilizationRate,
    }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard
          label={t("fleet.totalRevenue")}
          value={formatCurrency(data.totalRevenue)}
        />
        <KpiCard
          label={t("fleet.avgUtilization")}
          value={`${data.avgUtilization}%`}
          sub={`${data.periodDays} day period`}
        />
        <KpiCard
          label={t("fleet.maintenanceCost")}
          value={formatCurrency(data.totalMaintenanceCost)}
        />
      </div>

      {/* Utilization bar chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium mb-4">{t("fleet.utilization")}</p>
        {data.fleet.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="plate"
                type="category"
                width={80}
                tick={{ fontSize: 11, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`${v}%`, t("fleet.rate")]}
                labelFormatter={(l) => {
                  const item = chartData.find((d) => d.plate === l);
                  return item ? `${item.name} (${item.plate})` : l;
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="rate" radius={[0, 3, 3, 0]} maxBarSize={20}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={utilColor(entry.rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Vehicle table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium">{t("fleet.vehicle")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("fleet.vehicle")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("fleet.rentals")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("fleet.days")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("fleet.km")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("fleet.revenue")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("fleet.maintenance")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("fleet.rate")}</th>
              </tr>
            </thead>
            <tbody>
              {data.fleet.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">{t("noData")}</td>
                </tr>
              ) : (
                data.fleet.map((v) => (
                  <tr key={v.vehicleId} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{v.brand} {v.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.plate}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">{v.rentalsCount}</td>
                    <td className="px-4 py-2.5 text-right">{v.totalDays}</td>
                    <td className="px-4 py-2.5 text-right hidden md:table-cell">
                      {v.kmDriven > 0 ? `${v.kmDriven.toLocaleString()} km` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(v.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden md:table-cell text-amber-600 dark:text-amber-400">
                      {v.maintenanceCost > 0 ? formatCurrency(v.maintenanceCost) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: utilColor(v.utilizationRate) }}
                      >
                        {v.utilizationRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
