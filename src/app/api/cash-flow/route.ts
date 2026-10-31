import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCashFlowForecast, ForecastPeriod } from "@/lib/cashflow-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodParam = (searchParams.get("period") || "30_DAYS") as ForecastPeriod;
    const businessIdParam = searchParams.get("businessId");

    const validPeriods: ForecastPeriod[] = ["7_DAYS", "30_DAYS", "3_MONTHS", "6_MONTHS"];
    const period: ForecastPeriod = validPeriods.includes(periodParam) ? periodParam : "30_DAYS";

    // 1. Retrieve active business
    let business;
    if (businessIdParam) {
      business = await prisma.business.findUnique({
        where: { id: businessIdParam },
        include: { accounts: true },
      });
    } else {
      business = await prisma.business.findFirst({
        include: { accounts: true },
      });
    }

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    // 2. Compute current cash balance across business accounts
    const currentCashBalance = business.accounts.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0
    );

    // 3. Fetch all transactions
    const transactions = await prisma.transaction.findMany({
      where: { businessId: business.id },
      orderBy: { date: "asc" },
      include: { account: true },
    });

    // 4. Run Cash Flow Forecast Engine
    const forecast = calculateCashFlowForecast(
      transactions.map((t) => ({
        id: t.id,
        date: t.date,
        dueDate: t.dueDate,
        description: t.description,
        amount: t.amount,
        type: t.type,
        status: t.status,
        category: t.category,
        classification: t.classification,
        accountId: t.accountId,
        counterparty: t.counterparty,
        referenceNumber: t.referenceNumber,
      })),
      {
        period,
        currentCashBalance,
        minimumCashBalance: business.minimumCashBalance,
        asOfDate: new Date(),
      }
    );

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        minimumCashBalance: business.minimumCashBalance,
        accounts: business.accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.accountType,
          currentBalance: a.currentBalance,
        })),
      },
      forecast,
    });
  } catch (error: any) {
    console.error("Error generating cash flow forecast:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate cash flow forecast" },
      { status: 500 }
    );
  }
}
