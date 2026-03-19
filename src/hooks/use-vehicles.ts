"use client";

import useSWR from "swr";
import type { IVehicle } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseVehiclesParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface VehiclesResponse {
  data: IVehicle[];
  total: number;
  page: number;
  limit: number;
  statusCounts: Record<string, number>;
}

export function useVehicles({ search = "", status = "all", page = 1, limit = 20 }: UseVehiclesParams = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const key = `/api/vehicles?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: IVehicle[] } & VehiclesResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    vehicles: data?.data ?? [],
    total: data?.total ?? 0,
    statusCounts: data?.statusCounts ?? {},
    isLoading,
    error,
    refresh: mutate,
  };
}
