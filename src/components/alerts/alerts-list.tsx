"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts } from "@/hooks/use-alerts";
import type { IAlert } from "@/app/api/alerts/route";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STORAGE_KEY = "rentcar_dismissed_alerts";

const SEVERITY_CONFIG = {
  danger: {
    label: "types.danger",
    border: "border-s-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-500",
    labelBg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    Icon: AlertCircle,
  },
  warning: {
    label: "types.warning",
    border: "border-s-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-500",
    labelBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  info: {
    label: "types.info",
    border: "border-s-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-500",
    labelBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    Icon: Info,
  },
} as const;

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function AlertCard({
  alert,
  onDismiss,
}: {
  alert: IAlert;
  onDismiss: (id: string) => void;
}) {
  const t = useTranslations("alerts");
  const cfg = SEVERITY_CONFIG[alert.type];
  const { Icon } = cfg;

  const title = t(`${alert.titleKey}` as any);
  const message = t(`${alert.titleKey.replace(".title", ".message")}` as any, alert.messageParams as any);

  const relativeTime = formatDistanceToNow(new Date(alert.date), { addSuffix: true });

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border border-s-4",
        cfg.bg,
        cfg.border
      )}
    >
      <div className={cn("mt-0.5 shrink-0", cfg.iconColor)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("dismiss")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground/60">{relativeTime}</span>
          <Link
            href={alert.href}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t("view")}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AlertsList() {
  const t = useTranslations("alerts");
  const { alerts, total, isLoading } = useAlerts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  const unreadCount = visible.length;

  function dismiss(id: string) {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    saveDismissed(next);
  }

  function dismissAll() {
    const next = new Set(alerts.map((a) => a.id));
    setDismissed(next);
    saveDismissed(next);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (unreadCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-foreground">{t("noAlerts")}</p>
        <p className="text-sm text-muted-foreground max-w-xs">{t("noAlertsDesc")}</p>
        {total > 0 && dismissed.size > 0 && (
          <button
            onClick={() => {
              setDismissed(new Set());
              saveDismissed(new Set());
            }}
            className="text-xs text-primary hover:underline mt-1"
          >
            {t("restoreAll")}
          </button>
        )}
      </div>
    );
  }

  const groups = (["danger", "warning", "info"] as const).map((type) => ({
    type,
    items: visible.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("unread", { count: unreadCount })}
        </p>
        <Button variant="ghost" size="sm" onClick={dismissAll} className="text-xs h-7">
          {t("dismissAll")}
        </Button>
      </div>

      {/* Grouped alerts */}
      {groups.map(({ type, items }) => {
        const cfg = SEVERITY_CONFIG[type];
        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.labelBg)}>
                {t(cfg.label)}
              </span>
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            <div className="space-y-2">
              {items.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
