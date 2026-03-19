"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

const ALERT_CONFIG = {
  danger: {
    icon: AlertCircle,
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    icon_color: "text-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    icon_color: "text-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  info: {
    icon: AlertCircle,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    icon_color: "text-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
} as const;

export function AlertsPanel() {
  const t = useTranslations("dashboard");
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const { alerts } = stats;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("alerts")}</CardTitle>
          {alerts.length > 0 && (
            <span className="text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-sm">{t("noAlerts")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const cfg = ALERT_CONFIG[alert.type];
              const Icon = cfg.icon;

              const label =
                alert.key === "insuranceExpiring"
                  ? t("insuranceExpiring", { days: alert.days ?? 0 })
                  : alert.key === "overdueReturn"
                    ? t("overdueReturn", { days: alert.days ?? 0 })
                    : t("maintenanceDue");

              return (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.icon_color}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${cfg.text}`}>{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
