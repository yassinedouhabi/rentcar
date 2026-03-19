"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { formatCurrency } from "@/lib/utils";

const STATUS_CONFIG = {
  available: { dot: "bg-emerald-500", bar: "bg-emerald-500", labelKey: "available" },
  rented: { dot: "bg-blue-500", bar: "bg-blue-500", labelKey: "rented" },
  reserved: { dot: "bg-amber-500", bar: "bg-amber-500", labelKey: "reserved" },
  maintenance: { dot: "bg-red-500", bar: "bg-red-500", labelKey: "maintenance" },
} as const;

const BADGE_VARIANT: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  rented: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  reserved: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  maintenance: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export function FleetOverview() {
  const t = useTranslations("dashboard");
  const tv = useTranslations("vehicle");
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  const { fleetByStatus, totalVehicles, recentVehicles } = stats;
  const statuses = ["available", "rented", "reserved", "maintenance"] as const;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("fleetOverview")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status counts */}
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const count = fleetByStatus[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-sm text-muted-foreground flex-1 truncate">
                  {tv(`statuses.${cfg.labelKey}`)}
                </span>
                <span className="text-sm font-semibold tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Stacked bar */}
        {totalVehicles > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t("fleetDistribution")}</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
              {statuses.map((status) => {
                const pct = (fleetByStatus[status] / totalVehicles) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={status}
                    className={STATUS_CONFIG[status].bar}
                    style={{ width: `${pct}%` }}
                    title={`${tv(`statuses.${STATUS_CONFIG[status].labelKey}`)}: ${fleetByStatus[status]}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Recent vehicles */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">{t("recentVehicles")}</p>
          {recentVehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t("noActivity")}</p>
          ) : (
            recentVehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-1.5 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{v.plate}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(v.dailyRate)}/j
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_VARIANT[v.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {tv(`statuses.${v.status as keyof typeof STATUS_CONFIG}`)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
