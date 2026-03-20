"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import useSWR from "swr";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maintenanceSchema } from "@/lib/validations";
import type { IMaintenance, IVehicle, MaintenanceType, MaintenanceStatus } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MaintenanceFormData = {
  vehicleId: string;
  type: MaintenanceType;
  description?: string;
  cost: number;
  date: string;
  nextDue?: string;
  status: MaintenanceStatus;
};

const TYPES: MaintenanceType[] = ["oil_change", "tires", "brakes", "inspection", "repair", "other"];
const STATUSES: MaintenanceStatus[] = ["scheduled", "in_progress", "completed"];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

interface MaintenanceFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record?: IMaintenance | null;
}

export function MaintenanceForm({ open, onClose, onSuccess, record }: MaintenanceFormProps) {
  const t = useTranslations("maintenance");
  const tc = useTranslations("common");
  const isEdit = !!record;

  const { data: vehiclesData } = useSWR(open ? "/api/vehicles?limit=100" : null, fetcher);
  const vehicles: IVehicle[] = vehiclesData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(maintenanceSchema) as any,
    defaultValues: {
      vehicleId: "",
      type: "oil_change",
      description: "",
      cost: 0,
      date: new Date().toISOString().split("T")[0],
      nextDue: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (record) {
      const vehicleId =
        record.vehicleId && typeof record.vehicleId === "object"
          ? (record.vehicleId as IVehicle)._id
          : (record.vehicleId as string);
      reset({
        vehicleId: vehicleId || "",
        type: record.type,
        description: record.description ?? "",
        cost: record.cost,
        date: record.date ? new Date(record.date).toISOString().split("T")[0] : "",
        nextDue: record.nextDue ? new Date(record.nextDue).toISOString().split("T")[0] : "",
        status: record.status,
      });
    } else {
      reset({
        vehicleId: "",
        type: "oil_change",
        description: "",
        cost: 0,
        date: new Date().toISOString().split("T")[0],
        nextDue: "",
        status: "scheduled",
      });
    }
  }, [open, record, reset]);

  async function onSubmit(data: MaintenanceFormData) {
    const url = isEdit ? `/api/maintenance/${record!._id}` : "/api/maintenance";
    const method = isEdit ? "PUT" : "POST";
    const payload = { ...data, nextDue: data.nextDue || null };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const json = await res.json().catch(() => ({}));
        if (json?.error === "VEHICLE_RENTED") {
          toast.error(t("vehicleRentedError"));
        } else {
          toast.error(json?.error || tc("errorOccurred"));
        }
      }
    } catch {
      toast.error(tc("errorOccurred"));
    }
  }

  const typeVal = watch("type");
  const statusVal = watch("status");
  const vehicleIdVal = watch("vehicleId");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{isEdit ? t("edit") : t("add")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-6 space-y-4 mt-4">
          {/* Vehicle */}
          <div>
            <Label>{t("vehicle")} *</Label>
            <Select
              value={vehicleIdVal || ""}
              onValueChange={(v) => setValue("vehicleId", v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("selectVehicle")} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v._id} value={v._id}>
                    {v.brand} {v.model} — {v.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.vehicleId?.message} />
          </div>

          {/* Type */}
          <div>
            <Label>{t("type")} *</Label>
            <Select
              value={typeVal}
              onValueChange={(v) => setValue("type", v as MaintenanceType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>
                    {t(`types.${tp}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.type?.message} />
          </div>

          {/* Status */}
          <div>
            <Label>{t("status")} *</Label>
            <Select
              value={statusVal}
              onValueChange={(v) => setValue("status", v as MaintenanceStatus)}
            >
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
            <FieldError message={errors.status?.message} />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              className="mt-1 resize-none"
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Cost */}
          <div>
            <Label htmlFor="cost">{t("cost")} (MAD)</Label>
            <Input
              id="cost"
              type="number"
              min={0}
              step={0.01}
              className="mt-1"
              {...register("cost", { valueAsNumber: true })}
            />
            <FieldError message={errors.cost?.message} />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">{t("date")} *</Label>
            <Input id="date" type="date" className="mt-1" {...register("date")} />
            <FieldError message={errors.date?.message} />
          </div>

          {/* Next Due */}
          <div>
            <Label htmlFor="nextDue">{t("nextDue")}</Label>
            <Input id="nextDue" type="date" className="mt-1" {...register("nextDue")} />
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
