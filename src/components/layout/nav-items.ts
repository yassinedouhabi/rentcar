import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  FileText,
  Calendar,
  Receipt,
  CreditCard,
  TrendingUp,
  Wallet,
  Wrench,
  Bell,
  FolderOpen,
  BarChart3,
  Settings,
} from "lucide-react";

export interface NavItem {
  key: string;
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "principal" | "operations" | "finance" | "management";
}

export const navItems: NavItem[] = [
  {
    key: "dashboard",
    labelKey: "nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "principal",
  },
  {
    key: "vehicles",
    labelKey: "nav.vehicles",
    href: "/vehicles",
    icon: Car,
    group: "operations",
  },
  {
    key: "clients",
    labelKey: "nav.clients",
    href: "/clients",
    icon: Users,
    group: "operations",
  },
  {
    key: "reservations",
    labelKey: "nav.reservations",
    href: "/reservations",
    icon: CalendarCheck,
    group: "operations",
  },
  {
    key: "contracts",
    labelKey: "nav.contracts",
    href: "/contracts",
    icon: FileText,
    group: "operations",
  },
  {
    key: "calendar",
    labelKey: "nav.calendar",
    href: "/calendar",
    icon: Calendar,
    group: "operations",
  },
  {
    key: "invoicing",
    labelKey: "nav.invoicing",
    href: "/invoicing",
    icon: Receipt,
    group: "finance",
  },
  {
    key: "payments",
    labelKey: "nav.payments",
    href: "/payments",
    icon: CreditCard,
    group: "finance",
  },
  {
    key: "cashflow",
    labelKey: "nav.cashflow",
    href: "/cashflow",
    icon: TrendingUp,
    group: "finance",
  },
  {
    key: "expenses",
    labelKey: "nav.expenses",
    href: "/expenses",
    icon: Wallet,
    group: "finance",
  },
  {
    key: "maintenance",
    labelKey: "nav.maintenance",
    href: "/maintenance",
    icon: Wrench,
    group: "management",
  },
  {
    key: "alerts",
    labelKey: "nav.alerts",
    href: "/alerts",
    icon: Bell,
    group: "management",
  },
  {
    key: "documents",
    labelKey: "nav.documents",
    href: "/documents",
    icon: FolderOpen,
    group: "management",
  },
  {
    key: "reports",
    labelKey: "nav.reports",
    href: "/reports",
    icon: BarChart3,
    group: "management",
  },
  {
    key: "settings",
    labelKey: "nav.settings",
    href: "/settings",
    icon: Settings,
    group: "management",
  },
];

export const navGroups = [
  { key: "principal", labelKey: "nav.groups.principal" },
  { key: "operations", labelKey: "nav.groups.operations" },
  { key: "finance", labelKey: "nav.groups.finance" },
  { key: "management", labelKey: "nav.groups.management" },
] as const;
