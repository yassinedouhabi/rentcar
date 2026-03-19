"use client";

import useSWR from "swr";
import type { IReservation, IClient, IVehicle } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseReservationsParams {
  search?: string;
  status?: string;
  startFrom?: string;
  startTo?: string;
  page?: number;
  limit?: number;
}

export interface PopulatedReservation extends Omit<IReservation, "clientId" | "vehicleId"> {
  clientId: Pick<IClient, "_id" | "firstName" | "lastName" | "phone" | "email" | "cin"> | string;
  vehicleId: Pick<IVehicle, "_id" | "brand" | "model" | "plate" | "dailyRate" | "fuel" | "color"> | string;
}

interface ReservationsResponse {
  data: PopulatedReservation[];
  total: number;
  page: number;
  limit: number;
  statusCounts: Record<string, number>;
}

export function useReservations({
  search = "",
  status = "all",
  startFrom = "",
  startTo = "",
  page = 1,
  limit = 20,
}: UseReservationsParams = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);
  if (startFrom) params.set("startFrom", startFrom);
  if (startTo) params.set("startTo", startTo);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const key = `/api/reservations?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean } & ReservationsResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    reservations: data?.data ?? [],
    total: data?.total ?? 0,
    statusCounts: data?.statusCounts ?? {},
    isLoading,
    error,
    refresh: mutate,
  };
}
