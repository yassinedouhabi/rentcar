import { NextRequest, NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Contract from "@/models/Contract";
import { ContractPDF, type ContractPDFData } from "@/components/contracts/contract-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contract = await Contract.findById(id)
    .populate("clientId")
    .populate("vehicleId")
    .populate("reservationId")
    .lean() as any;

  if (!contract)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const c = contract.clientId ?? {};
  const v = contract.vehicleId ?? {};
  const r = contract.reservationId ?? {};

  const data: ContractPDFData = {
    contractNumber:  contract.contractNumber,
    status:          contract.status,
    signedAt:        contract.signedAt ? new Date(contract.signedAt).toISOString() : null,
    mileageOut:      contract.mileageOut ?? null,
    mileageIn:       contract.mileageIn  ?? null,
    fuelLevelOut:    contract.fuelLevelOut ?? null,
    fuelLevelIn:     contract.fuelLevelIn  ?? null,
    damageReportOut: contract.damageReportOut ?? null,
    damageReportIn:  contract.damageReportIn  ?? null,
    client: {
      firstName:      c.firstName    ?? "",
      lastName:       c.lastName     ?? "",
      phone:          c.phone        ?? "",
      email:          c.email        ?? null,
      cin:            c.cin          ?? null,
      passport:       c.passport     ?? null,
      drivingLicense: c.drivingLicense ?? null,
      licenseExpiry:  c.licenseExpiry ? new Date(c.licenseExpiry).toISOString() : null,
      address:        c.address      ?? null,
      city:           c.city         ?? null,
      dateOfBirth:    c.dateOfBirth  ? new Date(c.dateOfBirth).toISOString() : null,
      nationality:    c.nationality  ?? null,
    },
    vehicle: {
      brand:     v.brand     ?? "",
      model:     v.model     ?? "",
      plate:     v.plate     ?? "",
      year:      v.year      ?? null,
      color:     v.color     ?? null,
      fuel:      v.fuel      ?? null,
      dailyRate: v.dailyRate ?? 0,
      vin:       v.vin       ?? null,
    },
    reservation: {
      startDate:  r.startDate ? new Date(r.startDate).toISOString() : new Date().toISOString(),
      endDate:    r.endDate   ? new Date(r.endDate).toISOString()   : new Date().toISOString(),
      totalDays:  r.totalDays  ?? null,
      totalPrice: r.totalPrice ?? 0,
      deposit:    r.deposit    ?? null,
      dailyRate:  r.dailyRate  ?? v.dailyRate ?? null,
    },
  };

  try {
    const element = createElement(ContractPDF, { data }) as ReactElement<DocumentProps>;
    const buffer  = await renderToBuffer(element);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="contrat-${data.contractNumber}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ success: false, error: "PDF generation failed" }, { status: 500 });
  }
}
