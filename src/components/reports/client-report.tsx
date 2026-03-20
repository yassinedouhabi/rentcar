"use client";

import { useTranslations } from "next-intl";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ClientData {
  topClients: {
    clientId: string;
    firstName: string;
    lastName: string;
    clientType: string;
    totalRentals: number;
    totalSpent: number;
    city: string | null;
  }[];
  byType: { type: string; count: number }[];
  newPerMonth: { month: string; count: number }[];
  totalClients: number;
  newThisMonth: number;
  newInRange: number;
}

interface Props {
  data: ClientData | null;
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

const TYPE_COLORS: Record<string, string> = {
  regular: "#3b82f6",
  vip: "#f59e0b",
  blacklisted: "#ef4444",
};

const TYPE_FALLBACK = "#94a3b8";

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

export function ClientReport({ data, loading }: Props) {
  const t = useTranslations("report");
  const tc = useTranslations("client");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
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

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard label={t("clients.total")} value={String(data.totalClients)} />
        <KpiCard label={t("clients.newThisMonth")} value={String(data.newThisMonth)} />
        <KpiCard label={t("clients.newInRange")} value={String(data.newInRange)} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie chart by type */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-4">{t("clients.byType")}</p>
          {data.byType.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.byType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ count }: any) => `${count}`}
                  labelLine={false}
                >
                  {data.byType.map((entry) => (
                    <Cell
                      key={entry.type}
                      fill={TYPE_COLORS[entry.type] ?? TYPE_FALLBACK}
                    />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any, name: any) => [v, tc(`types.${name}` as Parameters<typeof tc>[0])]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  formatter={(value) => tc(`types.${value}` as Parameters<typeof tc>[0])}
                  iconSize={10}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* New clients per month */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-4">{t("clients.newPerMonth")}</p>
          {data.newPerMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.newPerMonth} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <XAxis dataKey="month" tick={(p: any) => <MonthLabel {...p} />} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [v, t("clients.newInRange")]}
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
                <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top clients table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium">{t("clients.topClients")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clients.name")}</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("clients.type")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clients.rentals")}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("clients.spent")}</th>
              </tr>
            </thead>
            <tbody>
              {data.topClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-8">{t("noData")}</td>
                </tr>
              ) : (
                data.topClients.map((c, i) => (
                  <tr key={c.clientId} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{c.firstName} {c.lastName}</p>
                      {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: TYPE_COLORS[c.clientType] ?? TYPE_FALLBACK }}
                      >
                        {tc(`types.${c.clientType}` as Parameters<typeof tc>[0])}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">{c.totalRentals}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.totalSpent)}
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
