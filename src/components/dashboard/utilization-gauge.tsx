"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export function UtilizationGauge() {
  const t = useTranslations("dashboard");
  const { stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <Skeleton className="w-32 h-32 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const { fleetByStatus, totalVehicles } = stats;
  const active = fleetByStatus.rented + fleetByStatus.reserved;
  const pct = totalVehicles > 0 ? Math.round((active / totalVehicles) * 100) : 0;

  const RADIUS = 36;
  const CX = 50;
  const CY = 50;
  const circumference = 2 * Math.PI * RADIUS;
  const offset = circumference * (1 - pct / 100);

  const gaugeColor =
    pct >= 80 ? "#22c55e" : pct >= 50 ? "#3b82f6" : pct >= 25 ? "#f59e0b" : "#ef4444";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("utilizationRate")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pt-1">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/40"
            />
            <circle
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke={gaugeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{pct}%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{active}</span>
          {" / "}
          <span className="tabular-nums">{totalVehicles}</span>
          {" véhicules"}
        </p>
      </CardContent>
    </Card>
  );
}
