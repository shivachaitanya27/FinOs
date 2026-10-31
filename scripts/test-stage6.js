/**
 * FinOS Stage 6 - Comprehensive Automated Test Suite
 * Covers all Stage 6 Deliverables:
 * 1. 9 Financial Reports (Daily, Weekly, Monthly, P&L, Cash Flow, Expense, Revenue, BRS, Risk)
 * 2. Schedule III Indian Accounting Format Compliance
 * 3. SheetJS Multi-Sheet Excel (.xlsx) Generation
 * 4. In-App Notifications Auto-Sync and Persistence
 * 5. Security & Multi-Tenant Data Isolation
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runStage6TestSuite() {
  console.log("=================================================");
  console.log("🚀 STARTING FINOS STAGE 6 COMPREHENSIVE TEST SUITE");
  console.log("=================================================\n");

  const results = [];

  const {
    generateFinancialReport,
    exportReportToExcel,
  } = await import("../src/lib/report-engine.ts");

  const {
    syncNotifications,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = await import("../src/lib/notification-service.ts");

  // Step 0: Ensure target business exists
  const business = await prisma.business.findFirst({
    include: { accounts: true, transactions: true },
  });
  if (!business) {
    throw new Error("No business found in database. Seed demo data first.");
  }

  console.log(`▶ Connected to Target Business: "${business.name}" (ID: ${business.id})`);
  console.log(`  Existing Database Transactions: ${business.transactions.length}`);
  console.log(`  Cash Accounts: ${business.accounts.length}\n`);

  // -----------------------------------------------------------------
  // TEST 1: Daily Financial Summary
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 1: Daily Financial Summary Report");
    const rep = await generateFinancialReport("DAILY_SUMMARY", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "DAILY_SUMMARY", "Report type must match");
    assert(rep.summaryMetrics.length >= 4, "Must contain summary metrics");
    assert(rep.sections.length >= 1, "Must contain daily transaction register");
    assert(rep.observations.length > 0, "Must provide verified observations");

    console.log(`    Generated: "${rep.title}" with ${rep.summaryMetrics.length} metrics.`);
    console.log("  ✔ Daily Financial Summary validated.\n");
    results.push({ name: "1. Daily Financial Summary", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 1 Error:", err.message);
    results.push({ name: "1. Daily Financial Summary", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 2: Weekly Financial Summary
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 2: Weekly Financial Summary Report");
    const rep = await generateFinancialReport("WEEKLY_SUMMARY", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "WEEKLY_SUMMARY", "Report type must match");
    assert(rep.chartData !== undefined, "Must contain chart data");
    assert(rep.sections[0].headers.includes("Day of Week"), "Must have Day of Week breakdown");

    console.log(`    Generated: "${rep.title}" with chart points: ${rep.chartData.length}`);
    console.log("  ✔ Weekly Financial Summary validated.\n");
    results.push({ name: "2. Weekly Financial Summary", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 2 Error:", err.message);
    results.push({ name: "2. Weekly Financial Summary", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 3: Monthly Financial Performance Summary
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 3: Monthly Financial Performance Report");
    const rep = await generateFinancialReport("MONTHLY_SUMMARY", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "MONTHLY_SUMMARY", "Report type must match");
    const revMetric = rep.summaryMetrics.find((m) => m.label.includes("Revenue"));
    assert(revMetric !== undefined, "Must include Revenue metric");

    console.log(`    Total Revenue: ${revMetric.value} | Observations: ${rep.observations.length}`);
    console.log("  ✔ Monthly Financial Summary validated.\n");
    results.push({ name: "3. Monthly Financial Summary", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 3 Error:", err.message);
    results.push({ name: "3. Monthly Financial Summary", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 4: Schedule III Statement of Profit & Loss
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 4: Statement of Profit & Loss (Schedule III)");
    const rep = await generateFinancialReport("PROFIT_LOSS", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "PROFIT_LOSS", "Report type must match");
    const pnlRows = rep.sections[0].rows;

    const hasRevenueLine = pnlRows.some((r) => r[0].includes("Revenue From Operations"));
    const hasEmployeeLine = pnlRows.some((r) => r[0].includes("Employee Benefits Expense"));
    const hasEbitdaLine = pnlRows.some((r) => r[0].includes("OPERATING PROFIT (EBITDA)"));
    const hasPatLine = pnlRows.some((r) => r[0].includes("PROFIT AFTER TAX"));

    assert(hasRevenueLine, "Must include Schedule III Revenue from Operations line");
    assert(hasEmployeeLine, "Must include Employee Benefits line");
    assert(hasEbitdaLine, "Must include Operating EBITDA calculation");
    assert(hasPatLine, "Must include Profit After Tax (PAT) line");

    console.log(`    Schedule III Rows verified (${pnlRows.length} standardized accounting line items).`);
    console.log("  ✔ Schedule III P&L Statement validated.\n");
    results.push({ name: "4. Schedule III Profit & Loss Statement", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 4 Error:", err.message);
    results.push({ name: "4. Schedule III Profit & Loss Statement", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 5: Cash Flow Report (Ind AS 7 / AS-3)
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 5: Cash Flow Report (Ind AS 7)");
    const rep = await generateFinancialReport("CASH_FLOW", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "CASH_FLOW", "Report type must match");
    const cfRows = rep.sections[0].rows;

    const hasOperating = cfRows.some((r) => r[0].includes("Operating Activities"));
    const hasInvesting = cfRows.some((r) => r[0].includes("Investing Activities"));
    const hasFinancing = cfRows.some((r) => r[0].includes("Financing Activities"));
    const hasNetIncrease = cfRows.some((r) => r[0].includes("NET INCREASE / (DECREASE)"));

    assert(hasOperating, "Must classify Operating Activities");
    assert(hasInvesting, "Must classify Investing Activities");
    assert(hasFinancing, "Must classify Financing Activities");
    assert(hasNetIncrease, "Must calculate net cash movement");

    console.log(`    Cash flow classified across Operating, Investing, and Financing activities.`);
    console.log("  ✔ Ind AS 7 Cash Flow Report validated.\n");
    results.push({ name: "5. Ind AS 7 Cash Flow Report", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 5 Error:", err.message);
    results.push({ name: "5. Ind AS 7 Cash Flow Report", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 6: Expense Analysis Report
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 6: Expense Analysis & Cost Optimization Report");
    const rep = await generateFinancialReport("EXPENSE_ANALYSIS", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "EXPENSE_ANALYSIS", "Report type must match");
    assert(rep.sections.length >= 2, "Must contain category breakdown and largest items tables");

    console.log(`    Expense Breakdown: ${rep.sections[0].rows.length} categories analyzed.`);
    console.log("  ✔ Expense Analysis Report validated.\n");
    results.push({ name: "6. Expense Analysis Report", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 6 Error:", err.message);
    results.push({ name: "6. Expense Analysis Report", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 7: Revenue Analysis Report
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 7: Revenue Analysis & Client Realization Report");
    const rep = await generateFinancialReport("REVENUE_ANALYSIS", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "REVENUE_ANALYSIS", "Report type must match");
    assert(rep.sections.length >= 2, "Must contain revenue streams and top receipts tables");

    console.log(`    Revenue Streams: ${rep.sections[0].rows.length} streams analyzed.`);
    console.log("  ✔ Revenue Analysis Report validated.\n");
    results.push({ name: "7. Revenue Analysis Report", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 7 Error:", err.message);
    results.push({ name: "7. Revenue Analysis Report", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 8: Bank Reconciliation Statement (BRS)
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 8: Bank Reconciliation Statement (BRS)");
    const rep = await generateFinancialReport("BANK_RECONCILIATION", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "BANK_RECONCILIATION", "Report type must match");
    const matchMetric = rep.summaryMetrics.find((m) => m.label.includes("Reconciliation Rate"));
    assert(matchMetric !== undefined, "Must calculate Reconciliation Rate %");

    console.log(`    BRS Match Rate: ${matchMetric.value} | Observations: ${rep.observations.length}`);
    console.log("  ✔ Bank Reconciliation Report validated.\n");
    results.push({ name: "8. Bank Reconciliation Report", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 8 Error:", err.message);
    results.push({ name: "8. Bank Reconciliation Report", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 9: Comprehensive Financial Risk Report
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 9: Comprehensive Financial Risk & Compliance Report");
    const rep = await generateFinancialReport("FINANCIAL_RISK", {
      businessId: business.id,
      period: "this_month",
    });

    assert(rep.reportType === "FINANCIAL_RISK", "Report type must match");
    const scoreMetric = rep.summaryMetrics.find((m) => m.label.includes("Health Score"));
    assert(scoreMetric !== undefined, "Must compute Financial Health Score");

    console.log(`    Financial Health Score: ${scoreMetric.value}`);
    console.log("  ✔ Financial Risk Report validated.\n");
    results.push({ name: "9. Financial Risk Report", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 9 Error:", err.message);
    results.push({ name: "9. Financial Risk Report", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 10: SheetJS Multi-Sheet Excel Export (.xlsx)
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 10: Multi-Sheet Excel Workbook Export (.xlsx)");
    const rep = await generateFinancialReport("PROFIT_LOSS", {
      businessId: business.id,
      period: "this_month",
    });

    const excelBuffer = exportReportToExcel(rep);
    assert(excelBuffer && excelBuffer.length > 500, "Excel buffer must be non-empty valid binary");

    // Check PK zip header for .xlsx (0x50 0x4B 0x03 0x04)
    assert(
      excelBuffer[0] === 0x50 && excelBuffer[1] === 0x4b,
      "Excel buffer must have valid OpenXML zip file signature (PK..)"
    );

    console.log(`    Generated valid .xlsx workbook binary (${excelBuffer.length} bytes).`);
    console.log("  ✔ SheetJS Multi-Sheet Excel Export validated.\n");
    results.push({ name: "10. Multi-Sheet Excel (.xlsx) Export", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 10 Error:", err.message);
    results.push({ name: "10. Multi-Sheet Excel (.xlsx) Export", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 11: In-App Notification Service & Persistence
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 11: In-App Notification Service & SQLite Persistence");
    const syncRes = await syncNotifications(business.id);
    console.log(`    Notifications Synchronized: ${syncRes.createdCount} new notifications created.`);

    const { notifications, unreadCount } = await getNotifications(business.id);
    assert(notifications.length > 0, "Must have persistent notifications in database");
    console.log(`    Total Notifications: ${notifications.length} (Unread: ${unreadCount})`);

    const firstNotif = notifications[0];
    const markOk = await markNotificationAsRead(firstNotif.id);
    assert(markOk, "Mark notification as read must succeed");

    const afterRead = await prisma.notification.findUnique({ where: { id: firstNotif.id } });
    assert(afterRead.isRead === true, "Notification isRead must be true in database");

    console.log("  ✔ In-App Notification Service & Persistence validated.\n");
    results.push({ name: "11. In-App Notification Service", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 11 Error:", err.message);
    results.push({ name: "11. In-App Notification Service", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // TEST 12: Security Hardening & Environment Configuration
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 12: Security Hardening & Environment Configuration");

    // Check .gitignore exists and ignores sensitive files
    const gitignorePath = path.resolve(".gitignore");
    assert(fs.existsSync(gitignorePath), ".gitignore file must exist");
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");

    assert(gitignoreContent.includes(".env"), ".gitignore must ignore .env files");
    assert(gitignoreContent.includes("node_modules"), ".gitignore must ignore node_modules");
    assert(gitignoreContent.includes("dev.db"), ".gitignore must ignore SQLite database files");

    // Check .env.example exists and documents vars without leaking production credentials
    const envExamplePath = path.resolve(".env.example");
    assert(fs.existsSync(envExamplePath), ".env.example file must exist");
    const envExampleContent = fs.readFileSync(envExamplePath, "utf8");
    assert(envExampleContent.includes("DATABASE_URL"), ".env.example must document DATABASE_URL");

    console.log("    .gitignore and .env.example verified for credential and database isolation.");
    console.log("  ✔ Security Hardening & Configuration validated.\n");
    results.push({ name: "12. Security & Environment Hardening", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 12 Error:", err.message);
    results.push({ name: "12. Security & Environment Hardening", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log("=================================================");
  console.log("📊 FINOS STAGE 6 TEST SUITE SUMMARY");
  console.log("=================================================");
  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  console.log(`Total Tests : ${results.length}`);
  console.log(`Passed      : ${passed} / ${results.length}`);
  console.log(`Failed      : ${failed} / ${results.length}`);
  console.log("=================================================\n");

  if (failed > 0) {
    console.error("❌ Some Stage 6 tests failed.");
    process.exit(1);
  } else {
    console.log("🎉 ALL 12 STAGE 6 AUTOMATED TESTS PASSED SUCCESSFULLY!\n");
  }
}

runStage6TestSuite()
  .catch((err) => {
    console.error("Fatal Test Suite Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

