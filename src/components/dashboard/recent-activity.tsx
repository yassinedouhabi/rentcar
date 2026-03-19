"use client";

import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

const ACTION_STYLE: Record<string, string> = {
  create: "text-emerald-600 dark:text-emerald-400",
  update: "text-blue-600 dark:text-blue-400",
  delete: "text-red-600 dark:text-red-400",
};

const ENTITY_LABEL: Record<string, string> = {
  Vehicle: "Véhicule",
  Client: "Client",
  Reservation: "Réservation",
  Contract: "Contrat",
  Invoice: "Facture",
  Payment: "Paiement",
  Expense: "Dépense",
  Maintenance: "Maintenance",
};

export function RecentActivity() {
  const t = useTranslations("dashboard");
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const { recentActivity } = stats;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("recentActivity")}</CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("noActivity")}</p>
        ) : (
          <div className="space-y-0">
            {recentActivity.map((entry, idx) => {
              const actionLabel =
                entry.action === "create"
                  ? t("actCreate")
                  : entry.action === "update"
                    ? t("actUpdate")
                    : t("actDelete");
              const entityLabel = ENTITY_LABEL[entry.entity] ?? entry.entity;
              const detail =
                entry.details &&
                typeof entry.details === "object" &&
                "name" in entry.details
                  ? String(entry.details.name)
                  : entry.details &&
                      typeof entry.details === "object" &&
                      "plate" in entry.details
                    ? String(entry.details.plate)
                    : null;

              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-3 py-2.5 ${idx < recentActivity.length - 1 ? "border-b border-border/50" : ""}`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className={`font-medium ${ACTION_STYLE[entry.action] ?? ""}`}>
                        {actionLabel}
                      </span>{" "}
                      <span className="text-foreground">{entityLabel}</span>
                      {detail && (
                        <span className="text-muted-foreground"> · {detail}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(entry.timestamp), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
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
