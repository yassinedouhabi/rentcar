"use client";

import { useTranslations } from "next-intl";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  date: string | Date;
  description: string;
  reference: string;
  runningBalance: number;
}

interface CashflowTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function CashflowTable({ transactions, isLoading }: CashflowTableProps) {
  const t = useTranslations("cashflow");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{tc("total")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc("date")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{tc("description")}</TableHead>
                <TableHead>{t("reference")}</TableHead>
                <TableHead className="text-right">{tc("amount")}</TableHead>
                <TableHead className="text-right">{t("runningBalance")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 p-0">
                    <EmptyState
                      icon={ArrowUpCircle}
                      title={t("noTransactions")}
                      description={t("noTransactionsDesc")}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx._id} className="hover:bg-muted/50">
                    <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                    <TableCell>
                      {tx.type === "income" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          {t("incomeType")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          {t("expenseType")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{tx.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                      {tx.reference || "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums text-sm ${
                        tx.type === "income"
                          ? "text-green-700 dark:text-green-400"
                          : "text-destructive"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums text-sm font-medium ${
                        tx.runningBalance >= 0
                          ? "text-foreground"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(tx.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={ArrowUpCircle}
                title={t("noTransactions")}
                description={t("noTransactionsDesc")}
              />
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx._id} className="flex items-center gap-3 p-4">
                <div
                  className={`p-1.5 rounded-full shrink-0 ${
                    tx.type === "income"
                      ? "bg-green-100 dark:bg-green-950/40"
                      : "bg-red-100 dark:bg-red-950/40"
                  }`}
                >
                  {tx.type === "income" ? (
                    <ArrowUpCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      tx.type === "income"
                        ? "text-green-700 dark:text-green-400"
                        : "text-destructive"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(tx.runningBalance)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
