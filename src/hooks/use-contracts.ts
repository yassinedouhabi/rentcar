"use client";

import useSWR from "swr";
import type { IContract, IClient, IVehicle, IReservation } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseContractsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PopulatedContract extends Omit<IContract, "clientId" | "vehicleId" | "reservationId"> {
  clientId: Pick<IClient, "_id" | "firstName" | "lastName" | "phone" | "email" | "cin"> | string;
  vehicleId: Pick<IVehicle, "_id" | "brand" | "model" | "plate" | "dailyRate" | "mileage" | "fuel" | "color"> | string;
  reservationId: Pick<IReservation, "_id" | "startDate" | "endDate" | "totalPrice" | "totalDays" | "dailyRate" | "deposit" | "status"> | string;
}

interface ContractsResponse {
  data: PopulatedContract[];
  total: number;
  page: number;
  limit: number;
  statusCounts: Record<string, number>;
}

export function useContracts({ search = "", status = "all", page = 1, limit = 20 }: UseContractsParams = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean } & ContractsResponse>(
    `/api/contracts?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    contracts: data?.data ?? [],
    total: data?.total ?? 0,
    statusCounts: data?.statusCounts ?? {},
    isLoading,
    error,
    refresh: mutate,
  };
}
