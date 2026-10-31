import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runMatchingEngine, ReconcileTransaction } from "@/lib/reconciliation-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { autoApproveHighConfidence = false, accountId } = body;

    const firstBiz = await prisma.business.findFirst();
    if (!firstBiz) {
      return NextResponse.json({ error: "No business found" }, { status: 400 });
    }
    const businessId = firstBiz.id;

    // Fetch transactions
    const where: any = { businessId };
    if (accountId && accountId !== "ALL") {
      where.accountId = accountId;
    }

    const allTxs = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { date: "desc" },
    });

    const bankTxs: ReconcileTransaction[] = [];
    const accTxs: ReconcileTransaction[] = [];

    for (const t of allTxs) {
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
      };

      if (t.source === "BANK_STATEMENT") {
        bankTxs.push(item);
      } else {
        accTxs.push(item);
      }
    }

    const engineResults = runMatchingEngine(bankTxs, accTxs);

    let autoApprovedCount = 0;
    if (autoApproveHighConfidence) {
      for (const pair of engineResults.matchedPairs) {
        if (pair.evidence.confidence === "HIGH_CONFIDENCE" && pair.evidence.totalScore >= 90) {
          await prisma.$transaction(async (tx) => {
            await tx.transaction.update({
              where: { id: pair.bankTransaction.id },
              data: { status: "RECONCILED", reconciledWithId: pair.accountingTransaction.id },
            });
            await tx.transaction.update({
              where: { id: pair.accountingTransaction.id },
              data: { status: "RECONCILED", reconciledWithId: pair.bankTransaction.id },
            });
            await tx.reconciliationRecord.create({
              data: {
                businessId,
                transactionId: pair.bankTransaction.id,
                accountingTransactionId: pair.accountingTransaction.id,
                bankStatementRef: pair.bankTransaction.referenceNumber || `AUTO-${pair.bankTransaction.id.slice(-6)}`,
                matchConfidence: pair.evidence.totalScore / 100,
                matchScore: pair.evidence.totalScore,
                matchStatus: "APPROVED",
                matchReasons: JSON.stringify(pair.evidence.reasons),
                reviewedAt: new Date(),
                reviewedBy: "FinOS Auto-Reconciliation Engine",
                notes: "Auto-approved high confidence match.",
              },
            });
          });
          autoApprovedCount++;
        }
      }
    }

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        businessId,
        action: "AUTO_RECONCILIATION_RUN",
        entityType: "REPORT",
        details: `Engine evaluated ${bankTxs.length} bank feeds against ${accTxs.length} accounting records. Found ${engineResults.matchedPairs.length} matches (${autoApprovedCount} auto-approved).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reconciliation engine evaluated ${bankTxs.length + accTxs.length} records.`,
      matchedCount: engineResults.matchedPairs.length,
      autoApprovedCount,
      unmatchedBankCount: engineResults.unmatchedBank.length,
      unmatchedAccountingCount: engineResults.unmatchedAccounting.length,
    });
  } catch (error: any) {
    console.error("Auto-Reconciliation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

