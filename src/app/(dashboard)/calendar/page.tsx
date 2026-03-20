"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { addDays, addMonths, startOfWeek, startOfMonth, format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { BookingTimeline } from "@/components/calendar/booking-timeline";
import type { ViewMode } from "@/components/calendar/types";

function getViewRange(anchor: Date, viewMode: ViewMode): { from: Date; to: Date } {
  switch (viewMode) {
    case "1w": { const from = startOfWeek(anchor, { weekStartsOn: 1 }); return { from, to: addDays(from, 6) }; }
    case "2w": { const from = startOfWeek(anchor, { weekStartsOn: 1 }); return { from, to: addDays(from, 13) }; }
    case "1m": { const from = startOfMonth(anchor); return { from, to: new Date(from.getFullYear(), from.getMonth() + 1, 0) }; }
    case "3m": { const from = startOfMonth(anchor); return { from, to: new Date(from.getFullYear(), from.getMonth() + 3, 0) }; }
  }
}

function navigate(anchor: Date, viewMode: ViewMode, dir: -1 | 1): Date {
  switch (viewMode) {
    case "1w":  return addDays(anchor, dir * 7);
    case "2w":  return addDays(anchor, dir * 14);
    case "1m":  return addMonths(anchor, dir);
    case "3m":  return addMonths(anchor, dir * 3);
  }
}

export default function CalendarPage() {
  const tp = useTranslations("pages");

  const [viewMode, setViewMode] = useState<ViewMode>("1m");
  const [anchor,   setAnchor]   = useState(() => new Date());

  const { from, to } = getViewRange(anchor, viewMode);
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr   = format(to,   "yyyy-MM-dd");

  const goToPrev         = useCallback(() => setAnchor((d) => navigate(d, viewMode, -1)), [viewMode]);
  const goToNext         = useCallback(() => setAnchor((d) => navigate(d, viewMode,  1)), [viewMode]);
  const goToToday        = useCallback(() => setAnchor(new Date()), []);
  const handleViewChange = useCallback((vm: ViewMode) => setViewMode(vm), []);

  // Keyboard navigation
  useEffect(() => {
    const VIEW_KEYS: Record<string, ViewMode> = { "1": "1w", "2": "2w", "3": "1m", "4": "3m" };
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); goToPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goToNext(); }
      if (e.key === "t" || e.key === "T") goToToday();
      if (VIEW_KEYS[e.key]) handleViewChange(VIEW_KEYS[e.key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToPrev, goToNext, goToToday, handleViewChange]);

  return (
    <div className="space-y-4">
      <PageHeader title={tp("calendar")} />
      <CalendarHeader
        from={from}
        to={to}
        viewMode={viewMode}
        onViewModeChange={handleViewChange}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
      />
      <BookingTimeline from={fromStr} to={toStr} viewMode={viewMode} />
    </div>
  );
}
