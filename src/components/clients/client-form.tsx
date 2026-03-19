"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { clientSchema } from "@/lib/validations";
import type { IClient } from "@/types";

type ClientFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  cin?: string;
  passport?: string;
  drivingLicense: string;
  licenseExpiry?: string;
  address?: string;
  city?: string;
  nationality?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  clientType: "regular" | "vip" | "blacklisted";
  notes?: string;
};

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: IClient | null;
}

const CLIENT_TYPES = ["regular", "vip", "blacklisted"] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function ClientForm({ open, onClose, onSuccess, client }: ClientFormProps) {
  const t = useTranslations("client");
  const tc = useTranslations("common");
  const isEdit = !!client;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema) as any,
    defaultValues: { clientType: "regular" },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          email: client.email,
          cin: client.cin,
          passport: client.passport,
          drivingLicense: client.drivingLicense,
          licenseExpiry: client.licenseExpiry
            ? new Date(client.licenseExpiry).toISOString().split("T")[0]
            : undefined,
          address: client.address,
          city: client.city,
          nationality: client.nationality,
          dateOfBirth: client.dateOfBirth
            ? new Date(client.dateOfBirth).toISOString().split("T")[0]
            : undefined,
          emergencyContact: client.emergencyContact,
          clientType: client.clientType,
          notes: client.notes,
        });
      } else {
        reset({ clientType: "regular" });
      }
    }
  }, [open, client, reset]);

  async function onSubmit(data: ClientFormData) {
    const url = isEdit ? `/api/clients/${client!._id}` : "/api/clients";
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

  const clientType = watch("clientType");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{isEdit ? t("edit") : t("add")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-6 space-y-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tc("general")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">{t("firstName")} *</Label>
                <Input id="firstName" className="mt-1" {...register("firstName")} />
                <FieldError message={errors.firstName?.message} />
              </div>
              <div>
                <Label htmlFor="lastName">{t("lastName")} *</Label>
                <Input id="lastName" className="mt-1" {...register("lastName")} />
                <FieldError message={errors.lastName?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("clientType")}</Label>
                <Select
                  value={clientType}
                  onValueChange={(v) => setValue("clientType", v as typeof CLIENT_TYPES[number])}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`types.${type}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateOfBirth">{t("dateOfBirth")}</Label>
                <Input id="dateOfBirth" type="date" className="mt-1" {...register("dateOfBirth")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nationality">{t("nationality")}</Label>
                <Input id="nationality" className="mt-1" {...register("nationality")} />
              </div>
              <div>
                <Label htmlFor="city">{t("city")}</Label>
                <Input id="city" className="mt-1" {...register("city")} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Identity Documents */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("identity")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cin">{t("cin")}</Label>
                <Input id="cin" className="mt-1 font-mono uppercase" {...register("cin")} />
              </div>
              <div>
                <Label htmlFor="passport">{t("passport")}</Label>
                <Input id="passport" className="mt-1 font-mono uppercase" {...register("passport")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="drivingLicense">{t("drivingLicense")} *</Label>
                <Input id="drivingLicense" className="mt-1 font-mono" {...register("drivingLicense")} />
                <FieldError message={errors.drivingLicense?.message} />
              </div>
              <div>
                <Label htmlFor="licenseExpiry">{t("licenseExpiry")}</Label>
                <Input id="licenseExpiry" type="date" className="mt-1" {...register("licenseExpiry")} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("contact")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">{t("phone")} *</Label>
                <Input id="phone" type="tel" className="mt-1" {...register("phone")} />
                <FieldError message={errors.phone?.message} />
              </div>
              <div>
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" className="mt-1" {...register("email")} />
                <FieldError message={errors.email?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="address">{t("address")}</Label>
              <Input id="address" className="mt-1" {...register("address")} />
            </div>

            <div>
              <Label htmlFor="emergencyContact">{t("emergencyContact")}</Label>
              <Input id="emergencyContact" type="tel" className="mt-1" {...register("emergencyContact")} />
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
