"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CalendarDays, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ViewMode } from "./types";

interface CalendarHeaderProps {
  from: Date;
  to: Date;
  viewMode: ViewMode;
  onViewModeChange: (vm: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const VIEW_MODES: ViewMode[] = ["1w", "2w", "1m", "3m"];

function formatRange(from: Date, to: Date, viewMode: ViewMode, locale: string): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleString(locale, opts);
  if (viewMode === "1m") return fmt(from, { month: "long", year: "numeric" });
  if (viewMode === "3m") return `${fmt(from, { month: "short" })} – ${fmt(to, { month: "short", year: "numeric" })}`;
  const fromPart = fmt(from, { month: "short", day: "numeric" });
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  const toPart = sameMonth
    ? `${to.getDate()}, ${to.getFullYear()}`
    : fmt(to, { month: "short", day: "numeric", year: "numeric" });
  return `${fromPart} – ${toPart}`;
}

export function CalendarHeader({
  from, to, viewMode, onViewModeChange, onPrev, onNext, onToday,
}: CalendarHeaderProps) {
  const t      = useTranslations("calendar");
  const locale = useLocale();
  const now    = new Date();
  const isCurrentPeriod = now >= from && now <= to;
  const rangeLabel = formatRange(from, to, viewMode, locale);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold capitalize">{rangeLabel}</h2>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* View mode segmented control */}
        <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
          {VIEW_MODES.map((vm, i) => (
            <Tooltip key={vm}>
              <TooltipTrigger>
                <button
                  onClick={() => onViewModeChange(vm)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    viewMode === vm
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`view.${vm}`)}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{t(`viewFull.${vm}`)}</span>
                <span className="ml-2 opacity-50 text-xs">{i + 1}</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {!isCurrentPeriod && (
            <Tooltip>
              <TooltipTrigger>
                <Button variant="outline" size="sm" onClick={onToday} className="h-8 text-xs font-medium">
                  {t("today")}
                </Button>
              </TooltipTrigger>
              <TooltipContent><span className="opacity-50 text-xs mr-1">T</span>{t("today")}</TooltipContent>
            </Tooltip>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Keyboard hint */}
        <Tooltip>
          <TooltipTrigger>
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors cursor-default">
              <Keyboard className="w-3.5 h-3.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-xs space-y-1">
            <p><kbd className="opacity-60">← →</kbd> Navigate</p>
            <p><kbd className="opacity-60">T</kbd> Today</p>
            <p><kbd className="opacity-60">1–4</kbd> Change view</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
