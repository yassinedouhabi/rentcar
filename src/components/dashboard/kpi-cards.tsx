"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Car, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { formatCurrency } from "@/lib/utils";

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  change,
  changeLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  change?: number;
  changeLabel?: string;
}) {
  const positive = (change ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            {change !== undefined && changeLabel && (
              <div className="flex items-center gap-1 mt-2">
                {positive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {positive ? "+" : ""}
                  {change}%
                </span>
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCards() {
  const t = useTranslations("dashboard");
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: t("totalRevenue"),
      value: formatCurrency(stats.totalRevenue),
      sub: formatCurrency(stats.currentMonthRevenue) + " ce mois",
      icon: TrendingUp,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      change: stats.revenueChange,
      changeLabel: t("vsLastMonth"),
    },
    {
      label: t("activeRentals"),
      value: String(stats.activeRentals),
      sub: `${stats.totalVehicles} véhicules total`,
      icon: Car,
      iconBg: "bg-violet-100 dark:bg-violet-900/40",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: t("availableVehicles"),
      value: String(stats.availableVehicles),
      sub: `sur ${stats.totalVehicles} véhicules`,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("pendingPayments"),
      value: formatCurrency(stats.pendingPaymentsAmount),
      sub: `${stats.pendingPaymentsCount} facture(s)`,
      icon: Clock,
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
