import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectFinancialRisks, RiskAlertOutput } from "@/lib/risk-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const businessIdParam = request.nextUrl.searchParams.get("businessId");

    // Retrieve active business
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

    // 1. Fetch transactions for business
    const transactions = await prisma.transaction.findMany({
      where: { businessId: business.id },
      orderBy: { date: "asc" },
      include: { account: true },
    });

    // 2. Compute current cash balance across accounts
    const currentCashBalance = business.accounts.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0
    );

    // 3. Fetch existing RiskAlert records in DB to preserve user actions/statuses
    const existingDbAlerts = await prisma.riskAlert.findMany({
      where: { businessId: business.id },
    });

    const existingAlertsMap: RiskAlertOutput[] = existingDbAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category as any,
      severity: a.severity as any,
      status: a.status as any,
      amount: a.amount,
      relatedCategory: a.relatedCategory,
      relatedTransactionId: a.relatedTransactionId,
      evidence: a.evidence || "{}",
      recommendedAction: a.recommendedAction || "",
      reviewNotes: a.reviewNotes,
      detectedAt: a.detectedAt,
    }));

    // 4. Run Risk Detection Pipeline
    const riskSummary = detectFinancialRisks(
      transactions.map((t) => ({
        id: t.id,
        date: t.date,
        dueDate: t.dueDate,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        status: t.status,
        classification: t.classification,
        accountId: t.accountId,
        counterparty: t.counterparty,
        referenceNumber: t.referenceNumber,
        source: t.source,
        isUnusual: t.isUnusual,
        isDuplicate: t.isDuplicate,
      })),
      {
        currentCashBalance,
        minimumCashBalance: business.minimumCashBalance,
        existingAlerts: existingAlertsMap,
      }
    );

    // 5. Synchronize detected alerts to DB if they don't already exist
    for (const detected of riskSummary.alerts) {
      const match = existingDbAlerts.find(
        (ea) => ea.title === detected.title || (ea.relatedTransactionId && ea.relatedTransactionId === detected.relatedTransactionId)
      );

      if (!match) {
        const created = await prisma.riskAlert.create({
          data: {
            businessId: business.id,
            title: detected.title,
            description: detected.description,
            category: detected.category,
            severity: detected.severity,
            status: detected.status,
            amount: detected.amount || null,
            relatedCategory: detected.relatedCategory || null,
            relatedTransactionId: detected.relatedTransactionId || null,
            evidence: detected.evidence,
            recommendedAction: detected.recommendedAction,
          },
        });
        detected.id = created.id;
      } else {
        detected.id = match.id;
        detected.status = match.status as any;
        detected.reviewNotes = match.reviewNotes;
      }
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        minimumCashBalance: business.minimumCashBalance,
        currentCashBalance,
      },
      summary: riskSummary,
    });
  } catch (error: any) {
    console.error("Error running risk detection:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run risk detection" },
      { status: 500 }
    );
  }
}
