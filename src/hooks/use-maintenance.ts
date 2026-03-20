import useSWR from "swr";
import type { IMaintenance } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseMaintenanceOptions {
  vehicleId?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export function useMaintenance({
  vehicleId,
  status,
  type,
  page = 1,
  limit = 20,
}: UseMaintenanceOptions = {}) {
  const params = new URLSearchParams();
  if (vehicleId && vehicleId !== "all") params.set("vehicleId", vehicleId);
  if (status && status !== "all") params.set("status", status);
  if (type && type !== "all") params.set("type", type);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, error, isLoading, mutate } = useSWR(
    `/api/maintenance?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  );

  return {
    records: (data?.data ?? []) as IMaintenance[],
    total: data?.total ?? 0,
    totalCost: (data?.totalCost ?? 0) as number,
    isLoading,
    error,
    refresh: mutate,
  };
}
