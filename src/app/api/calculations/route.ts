import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateFinancialMetrics } from "@/lib/financial-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessIdParam = searchParams.get("businessId");
    const accountIdParam = searchParams.get("accountId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let business = businessIdParam
      ? await prisma.business.findUnique({ where: { id: businessIdParam } })
      : await prisma.business.findFirst();

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 400 });
    }

    const where: any = {
      businessId: business.id,
      status: { in: ["COMPLETED", "RECONCILED"] },
    };

    if (accountIdParam) {
      where.accountId = accountIdParam;
    }

    if (startDateParam || endDateParam) {
      where.date = {};
      if (startDateParam) where.date.gte = new Date(startDateParam);
      if (endDateParam) where.date.lte = new Date(endDateParam);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { date: "desc" },
    });

    const accounts = await prisma.financialAccount.findMany({
      where: { businessId: business.id },
    });

    const openingCash = accounts.reduce((acc, a) => acc + (a.openingBalance || 0), 0);
    const currentCashPosition = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);

    const metrics = calculateFinancialMetrics(transactions, {
      openingCash: currentCashPosition,
      targetAccountId: accountIdParam || null,
    });

    return NextResponse.json({
      success: true,
      businessId: business.id,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions, openingCash } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Expected transactions array in request body." },
        { status: 400 }
      );
    }

    const metrics = calculateFinancialMetrics(transactions, {
      openingCash: Number(openingCash) || 0,
      filterCompletedOnly: false,
    });

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

