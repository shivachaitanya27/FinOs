/**
 * FinOS Stage 4 - End-to-End Database Workflow & Persistence Test
 * Verifies live SQLite persistence for Risk Alerts, user approval actions,
 * audit logging, and cash flow forecasting against real business records.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runStage4E2ETest() {
  console.log("=================================================");
  console.log("🧪 STARTING STAGE 4 DATABASE WORKFLOW E2E TEST");
  console.log("=================================================\n");

  // Step 1: Ensure demo business exists
  const biz = await prisma.business.findFirst({ include: { accounts: true } });
  if (!biz) throw new Error("No business found in database. Seed demo data first.");

  console.log(`▶ Connected to Business: "${biz.name}" (ID: ${biz.id})`);
  console.log(`  Current Minimum Cash Balance: ₹${biz.minimumCashBalance.toLocaleString("en-IN")}\n`);

  // Step 2: Create a test risk alert in database
  console.log("▶ Step 1: Creating a test RiskAlert in SQLite...");
  const testAlert = await prisma.riskAlert.create({
    data: {
      businessId: biz.id,
      title: "Test Risk Alert - Cloud Egress Spike",
      description: "Automated test alert for cloud infrastructure surge.",
      severity: "HIGH",
      category: "UNUSUAL_EXPENSE",
      status: "ACTIVE",
      amount: 125000,
      evidence: JSON.stringify({ multiplier: 3.2, baseline: 39000 }),
      recommendedAction: "Audit test egress data.",
    },
  });

  assert(testAlert.id !== undefined, "Test alert should have generated ID");
  assert(testAlert.status === "ACTIVE", "Initial status should be ACTIVE");
  console.log(`  ✔ RiskAlert persisted: ${testAlert.id} [${testAlert.severity}]`);

  // Step 3: Simulate User Action - Mark Reviewed with Notes
  console.log("\n▶ Step 2: Simulating User Action 'mark_reviewed' & 'add_notes'...");
  const reviewedAlert = await prisma.riskAlert.update({
    where: { id: testAlert.id },
    data: {
      status: "REVIEWED",
      reviewNotes: "Senior DevOps confirmed cross-region backup test. Verified variance.",
      reviewedAt: new Date(),
      reviewedBy: "DEV_E2E_RUNNER",
    },
  });

  assert(reviewedAlert.status === "REVIEWED", "Alert status should be REVIEWED");
  assert(reviewedAlert.reviewNotes.includes("Senior DevOps"), "Review notes must be preserved");

  // Record AuditLog
  const audit1 = await prisma.auditLog.create({
    data: {
      businessId: biz.id,
      action: "RISK_ALERT_REVIEWED",
      entityType: "RISK_ALERT",
      entityId: testAlert.id,
      details: JSON.stringify({ previousStatus: "ACTIVE", newStatus: "REVIEWED", notes: reviewedAlert.reviewNotes }),
    },
  });
  assert(audit1.id !== undefined, "Audit log for review must be stored");
  console.log("  ✔ RiskAlert marked REVIEWED with notes and persisted to AuditLog.");

  // Step 4: Simulate User Action - Resolve Alert
  console.log("\n▶ Step 3: Simulating User Action 'resolve'...");
  const resolvedAlert = await prisma.riskAlert.update({
    where: { id: testAlert.id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  assert(resolvedAlert.status === "RESOLVED", "Alert status should be RESOLVED");

  // Record AuditLog
  const audit2 = await prisma.auditLog.create({
    data: {
      businessId: biz.id,
      action: "RISK_ALERT_RESOLVED",
      entityType: "RISK_ALERT",
      entityId: testAlert.id,
      details: JSON.stringify({ previousStatus: "REVIEWED", newStatus: "RESOLVED" }),
    },
  });
  assert(audit2.id !== undefined, "Audit log for resolve must be stored");
  console.log("  ✔ RiskAlert marked RESOLVED and audit trail confirmed.");

  // Step 5: Test Minimum Cash Balance Setting & Threshold Update
  console.log("\n▶ Step 4: Updating Minimum Cash Balance threshold...");
  const previousThreshold = biz.minimumCashBalance;
  const newThreshold = 75000;

  const updatedBiz = await prisma.business.update({
    where: { id: biz.id },
    data: { minimumCashBalance: newThreshold },
  });

  assert(updatedBiz.minimumCashBalance === 75000, "Minimum cash balance should update to 75000");

  const audit3 = await prisma.auditLog.create({
    data: {
      businessId: biz.id,
      action: "MINIMUM_CASH_BALANCE_UPDATED",
      entityType: "BUSINESS",
      entityId: biz.id,
      details: JSON.stringify({ previousThreshold, newThreshold }),
    },
  });
  assert(audit3.id !== undefined, "Audit log for threshold update must be stored");
  console.log(`  ✔ Minimum Cash Balance updated from ₹${previousThreshold} to ₹${newThreshold} with AuditLog.`);

  // Restore threshold
  await prisma.business.update({
    where: { id: biz.id },
    data: { minimumCashBalance: previousThreshold },
  });

  // Step 6: Test Cash Flow Engine against live SQLite transactions
  console.log("\n▶ Step 5: Running Cash Flow Forecasting against live SQLite transactions...");
  const liveTxs = await prisma.transaction.findMany({
    where: { businessId: biz.id },
    include: { account: true },
  });

  const { calculateCashFlowForecast } = await import("../src/lib/cashflow-engine.ts");
  const liveCash = biz.accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const forecast = calculateCashFlowForecast(
    liveTxs.map((t) => ({
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
    })),
    {
      period: "30_DAYS",
      currentCashBalance: liveCash,
      minimumCashBalance: previousThreshold,
    }
  );

  console.log(`  Live Available Cash: ₹${forecast.currentCashBalance.toLocaleString("en-IN")}`);
  console.log(`  Expected Inflows (30d): +₹${forecast.expectedCashInflows.toLocaleString("en-IN")}`);
  console.log(`  Expected Outflows (30d): -₹${forecast.expectedCashOutflows.toLocaleString("en-IN")}`);
  console.log(`  Projected Closing Balance: ₹${forecast.projectedClosingBalance.toLocaleString("en-IN")}`);
  console.log(`  Timeline Data Points: ${forecast.timeline.length} days`);
  console.log(`  Scheduled Receivables Included: ${forecast.scheduledReceivablesIncluded.length}`);

  assert(forecast.timeline.length === 30, "Should generate 30 daily points");
  assert(forecast.currentCashBalance === liveCash, "Current cash must match live accounts sum");
  console.log("  ✔ Live SQLite forecasting completed deterministically.");

  // Step 7: Clean up test artifacts
  console.log("\n▶ Step 6: Cleaning up test artifacts...");
  await prisma.auditLog.deleteMany({
    where: { entityId: testAlert.id },
  });
  await prisma.riskAlert.delete({
    where: { id: testAlert.id },
  });
  console.log("  ✔ Cleaned up test RiskAlert and associated audit records.");

  console.log("\n=================================================");
  console.log("🎉 ALL STAGE 4 DATABASE WORKFLOW TESTS PASSED!");
  console.log("=================================================\n");
}

runStage4E2ETest()
  .catch((e) => {
    console.error("Fatal E2E error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

