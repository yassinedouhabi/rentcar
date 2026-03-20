"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { createElement } from "react";
import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 32, color: "#111827" },
  header: { backgroundColor: "#1d4ed8", padding: "12 16", borderRadius: 4, marginBottom: 20 },
  headerTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  headerSub: { fontSize: 9, color: "#bfdbfe", marginTop: 3 },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: "#f8fafc", border: "1pt solid #e2e8f0", borderRadius: 4, padding: "8 10" },
  kpiLabel: { fontSize: 7, color: "#64748b", marginBottom: 3 },
  kpiValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1d4ed8", marginBottom: 8, marginTop: 12 },
  table: { border: "1pt solid #e2e8f0", borderRadius: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", borderBottom: "1pt solid #e2e8f0", padding: "5 8" },
  tableRow: { flexDirection: "row", borderBottom: "1pt solid #f1f5f9", padding: "4 8" },
  tableRowLast: { flexDirection: "row", padding: "4 8" },
  cell: { fontSize: 8 },
  cellRight: { fontSize: 8, textAlign: "right" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
});

interface KpiItem { label: string; value: string }
interface TableRow { cells: string[] }

interface ReportPDFProps {
  title: string;
  subtitle: string;
  kpis: KpiItem[];
  tableHeaders: string[];
  tableRows: TableRow[];
  generatedAt: string;
}

function ReportPDF({ title, subtitle, kpis, tableHeaders, tableRows, generatedAt }: ReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub}>{subtitle}</Text>
        </View>

        {/* KPIs */}
        {kpis.length > 0 && (
          <View style={styles.kpiRow}>
            {kpis.map((k, i) => (
              <View key={i} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{k.label}</Text>
                <Text style={styles.kpiValue}>{k.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Table */}
        {tableRows.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                {tableHeaders.map((h, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.cell,
                      { flex: i === 0 ? 2 : 1, fontFamily: "Helvetica-Bold", fontSize: 7, color: "#475569" },
                    ]}
                  >
                    {h}
                  </Text>
                ))}
              </View>
              {tableRows.map((row, ri) => (
                <View
                  key={ri}
                  style={ri === tableRows.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  {row.cells.map((cell, ci) => (
                    <Text
                      key={ci}
                      style={[
                        ci === 0 ? styles.cell : styles.cellRight,
                        { flex: ci === 0 ? 2 : 1 },
                      ]}
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>RentCAR — {title}</Text>
          <Text style={styles.footerText}>{generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}

interface ExportButtonProps {
  title: string;
  subtitle: string;
  kpis: KpiItem[];
  tableHeaders: string[];
  tableRows: TableRow[];
  filename?: string;
  disabled?: boolean;
}

export function ExportButton({
  title, subtitle, kpis, tableHeaders, tableRows, filename, disabled,
}: ExportButtonProps) {
  const t = useTranslations("report");
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const now = new Date();
      const generatedAt = now.toLocaleDateString("fr-MA", {
        day: "2-digit", month: "long", year: "numeric",
      });

      const element = createElement(ReportPDF, {
        title, subtitle, kpis, tableHeaders, tableRows, generatedAt,
      });

      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? `rapport-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || loading}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-background hover:bg-muted text-sm font-medium text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {t("exportPdf")}
    </button>
  );
}

export { formatCurrency };
