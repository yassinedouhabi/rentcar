"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Car, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, navGroups } from "./nav-items";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="w-5 h-5" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">RentCAR</span>
          </SheetTitle>
        </SheetHeader>
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
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span>{t(item.labelKey)}</span>
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
      </SheetContent>
    </Sheet>
  );
}
