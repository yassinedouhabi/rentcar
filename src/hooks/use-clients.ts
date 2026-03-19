"use client";

import useSWR from "swr";
import type { IClient } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseClientsParams {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface ClientsResponse {
  data: IClient[];
  total: number;
  page: number;
  limit: number;
  typeCounts: Record<string, number>;
}

export function useClients({ search = "", type = "all", page = 1, limit = 20 }: UseClientsParams = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (type && type !== "all") params.set("type", type);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const key = `/api/clients?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean } & ClientsResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    clients: data?.data ?? [],
    total: data?.total ?? 0,
    typeCounts: data?.typeCounts ?? {},
    isLoading,
    error,
    refresh: mutate,
  };
}
