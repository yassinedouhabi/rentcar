"use client";

import { useTranslations } from "next-intl";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ExpenseData {
  byCategory: { category: string; total: number; count: number }[];
  byVehicle: { vehicleId: string; brand: string; model: string; plate: string; total: number }[];
  byMonth: { month: string; total: number }[];
  totalExpenses: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
  count: number;
}

interface Props {
  data: ExpenseData | null;
  loading: boolean;
}

function KpiCard({
  label, value, sub, color,
}: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const CAT_COLORS: Record<string, string> = {
  fuel:      "#3b82f6",
  repair:    "#f97316",
  insurance: "#8b5cf6",
  tax:       "#ef4444",
  parking:   "#06b6d4",
  other:     "#94a3b8",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthLabel(props: any) {
  const { x, y, payload } = props;
  if (!payload?.value) return null;
  const [yr, mo] = String(payload.value).split("-");
  const d = new Date(Number(yr), Number(mo) - 1, 1);
  return (
    <text x={x} y={y + 16} textAnchor="middle" fill="currentColor" fontSize={11}>
      {d.toLocaleString("default", { month: "short" })}
    </text>
  );
}

export function ExpenseReport({ data, loading }: Props) {
  const t = useTranslations("report");
  const te = useTranslations("expense");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-64 rounded-lg border border-border bg-muted/30 animate-pulse" />
          <div className="h-64 rounded-lg border border-border bg-muted/30 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground text-sm">{t("noData")}</p>;

  const isProfit = data.profit >= 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label={t("expenses.total")}
          value={formatCurrency(data.totalExpenses)}
          color="text-red-600 dark:text-red-400"
        />
        <KpiCard
          label={t("expenses.revenue")}
          value={formatCurrency(data.totalRevenue)}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label={t("expenses.profit")}
          value={formatCurrency(data.profit)}
          color={isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
        />
        <KpiCard
          label={t("expenses.margin")}
          value={`${data.profitMargin}%`}
          color={isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie by category */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-4">{t("expenses.byCategory")}</p>
          {data.byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.byCategory}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  labelLine={false}
                >
                  {data.byCategory.map((entry) => (
                    <Cell key={entry.category} fill={CAT_COLORS[entry.category] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any, name: any) => [
                    formatCurrency(v as number),
                    te(`categories.${name}` as Parameters<typeof te>[0]),
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  formatter={(value) => te(`categories.${value}` as Parameters<typeof te>[0])}
                  iconSize={10}
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar by month */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-4">{t("expenses.byMonth")}</p>
          {data.byMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byMonth} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <XAxis dataKey="month" tick={(p: any) => <MonthLabel {...p} />} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [formatCurrency(v as number), t("expenses.total")]}
                  labelFormatter={(l) => {
                    const [y, m] = String(l).split("-");
                    return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", {
                      month: "long", year: "numeric",
                    });
                  }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="total" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium">{t("expenses.byCategory")}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{t("expenses.category")}</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">{t("expenses.count")}</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">{t("expenses.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {data.byCategory.map((row) => (
                <tr key={row.category} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CAT_COLORS[row.category] ?? "#94a3b8" }}
                    />
                    {te(`categories.${row.category}` as Parameters<typeof te>[0])}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{row.count}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By vehicle */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium">{t("expenses.byVehicle")}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{t("fleet.vehicle")}</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">{t("expenses.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {data.byVehicle.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center text-muted-foreground py-6">{t("noData")}</td>
                </tr>
              ) : (
                data.byVehicle.map((v) => (
                  <tr key={v.vehicleId} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{v.brand} {v.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.plate}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(v.total)}
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
