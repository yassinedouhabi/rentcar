"use client";

import useSWR from "swr";
import type { IAlert } from "@/app/api/alerts/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR("/api/alerts", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60 * 1000,
  });

  return {
    alerts: (data?.data ?? []) as IAlert[],
    total: (data?.total ?? 0) as number,
    isLoading,
    error,
    refresh: mutate,
  };
}
