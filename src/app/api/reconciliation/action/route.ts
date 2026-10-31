import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMatchScore } from "@/lib/reconciliation-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      bankTransactionId,
      accountingTransactionId,
      transactionId,
      primaryTransactionId,
      reconciliationRecordId,
      matchScore = 100,
      reasons = [],
      notes,
    } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing required 'action' parameter." }, { status: 400 });
    }

    const firstBiz = await prisma.business.findFirst();
    const businessId = firstBiz?.id;
    if (!businessId) {
      return NextResponse.json({ error: "No active business found." }, { status: 400 });
    }

    switch (action) {
      // 1. Approve a Suggested Match
      case "approve_match": {
        if (!bankTransactionId || !accountingTransactionId) {
          return NextResponse.json(
            { error: "Both bankTransactionId and accountingTransactionId are required to approve a match." },
            { status: 400 }
          );
        }

        const bankTx = await prisma.transaction.findUnique({ where: { id: bankTransactionId } });
        const accTx = await prisma.transaction.findUnique({ where: { id: accountingTransactionId } });

        if (!bankTx || !accTx) {
          return NextResponse.json({ error: "One or both transactions could not be found." }, { status: 404 });
        }

        const score = typeof matchScore === "number" ? matchScore : 95;
        const reasonsStr = typeof reasons === "string" ? reasons : JSON.stringify(reasons);

        const result = await prisma.$transaction(async (tx) => {
          // Update bank transaction
          await tx.transaction.update({
            where: { id: bankTransactionId },
            data: {
              status: "RECONCILED",
              reconciledWithId: accountingTransactionId,
            },
          });

          // Update accounting transaction
          await tx.transaction.update({
            where: { id: accountingTransactionId },
            data: {
              status: "RECONCILED",
              reconciledWithId: bankTransactionId,
            },
          });

          // Create or update ReconciliationRecord
          const rec = await tx.reconciliationRecord.create({
            data: {
              businessId,
              transactionId: bankTransactionId,
              accountingTransactionId,
              bankStatementRef: bankTx.referenceNumber || `REF-${bankTx.id.slice(-6)}`,
              matchConfidence: score / 100,
              matchScore: score,
              matchStatus: "APPROVED",
              matchReasons: reasonsStr,
              reviewedAt: new Date(),
              reviewedBy: "System Auditor / User",
              notes: notes || "Match verified and approved by user.",
            },
          });

          // Record Audit Log
          await tx.auditLog.create({
            data: {
              businessId,
              action: "RECONCILIATION_MATCH_APPROVED",
              entityType: "TRANSACTION",
              entityId: rec.id,
              details: `Approved match: Bank Tx "${bankTx.description}" (₹${bankTx.amount}) with Accounting "${accTx.description}" (₹${accTx.amount}). Score: ${score}/100.`,
            },
          });

          return rec;
        });

        return NextResponse.json({ success: true, message: "Match approved successfully.", record: result });
      }

      // 2. Reject a Suggested Match
      case "reject_match": {
        if (!bankTransactionId && !reconciliationRecordId) {
          return NextResponse.json({ error: "Missing transaction identification to reject." }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
          if (bankTransactionId) {
            await tx.transaction.update({
              where: { id: bankTransactionId },
              data: { status: "UNMATCHED", reconciledWithId: null },
            });
          }

          if (accountingTransactionId) {
            await tx.transaction.update({
              where: { id: accountingTransactionId },
              data: { status: "UNMATCHED", reconciledWithId: null },
            });
          }

          if (reconciliationRecordId) {
            await tx.reconciliationRecord.deleteMany({
              where: { id: reconciliationRecordId },
            });
          }

          await tx.auditLog.create({
            data: {
              businessId,
              action: "RECONCILIATION_MATCH_REJECTED",
              entityType: "TRANSACTION",
              entityId: bankTransactionId || reconciliationRecordId,
              details: `Rejected suggested match between transactions ${bankTransactionId || ""} and ${accountingTransactionId || ""}.`,
            },
          });
        });

        return NextResponse.json({ success: true, message: "Match rejected." });
      }

      // 3. Manual Match Two Transactions
      case "manual_match": {
        if (!bankTransactionId || !accountingTransactionId) {
          return NextResponse.json(
            { error: "Both bankTransactionId and accountingTransactionId must be provided for manual match." },
            { status: 400 }
          );
        }

        const bankTx = await prisma.transaction.findUnique({ where: { id: bankTransactionId } });
        const accTx = await prisma.transaction.findUnique({ where: { id: accountingTransactionId } });

        if (!bankTx || !accTx) {
          return NextResponse.json({ error: "Transactions not found." }, { status: 404 });
        }

        // Calculate score
        const evidence = calculateMatchScore(
          {
            id: bankTx.id,
            date: bankTx.date,
            description: bankTx.description,
            amount: bankTx.amount,
            type: bankTx.type,
            source: bankTx.source,
            referenceNumber: bankTx.referenceNumber,
            counterparty: bankTx.counterparty,
          },
          {
            id: accTx.id,
            date: accTx.date,
            description: accTx.description,
            amount: accTx.amount,
            type: accTx.type,
            source: accTx.source,
            referenceNumber: accTx.referenceNumber,
            counterparty: accTx.counterparty,
          }
        );

        const rec = await prisma.$transaction(async (tx) => {
          await tx.transaction.update({
            where: { id: bankTransactionId },
            data: { status: "RECONCILED", reconciledWithId: accountingTransactionId },
          });

          await tx.transaction.update({
            where: { id: accountingTransactionId },
            data: { status: "RECONCILED", reconciledWithId: bankTransactionId },
          });

          const created = await tx.reconciliationRecord.create({
            data: {
              businessId,
              transactionId: bankTransactionId,
              accountingTransactionId,
              bankStatementRef: bankTx.referenceNumber || `MANUAL-${bankTx.id.slice(-6)}`,
              matchConfidence: 1.0,
              matchScore: Math.max(evidence.totalScore, 75),
              matchStatus: "MANUAL_MATCH",
              matchReasons: JSON.stringify([
                "Manually matched and authorized by financial user",
                ...evidence.reasons,
              ]),
              reviewedAt: new Date(),
              reviewedBy: "User Manual Override",
              notes: notes || "Manually reconciled by user.",
            },
          });

          await tx.auditLog.create({
            data: {
              businessId,
              action: "RECONCILIATION_MANUAL_MATCH",
              entityType: "TRANSACTION",
              entityId: created.id,
              details: `Manually matched Bank Tx "${bankTx.description}" with Accounting Tx "${accTx.description}". Reason: ${notes || "User authorization"}.`,
            },
          });

          return created;
        });

        return NextResponse.json({ success: true, message: "Transactions manually matched.", record: rec });
      }

      // 4. Unmatch Transactions
      case "unmatch": {
        if (!reconciliationRecordId && !transactionId) {
          return NextResponse.json({ error: "Missing record identification to unmatch." }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
          let rec = null;
          if (reconciliationRecordId) {
            rec = await tx.reconciliationRecord.findUnique({ where: { id: reconciliationRecordId } });
          } else if (transactionId) {
            rec = await tx.reconciliationRecord.findFirst({
              where: {
                OR: [{ transactionId }, { accountingTransactionId: transactionId }],
              },
            });
          }

          if (rec) {
            if (rec.transactionId) {
              await tx.transaction.update({
                where: { id: rec.transactionId },
                data: { status: "COMPLETED", reconciledWithId: null },
              });
            }
            if (rec.accountingTransactionId) {
              await tx.transaction.update({
                where: { id: rec.accountingTransactionId },
                data: { status: "COMPLETED", reconciledWithId: null },
              });
            }

            await tx.reconciliationRecord.delete({ where: { id: rec.id } });

            await tx.auditLog.create({
              data: {
                businessId,
                action: "RECONCILIATION_UNMATCHED",
                entityType: "TRANSACTION",
                entityId: rec.id,
                details: `Unmatched reconciled transactions. Set back to active ledger.`,
              },
            });
          }
        });

        return NextResponse.json({ success: true, message: "Transactions successfully unmatched." });
      }

      // 5. Confirm Suspected Duplicate
      case "confirm_duplicate": {
        if (!transactionId) {
          return NextResponse.json({ error: "transactionId is required to flag a duplicate." }, { status: 400 });
        }

        const updated = await prisma.$transaction(async (tx) => {
          const res = await tx.transaction.update({
            where: { id: transactionId },
            data: {
              isDuplicate: true,
              status: "FLAGGED",
              duplicateOfId: primaryTransactionId || null,
              notes: notes || "Confirmed as duplicate payment by user audit.",
            },
          });

          await tx.auditLog.create({
            data: {
              businessId,
              action: "DUPLICATE_CONFIRMED",
              entityType: "TRANSACTION",
              entityId: transactionId,
              details: `Confirmed transaction "${res.description}" (₹${res.amount}) as duplicate. Flagged for review/reversal.`,
            },
          });

          return res;
        });

        return NextResponse.json({ success: true, message: "Duplicate confirmed and flagged.", transaction: updated });
      }

      // 6. Dismiss Duplicate Flag (Confirm Legitimate)
      case "dismiss_duplicate": {
        if (!transactionId) {
          return NextResponse.json({ error: "transactionId is required to dismiss duplicate flag." }, { status: 400 });
        }

        const updated = await prisma.$transaction(async (tx) => {
          const res = await tx.transaction.update({
            where: { id: transactionId },
            data: {
              isDuplicate: false,
              status: "COMPLETED",
              duplicateOfId: null,
            },
          });

          await tx.auditLog.create({
            data: {
              businessId,
              action: "DUPLICATE_DISMISSED",
              entityType: "TRANSACTION",
              entityId: transactionId,
              details: `Dismissed duplicate alert for transaction "${res.description}" (₹${res.amount}). Marked as legitimate.`,
            },
          });

          return res;
        });

        return NextResponse.json({ success: true, message: "Transaction confirmed as legitimate.", transaction: updated });
      }

      default:
        return NextResponse.json({ error: `Unknown action: "${action}"` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Reconciliation Action error:", error);
    return NextResponse.json({ error: error.message || "Failed to process reconciliation action." }, { status: 500 });
  }
}

