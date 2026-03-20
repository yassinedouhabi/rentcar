"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface CashflowSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  isLoading: boolean;
}

export function CashflowSummary({
  totalIncome,
  totalExpenses,
  netProfit,
  isLoading,
}: CashflowSummaryProps) {
  const t = useTranslations("cashflow");

  const cards = [
    {
      label: t("totalIncome"),
      value: totalIncome,
      icon: TrendingUp,
      valueClass: "text-green-600 dark:text-green-400",
      iconClass: "text-green-600 dark:text-green-400",
      bgClass: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: t("totalExpenses"),
      value: totalExpenses,
      icon: TrendingDown,
      valueClass: "text-destructive",
      iconClass: "text-destructive",
      bgClass: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: t("netProfit"),
      value: netProfit,
      icon: Wallet,
      valueClass:
        netProfit >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-destructive",
      iconClass:
        netProfit >= 0
          ? "text-blue-600 dark:text-blue-400"
          : "text-destructive",
      bgClass:
        netProfit >= 0
          ? "bg-blue-50 dark:bg-blue-950/30"
          : "bg-red-50 dark:bg-red-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, icon: Icon, valueClass, iconClass, bgClass }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-32" />
                ) : (
                  <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>
                    {formatCurrency(value)}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${bgClass}`}>
                <Icon className={`w-5 h-5 ${iconClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
