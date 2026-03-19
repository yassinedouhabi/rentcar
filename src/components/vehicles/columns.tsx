"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IVehicle, VehicleStatus } from "@/types";

interface ColumnActions {
  onView: (vehicle: IVehicle) => void;
  onEdit: (vehicle: IVehicle) => void;
  onDelete: (vehicle: IVehicle) => void;
  statusLabel: (status: VehicleStatus) => string;
  t: (key: string) => string;
}

export function getVehicleColumns(actions: ColumnActions): ColumnDef<IVehicle>[] {
  return [
    {
      accessorKey: "brand",
      header: () => actions.t("brand"),
      cell: ({ row }) => (
        <button
          onClick={() => actions.onView(row.original)}
          className="text-left hover:underline focus:outline-none"
        >
          <p className="font-medium">
            {row.original.brand} {row.original.model}
          </p>
          {row.original.year && (
            <p className="text-xs text-muted-foreground">{row.original.year}</p>
          )}
        </button>
      ),
    },
    {
      accessorKey: "plate",
      header: () => actions.t("plate"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.plate}</span>
      ),
    },
    {
      accessorKey: "fuel",
      header: () => actions.t("fuel"),
      cell: ({ row }) => <span className="text-sm">{row.original.fuel}</span>,
    },
    {
      accessorKey: "mileage",
      header: () => actions.t("mileage"),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {new Intl.NumberFormat("fr-MA").format(row.original.mileage ?? 0)} km
        </span>
      ),
    },
    {
      accessorKey: "dailyRate",
      header: () => actions.t("dailyRate"),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums font-medium">
          {formatCurrency(row.original.dailyRate)}
        </span>
      ),
    },
    {
      accessorKey: "insuranceExpiry",
      header: () => actions.t("insuranceExpiry"),
      cell: ({ row }) => {
        if (!row.original.insuranceExpiry) return <span className="text-muted-foreground">—</span>;
        const date = new Date(row.original.insuranceExpiry);
        const soon = date.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
        return (
          <span className={`text-sm tabular-nums ${soon ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>
            {formatDateShort(date)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => actions.t("status"),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          label={actions.statusLabel(row.original.status)}
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none">
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Actions</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onView(row.original)}>
              <Eye className="w-4 h-4 mr-2" />
              {actions.t("viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEdit(row.original)}>
              <Pencil className="w-4 h-4 mr-2" />
              {actions.t("edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {actions.t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
