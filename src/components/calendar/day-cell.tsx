"use client";

import { useLocale } from "next-intl";
import { HEADER_HEIGHT, type ViewMode } from "./types";

interface DayCellProps {
  date: Date;
  width: number;
  isToday: boolean;
  isWeekend: boolean;
  viewMode: ViewMode;
}

export function DayCell({ date, width, isToday, isWeekend, viewMode }: DayCellProps) {
  const locale = useLocale();
  const day    = date.getDate();

  // Weekday label strategy per view
  const weekdayLabel =
    viewMode === "1w" ? date.toLocaleString(locale, { weekday: "short" }).toUpperCase().slice(0, 3)
    : viewMode === "2w" ? date.toLocaleString(locale, { weekday: "narrow" }).toUpperCase()
    : viewMode === "1m" ? date.toLocaleString(locale, { weekday: "narrow" }).toUpperCase()
    : null;

  // Show month abbreviation on 1st of month for 3m and when crossing month boundary
  const showMonthLabel = day === 1 && (viewMode === "3m" || viewMode === "1m" || viewMode === "2w");
  const monthLabel = showMonthLabel
    ? date.toLocaleString(locale, { month: "short" }).toUpperCase()
    : null;

  return (
    <div
      className={`relative flex flex-col items-center justify-center border-r select-none flex-shrink-0 ${
        isWeekend ? "bg-muted/30" : ""
      }`}
      style={{ width, height: HEADER_HEIGHT }}
    >
      {/* Month label (shows on 1st of month) */}
      {monthLabel && (
        <span className="text-[8px] font-bold tracking-widest text-muted-foreground/50 leading-none mb-0.5">
          {monthLabel}
        </span>
      )}

      {/* Weekday */}
      {weekdayLabel && !monthLabel && (
        <span className={`leading-none font-semibold tracking-wide mb-1 ${
          viewMode === "1w" ? "text-[10px]" : "text-[9px]"
        } ${isToday ? "text-primary" : "text-muted-foreground"}`}>
          {weekdayLabel}
        </span>
      )}

      {/* Day number — circle for today */}
      {isToday ? (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-sm">
          <span className={`font-bold leading-none ${viewMode === "3m" ? "text-[10px]" : "text-sm"}`}>
            {day}
          </span>
        </div>
      ) : (
        <span className={`font-medium leading-none ${
          viewMode === "3m" ? "text-[9px]"
          : viewMode === "1m" ? "text-xs"
          : "text-sm"
        } ${isWeekend ? "text-muted-foreground/70" : "text-foreground/80"}`}>
          {day}
        </span>
      )}
    </div>
  );
}
