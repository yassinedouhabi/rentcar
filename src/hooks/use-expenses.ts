import useSWR from "swr";
import type { IExpense } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseExpensesOptions {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function useExpenses({
  category,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
}: UseExpensesOptions = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, error, isLoading, mutate } = useSWR(
    `/api/expenses?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  );

  return {
    expenses: (data?.data ?? []) as IExpense[],
    total: data?.total ?? 0,
    totalAmount: (data?.totalAmount ?? 0) as number,
    isLoading,
    error,
    refresh: mutate,
  };
}
