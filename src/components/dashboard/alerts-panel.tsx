"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts } from "@/hooks/use-alerts";
import type { IAlert } from "@/app/api/alerts/route";
import { cn } from "@/lib/utils";

const ALERT_CONFIG = {
  danger: {
    Icon: AlertCircle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    iconColor: "text-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  warning: {
    Icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  info: {
    Icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
} as const;

function AlertRow({ alert }: { alert: IAlert }) {
  const t = useTranslations("alerts");
  const cfg = ALERT_CONFIG[alert.type];
  const { Icon } = cfg;

  const title = t(`${alert.titleKey}` as any);
  const message = t(
    `${alert.titleKey.replace(".title", ".message")}` as any,
    alert.messageParams as any
  );

  return (
    <Link
      href={alert.href}
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-lg border transition-opacity hover:opacity-80",
        cfg.bg,
        cfg.border
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.iconColor)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-xs font-semibold", cfg.text)}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{message}</p>
      </div>
    </Link>
  );
}

export function AlertsPanel() {
  const t = useTranslations("dashboard");
  const { alerts, total, isLoading } = useAlerts();

  if (isLoading) {
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

  const top4 = alerts.slice(0, 4);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t("alerts")}</CardTitle>
          {total > 0 && (
            <span className="text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">
              {total}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {top4.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-sm">{t("noAlerts")}</p>
          </div>
        ) : (
          <>
            {top4.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
            {total > 4 && (
              <Link
                href="/alerts"
                className="flex items-center justify-center gap-1.5 w-full text-xs text-primary hover:underline pt-1"
              >
                {t("viewAll")}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
