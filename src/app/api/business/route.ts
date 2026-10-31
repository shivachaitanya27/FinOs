import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId");
    let business;

    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { accounts: true },
      });
    } else {
      business = await prisma.business.findFirst({
        include: { accounts: true },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, legalName, taxId, panNumber, industry, fiscalYearStart, minimumCashBalance } = body;

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(legalName !== undefined && { legalName }),
        ...(taxId !== undefined && { taxId }),
        ...(panNumber !== undefined && { panNumber }),
        ...(industry !== undefined && { industry }),
        ...(fiscalYearStart !== undefined && { fiscalYearStart }),
        ...(minimumCashBalance !== undefined && { minimumCashBalance: Number(minimumCashBalance) }),
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
