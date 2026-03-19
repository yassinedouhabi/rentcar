"use client";

import { useTranslations } from "next-intl";
import { Pencil, Calendar, Gauge, Fuel, Hash, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IVehicle, VehicleStatus } from "@/types";

interface VehicleDetailProps {
  vehicle: IVehicle | null;
  open: boolean;
  onClose: () => void;
  onEdit: (vehicle: IVehicle) => void;
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export function VehicleDetail({ vehicle, open, onClose, onEdit }: VehicleDetailProps) {
  const t = useTranslations("vehicle");
  const tc = useTranslations("common");

  if (!vehicle) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pr-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-xl">
                {vehicle.brand} {vehicle.model}
              </SheetTitle>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{vehicle.plate}</p>
            </div>
            <StatusBadge
              status={vehicle.status}
              label={t(`statuses.${vehicle.status}` as Parameters<typeof t>[0])}
            />
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* General */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {tc("general")}
            </p>
            <div className="divide-y divide-border/50">
              <DetailRow label={t("brand")} value={vehicle.brand} />
              <DetailRow label={t("model")} value={vehicle.model} />
              <DetailRow label={t("year")} value={vehicle.year} />
              <DetailRow label={t("color")} value={vehicle.color} />
              <DetailRow label={t("fuel")} value={vehicle.fuel} />
              <DetailRow label={t("plate")} value={<span className="font-mono">{vehicle.plate}</span>} />
            </div>
          </div>

          <Separator />

          {/* Technical */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {tc("technical")}
            </p>
            <div className="divide-y divide-border/50">
              <DetailRow
                label={t("mileage")}
                value={vehicle.mileage != null ? `${new Intl.NumberFormat("fr-MA").format(vehicle.mileage)} km` : undefined}
              />
              <DetailRow label={t("vin")} value={vehicle.vin ? <span className="font-mono text-xs">{vehicle.vin}</span> : undefined} />
              <DetailRow
                label={t("technicalInspection")}
                value={vehicle.technicalInspection ? formatDateShort(vehicle.technicalInspection) : undefined}
              />
            </div>
          </div>

          <Separator />

          {/* Financial */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {tc("financial")}
            </p>
            <div className="divide-y divide-border/50">
              <DetailRow label={t("dailyRate")} value={formatCurrency(vehicle.dailyRate)} />
              <DetailRow
                label={t("insuranceExpiry")}
                value={vehicle.insuranceExpiry ? formatDateShort(vehicle.insuranceExpiry) : undefined}
              />
            </div>
          </div>

          {vehicle.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {tc("notes")}
                </p>
                <p className="text-sm">{vehicle.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <Button className="w-full" onClick={() => onEdit(vehicle)}>
            <Pencil className="w-4 h-4 mr-2" />
            {t("edit")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
