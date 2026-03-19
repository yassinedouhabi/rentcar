import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CalendarPlus, Car, UserPlus, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { FleetOverview } from "@/components/dashboard/fleet-overview";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { UtilizationGauge } from "@/components/dashboard/utilization-gauge";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  const quickActions = [
    {
      label: t("newReservation"),
      href: "/reservations",
      icon: CalendarPlus,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40",
    },
    {
      label: t("addVehicle"),
      href: "/vehicles",
      icon: Car,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40",
    },
    {
      label: t("newClient"),
      href: "/clients",
      icon: UserPlus,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    },
    {
      label: t("newContract"),
      href: "/contracts",
      icon: FileText,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40",
    },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <KpiCards />

      {/* Row 2: Revenue Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <AlertsPanel />
      </div>

      {/* Row 3: Fleet Overview + Utilization + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FleetOverview />
        <div className="flex flex-col gap-5">
          <UtilizationGauge />

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">{t("quickActions")}</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border border-transparent transition-colors text-center ${action.bg}`}
                    >
                      <Icon className={`w-5 h-5 ${action.color}`} />
                      <span className="text-xs font-medium leading-tight">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <RecentActivity />
      </div>
    </div>
  );
}
