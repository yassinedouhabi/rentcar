"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, navGroups } from "./nav-items";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="fixed inset-y-0 start-0 z-50 w-64 flex flex-col border-e border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Car className="w-4 h-4" />
        </div>
        <span className="font-bold text-lg tracking-tight">RentCAR</span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-5">
          {navGroups.map((group) => {
            const items = navItems.filter((item) => item.group === group.key);
            return (
              <div key={group.key}>
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {t(group.labelKey)}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span>{t(item.labelKey)}</span>
                          {isActive && (
                            <span className="ms-auto w-1 h-4 rounded-full bg-primary" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      <div className="px-5 py-3 text-xs text-muted-foreground/50 text-center">
        RentCAR v1.0
      </div>
    </aside>
  );
}
