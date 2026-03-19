"use client";

import { useTranslations } from "next-intl";
import { Pencil, Phone, Mail, MapPin, CreditCard, Car, TrendingUp } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IClient } from "@/types";

interface ClientDetailProps {
  client: IClient | null;
  open: boolean;
  onClose: () => void;
  onEdit: (client: IClient) => void;
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

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function ClientDetail({ client, open, onClose, onEdit }: ClientDetailProps) {
  const t = useTranslations("client");
  const tc = useTranslations("common");

  if (!client) return null;

  const initials = `${client.firstName[0] ?? ""}${client.lastName[0] ?? ""}`.toUpperCase();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pr-10">
          <div className="flex items-start gap-3">
            <Avatar size="lg" className="w-12 h-12">
              <AvatarFallback className="text-base font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">
                {client.firstName} {client.lastName}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge
                  status={client.clientType}
                  label={t(`types.${client.clientType}` as Parameters<typeof t>[0])}
                />
                {client.city && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {client.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={Car} label={t("totalRentals")} value={String(client.totalRentals ?? 0)} />
            <StatCard icon={TrendingUp} label={t("totalSpent")} value={formatCurrency(client.totalSpent ?? 0)} />
          </div>

          <Separator />

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("contact")}
            </p>
            <div className="divide-y divide-border/50">
              <DetailRow
                label={t("phone")}
                value={
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:underline">
                    <Phone className="w-3 h-3" />
                    {client.phone}
                  </a>
                }
              />
              <DetailRow
                label={t("email")}
                value={
                  client.email ? (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:underline">
                      <Mail className="w-3 h-3" />
                      {client.email}
                    </a>
                  ) : undefined
                }
              />
              <DetailRow label={t("address")} value={client.address} />
              <DetailRow label={t("city")} value={client.city} />
              <DetailRow label={t("nationality")} value={client.nationality} />
              <DetailRow label={t("emergencyContact")} value={client.emergencyContact} />
            </div>
          </div>

          <Separator />

          {/* Identity */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t("identity")}
            </p>
            <div className="divide-y divide-border/50">
              <DetailRow
                label={t("cin")}
                value={client.cin ? <span className="font-mono text-xs flex items-center gap-1"><CreditCard className="w-3 h-3" />{client.cin}</span> : undefined}
              />
              <DetailRow
                label={t("passport")}
                value={client.passport ? <span className="font-mono text-xs">{client.passport}</span> : undefined}
              />
              <DetailRow
                label={t("drivingLicense")}
                value={client.drivingLicense ? <span className="font-mono text-xs">{client.drivingLicense}</span> : undefined}
              />
              <DetailRow
                label={t("licenseExpiry")}
                value={client.licenseExpiry ? formatDateShort(client.licenseExpiry) : undefined}
              />
              <DetailRow
                label={t("dateOfBirth")}
                value={client.dateOfBirth ? formatDateShort(client.dateOfBirth) : undefined}
              />
            </div>
          </div>

          {client.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {tc("notes")}
                </p>
                <p className="text-sm">{client.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <Button className="w-full" onClick={() => onEdit(client)}>
            <Pencil className="w-4 h-4 mr-2" />
            {t("edit")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
