import { getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { AlertsList } from "@/components/alerts/alerts-list";

export default async function AlertsPage() {
  const t = await getTranslations("alerts");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <AlertsList />
    </div>
  );
}
