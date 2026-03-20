"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import { toast } from "sonner";
import {
  Building2, Globe, FileText, Shield, Database,
  Save, Upload, Loader2, Eye, EyeOff, Download, Sprout,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import type { ISettings } from "@/types";

// ─── Fetcher ──────────────────────────────────────────────────────────────────
const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((r) => r.data as ISettings);

// ─── Reusable sub-components ──────────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-start gap-3 p-5 border-b border-border bg-muted/20">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-3 gap-2 sm:gap-4 items-start py-3 border-b border-border last:border-0">
      <div className="sm:pt-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
const textareaCls =
  "w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none";
const selectCls =
  "w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

function SaveBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const t  = useTranslations("settings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { theme, setTheme } = useTheme();

  const { data: settings, isLoading, mutate } = useSWR("/api/settings", fetcher);

  // ── Section 1: Agency ──────────────────────────────────────────────────────
  const [agency, setAgency] = useState({
    agencyName: "", agencyAddress: "", agencyPhone: "", agencyEmail: "", agencyLogo: "",
  });
  const [agencySaving, setAgencySaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Section 2: Preferences ────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    defaultLanguage: "fr", currency: "MAD", taxRate: 0, lateReturnPenaltyRate: 0,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  // ── Section 3: Invoicing ──────────────────────────────────────────────────
  const [invoicing, setInvoicing] = useState({
    invoiceNotes: "", invoicePrefix: "INV", contractPrefix: "RC",
  });
  const [invoicingSaving, setInvoicingSaving] = useState(false);

  // ── Section 4: Security ───────────────────────────────────────────────────
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // ── Section 5: Data ───────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Populate state when settings load
  useEffect(() => {
    if (!settings) return;
    setAgency({
      agencyName:   settings.agencyName   ?? "RentCAR",
      agencyAddress:settings.agencyAddress?? "",
      agencyPhone:  settings.agencyPhone  ?? "",
      agencyEmail:  settings.agencyEmail  ?? "",
      agencyLogo:   settings.agencyLogo   ?? "",
    });
    setPrefs({
      defaultLanguage:      settings.defaultLanguage      ?? "fr",
      currency:             settings.currency             ?? "MAD",
      taxRate:              settings.taxRate              ?? 0,
      lateReturnPenaltyRate:settings.lateReturnPenaltyRate?? 0,
    });
    setInvoicing({
      invoiceNotes:   settings.invoiceNotes   ?? "",
      invoicePrefix:  settings.invoicePrefix  ?? "INV",
      contractPrefix: settings.contractPrefix ?? "RC",
    });
  }, [settings]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function saveSettings(data: Record<string, unknown>) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Save failed");
    }
    await mutate();
  }

  function handleLogoFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("logoTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAgency((a) => ({ ...a, agencyLogo: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function setLocaleCookie(l: string) {
    document.cookie = `locale=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  // ── Submit handlers ────────────────────────────────────────────────────────
  async function submitAgency(e: React.FormEvent) {
    e.preventDefault();
    setAgencySaving(true);
    try {
      await saveSettings(agency);
      toast.success(t("savedAgency"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tc("errorOccurred"));
    } finally {
      setAgencySaving(false);
    }
  }

  async function submitPrefs(e: React.FormEvent) {
    e.preventDefault();
    setPrefsSaving(true);
    try {
      await saveSettings(prefs);
      // Apply language change live
      if (prefs.defaultLanguage !== locale) setLocaleCookie(prefs.defaultLanguage);
      else toast.success(t("savedPrefs"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tc("errorOccurred"));
    } finally {
      setPrefsSaving(false);
    }
  }

  async function submitInvoicing(e: React.FormEvent) {
    e.preventDefault();
    setInvoicingSaving(true);
    try {
      await saveSettings(invoicing);
      toast.success(t("savedInvoicing"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tc("errorOccurred"));
    } finally {
      setInvoicingSaving(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm) { toast.error(t("passwordMismatch")); return; }
    if (pw.next.length < 8)     { toast.error(t("passwordTooShort")); return; }
    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errKey = data.error === "wrong_current_password"
          ? "wrongCurrentPassword"
          : data.error === "password_too_short"
          ? "passwordTooShort"
          : "errorOccurred";
        toast.error(t(errKey as Parameters<typeof t>[0]));
        return;
      }
      toast.success(t("passwordChanged"));
      setPw({ current: "", next: "", confirm: "" });
    } catch {
      toast.error(tc("errorOccurred"));
    } finally {
      setPwSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rentcar-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(tc("errorOccurred"));
    } finally {
      setExporting(false);
    }
  }

  async function handleSeed() {
    if (!confirm(t("seedConfirm"))) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/settings/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "already_seeded") { toast.error(t("alreadySeeded")); return; }
        throw new Error(data.error);
      }
      toast.success(t("seedSuccess", { vehicles: data.data.vehicles, clients: data.data.clients }));
    } catch {
      toast.error(tc("errorOccurred"));
    } finally {
      setSeeding(false);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 rounded-xl border border-border bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-5 pb-10">

      {/* ── 1. Agency ──────────────────────────────────────────────────────── */}
      <SectionCard icon={Building2} title={t("agency.title")} description={t("agency.desc")}>
        <form onSubmit={submitAgency} className="space-y-0">
          <FieldRow label={t("agency.name")}>
            <input
              className={inputCls}
              value={agency.agencyName}
              onChange={(e) => setAgency((a) => ({ ...a, agencyName: e.target.value }))}
              placeholder="RentCAR"
            />
          </FieldRow>
          <FieldRow label={t("agency.address")}>
            <input
              className={inputCls}
              value={agency.agencyAddress}
              onChange={(e) => setAgency((a) => ({ ...a, agencyAddress: e.target.value }))}
              placeholder="123 Avenue Mohammed V, Casablanca"
            />
          </FieldRow>
          <FieldRow label={t("agency.phone")}>
            <input
              className={inputCls}
              value={agency.agencyPhone}
              onChange={(e) => setAgency((a) => ({ ...a, agencyPhone: e.target.value }))}
              placeholder="+212 6XX XXX XXX"
            />
          </FieldRow>
          <FieldRow label={t("agency.email")}>
            <input
              type="email"
              className={inputCls}
              value={agency.agencyEmail}
              onChange={(e) => setAgency((a) => ({ ...a, agencyEmail: e.target.value }))}
              placeholder="contact@agency.ma"
            />
          </FieldRow>
          <FieldRow label={t("agency.logo")} hint={t("agency.logoHint")}>
            <div className="flex items-center gap-3">
              {agency.agencyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agency.agencyLogo}
                  alt="Logo"
                  className="h-12 w-auto max-w-[120px] rounded border border-border object-contain bg-white p-1"
                />
              ) : (
                <div className="h-12 w-24 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background hover:bg-muted text-xs font-medium transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  {t("agency.uploadLogo")}
                </button>
                {agency.agencyLogo && (
                  <button
                    type="button"
                    onClick={() => setAgency((a) => ({ ...a, agencyLogo: "" }))}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors text-left"
                  >
                    {t("agency.removeLogo")}
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          </FieldRow>
          <div className="pt-4 flex justify-end">
            <SaveBtn loading={agencySaving} label={tc("save")} />
          </div>
        </form>
      </SectionCard>

      {/* ── 2. Preferences ─────────────────────────────────────────────────── */}
      <SectionCard icon={Globe} title={t("prefs.title")} description={t("prefs.desc")}>
        <form onSubmit={submitPrefs} className="space-y-0">
          <FieldRow label={t("prefs.language")}>
            <select
              className={selectCls}
              value={prefs.defaultLanguage}
              onChange={(e) => setPrefs((p) => ({ ...p, defaultLanguage: e.target.value }))}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </FieldRow>
          <FieldRow label={t("prefs.theme")}>
            <select
              className={selectCls}
              value={theme}
              onChange={(e) => setTheme(e.target.value as "dark" | "light" | "system")}
            >
              <option value="dark">{t("prefs.themeDark")}</option>
              <option value="light">{t("prefs.themeLight")}</option>
              <option value="system">{t("prefs.themeSystem")}</option>
            </select>
          </FieldRow>
          <FieldRow label={t("prefs.currency")}>
            <input
              className={inputCls}
              value={prefs.currency}
              onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}
              placeholder="MAD"
              maxLength={10}
            />
          </FieldRow>
          <FieldRow label={t("prefs.taxRate")} hint={t("prefs.taxRateHint")}>
            <div className="relative flex items-center">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className={`${inputCls} pr-8`}
                value={prefs.taxRate}
                onChange={(e) => setPrefs((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
              />
              <span className="absolute right-3 text-xs text-muted-foreground">%</span>
            </div>
          </FieldRow>
          <FieldRow label={t("prefs.lateReturnPenalty")} hint={t("prefs.lateReturnPenaltyHint")}>
            <div className="relative flex items-center">
              <input
                type="number"
                min={0}
                step={1}
                className={`${inputCls} pr-20`}
                value={prefs.lateReturnPenaltyRate}
                onChange={(e) => setPrefs((p) => ({ ...p, lateReturnPenaltyRate: parseFloat(e.target.value) || 0 }))}
              />
              <span className="absolute right-3 text-xs text-muted-foreground">MAD/jour</span>
            </div>
          </FieldRow>
          <div className="pt-4 flex justify-end">
            <SaveBtn loading={prefsSaving} label={tc("save")} />
          </div>
        </form>
      </SectionCard>

      {/* ── 3. Invoicing ───────────────────────────────────────────────────── */}
      <SectionCard icon={FileText} title={t("invoicing.title")} description={t("invoicing.desc")}>
        <form onSubmit={submitInvoicing} className="space-y-0">
          <FieldRow label={t("invoicing.invoicePrefix")} hint={t("invoicing.prefixHint")}>
            <input
              className={inputCls}
              value={invoicing.invoicePrefix}
              onChange={(e) => setInvoicing((i) => ({ ...i, invoicePrefix: e.target.value.toUpperCase() }))}
              placeholder="INV"
              maxLength={10}
            />
          </FieldRow>
          <FieldRow label={t("invoicing.contractPrefix")} hint={t("invoicing.prefixHint")}>
            <input
              className={inputCls}
              value={invoicing.contractPrefix}
              onChange={(e) => setInvoicing((i) => ({ ...i, contractPrefix: e.target.value.toUpperCase() }))}
              placeholder="RC"
              maxLength={10}
            />
          </FieldRow>
          <FieldRow label={t("invoicing.notes")} hint={t("invoicing.notesHint")}>
            <textarea
              className={textareaCls}
              rows={4}
              value={invoicing.invoiceNotes}
              onChange={(e) => setInvoicing((i) => ({ ...i, invoiceNotes: e.target.value }))}
              placeholder={t("invoicing.notesPlaceholder")}
            />
          </FieldRow>
          <div className="pt-4 flex justify-end">
            <SaveBtn loading={invoicingSaving} label={tc("save")} />
          </div>
        </form>
      </SectionCard>

      {/* ── 4. Security ────────────────────────────────────────────────────── */}
      <SectionCard icon={Shield} title={t("security.title")} description={t("security.desc")}>
        <form onSubmit={submitPassword} className="space-y-0">
          {(["current", "next", "confirm"] as const).map((field) => {
            const labels: Record<typeof field, string> = {
              current: t("security.currentPassword"),
              next:    t("security.newPassword"),
              confirm: t("security.confirmPassword"),
            };
            return (
              <FieldRow
                key={field}
                label={labels[field]}
                hint={field === "next" ? t("security.passwordHint") : undefined}
              >
                <div className="relative flex items-center">
                  <input
                    type={showPw[field] ? "text" : "password"}
                    className={`${inputCls} pr-10`}
                    value={pw[field]}
                    onChange={(e) => setPw((p) => ({ ...p, [field]: e.target.value }))}
                    autoComplete={field === "current" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => ({ ...s, [field]: !s[field] }))}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPw[field]
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
              </FieldRow>
            );
          })}
          <div className="pt-4 flex justify-end">
            <SaveBtn loading={pwSaving} label={t("security.changePassword")} />
          </div>
        </form>
      </SectionCard>

      {/* ── 5. Data ────────────────────────────────────────────────────────── */}
      <SectionCard icon={Database} title={t("data.title")} description={t("data.desc")}>
        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium">{t("data.exportTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("data.exportDesc")}</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-background hover:bg-muted text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {t("data.exportBtn")}
            </button>
          </div>

          {/* Seed */}
          <div className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">{t("data.seedTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("data.seedDesc")}</p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sprout className="w-3.5 h-3.5" />}
              {t("data.seedBtn")}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
