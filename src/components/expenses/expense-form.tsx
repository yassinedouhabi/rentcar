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
import { expenseSchema } from "@/lib/validations";
import type { IExpense, IVehicle, ExpenseCategory } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ExpenseFormData = {
  category: ExpenseCategory;
  vehicleId?: string;
  amount: number;
  description: string;
  date: string;
  receipt?: string;
};

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense?: IExpense | null;
}

const CATEGORIES: ExpenseCategory[] = ["fuel", "repair", "insurance", "tax", "parking", "other"];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function ExpenseForm({ open, onClose, onSuccess, expense }: ExpenseFormProps) {
  const t = useTranslations("expense");
  const tc = useTranslations("common");
  const isEdit = !!expense;

  const { data: vehiclesData } = useSWR(
    open ? "/api/vehicles?limit=100" : null,
    fetcher
  );
  const vehicles: IVehicle[] = vehiclesData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      category: "other",
      vehicleId: "",
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
      receipt: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (expense) {
        const vehicleId =
          expense.vehicleId && typeof expense.vehicleId === "object"
            ? (expense.vehicleId as IVehicle)._id
            : (expense.vehicleId as string) ?? "";
        reset({
          category: expense.category,
          vehicleId: vehicleId || "",
          amount: expense.amount,
          description: expense.description,
          date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
          receipt: expense.receipt ?? "",
        });
      } else {
        reset({
          category: "other",
          vehicleId: "",
          amount: 0,
          description: "",
          date: new Date().toISOString().split("T")[0],
          receipt: "",
        });
      }
    }
  }, [open, expense, reset]);

  async function onSubmit(data: ExpenseFormData) {
    const url = isEdit ? `/api/expenses/${expense!._id}` : "/api/expenses";
    const method = isEdit ? "PUT" : "POST";
    const payload = { ...data, vehicleId: data.vehicleId || null };

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

  const category = watch("category");
  const vehicleId = watch("vehicleId");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{isEdit ? t("edit") : t("add")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-6 space-y-4 mt-4">
          {/* Category */}
          <div>
            <Label>{t("category")} *</Label>
            <Select
              value={category}
              onValueChange={(v) => setValue("category", v as ExpenseCategory)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`categories.${c}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.category?.message} />
          </div>

          {/* Vehicle (optional) */}
          <div>
            <Label>{t("vehicleOptional")}</Label>
            <Select
              value={vehicleId || "none"}
              onValueChange={(v) => setValue("vehicleId", v === "none" ? "" : v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t("noVehicle")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noVehicle")}</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v._id} value={v._id}>
                    {v.brand} {v.model} — {v.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">{t("amount")} (MAD) *</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={0.01}
              className="mt-1"
              {...register("amount", { valueAsNumber: true })}
            />
            <FieldError message={errors.amount?.message} />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t("description")} *</Label>
            <Textarea
              id="description"
              className="mt-1 resize-none"
              rows={2}
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">{t("date")} *</Label>
            <Input id="date" type="date" className="mt-1" {...register("date")} />
            <FieldError message={errors.date?.message} />
          </div>

          {/* Receipt */}
          <div>
            <Label htmlFor="receipt">{t("receipt")}</Label>
            <Input
              id="receipt"
              className="mt-1"
              placeholder="Réf. justificatif..."
              {...register("receipt")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
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
