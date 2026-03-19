"use client";

import useSWR from "swr";
import type { IInvoice, IClient, IContract, IPayment } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseInvoicesParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PopulatedInvoice extends Omit<IInvoice, "clientId" | "contractId"> {
  clientId: Pick<IClient, "_id" | "firstName" | "lastName" | "phone" | "email" | "cin"> | string;
  contractId: Pick<IContract, "_id" | "contractNumber" | "signedAt" | "mileageOut" | "mileageIn"> | string;
  paidAmount?: number;
  payments?: IPayment[];
}

interface InvoicesResponse {
  data: PopulatedInvoice[];
  total: number;
  page: number;
  limit: number;
  statusCounts: Record<string, number>;
}

export function useInvoices({ search = "", status = "all", page = 1, limit = 20 }: UseInvoicesParams = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean } & InvoicesResponse>(
    `/api/invoices?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    invoices: data?.data ?? [],
    total: data?.total ?? 0,
    statusCounts: data?.statusCounts ?? {},
    isLoading,
    error,
    refresh: mutate,
  };
}
