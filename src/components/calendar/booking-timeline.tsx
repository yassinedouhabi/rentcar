"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import {
  Car, Wrench, FileText, CalendarRange, Search, X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DayCell } from "./day-cell";
import { formatDate, calculateDays } from "@/lib/utils";
import {
  DAY_WIDTHS, EVENT_STYLES, VEHICLE_COL_WIDTH, HEADER_HEIGHT, ROW_HEIGHT, BAR_HEIGHT,
  VEHICLE_STATUS, type ViewMode,
} from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type BookingType = "reservation" | "contract" | "maintenance";
type VehicleStatusKey = keyof typeof VEHICLE_STATUS;

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  clientName: string;
  type: BookingType;
}

interface VehicleRow {
  vehicleId: string;
  vehicleName: string;
  plate: string;
  status: VehicleStatusKey;
  bookings: Booking[];
}

interface CalendarData {
  from: string;
  to: string;
  vehicles: VehicleRow[];
}

interface DayInfo {
  date: Date;
  isWeekend: boolean;
  isToday: boolean;
  isMonthStart: boolean;
  month: number;
  year: number;
}

interface MonthGroup {
  label: string;
  startIdx: number;
  count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function buildDays(fromStr: string, toStr: string): DayInfo[] {
  const from    = parseDateStr(fromStr);
  const to      = parseDateStr(toStr);
  const todayMs = new Date(new Date().toDateString()).getTime();
  const days: DayInfo[] = [];
  const cur = new Date(from);
  let prevMonth = -1;

  while (cur <= to) {
    const dow = cur.getDay();
    days.push({
      date:         new Date(cur),
      isWeekend:    dow === 0 || dow === 6,
      isToday:      cur.getTime() === todayMs,
      isMonthStart: cur.getMonth() !== prevMonth,
      month:        cur.getMonth() + 1,
      year:         cur.getFullYear(),
    });
    prevMonth = cur.getMonth();
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function buildMonthGroups(days: DayInfo[], locale: string): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (let i = 0; i < days.length; i++) {
    if (days[i].isMonthStart) {
      groups.push({
        label:    days[i].date.toLocaleString(locale, { month: "long", year: "numeric" }),
        startIdx: i,
        count:    1,
      });
    } else {
      groups[groups.length - 1].count++;
    }
  }
  return groups;
}

function calcBar(
  booking: Booking, fromStr: string, toStr: string, dayWidth: number,
): { left: number; width: number; visible: boolean } {
  const MS         = 86_400_000;
  const rangeFrom  = parseDateStr(fromStr).getTime();
  const rangeTo    = parseDateStr(toStr).getTime();
  const startMs    = parseDateStr(booking.startDate).getTime();
  const endMs      = parseDateStr(booking.endDate).getTime();
  if (startMs > rangeTo || endMs < rangeFrom) return { left: 0, width: 0, visible: false };
  const clamped0   = Math.max(startMs, rangeFrom);
  const clamped1   = Math.min(endMs, rangeTo);
  const startIdx   = Math.round((clamped0 - rangeFrom) / MS);
  const endIdx     = Math.round((clamped1 - rangeFrom) / MS);
  return { left: startIdx * dayWidth, width: (endIdx - startIdx + 1) * dayWidth, visible: true };
}

function calcOccupancy(bookings: Booking[], fromStr: string, toStr: string, totalDays: number): number {
  if (totalDays === 0) return 0;
  const MS        = 86_400_000;
  const rangeFrom = parseDateStr(fromStr).getTime();
  const rangeTo   = parseDateStr(toStr).getTime();
  const occupied  = new Set<number>();
  for (const b of bookings) {
    const s = Math.max(parseDateStr(b.startDate).getTime(), rangeFrom);
    const e = Math.min(parseDateStr(b.endDate).getTime(),   rangeTo);
    if (s > e) continue;
    const si = Math.round((s - rangeFrom) / MS);
    const ei = Math.round((e - rangeFrom) / MS);
    for (let i = si; i <= ei; i++) occupied.add(i);
  }
  return Math.round((occupied.size / totalDays) * 100);
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Type icon + label maps ───────────────────────────────────────────────────

const TYPE_ICON: Record<BookingType, React.ReactNode> = {
  reservation: <CalendarRange className="w-3 h-3 shrink-0" />,
  contract:    <FileText      className="w-3 h-3 shrink-0" />,
  maintenance: <Wrench        className="w-3 h-3 shrink-0" />,
};

// ─── Stat card ───────────────────────────────────────────────────────────────

const STAT_PALETTE = {
  emerald: { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  blue:    { text: "text-blue-600 dark:text-blue-400",       bar: "bg-blue-500",    dot: "bg-blue-500"    },
  amber:   { text: "text-amber-600 dark:text-amber-400",     bar: "bg-amber-500",   dot: "bg-amber-500"   },
  rose:    { text: "text-rose-600 dark:text-rose-400",       bar: "bg-rose-500",    dot: "bg-rose-500"    },
  slate:   { text: "text-slate-500 dark:text-slate-400",     bar: "bg-slate-400",   dot: "bg-slate-400"   },
} as const;
type PaletteKey = keyof typeof STAT_PALETTE;

function StatCard({
  label, value, total, palette,
}: { label: string; value: number; total: number; palette: PaletteKey }) {
  const p   = STAT_PALETTE[palette];
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-1 px-4 py-3 border-r last:border-r-0">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${p.dot}`} />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${p.text}`}>{value}</p>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${p.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Booking bar + popover ────────────────────────────────────────────────────

interface BarProps {
  booking: Booking;
  left: number;
  width: number;
  barTop: number;
  vehicleName: string;
}

function BookingBar({ booking, left, width, barTop, vehicleName }: BarProps) {
  const t       = useTranslations("calendar");
  const es      = EVENT_STYLES[booking.status] ?? EVENT_STYLES.completed;
  const days    = calculateDays(booking.startDate, booking.endDate) + 1;
  const initials = getInitials(booking.clientName);

  const label =
    width >= 96 ? (booking.clientName || booking.status)
    : width >= 40 ? initials
    : null;

  return (
    <Popover>
      <PopoverTrigger
        className={`absolute flex items-center gap-1.5 px-2 z-20 rounded-full cursor-pointer
          focus:outline-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-primary
          ${es.bg} ${es.text} ${es.hover}`}
        style={{ left: left + 2, width: Math.max(width - 4, 4), top: barTop, height: BAR_HEIGHT }}
      >
        {/* Type icon (show when there's space) */}
        {width >= 28 && (
          <span className="shrink-0 opacity-80">{TYPE_ICON[booking.type]}</span>
        )}
        {/* Label */}
        {label && (
          <span className="text-xs font-semibold truncate leading-none">{label}</span>
        )}
      </PopoverTrigger>

      <PopoverContent side="top" className="w-72 p-0 overflow-hidden">
        {/* Color header strip */}
        <div className={`px-3 py-2 flex items-center gap-2 ${es.bg}`}>
          <span className={`shrink-0 ${es.text}`}>{TYPE_ICON[booking.type]}</span>
          <span className={`text-xs font-bold uppercase tracking-wide ${es.text}`}>
            {booking.status.replace("_", " ")}
          </span>
          <span className={`ml-auto text-xs opacity-60 ${es.text}`}>{booking.type}</span>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2.5">
          {/* Client */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">
              {t("client")}
            </p>
            <p className="text-sm font-semibold">
              {booking.clientName || <span className="text-muted-foreground italic">{t("noClient")}</span>}
            </p>
          </div>

          {/* Vehicle */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">
              {t("vehicle")}
            </p>
            <p className="text-sm flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-muted-foreground" />
              {vehicleName}
            </p>
          </div>

          {/* Dates */}
          <div className="border-t pt-2.5 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{formatDate(booking.startDate)}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">{formatDate(booking.endDate)}</span>
            </div>
            <p className="text-xs text-center font-medium text-muted-foreground">
              {days} {t("days")}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const STATUS_FILTERS = ["all", "available", "rented", "reserved", "maintenance"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const FILTER_PALETTE: Record<string, PaletteKey> = {
  available: "emerald", rented: "blue", reserved: "amber", maintenance: "rose",
};

interface BookingTimelineProps {
  from: string;
  to: string;
  viewMode: ViewMode;
}

export function BookingTimeline({ from, to, viewMode }: BookingTimelineProps) {
  const t      = useTranslations("calendar");
  const locale = useLocale();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useSWR<{ success: boolean; data: CalendarData }>(
    `/api/calendar?from=${from}&to=${to}`,
    fetcher,
    { keepPreviousData: true }
  );

  const calendarData = data?.data;
  const dayWidth     = DAY_WIDTHS[viewMode];
  const BAR_TOP      = (ROW_HEIGHT - BAR_HEIGHT) / 2;
  const show3mHeader = viewMode === "3m";

  const days = useMemo(() => buildDays(from, to), [from, to]);
  const monthGroups = useMemo(
    () => (show3mHeader ? buildMonthGroups(days, locale) : []),
    [days, show3mHeader, locale]
  );

  const todayIdx   = days.findIndex((d) => d.isToday);
  const totalWidth = VEHICLE_COL_WIDTH + days.length * dayWidth;
  const totalDays  = days.length;

  // Fleet stats (computed from all vehicles, ignoring filter)
  const allVehicles = calendarData?.vehicles ?? [];
  const fleetStats = useMemo(() => ({
    total:       allVehicles.length,
    available:   allVehicles.filter((v) => v.status === "available").length,
    rented:      allVehicles.filter((v) => v.status === "rented").length,
    reserved:    allVehicles.filter((v) => v.status === "reserved").length,
    maintenance: allVehicles.filter((v) => v.status === "maintenance").length,
  }), [allVehicles]);

  // Filtered vehicle list
  const filteredVehicles = useMemo(() => {
    let list = allVehicles;
    if (statusFilter !== "all") list = list.filter((v) => v.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) => v.vehicleName.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allVehicles, statusFilter, search]);

  // Per-vehicle occupancy
  const occupancies = useMemo(
    () => Object.fromEntries(
      allVehicles.map((v) => [v.vehicleId, calcOccupancy(v.bookings, from, to, totalDays)])
    ),
    [allVehicles, from, to, totalDays]
  );

  const legend = [
    { label: t("legend.pending"),     dot: "bg-amber-500"   },
    { label: t("legend.confirmed"),   dot: "bg-blue-500"    },
    { label: t("legend.active"),      dot: "bg-emerald-500" },
    { label: t("legend.completed"),   dot: "bg-slate-400"   },
    { label: t("legend.maintenance"), dot: "bg-rose-500"    },
  ];

  // ── Loading skeleton ──
  if (isLoading && !calendarData) {
    return (
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-4 border-b">
          {["emerald", "blue", "amber", "rose"].map((c) => (
            <div key={c} className="px-4 py-3 border-r last:border-r-0">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-7 w-10 mb-1.5" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
        <div className="p-3 border-b flex gap-2">
          <Skeleton className="h-8 w-48 rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex border-b last:border-b-0">
            <Skeleton className="shrink-0 h-[68px]" style={{ width: VEHICLE_COL_WIDTH }} />
            <Skeleton className="flex-1 h-[68px] rounded-none" />
          </div>
        ))}
      </div>
    );
  }

  // ── Main render ──
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

      {/* ── Stats ribbon ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b divide-x divide-border">
        <StatCard label={t("filter.available")}   value={fleetStats.available}   total={fleetStats.total} palette="emerald" />
        <StatCard label={t("filter.rented")}      value={fleetStats.rented}      total={fleetStats.total} palette="blue"    />
        <StatCard label={t("filter.reserved")}    value={fleetStats.reserved}    total={fleetStats.total} palette="amber"   />
        <StatCard label={t("filter.maintenance")} value={fleetStats.maintenance} total={fleetStats.total} palette="rose"    />
      </div>

      {/* ── Controls ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b bg-muted/10">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-8 pl-8 pr-8 text-xs w-40 sm:w-52"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => {
            const count    = f === "all" ? fleetStats.total : fleetStats[f as keyof typeof fleetStats];
            const palette  = FILTER_PALETTE[f];
            const isActive = statusFilter === f;
            const dotColor = palette ? STAT_PALETTE[palette].dot : "";
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background border hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {palette && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
                {t(`filter.${f}`)}
                <span className={`tabular-nums text-[10px] font-bold ${isActive ? "opacity-70" : "opacity-40"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable timeline ──────────────────────────────────────── */}
      <div
        className="overflow-auto"
        style={{ maxHeight: "min(600px, calc(100vh - 360px))" }}
      >
        <div style={{ minWidth: totalWidth }}>

          {/* Month group row (3m view) */}
          {show3mHeader && (
            <div className="sticky top-0 z-30 flex border-b bg-muted/40">
              <div
                className="shrink-0 sticky left-0 z-40 bg-muted/40 border-r"
                style={{ width: VEHICLE_COL_WIDTH, height: 28 }}
              />
              {monthGroups.map((g) => (
                <div
                  key={g.startIdx}
                  className="shrink-0 px-2 flex items-center border-r text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
                  style={{ width: g.count * dayWidth, height: 28 }}
                >
                  {g.label}
                </div>
              ))}
            </div>
          )}

          {/* ── Sticky day header ── */}
          <div
            className={`sticky flex border-b bg-card shadow-sm ${show3mHeader ? "top-7" : "top-0"} z-20`}
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Corner cell */}
            <div
              className="shrink-0 sticky left-0 z-30 bg-card border-r flex items-end px-3 pb-2"
              style={{ width: VEHICLE_COL_WIDTH, height: HEADER_HEIGHT }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                {t("vehicle")}
              </span>
            </div>
            {/* Day cells */}
            <div className="flex">
              {days.map((d, i) => (
                <DayCell
                  key={i}
                  date={d.date}
                  width={dayWidth}
                  isToday={d.isToday}
                  isWeekend={d.isWeekend}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>

          {/* ── Vehicle rows ── */}
          {filteredVehicles.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 text-muted-foreground"
              style={{ height: ROW_HEIGHT * 4, minWidth: totalWidth }}
            >
              <Car className="w-10 h-10 opacity-15" />
              <p className="text-sm font-medium">
                {search || statusFilter !== "all" ? t("noResults") : t("noVehicles")}
              </p>
              {(search || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  className="text-xs text-primary hover:underline"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>
          ) : (
            filteredVehicles.map((vehicle, rowIdx) => {
              const occ = occupancies[vehicle.vehicleId] ?? 0;
              const occColor =
                occ >= 80 ? "bg-rose-500"
                : occ >= 50 ? "bg-amber-500"
                : occ > 0  ? "bg-emerald-500"
                : "bg-muted";

              const statusMeta = VEHICLE_STATUS[vehicle.status] ?? VEHICLE_STATUS.available;

              return (
                <div
                  key={vehicle.vehicleId}
                  className={`group flex border-b last:border-b-0 ${
                    rowIdx % 2 === 0 ? "bg-card" : "bg-muted/[0.03]"
                  }`}
                >
                  {/* Sticky vehicle name column */}
                  <div
                    className={`shrink-0 sticky left-0 z-10 border-r flex items-center px-3 gap-2.5 group-hover:bg-muted/30 transition-colors ${
                      rowIdx % 2 === 0 ? "bg-card" : "bg-muted/[0.03]"
                    }`}
                    style={{ width: VEHICLE_COL_WIDTH, height: ROW_HEIGHT }}
                  >
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dot}`} />

                    {/* Name + plate + occupancy bar */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm font-semibold truncate leading-tight">
                          {vehicle.vehicleName}
                        </p>
                        <span className={`text-[10px] font-bold tabular-nums shrink-0 ${
                          occ >= 80 ? "text-rose-600 dark:text-rose-400"
                          : occ >= 50 ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                        }`}>
                          {occ > 0 ? `${occ}%` : ""}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono tracking-tight leading-none mb-1.5">
                        {vehicle.plate}
                      </p>
                      {/* Occupancy bar */}
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${occColor}`}
                          style={{ width: `${occ}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day grid + bars */}
                  <div
                    className="relative shrink-0"
                    style={{ width: days.length * dayWidth, height: ROW_HEIGHT }}
                  >
                    {/* Column backgrounds */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {days.map((d, i) => (
                        <div
                          key={i}
                          className={`h-full border-r shrink-0 ${
                            d.isToday   ? "bg-primary/[0.04]"
                            : d.isWeekend ? "bg-muted/20"
                            : ""
                          }`}
                          style={{ width: dayWidth }}
                        />
                      ))}
                    </div>

                    {/* Today vertical line */}
                    {todayIdx !== -1 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-primary/30 pointer-events-none z-10"
                        style={{ left: todayIdx * dayWidth + dayWidth / 2 }}
                      />
                    )}

                    {/* Booking bars */}
                    {vehicle.bookings.map((booking) => {
                      const { left, width, visible } = calcBar(booking, from, to, dayWidth);
                      if (!visible || width < 3) return null;
                      return (
                        <BookingBar
                          key={booking.id}
                          booking={booking}
                          left={left}
                          width={width}
                          barTop={BAR_TOP}
                          vehicleName={vehicle.vehicleName}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className="border-t px-4 py-2.5 flex flex-wrap gap-x-5 gap-y-1.5 bg-muted/10">
        {legend.map(({ label, dot }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
            {label}
          </div>
        ))}
        <div className="ml-auto text-xs text-muted-foreground/40">
          {filteredVehicles.length} / {fleetStats.total} {t("vehicle").toLowerCase()}
        </div>
      </div>
    </div>
  );
}
