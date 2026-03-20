"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface ChartDataPoint {
  period: string;
  income: number;
  expenses: number;
}

interface CashflowChartProps {
  data: ChartDataPoint[];
  periodType: "week" | "month" | "year";
  isLoading: boolean;
}

function formatPeriodLabel(period: string, periodType: "week" | "month" | "year"): string {
  try {
    if (periodType === "year") {
      // "2026-03" → "Mar"
      const [y, m] = period.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleString("fr-FR", { month: "short" });
    } else if (periodType === "week") {
      // "2026-03-14" → "Sam"
      const d = new Date(period + "T12:00:00");
      return d.toLocaleString("fr-FR", { weekday: "short" });
    } else {
      // "2026-03-14" → "14"
      return period.split("-")[2] ?? period;
    }
  } catch {
    return period;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  const t = useTranslations("cashflow");
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold tabular-nums">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CashflowChart({ data, periodType, isLoading }: CashflowChartProps) {
  const t = useTranslations("cashflow");

  const chartData = data.map((d) => ({
    ...d,
    label: formatPeriodLabel(d.period, periodType),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {t("income")} / {t("expenses")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            {t("noTransactions")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) =>
                  value === "income" ? t("income") : t("expenses")
                }
                iconType="square"
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="income" name="income" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
