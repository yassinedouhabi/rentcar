// NOTE: This file uses @react-pdf/renderer primitives — NOT regular HTML/React.
// Do NOT use Tailwind, shadcn, or standard HTML elements here.
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Data shape ──────────────────────────────────────────────────────────────

export interface ContractPDFData {
  contractNumber: string;
  status: string;
  signedAt?: string | null;
  mileageOut?: number | null;
  mileageIn?: number | null;
  fuelLevelOut?: string | null;
  fuelLevelIn?: string | null;
  damageReportOut?: string | null;
  damageReportIn?: string | null;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    cin?: string | null;
    passport?: string | null;
    drivingLicense?: string | null;
    licenseExpiry?: string | null;
    address?: string | null;
    city?: string | null;
    dateOfBirth?: string | null;
    nationality?: string | null;
  };
  vehicle: {
    brand: string;
    model: string;
    plate: string;
    year?: number | null;
    color?: string | null;
    fuel?: string | null;
    dailyRate: number;
    vin?: string | null;
  };
  reservation: {
    startDate: string;
    endDate: string;
    totalDays?: number | null;
    totalPrice: number;
    deposit?: number | null;
    dailyRate?: number | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtDateLong(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function fmtMAD(n?: number | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-FR")} MAD`;
}

function fmtKm(n?: number | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-FR")} km`;
}

const FUEL_FR: Record<string, string> = {
  full: "Plein",
  "3/4": "3/4",
  "1/2": "1/2",
  "1/4": "1/4",
  empty: "Vide",
};

const STATUS_FR: Record<string, string> = {
  active:    "En cours",
  completed: "Terminé",
  disputed:  "Litigieux",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: "#dcfce7", text: "#15803d" },
  completed: { bg: "#e0f2fe", text: "#0369a1" },
  disputed:  { bg: "#fef9c3", text: "#92400e" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE   = "#1d4ed8";
const DARK   = "#0f172a";
const GRAY   = "#64748b";
const BORDER = "#e2e8f0";
const BG     = "#f8fafc";
const WHITE  = "#ffffff";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
  },

  // ── Header ──
  header: {
    backgroundColor: BLUE,
    paddingTop: 22,
    paddingBottom: 22,
    paddingLeft: 36,
    paddingRight: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: WHITE,
    letterSpacing: 3,
  },
  brandSub: {
    fontSize: 8,
    color: "#93c5fd",
    marginTop: 3,
  },
  contractRef: {
    alignItems: "flex-end",
  },
  contractTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contractNum: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: WHITE,
    marginTop: 4,
  },
  contractDate: {
    fontSize: 8,
    color: "#93c5fd",
    marginTop: 3,
  },

  // ── Status badge ──
  statusWrap: {
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  statusBadge: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusLabel: {
    fontSize: 8,
    color: GRAY,
    marginLeft: 8,
  },

  // ── Body ──
  body: {
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 16,
    paddingBottom: 16,
  },

  // ── Section ──
  section: {
    marginBottom: 14,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  sectionBar: {
    width: 3,
    height: 11,
    backgroundColor: BLUE,
    marginRight: 6,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: BLUE,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  // ── Two-column layout ──
  row2: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: BG,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  colGap: {
    width: 12,
  },

  // ── Data row ──
  dr: {
    flexDirection: "row",
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  dl: {
    width: 90,
    fontSize: 8,
    color: GRAY,
  },
  dv: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  // ── Rental summary box ──
  summaryBox: {
    borderWidth: 1,
    borderColor: BLUE,
    borderRadius: 4,
    backgroundColor: "#eff6ff",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    width: "50%",
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: 8,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: GRAY,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: DARK,
  },
  summaryValueAccent: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: BLUE,
  },

  // ── Notes box ──
  notesBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: BG,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 6,
  },
  notesText: {
    fontSize: 8,
    color: DARK,
    lineHeight: 1.5,
  },

  // ── Separator ──
  sep: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 14,
    marginBottom: 14,
  },

  // ── Terms ──
  termsBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: BG,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  termsText: {
    fontSize: 7,
    color: GRAY,
    lineHeight: 1.6,
  },

  // ── Signatures ──
  sigRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  sigBox: {
    flex: 1,
  },
  sigGap: {
    width: 32,
  },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: DARK,
    marginBottom: 6,
  },
  sigLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 28,
  },
  sigName: {
    fontSize: 7.5,
    color: GRAY,
  },

  // ── Footer ──
  footer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function DR({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "—") return null;
  return (
    <View style={s.dr}>
      <Text style={s.dl}>{label}</Text>
      <Text style={s.dv}>{value}</Text>
    </View>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={s.sectionHead}>
      <View style={s.sectionBar} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Main PDF document ────────────────────────────────────────────────────────

export function ContractPDF({ data }: { data: ContractPDFData }) {
  const { client, vehicle, reservation } = data;
  const statusColors = STATUS_COLORS[data.status] ?? STATUS_COLORS.completed;

  const totalDays     = reservation.totalDays ?? 0;
  const dailyRate     = reservation.dailyRate ?? vehicle.dailyRate ?? 0;
  const totalPrice    = reservation.totalPrice ?? 0;
  const deposit       = reservation.deposit ?? 0;
  const balance       = totalPrice - deposit;
  const hasReturn     = data.status === "completed" || data.status === "disputed";
  const kmDriven      = (data.mileageOut != null && data.mileageIn != null)
    ? data.mileageIn - data.mileageOut
    : null;

  return (
    <Document
      title={`Contrat ${data.contractNumber}`}
      author="RentCAR"
      subject="Contrat de location de véhicule"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>RENTCAR</Text>
            <Text style={s.brandSub}>Agence de location de véhicules · Maroc</Text>
          </View>
          <View style={s.contractRef}>
            <Text style={s.contractTitle}>Contrat de Location</Text>
            <Text style={s.contractNum}>{data.contractNumber}</Text>
            <Text style={s.contractDate}>
              Établi le {fmtDateLong(data.signedAt ?? reservation.startDate)}
            </Text>
          </View>
        </View>

        {/* ── Status strip ── */}
        <View style={s.statusWrap}>
          <View style={[s.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[s.statusText, { color: statusColors.text }]}>
              {STATUS_FR[data.status] ?? data.status}
            </Text>
          </View>
          <Text style={s.statusLabel}>
            Statut du contrat au {fmtDateLong(new Date().toISOString())}
          </Text>
        </View>

        <View style={s.body}>

          {/* ── Client + Vehicle (2 columns) ── */}
          <View style={s.section}>
            <View style={s.row2}>
              {/* Client column */}
              <View style={s.col}>
                <SectionHead title="Locataire" />
                <DR label="Nom complet"    value={`${client.firstName} ${client.lastName}`} />
                <DR label="Téléphone"      value={client.phone} />
                {client.email     && <DR label="Email"        value={client.email} />}
                {client.cin       && <DR label="CIN"          value={client.cin} />}
                {client.passport  && <DR label="Passeport"    value={client.passport} />}
                {client.drivingLicense && (
                  <DR label="Permis n°"   value={client.drivingLicense} />
                )}
                {client.licenseExpiry && (
                  <DR label="Exp. permis" value={fmtDate(client.licenseExpiry)} />
                )}
                {client.dateOfBirth && (
                  <DR label="Date nais."  value={fmtDate(client.dateOfBirth)} />
                )}
                {client.nationality && (
                  <DR label="Nationalité" value={client.nationality} />
                )}
                {(client.address || client.city) && (
                  <DR
                    label="Adresse"
                    value={[client.address, client.city].filter(Boolean).join(", ")}
                  />
                )}
              </View>

              <View style={s.colGap} />

              {/* Vehicle column */}
              <View style={s.col}>
                <SectionHead title="Véhicule" />
                <DR label="Marque / Modèle" value={`${vehicle.brand} ${vehicle.model}`} />
                <DR label="Immatriculation"  value={vehicle.plate} />
                {vehicle.year   && <DR label="Année"          value={String(vehicle.year)} />}
                {vehicle.color  && <DR label="Couleur"        value={vehicle.color} />}
                {vehicle.fuel   && <DR label="Carburant"      value={vehicle.fuel} />}
                {vehicle.vin    && <DR label="N° châssis"     value={vehicle.vin} />}
                <DR label="Tarif / jour"   value={fmtMAD(dailyRate)} />
              </View>
            </View>
          </View>

          {/* ── Rental summary ── */}
          <View style={s.section}>
            <SectionHead title="Conditions de location" />
            <View style={s.summaryBox}>
              <View style={s.summaryGrid}>
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Date de départ</Text>
                  <Text style={s.summaryValue}>{fmtDate(reservation.startDate)}</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Date de retour prévue</Text>
                  <Text style={s.summaryValue}>{fmtDate(reservation.endDate)}</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Durée</Text>
                  <Text style={s.summaryValue}>{totalDays} jour{totalDays > 1 ? "s" : ""}</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Tarif journalier</Text>
                  <Text style={s.summaryValue}>{fmtMAD(dailyRate)}</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={s.summaryLabel}>Montant total</Text>
                  <Text style={s.summaryValueAccent}>{fmtMAD(totalPrice)}</Text>
                </View>
                {deposit > 0 && (
                  <View style={s.summaryItem}>
                    <Text style={s.summaryLabel}>Caution versée</Text>
                    <Text style={s.summaryValue}>{fmtMAD(deposit)}</Text>
                  </View>
                )}
                {balance > 0 && (
                  <View style={s.summaryItem}>
                    <Text style={s.summaryLabel}>Reste à payer</Text>
                    <Text style={s.summaryValue}>{fmtMAD(balance)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Pickup condition ── */}
          <View style={s.section}>
            <SectionHead title="État du véhicule à la prise en charge" />
            <View style={s.col}>
              <DR label="Kilométrage départ"   value={fmtKm(data.mileageOut)} />
              <DR label="Niveau carburant"     value={data.fuelLevelOut ? (FUEL_FR[data.fuelLevelOut] ?? data.fuelLevelOut) : null} />
            </View>
            {data.damageReportOut && (
              <View style={s.notesBox}>
                <Text style={[s.notesText, { fontFamily: "Helvetica-Bold", marginBottom: 3 }]}>
                  Observations départ :
                </Text>
                <Text style={s.notesText}>{data.damageReportOut}</Text>
              </View>
            )}
          </View>

          {/* ── Return condition (only if completed/disputed) ── */}
          {hasReturn && (
            <View style={s.section}>
              <SectionHead title="État du véhicule au retour" />
              <View style={s.col}>
                <DR label="Kilométrage retour"   value={fmtKm(data.mileageIn)} />
                {kmDriven != null && (
                  <DR label="Km parcourus" value={fmtKm(kmDriven)} />
                )}
                <DR label="Niveau carburant"     value={data.fuelLevelIn ? (FUEL_FR[data.fuelLevelIn] ?? data.fuelLevelIn) : null} />
              </View>
              {data.damageReportIn && (
                <View style={s.notesBox}>
                  <Text style={[s.notesText, { fontFamily: "Helvetica-Bold", marginBottom: 3 }]}>
                    Observations retour :
                  </Text>
                  <Text style={s.notesText}>{data.damageReportIn}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── General conditions ── */}
          <View style={s.section}>
            <SectionHead title="Conditions générales" />
            <View style={s.termsBox}>
              <Text style={s.termsText}>
                Le locataire s'engage à : (1) utiliser le véhicule conformément au Code de la Route marocain et aux lois en vigueur ; (2) ne pas sous-louer, prêter ou céder le véhicule à un tiers ; (3) restituer le véhicule dans l'état dans lequel il l'a reçu, au lieu et à la date convenus ; (4) signaler immédiatement tout accident, vol ou dommage à l'agence ; (5) ne pas utiliser le véhicule hors du territoire marocain sans autorisation écrite préalable.
              </Text>
              <Text style={[s.termsText, { marginTop: 4 }]}>
                Tout retard de restitution non signalé sera facturé au tarif journalier en vigueur. En cas de sinistre, le locataire est responsable de la franchise prévue par la police d'assurance.
              </Text>
            </View>
          </View>

          {/* ── Signatures ── */}
          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Signature du Locataire</Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>{client.firstName} {client.lastName}</Text>
            </View>
            <View style={s.sigGap} />
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Cachet et Signature de l'Agence</Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>RENTCAR — Agence de location</Text>
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              Contrat N° {data.contractNumber} — {fmtDateLong(data.signedAt ?? reservation.startDate)}
            </Text>
            <Text style={s.footerText}>Document généré automatiquement · RentCAR</Text>
          </View>

        </View>
      </Page>
    </Document>
  );
}
