"use client";

import useSWR from "swr";
import type { IPayment, IClient, IInvoice } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UsePaymentsParams {
  invoiceId?: string;
  clientId?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PopulatedPayment extends Omit<IPayment, "clientId" | "invoiceId"> {
  clientId: Pick<IClient, "_id" | "firstName" | "lastName" | "phone"> | string;
  invoiceId: Pick<IInvoice, "_id" | "invoiceNumber" | "totalAmount" | "status"> | string;
}

interface PaymentsResponse {
  data: PopulatedPayment[];
  total: number;
  page: number;
  limit: number;
}

export function usePayments({
  invoiceId,
  clientId,
  method,
  dateFrom,
  dateTo,
  search = "",
  page = 1,
  limit = 20,
}: UsePaymentsParams = {}) {
  const params = new URLSearchParams();
  if (invoiceId) params.set("invoiceId", invoiceId);
  if (clientId) params.set("clientId", clientId);
  if (method) params.set("method", method);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean } & PaymentsResponse>(
    `/api/payments?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    payments: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}
