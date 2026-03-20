"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { CashflowSummary } from "@/components/cashflow/cashflow-summary";
import { CashflowChart } from "@/components/cashflow/cashflow-chart";
import { CashflowTable } from "@/components/cashflow/cashflow-table";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Period = "week" | "month" | "year";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  reference: string;
  runningBalance: number;
}

interface CashflowData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  chartData: { period: string; income: number; expenses: number }[];
  transactions: Transaction[];
}

export default function CashflowPage() {
  const t = useTranslations("cashflow");
  const tp = useTranslations("pages");

  const [period, setPeriod] = useState<Period>("month");

  const { data, isLoading } = useSWR<{ success: boolean; data: CashflowData }>(
    `/api/dashboard/cashflow?period=${period}`,
    fetcher,
    { keepPreviousData: true }
  );

  const cashflow = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title={tp("cashflow")} />
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="week">{t("thisWeek")}</TabsTrigger>
            <TabsTrigger value="month">{t("thisMonth")}</TabsTrigger>
            <TabsTrigger value="year">{t("thisYear")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <CashflowSummary
        totalIncome={cashflow?.totalIncome ?? 0}
        totalExpenses={cashflow?.totalExpenses ?? 0}
        netProfit={cashflow?.netProfit ?? 0}
        isLoading={isLoading}
      />

      <CashflowChart
        data={cashflow?.chartData ?? []}
        periodType={period}
        isLoading={isLoading}
      />

      <CashflowTable
        transactions={cashflow?.transactions ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
