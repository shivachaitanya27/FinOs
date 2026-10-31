import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  runMatchingEngine,
  detectDuplicates,
  computeReconciliationSummary,
  ReconcileTransaction,
  MatchedPair,
} from "@/lib/reconciliation-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessIdParam = searchParams.get("businessId");
    const accountIdParam = searchParams.get("accountId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const statusParam = searchParams.get("status") || "ALL";
    const sourceParam = searchParams.get("source") || "ALL";
    const minAmount = searchParams.get("minAmount") ? parseFloat(searchParams.get("minAmount")!) : null;
    const maxAmount = searchParams.get("maxAmount") ? parseFloat(searchParams.get("maxAmount")!) : null;
    const search = searchParams.get("search")?.trim().toLowerCase();

    // 1. Identify active business
    let business = businessIdParam
      ? await prisma.business.findUnique({ where: { id: businessIdParam } })
      : await prisma.business.findFirst();

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const businessId = business.id;

    // 2. Build transaction query filters
    const where: any = { businessId };

    if (accountIdParam && accountIdParam !== "ALL") {
      where.accountId = accountIdParam;
    }

    if (startDateParam || endDateParam) {
      where.date = {};
      if (startDateParam) where.date.gte = new Date(startDateParam);
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (minAmount !== null || maxAmount !== null) {
      where.amount = {};
      if (minAmount !== null) where.amount.gte = minAmount;
      if (maxAmount !== null) where.amount.lte = maxAmount;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { referenceNumber: { contains: search } },
        { counterparty: { contains: search } },
        { category: { contains: search } },
      ];
    }

    // 3. Fetch all matching transactions
    const rawTransactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: { date: "desc" },
    });

    // 4. Partition transactions into Bank vs Accounting records
    // Bank feeds: source === "BANK_STATEMENT"
    // Accounting books: source in ["TALLY", "ZOHO_BOOKS", "MANUAL", "GENERIC"]
    const bankTransactions: ReconcileTransaction[] = [];
    const accountingTransactions: ReconcileTransaction[] = [];

    for (const t of rawTransactions) {
      const isBankSource = t.source === "BANK_STATEMENT";
      const item: ReconcileTransaction = {
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        source: t.source || "MANUAL",
        status: t.status,
        referenceNumber: t.referenceNumber,
        counterparty: t.counterparty,
        accountId: t.accountId,
        account: t.account ? { id: t.account.id, name: t.account.name } : null,
        isDuplicate: t.isDuplicate,
        notes: t.notes,
      };

      if (isBankSource) {
        bankTransactions.push(item);
      } else {
        accountingTransactions.push(item);
      }
    }

    // 5. Query already existing ReconciliationRecords from SQLite
    const existingRecords = await prisma.reconciliationRecord.findMany({
      where: { businessId },
      include: {
        transaction: {
          include: { account: true },
        },
      },
    });

    // Map existing approved / manual matches
    const persistedMatches: MatchedPair[] = [];
    const persistedBankIds = new Set<string>();
    const persistedAccIds = new Set<string>();

    for (const rec of existingRecords) {
      if (rec.accountingTransactionId && rec.transactionId) {
        const bankTx = rawTransactions.find((t) => t.id === rec.transactionId);
        const accTx = rawTransactions.find((t) => t.id === rec.accountingTransactionId);

        if (bankTx && accTx) {
          persistedBankIds.add(bankTx.id);
          persistedAccIds.add(accTx.id);

          let parsedReasons: string[] = [];
          try {
            if (rec.matchReasons) parsedReasons = JSON.parse(rec.matchReasons);
          } catch {
            parsedReasons = [rec.notes || "Matched record"];
          }

          persistedMatches.push({
            id: rec.id,
            bankTransaction: {
              id: bankTx.id,
              date: bankTx.date,
              description: bankTx.description,
              amount: bankTx.amount,
              type: bankTx.type,
              category: bankTx.category,
              source: bankTx.source,
              status: bankTx.status,
              referenceNumber: bankTx.referenceNumber,
              counterparty: bankTx.counterparty,
              accountId: bankTx.accountId,
              account: bankTx.account,
            },
            accountingTransaction: {
              id: accTx.id,
              date: accTx.date,
              description: accTx.description,
              amount: accTx.amount,
              type: accTx.type,
              category: accTx.category,
              source: accTx.source,
              status: accTx.status,
              referenceNumber: accTx.referenceNumber,
              counterparty: accTx.counterparty,
              accountId: accTx.accountId,
              account: accTx.account,
            },
            evidence: {
              amountScore: 30,
              referenceScore: 40,
              dateScore: 20,
              descriptionScore: 10,
              totalScore: rec.matchScore,
              confidence: rec.matchScore >= 90 ? "HIGH_CONFIDENCE" : "MEDIUM_CONFIDENCE",
              isDirectionMatch: true,
              isAmbiguous: false,
              reasons: parsedReasons,
              discrepancies: [],
            },
            matchScore: rec.matchScore,
            status: rec.matchStatus as any,
            reviewedAt: rec.reviewedAt,
            reviewedBy: rec.reviewedBy,
          });
        }
      }
    }

    // 6. Run algorithmic matching engine on unpersisted items
    const availableBank = bankTransactions.filter((b) => !persistedBankIds.has(b.id));
    const availableAcc = accountingTransactions.filter((a) => !persistedAccIds.has(a.id));

    const engineResults = runMatchingEngine(availableBank, availableAcc);

    // Combine persisted approved matches and newly suggested matches
    const allMatchedPairs = [...persistedMatches, ...engineResults.matchedPairs];

    // Filter matched pairs if status filter is active
    let filteredMatches = allMatchedPairs;
    if (statusParam === "RECONCILED" || statusParam === "APPROVED") {
      filteredMatches = allMatchedPairs.filter((p) => p.status === "APPROVED" || p.status === "MANUAL_MATCH");
    } else if (statusParam === "SUGGESTED") {
      filteredMatches = allMatchedPairs.filter((p) => p.status === "SUGGESTED");
    }

    // 7. Run Duplicate Detection Engine
    const duplicateGroups = detectDuplicates([...bankTransactions, ...accountingTransactions]);

    // 8. Compute Comprehensive Summary Metrics
    const summary = computeReconciliationSummary(
      bankTransactions,
      accountingTransactions,
      allMatchedPairs,
      duplicateGroups
    );

    return NextResponse.json({
      success: true,
      businessId,
      summary,
      matchedPairs: filteredMatches,
      unmatchedBank: engineResults.unmatchedBank,
      unmatchedAccounting: engineResults.unmatchedAccounting,
      duplicateGroups,
    });
  } catch (error: any) {
    console.error("Reconciliation GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

