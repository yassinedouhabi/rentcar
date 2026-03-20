export type ViewMode = "1w" | "2w" | "1m" | "3m";

export const DAY_WIDTHS: Record<ViewMode, number> = {
  "1w": 92,
  "2w": 64,
  "1m": 44,
  "3m": 22,
};

export const VEHICLE_COL_WIDTH = 244;
export const HEADER_HEIGHT     = 56;
export const ROW_HEIGHT        = 68;
export const BAR_HEIGHT        = 34;

// Full-solid-color pill events (Linear/Notion calendar style, no gradients)
export const EVENT_STYLES: Record<string, { bg: string; text: string; dot: string; hover: string }> = {
  pending:     { bg: "bg-amber-100 dark:bg-amber-900/50",    text: "text-amber-900 dark:text-amber-100",   dot: "bg-amber-500",   hover: "hover:bg-amber-200 dark:hover:bg-amber-800/50"    },
  confirmed:   { bg: "bg-blue-500 dark:bg-blue-600",         text: "text-white",                           dot: "bg-blue-300",    hover: "hover:bg-blue-600 dark:hover:bg-blue-500"         },
  active:      { bg: "bg-emerald-500 dark:bg-emerald-600",   text: "text-white",                           dot: "bg-emerald-300", hover: "hover:bg-emerald-600 dark:hover:bg-emerald-500"   },
  completed:   { bg: "bg-slate-200 dark:bg-slate-700",       text: "text-slate-600 dark:text-slate-300",   dot: "bg-slate-400",   hover: "hover:bg-slate-300 dark:hover:bg-slate-600"       },
  disputed:    { bg: "bg-orange-500 dark:bg-orange-600",     text: "text-white",                           dot: "bg-orange-300",  hover: "hover:bg-orange-600 dark:hover:bg-orange-500"     },
  scheduled:   { bg: "bg-violet-400 dark:bg-violet-600",     text: "text-white",                           dot: "bg-violet-200",  hover: "hover:bg-violet-500 dark:hover:bg-violet-500"     },
  in_progress: { bg: "bg-rose-500 dark:bg-rose-600",         text: "text-white",                           dot: "bg-rose-200",    hover: "hover:bg-rose-600 dark:hover:bg-rose-500"         },
};

export const VEHICLE_STATUS: Record<string, { dot: string; label: string }> = {
  available:   { dot: "bg-emerald-500", label: "available"   },
  rented:      { dot: "bg-blue-500",    label: "rented"      },
  reserved:    { dot: "bg-amber-500",   label: "reserved"    },
  maintenance: { dot: "bg-rose-500",    label: "maintenance" },
};
