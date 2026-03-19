"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { vehicleSchema } from "@/lib/validations";
import type { IVehicle } from "@/types";

type VehicleFormData = {
  brand: string;
  model: string;
  plate: string;
  year?: number;
  color?: string;
  fuel: "Diesel" | "Essence" | "Hybride" | "Electrique";
  mileage: number;
  dailyRate: number;
  status: "available" | "rented" | "reserved" | "maintenance";
  vin?: string;
  insuranceExpiry?: string;
  technicalInspection?: string;
  notes?: string;
};

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: IVehicle | null;
}

const FUEL_TYPES = ["Diesel", "Essence", "Hybride", "Electrique"] as const;
const STATUSES = ["available", "rented", "reserved", "maintenance"] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function VehicleForm({ open, onClose, onSuccess, vehicle }: VehicleFormProps) {
  const t = useTranslations("vehicle");
  const tc = useTranslations("common");
  const isEdit = !!vehicle;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      fuel: "Diesel",
      status: "available",
      mileage: 0,
      dailyRate: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (vehicle) {
        reset({
          brand: vehicle.brand,
          model: vehicle.model,
          plate: vehicle.plate,
          year: vehicle.year,
          color: vehicle.color,
          fuel: vehicle.fuel,
          mileage: vehicle.mileage,
          dailyRate: vehicle.dailyRate,
          status: vehicle.status,
          vin: vehicle.vin,
          insuranceExpiry: vehicle.insuranceExpiry
            ? new Date(vehicle.insuranceExpiry).toISOString().split("T")[0]
            : undefined,
          technicalInspection: vehicle.technicalInspection
            ? new Date(vehicle.technicalInspection).toISOString().split("T")[0]
            : undefined,
          notes: vehicle.notes,
        });
      } else {
        reset({ fuel: "Diesel", status: "available", mileage: 0, dailyRate: 0 });
      }
    }
  }, [open, vehicle, reset]);

  async function onSubmit(data: VehicleFormData) {
    const url = isEdit ? `/api/vehicles/${vehicle!._id}` : "/api/vehicles";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        let errorMsg = tc("errorOccurred");
        try {
          const json = await res.json();
          if (json?.error) errorMsg = json.error;
        } catch {}
        toast.error(errorMsg);
      }
    } catch {
      toast.error(tc("errorOccurred"));
    }
  }

  const fuel = watch("fuel");
  const status = watch("status");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{isEdit ? t("edit") : t("add")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-6 space-y-6">
          {/* General */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tc("general")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="brand">{t("brand")} *</Label>
                <Input id="brand" className="mt-1" {...register("brand")} />
                <FieldError message={errors.brand?.message} />
              </div>
              <div>
                <Label htmlFor="model">{t("model")} *</Label>
                <Input id="model" className="mt-1" {...register("model")} />
                <FieldError message={errors.model?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="plate">{t("plate")} *</Label>
                <Input id="plate" className="mt-1 font-mono uppercase" {...register("plate")} />
                <FieldError message={errors.plate?.message} />
              </div>
              <div>
                <Label htmlFor="year">{t("year")}</Label>
                <Input
                  id="year"
                  type="number"
                  className="mt-1"
                  {...register("year", { valueAsNumber: true })}
                />
                <FieldError message={errors.year?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="color">{t("color")}</Label>
                <Input id="color" className="mt-1" {...register("color")} />
              </div>
              <div>
                <Label>{t("fuel")}</Label>
                <Select value={fuel} onValueChange={(v) => setValue("fuel", v as typeof FUEL_TYPES[number])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {t(`fuel_types.${f}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t("status")}</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as typeof STATUSES[number])}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`statuses.${s}` as Parameters<typeof t>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Technical */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tc("technical")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mileage">{t("mileage")}</Label>
                <Input
                  id="mileage"
                  type="number"
                  className="mt-1"
                  {...register("mileage", { valueAsNumber: true })}
                />
                <FieldError message={errors.mileage?.message} />
              </div>
              <div>
                <Label htmlFor="vin">{t("vin")}</Label>
                <Input id="vin" className="mt-1 font-mono uppercase" {...register("vin")} />
              </div>
            </div>

            <div>
              <Label htmlFor="technicalInspection">{t("technicalInspection")}</Label>
              <Input
                id="technicalInspection"
                type="date"
                className="mt-1"
                {...register("technicalInspection")}
              />
            </div>
          </div>

          <Separator />

          {/* Financial */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tc("financial")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dailyRate">{t("dailyRate")} * (MAD)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  className="mt-1"
                  {...register("dailyRate", { valueAsNumber: true })}
                />
                <FieldError message={errors.dailyRate?.message} />
              </div>
              <div>
                <Label htmlFor="insuranceExpiry">{t("insuranceExpiry")}</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  className="mt-1"
                  {...register("insuranceExpiry")}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{tc("notes")}</Label>
            <Textarea id="notes" className="mt-1 resize-none" rows={3} {...register("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
