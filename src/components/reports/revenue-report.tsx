"use client";

import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueData {
  byPeriod: { label: string; revenue: number; count: number }[];
  byVehicle: { vehicleId: string; brand: string; model: string; plate: string; revenue: number; count: number }[];
  byClient: { clientId: string; firstName: string; lastName: string; revenue: number; count: number }[];
  total: number;
  averagePerRental: number;
  count: number;
}

interface Props {
  data: RevenueData | null;
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

export function RevenueReport({ data, loading }: Props) {
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

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard label={t("revenue.total")} value={formatCurrency(data.total)} />
        <KpiCard label={t("revenue.count")} value={String(data.count)} />
        <KpiCard
          label={t("revenue.average")}
          value={formatCurrency(data.averagePerRental)}
        />
      </div>

      {/* Bar chart by period */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium mb-4">{t("revenue.byPeriod")}</p>
        {data.byPeriod.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noData")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.byPeriod} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tick={(props: any) => <MonthLabel {...props} />}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [formatCurrency(v as number), t("revenue.total")]}
                labelFormatter={(l) => {
                  const [y, m] = String(l).split("-");
                  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  });
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two-column tables */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* By vehicle */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-3">{t("revenue.byVehicle")}</p>
          {data.byVehicle.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          ) : (
            <div className="space-y-2">
              {data.byVehicle.map((v, i) => (
                <div key={v.vehicleId} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.brand} {v.model}</p>
                    <p className="text-xs text-muted-foreground font-mono">{v.plate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(v.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">{v.count} rental(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By client */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium mb-3">{t("revenue.byClient")}</p>
          {data.byClient.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          ) : (
            <div className="space-y-2">
              {data.byClient.map((c, i) => (
                <div key={c.clientId} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-muted-foreground">{c.count} rental(s)</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    {formatCurrency(c.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
