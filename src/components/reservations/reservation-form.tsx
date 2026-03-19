"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { IVehicle, IClient } from "@/types";
import type { PopulatedReservation } from "@/hooks/use-reservations";

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservation?: PopulatedReservation | null;
}

function toDateValue(d: Date | string | undefined): Date | undefined {
  if (!d) return undefined;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

function toISODate(d: Date | undefined): string {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

export function ReservationForm({ open, onClose, onSuccess, reservation }: ReservationFormProps) {
  const t = useTranslations("reservation");
  const tc = useTranslations("common");
  const isEdit = !!reservation;

  // Form state
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [deposit, setDeposit] = useState("0");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client search
  const [clients, setClients] = useState<IClient[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);

  // Available vehicles
  const [availableVehicles, setAvailableVehicles] = useState<IVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const datesReady = !!(startDate && endDate && startDate < endDate);

  // Derived pricing
  const selectedVehicle = availableVehicles.find((v) => v._id === vehicleId);
  const dailyRate = selectedVehicle?.dailyRate ?? 0;
  const totalDays = datesReady
    ? Math.max(1, Math.ceil((endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const totalPrice = totalDays * dailyRate;

  // Selected client display
  const selectedClient = clients.find((c) => c._id === clientId);

  // Fetch clients when search changes
  const clientSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!clientOpen) return;
    if (clientSearchTimeout.current) clearTimeout(clientSearchTimeout.current);
    clientSearchTimeout.current = setTimeout(async () => {
      setClientsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "30" });
        if (clientSearch) params.set("search", clientSearch);
        const res = await fetch(`/api/clients?${params}`);
        const json = await res.json();
        if (json.success) setClients(json.data);
      } finally {
        setClientsLoading(false);
      }
    }, 300);
    return () => { if (clientSearchTimeout.current) clearTimeout(clientSearchTimeout.current); };
  }, [clientSearch, clientOpen]);

  // Fetch available vehicles when dates change
  useEffect(() => {
    if (!datesReady) { setAvailableVehicles([]); setVehicleId(""); return; }
    const controller = new AbortController();
    setVehiclesLoading(true);
    const params = new URLSearchParams({
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
    });
    if (isEdit && reservation?._id) params.set("excludeReservationId", reservation._id);
    fetch(`/api/vehicles/available?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => { if (json.success) setAvailableVehicles(json.data); })
      .catch(() => {})
      .finally(() => setVehiclesLoading(false));
    return () => controller.abort();
  }, [startDate, endDate, datesReady, isEdit, reservation?._id]);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (reservation) {
      const c = reservation.clientId as IClient;
      const v = reservation.vehicleId as IVehicle;
      setClientId(typeof c === "string" ? c : c._id);
      setVehicleId(typeof v === "string" ? v : v._id);
      setStartDate(toDateValue(reservation.startDate));
      setEndDate(toDateValue(reservation.endDate));
      setDeposit(String(reservation.deposit ?? 0));
      setNotes(reservation.notes ?? "");
      setStatus(reservation.status);
      // Pre-populate clients list with the existing client
      if (typeof c !== "string") setClients([c as unknown as IClient]);
      // Pre-populate vehicles list with existing vehicle
      if (typeof v !== "string") setAvailableVehicles([v as unknown as IVehicle]);
    } else {
      setClientId(""); setVehicleId(""); setStartDate(undefined); setEndDate(undefined);
      setDeposit("0"); setNotes(""); setStatus("pending");
      setClients([]); setAvailableVehicles([]);
    }
  }, [open, reservation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !vehicleId || !startDate || !endDate) {
      toast.error(tc("errorOccurred"));
      return;
    }
    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/reservations/${reservation!._id}` : "/api/reservations";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          vehicleId,
          startDate: toISODate(startDate),
          endDate: toISODate(endDate),
          dailyRate,
          totalDays,
          totalPrice,
          deposit: parseFloat(deposit) || 0,
          notes: notes || undefined,
          status,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        let msg = tc("errorOccurred");
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        toast.error(msg);
      }
    } catch {
      toast.error(tc("errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>{isEdit ? t("edit") : t("add")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-5">
          {/* Client */}
          <div>
            <Label className="mb-1 block">{t("client")} *</Label>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger
                className="w-full flex items-center justify-between h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-left"
              >
                <span className={selectedClient ? "" : "text-muted-foreground"}>
                  {selectedClient
                    ? `${selectedClient.firstName} ${selectedClient.lastName} — ${selectedClient.phone}`
                    : t("selectClient")}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t("selectClient")}
                    value={clientSearch}
                    onValueChange={setClientSearch}
                  />
                  <CommandList>
                    {clientsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : clients.length === 0 ? (
                      <CommandEmpty>{tc("noResults")}</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {clients.map((c) => (
                          <CommandItem
                            key={c._id}
                            value={c._id}
                            onSelect={() => { setClientId(c._id); setClientOpen(false); }}
                          >
                            <Check className={`w-4 h-4 shrink-0 ${clientId === c._id ? "opacity-100" : "opacity-0"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                              <p className="text-xs text-muted-foreground">{c.phone}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{t("startDate")} *</Label>
              <Popover>
                <PopoverTrigger className="w-full flex items-center justify-between h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-left">
                  <span className={startDate ? "" : "text-muted-foreground"}>
                    {startDate ? formatDateShort(startDate) : "Pick date"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => { setStartDate(d); if (endDate && d && d >= endDate) setEndDate(undefined); }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="mb-1 block">{t("endDate")} *</Label>
              <Popover>
                <PopoverTrigger className="w-full flex items-center justify-between h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-left">
                  <span className={endDate ? "" : "text-muted-foreground"}>
                    {endDate ? formatDateShort(endDate) : "Pick date"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(d) => !startDate || d <= startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <Label className="mb-1 block">{t("vehicle")} *</Label>
            {!datesReady ? (
              <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2">
                {t("selectDatesFirst")}
              </p>
            ) : (
              <Select
                value={vehicleId}
                onValueChange={(v) => setVehicleId(v ?? "")}
                disabled={vehiclesLoading || availableVehicles.length === 0}
              >
                <SelectTrigger className="w-full mt-0">
                  {vehiclesLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                    </span>
                  ) : (
                    <SelectValue placeholder={
                      availableVehicles.length === 0
                        ? t("noVehiclesAvailable")
                        : t("selectVehicle")
                    } />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v._id} value={v._id}>
                      {v.brand} {v.model} — {v.plate} ({formatCurrency(v.dailyRate)}/j)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Pricing summary */}
          {datesReady && vehicleId && dailyRate > 0 && (
            <div className="rounded-lg bg-muted/60 border border-border p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("autoCalculated")}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("totalDays")}</span>
                  <span className="font-medium">{t("daysCount", { count: totalDays })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dailyRate")}</span>
                  <span className="font-medium">{formatCurrency(dailyRate)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>{t("totalPrice")}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Deposit */}
          <div>
            <Label htmlFor="deposit">{t("deposit")} (MAD)</Label>
            <Input
              id="deposit"
              type="number"
              min="0"
              className="mt-1"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{tc("notes")}</Label>
            <Textarea
              id="notes"
              className="mt-1 resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !clientId || !vehicleId || !datesReady}
            >
              {isSubmitting ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
