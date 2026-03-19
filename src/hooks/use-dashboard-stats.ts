"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface DashboardStats {
  totalRevenue: number;
  currentMonthRevenue: number;
  revenueChange: number;
  activeRentals: number;
  availableVehicles: number;
  totalVehicles: number;
  pendingPaymentsAmount: number;
  pendingPaymentsCount: number;
  fleetByStatus: {
    available: number;
    rented: number;
    reserved: number;
    maintenance: number;
  };
  revenueByMonth: Array<{ month: string; revenue: number }>;
  recentActivity: Array<{
    id: string;
    action: "create" | "update" | "delete";
    entity: string;
    details: Record<string, unknown>;
    timestamp: string;
  }>;
  alerts: Array<{
    type: "warning" | "danger" | "info";
    key: string;
    message: string;
    days?: number;
  }>;
  recentVehicles: Array<{
    id: string;
    brand: string;
    model: string;
    plate: string;
    status: string;
    dailyRate: number;
  }>;
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard/stats", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000,
  });

  return {
    stats: data?.data as DashboardStats | undefined,
    isLoading,
    error,
    refresh: mutate,
  };
}
