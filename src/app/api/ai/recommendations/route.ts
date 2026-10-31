import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFinancialRecommendations, RecommendationOutput } from "@/lib/recommendation-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const businessIdParam = request.nextUrl.searchParams.get("businessId");

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
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 1. Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: { businessId: business.id },
      orderBy: { date: "asc" },
      include: { account: true },
    });

    const currentCashBalance = business.accounts.reduce(
      (sum, a) => sum + (a.currentBalance || 0),
      0
    );

    // 2. Fetch existing DB recommendations
    const existingDbRecs = await prisma.aIRecommendation.findMany({
      where: { businessId: business.id },
    });

    const existingRecsMap: RecommendationOutput[] = existingDbRecs.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category as any,
      impact: r.impact as any,
      estimatedSavings: r.estimatedSavings,
      actionType: r.actionType as any,
      suggestedAction: r.suggestedAction || "",
      evidence: r.evidence || "{}",
      status: r.status as any,
      notes: r.notes,
      createdAt: r.createdAt,
    }));

    // 3. Generate recommendations from live business data
    const summary = generateFinancialRecommendations(
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
        counterparty: t.counterparty,
        referenceNumber: t.referenceNumber,
        isUnusual: t.isUnusual,
        isDuplicate: t.isDuplicate,
      })),
      {
        currentCashBalance,
        minimumCashBalance: business.minimumCashBalance,
        existingRecommendations: existingRecsMap,
      }
    );

    // 4. Synchronize new recommendations into DB
    for (const rec of summary.recommendations) {
      const match = existingDbRecs.find((er) => er.title === rec.title);
      if (!match) {
        const created = await prisma.aIRecommendation.create({
          data: {
            businessId: business.id,
            title: rec.title,
            description: rec.description,
            category: rec.category,
            impact: rec.impact,
            estimatedSavings: rec.estimatedSavings || null,
            actionType: rec.actionType,
            suggestedAction: rec.suggestedAction,
            evidence: rec.evidence,
            status: rec.status,
          },
        });
        rec.id = created.id;
      } else {
        rec.id = match.id;
        rec.status = match.status as any;
        rec.notes = match.notes;
      }
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        currentCashBalance,
        minimumCashBalance: business.minimumCashBalance,
      },
      summary,
    });
  } catch (error: any) {
    console.error("Error loading recommendations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load recommendations" },
      { status: 500 }
    );
  }
}

