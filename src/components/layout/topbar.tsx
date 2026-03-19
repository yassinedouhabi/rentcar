"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/components/providers/theme-provider";
import { MobileNav } from "./mobile-nav";
import { formatDate } from "@/lib/utils";
import { navItems } from "./nav-items";

function setLocaleCookie(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
  window.location.reload();
}

export function Topbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();

  const currentNav = navItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)
  );
  const pageTitle = currentNav ? t(currentNav.labelKey) : "RentCAR";

  const dateLocale = locale === "ar" ? "ar-MA" : "en-GB";
  const today = formatDate(new Date(), dateLocale);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 h-16 px-4 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Mobile menu trigger */}
      <MobileNav />

      {/* Page title + date */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{pageTitle}</h1>
        <p className="text-xs text-muted-foreground hidden sm:block">{today}</p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as "dark" | "light" | "system")}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>

        <select
          value={locale}
          onChange={(e) => setLocaleCookie(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>
    </header>
  );
}
