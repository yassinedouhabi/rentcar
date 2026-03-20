"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Car, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, navGroups } from "./nav-items";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";
import { AlertBadge } from "@/components/alerts/alert-badge";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-50 flex flex-col border-e border-border bg-card transition-[width] duration-300 overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header: logo + collapse toggle */}
      <div className="flex items-center h-14 px-3 border-b border-border shrink-0">
        {collapsed ? (
          <button
            onClick={toggle}
            className="flex items-center justify-center w-full h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 rtl:scale-x-[-1]" />
          </button>
        ) : (
          <>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight flex-1 truncate ms-2">RentCAR</span>
            <button
              onClick={toggle}
              className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 rtl:scale-x-[-1]" />
            </button>
          </>
        )}
      </div>

      {/* Nav — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3">
        <nav className={cn("space-y-4", collapsed ? "px-2" : "px-3")}>
          {navGroups.map((group) => {
            const items = navItems.filter((item) => item.group === group.key);
            return (
              <div key={group.key}>
                {!collapsed ? (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {t(group.labelKey)}
                  </p>
                ) : (
                  <Separator className="mb-2 opacity-20" />
                )}

                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);

                    const link = (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center rounded-md text-sm font-medium transition-colors",
                          collapsed
                            ? "justify-center w-10 h-10 mx-auto"
                            : "gap-3 px-3 py-2 w-full",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <span className="relative shrink-0">
                          <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                          {collapsed && item.key === "alerts" && (
                            <AlertBadge variant="dot" />
                          )}
                        </span>
                        {!collapsed && (
                          <>
                            <span>{t(item.labelKey)}</span>
                            {item.key === "alerts" && !isActive
                              ? <AlertBadge variant="pill" />
                              : isActive && <span className="ms-auto w-1 h-4 rounded-full bg-primary" />
                            }
                          </>
                        )}
                      </Link>
                    );

                    return (
                      <li key={item.key}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger>{link}</TooltipTrigger>
                            <TooltipContent side="right">
                              {t(item.labelKey)}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          link
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-2">
        {!collapsed && (
          <p className="text-xs text-muted-foreground/40 text-center">RentCAR v1.0</p>
        )}
      </div>
    </aside>
  );
}
