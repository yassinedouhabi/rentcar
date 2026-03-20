"use client";

import { useSidebar } from "./sidebar-context";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex flex-col min-h-screen transition-[margin] duration-300 ${
        collapsed ? "md:ms-16" : "md:ms-64"
      }`}
    >
      {children}
    </div>
  );
}
