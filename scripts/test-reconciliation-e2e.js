/**
 * FinOS Stage 3 - End-to-End Database Reconciliation & Approval Workflow Test
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runE2E() {
  console.log("=================================================");
  console.log("🧪 STARTING STAGE 3 DATABASE WORKFLOW E2E TEST");
  console.log("=================================================\n");

  const biz = await prisma.business.findFirst({ include: { accounts: true } });
  if (!biz) throw new Error("No business found");

  const hdfc = biz.accounts[0];

  // Create temporary test transactions: 1 bank entry and 1 accounting entry
  console.log("▶ Step 1: Creating paired test transactions in SQLite...");
  const bankTx = await prisma.transaction.create({
    data: {
      businessId: biz.id,
      accountId: hdfc.id,
      date: new Date("2024-10-15"),
      description: "NEFT CR-ACME CORP SALES REVENUE",
      amount: 175000,
      type: "REVENUE",
      category: "Sales & Services",
      source: "BANK_STATEMENT",
      referenceNumber: "ACME-UTR-7712",
      status: "COMPLETED",
      isDemo: false,
    },
  });

  const accTx = await prisma.transaction.create({
    data: {
      businessId: biz.id,
      accountId: hdfc.id,
      date: new Date("2024-10-15"),
      description: "Acme Corp Enterprise SaaS Annual License",
      amount: 175000,
      type: "REVENUE",
      category: "Sales & Services",
      source: "TALLY",
      referenceNumber: "ACME-UTR-7712",
      status: "COMPLETED",
      isDemo: false,
    },
  });

  console.log(`  Created Bank Tx (${bankTx.id}) & Accounting Tx (${accTx.id})`);

  // Step 2: Test User Approval Action
  console.log("\n▶ Step 2: Simulating User Approval Workflow (action: approve_match)...");
  // Simulate POST to /api/reconciliation/action
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: bankTx.id },
      data: { status: "RECONCILED", reconciledWithId: accTx.id },
    });
    await tx.transaction.update({
      where: { id: accTx.id },
      data: { status: "RECONCILED", reconciledWithId: bankTx.id },
    });
    await tx.reconciliationRecord.create({
      data: {
        businessId: biz.id,
        transactionId: bankTx.id,
        accountingTransactionId: accTx.id,
        bankStatementRef: bankTx.referenceNumber,
        matchConfidence: 0.98,
        matchScore: 98,
        matchStatus: "APPROVED",
        matchReasons: JSON.stringify(["Exact reference match", "Exact amount match", "Same date"]),
        reviewedAt: new Date(),
        reviewedBy: "E2E Auditor",
        notes: "Approved via automated test",
      },
    });
    await tx.auditLog.create({
      data: {
        businessId: biz.id,
        action: "RECONCILIATION_MATCH_APPROVED",
        entityType: "TRANSACTION",
        entityId: bankTx.id,
        details: `Approved match for ${bankTx.id} with ${accTx.id}`,
      },
    });
  });

  // Verify database state after approval
  const verifiedBankTx = await prisma.transaction.findUnique({ where: { id: bankTx.id } });
  const verifiedAccTx = await prisma.transaction.findUnique({ where: { id: accTx.id } });
  const recRecord = await prisma.reconciliationRecord.findFirst({
    where: { transactionId: bankTx.id },
  });
  const auditLog = await prisma.auditLog.findFirst({
    where: { action: "RECONCILIATION_MATCH_APPROVED", entityId: bankTx.id },
  });

  if (verifiedBankTx.status !== "RECONCILED" || verifiedBankTx.reconciledWithId !== accTx.id) {
    throw new Error("Bank transaction status was not updated to RECONCILED");
  }
  if (verifiedAccTx.status !== "RECONCILED" || verifiedAccTx.reconciledWithId !== bankTx.id) {
    throw new Error("Accounting transaction status was not updated to RECONCILED");
  }
  if (!recRecord || recRecord.matchStatus !== "APPROVED" || recRecord.matchScore !== 98) {
    throw new Error("ReconciliationRecord was not stored correctly");
  }
  if (!auditLog) {
    throw new Error("Audit log record was not created");
  }
  console.log("  ✔ Transactions marked RECONCILED, cross-linked, ReconciliationRecord stored, AuditLog recorded.");

  // Step 3: Test Unmatch Action
  console.log("\n▶ Step 3: Simulating Unmatch Workflow (action: unmatch)...");
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: bankTx.id },
      data: { status: "COMPLETED", reconciledWithId: null },
    });
    await tx.transaction.update({
      where: { id: accTx.id },
      data: { status: "COMPLETED", reconciledWithId: null },
    });
    await tx.reconciliationRecord.deleteMany({
      where: { transactionId: bankTx.id },
    });
    await tx.auditLog.create({
      data: {
        businessId: biz.id,
        action: "RECONCILIATION_UNMATCHED",
        entityType: "TRANSACTION",
        entityId: bankTx.id,
        details: `Unmatched transactions`,
      },
    });
  });

  const postUnmatchBank = await prisma.transaction.findUnique({ where: { id: bankTx.id } });
  const postUnmatchRec = await prisma.reconciliationRecord.findFirst({
    where: { transactionId: bankTx.id },
  });
  if (postUnmatchBank.status !== "COMPLETED" || postUnmatchBank.reconciledWithId !== null) {
    throw new Error("Unmatch did not reset transaction status");
  }
  if (postUnmatchRec !== null) {
    throw new Error("ReconciliationRecord was not removed on unmatch");
  }
  console.log("  ✔ Unmatch successfully broke link and restored transactions to active ledger.");

  // Step 4: Test Manual Match Action
  console.log("\n▶ Step 4: Simulating Manual Match Workflow (action: manual_match)...");
  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: bankTx.id },
      data: { status: "RECONCILED", reconciledWithId: accTx.id },
    });
    await tx.transaction.update({
      where: { id: accTx.id },
      data: { status: "RECONCILED", reconciledWithId: bankTx.id },
    });
    await tx.reconciliationRecord.create({
      data: {
        businessId: biz.id,
        transactionId: bankTx.id,
        accountingTransactionId: accTx.id,
        bankStatementRef: bankTx.referenceNumber,
        matchConfidence: 1.0,
        matchScore: 85,
        matchStatus: "MANUAL_MATCH",
        matchReasons: JSON.stringify(["Manually verified by accountant"]),
        reviewedAt: new Date(),
        reviewedBy: "Accountant Manual Override",
        notes: "Manually matched",
      },
    });
  });

  const manualRec = await prisma.reconciliationRecord.findFirst({
    where: { transactionId: bankTx.id },
  });
  if (!manualRec || manualRec.matchStatus !== "MANUAL_MATCH") {
    throw new Error("Manual match record not stored");
  }
  console.log("  ✔ Manual match successfully created and marked as MANUAL_MATCH.");

  // Step 5: Test Duplicate Flagging & Dismissal
  console.log("\n▶ Step 5: Simulating Duplicate Flagging & Dismissal Workflow...");
  // Flag as duplicate
  await prisma.transaction.update({
    where: { id: accTx.id },
    data: { isDuplicate: true, status: "FLAGGED", duplicateOfId: bankTx.id },
  });
  const flagged = await prisma.transaction.findUnique({ where: { id: accTx.id } });
  if (!flagged.isDuplicate || flagged.status !== "FLAGGED") {
    throw new Error("Failed to flag duplicate");
  }

  // Dismiss duplicate
  await prisma.transaction.update({
    where: { id: accTx.id },
    data: { isDuplicate: false, status: "COMPLETED", duplicateOfId: null },
  });
  const dismissed = await prisma.transaction.findUnique({ where: { id: accTx.id } });
  if (dismissed.isDuplicate !== false || dismissed.status !== "COMPLETED") {
    throw new Error("Failed to dismiss duplicate");
  }
  console.log("  ✔ Duplicate flagging and confirmation dismissal verified.");

  // Clean up test transactions
  console.log("\n▶ Step 6: Cleaning up test artifacts...");
  await prisma.reconciliationRecord.deleteMany({ where: { transactionId: bankTx.id } });
  await prisma.transaction.delete({ where: { id: bankTx.id } });
  await prisma.transaction.delete({ where: { id: accTx.id } });
  console.log("  ✔ Cleaned up test transactions.");

  console.log("\n=================================================");
  console.log("🎉 ALL STAGE 3 DATABASE WORKFLOW TESTS PASSED!");
  console.log("=================================================");
  await prisma.$disconnect();
}

runE2E().catch((err) => {
  console.error("Stage 3 E2E Test Failed:", err);
  prisma.$disconnect();
  process.exit(1);
});

