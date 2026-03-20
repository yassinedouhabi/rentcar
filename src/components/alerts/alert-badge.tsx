"use client";

import { useAlerts } from "@/hooks/use-alerts";

interface AlertBadgeProps {
  variant?: "pill" | "dot";
}

export function AlertBadge({ variant = "pill" }: AlertBadgeProps) {
  const { total } = useAlerts();

  if (!total) return null;

  if (variant === "dot") {
    return (
      <span className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
    );
  }

  return (
    <span className="ms-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      {total > 99 ? "99+" : total}
    </span>
  );
}
