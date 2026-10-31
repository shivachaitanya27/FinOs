/**
 * FinOS Stage 4 - Comprehensive Automated Test Suite
 * Covers all 8 Stage 4 Scenarios: Financial Risk Detection & Cash Flow Forecasting Engine
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper: Assert condition
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runStage4TestSuite() {
  console.log("=================================================");
  console.log("🚀 STARTING FINOS STAGE 4 COMPREHENSIVE TEST SUITE");
  console.log("=================================================\n");

  const results = [];

  const { detectFinancialRisks } = await import("../src/lib/risk-engine.ts");
  const { calculateCashFlowForecast } = await import("../src/lib/cashflow-engine.ts");

  const today = new Date("2024-10-31");
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };
  const daysAhead = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d;
  };

  // -----------------------------------------------------------------
  // SCENARIO 1: Business with Stable Cash Flow
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 1: Business with Stable Cash Flow");
    const stableTxs = [
      { id: "s-1", date: daysAgo(3), amount: 150000, type: "REVENUE", status: "COMPLETED", description: "Daily Sales Batch" },
      { id: "s-2", date: daysAgo(6), amount: 160000, type: "REVENUE", status: "COMPLETED", description: "Client Payout" },
      { id: "s-3", date: daysAgo(10), amount: 140000, type: "REVENUE", status: "COMPLETED", description: "Customer Fees" },
      { id: "s-4", date: daysAgo(14), amount: 155000, type: "REVENUE", status: "COMPLETED", description: "Subscriptions" },
      { id: "s-5", date: daysAgo(18), amount: 165000, type: "REVENUE", status: "COMPLETED", description: "Mid-month billing" },
      { id: "s-6", date: daysAgo(21), amount: 145000, type: "REVENUE", status: "COMPLETED", description: "Enterprise client wire" },
      { id: "s-7", date: daysAgo(25), amount: 150000, type: "REVENUE", status: "COMPLETED", description: "Recurring SLA fees" },
      { id: "s-8", date: daysAgo(28), amount: 170000, type: "REVENUE", status: "COMPLETED", description: "Batch settlement" },
      { id: "s-9", date: daysAgo(32), amount: 140000, type: "REVENUE", status: "COMPLETED", description: "Prior month settlement" },
      { id: "s-10", date: daysAgo(36), amount: 160000, type: "REVENUE", status: "COMPLETED", description: "Monthly retainer" },
      { id: "s-11", date: daysAgo(40), amount: 150000, type: "REVENUE", status: "COMPLETED", description: "Direct debit credit" },
      { id: "s-12", date: daysAgo(45), amount: 155000, type: "REVENUE", status: "COMPLETED", description: "Sales batch" },
      // Regular Outflows
      { id: "s-13", date: daysAgo(5), amount: 40000, type: "EXPENSE", status: "COMPLETED", description: "Office Supplies" },
      { id: "s-14", date: daysAgo(12), amount: 45000, type: "EXPENSE", status: "COMPLETED", description: "Utilities" },
      { id: "s-15", date: daysAgo(19), amount: 42000, type: "EXPENSE", status: "COMPLETED", description: "Internet & SaaS" },
      { id: "s-16", date: daysAgo(26), amount: 43000, type: "EXPENSE", status: "COMPLETED", description: "Maintenance" },
      { id: "s-17", date: daysAgo(33), amount: 41000, type: "EXPENSE", status: "COMPLETED", description: "Logistics" },
      { id: "s-18", date: daysAgo(40), amount: 44000, type: "EXPENSE", status: "COMPLETED", description: "Operating costs" },
    ];

    const forecast = calculateCashFlowForecast(stableTxs, {
      period: "30_DAYS",
      currentCashBalance: 500000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    console.log(`    Current Cash: ₹${forecast.currentCashBalance.toLocaleString("en-IN")}`);
    console.log(`    Projected Closing: ₹${forecast.projectedClosingBalance.toLocaleString("en-IN")}`);
    console.log(`    Has Cash Shortage Risk: ${forecast.hasCashShortageRisk}`);
    console.log(`    Safe Runway Days: ${forecast.safeRunwayDays}`);

    assert(forecast.hasCashShortageRisk === false, "Stable business should not have shortage risk");
    assert(forecast.projectedClosingBalance > forecast.minimumCashBalance, "Projected closing balance should exceed minimum");
    assert(forecast.timeline.length === 30, "30-day forecast should generate 30 daily timeline points");
    assert(forecast.transparency.reliabilityScore >= 70, "Should have good reliability score");

    console.log("  ✔ Stable cash flow correctly forecasted with positive liquidity and no false shortage alerts.\n");
    results.push({ name: "1. Stable Cash Flow Forecast", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 1 Error:", err.message);
    results.push({ name: "1. Stable Cash Flow Forecast", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 2: Business with Sudden Expense Increases (Outlier & Category Surge)
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 2: Business with Sudden Expense Increases");
    const baselineTxs = [
      // 5 Normal Cloud Expenses in Prior Baseline (35-70 days ago) avg ~₹30,000
      { id: "e-1", date: daysAgo(60), amount: 28000, type: "EXPENSE", category: "Cloud & Software", status: "COMPLETED", description: "Cloud Hosting Aug" },
      { id: "e-2", date: daysAgo(50), amount: 32000, type: "EXPENSE", category: "Cloud & Software", status: "COMPLETED", description: "Cloud Compute Sep" },
      { id: "e-3", date: daysAgo(45), amount: 30000, type: "EXPENSE", category: "Cloud & Software", status: "COMPLETED", description: "Database Storage Sep" },
      { id: "e-4", date: daysAgo(40), amount: 29000, type: "EXPENSE", category: "Cloud & Software", status: "COMPLETED", description: "CDN Bandwidth Sep" },
      { id: "e-5", date: daysAgo(35), amount: 31000, type: "EXPENSE", category: "Cloud & Software", status: "COMPLETED", description: "Cloud Licensing Sep" },
      // Sudden Cloud Spike in Recent Window (last 30 days) of ₹2,95,000
      { id: "e-spike", date: daysAgo(7), amount: 295000, type: "EXPENSE", category: "Cloud & Software", status: "COMPLETED", description: "AWS Cloud Data Egress Spike" },
      // Other regular expenses
      { id: "e-6", date: daysAgo(10), amount: 35000, type: "EXPENSE", category: "Office Rent", status: "COMPLETED", description: "Rent Oct" },
      { id: "e-7", date: daysAgo(20), amount: 20000, type: "REVENUE", status: "COMPLETED", description: "Sales" },
    ];

    const riskSummary = detectFinancialRisks(baselineTxs, {
      currentCashBalance: 300000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    const outlierAlert = riskSummary.alerts.find((a) => a.category === "UNUSUAL_EXPENSE");
    const categorySpikeAlert = riskSummary.alerts.find((a) => a.category === "CATEGORY_SPIKE");

    console.log(`    Total Alerts: ${riskSummary.alerts.length}`);
    console.log(`    Outlier Alert: ${outlierAlert?.title} (Amount: ₹${outlierAlert?.amount?.toLocaleString("en-IN")})`);
    console.log(`    Category Surge Alert: ${categorySpikeAlert?.title}`);

    assert(outlierAlert !== undefined, "Should detect UNUSUAL_EXPENSE outlier");
    assert(outlierAlert.amount === 295000, "Outlier amount should match ₹2,95,000");
    assert(categorySpikeAlert !== undefined, "Should detect CATEGORY_SPIKE in Cloud & Software");

    const spikeEvidence = JSON.parse(categorySpikeAlert.evidence);
    console.log(`    Surge Percentage: +${spikeEvidence.percentageIncrease}% over baseline`);
    assert(spikeEvidence.percentageIncrease >= 50, "Category surge should exceed 50%");

    console.log("  ✔ Sudden expense outlier and category surge detected with exact evidence.\n");
    results.push({ name: "2. Sudden Expense Increases", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 2 Error:", err.message);
    results.push({ name: "2. Sudden Expense Increases", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 3: Business with Potential Duplicate Transactions
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 3: Business with Potential Duplicate Transactions");
    const duplicateTxs = [
      { id: "d-1", date: daysAgo(5), amount: 88000, type: "EXPENSE", category: "Cloud & Software", referenceNumber: "ZOHO-INV-4412", description: "Zoho Enterprise Renewal", status: "COMPLETED" },
      { id: "d-2", date: daysAgo(4), amount: 88000, type: "EXPENSE", category: "Cloud & Software", referenceNumber: "ZOHO-INV-4412", description: "Zoho Enterprise Renewal (Retry)", status: "COMPLETED" },
      // Legitimate recurring monthly rent (30 days apart)
      { id: "r-1", date: daysAgo(35), amount: 145000, type: "EXPENSE", category: "Office Rent", description: "WeWork Office Rent Sep", status: "COMPLETED" },
      { id: "r-2", date: daysAgo(5), amount: 145000, type: "EXPENSE", category: "Office Rent", description: "WeWork Office Rent Oct", status: "COMPLETED" },
      // Other transactions
      { id: "d-3", date: daysAgo(2), amount: 50000, type: "REVENUE", status: "COMPLETED", description: "Sales Inflow" },
    ];

    const riskSummary = detectFinancialRisks(duplicateTxs, {
      currentCashBalance: 200000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    const dupAlert = riskSummary.alerts.find((a) => a.category === "DUPLICATE_PAYMENT");
    console.log(`    Duplicate Alert: ${dupAlert?.title}`);
    console.log(`    Duplicate Description: ${dupAlert?.description}`);

    assert(dupAlert !== undefined, "Should detect duplicate payment");
    assert(dupAlert.amount === 176000, `Expected total duplicate amount 176000, got ${dupAlert.amount}`);

    // Verify legitimate rent was NOT flagged as duplicate
    const rentAlert = riskSummary.alerts.find((a) => a.category === "DUPLICATE_PAYMENT" && a.title.includes("Rent"));
    assert(rentAlert === undefined, "Legitimate recurring monthly rent must NOT be flagged as duplicate");

    console.log("  ✔ Duplicate payment flagged with evidence while preserving recurring monthly rent.\n");
    results.push({ name: "3. Duplicate Detection & Recurring Safeguard", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 3 Error:", err.message);
    results.push({ name: "3. Duplicate Detection & Recurring Safeguard", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 4: Business with Unmatched Bank Records
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 4: Business with Unmatched Bank Records");
    const unmatchedTxs = [
      { id: "ub-1", date: daysAgo(10), amount: 45000, type: "EXPENSE", status: "UNMATCHED", source: "BANK_STATEMENT", referenceNumber: "CHQ-CLR-409218", description: "Cheque Clearing #409218 Unmatched Debit" },
      { id: "c-1", date: daysAgo(12), amount: 100000, type: "REVENUE", status: "COMPLETED", description: "Client Wire" },
      { id: "c-2", date: daysAgo(8), amount: 30000, type: "EXPENSE", status: "COMPLETED", description: "Office Maintenance" },
      { id: "c-3", date: daysAgo(5), amount: 25000, type: "EXPENSE", status: "COMPLETED", description: "Vendor Payment" },
      { id: "c-4", date: daysAgo(2), amount: 40000, type: "REVENUE", status: "COMPLETED", description: "Online Gateway" },
      { id: "c-5", date: daysAgo(1), amount: 15000, type: "EXPENSE", status: "COMPLETED", description: "Supplies" },
    ];

    const riskSummary = detectFinancialRisks(unmatchedTxs, {
      currentCashBalance: 150000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    const unmatchedAlert = riskSummary.alerts.find((a) => a.category === "UNMATCHED_TRANSACTION");
    console.log(`    Unmatched Alert: ${unmatchedAlert?.title}`);
    console.log(`    Unmatched Amount: ₹${unmatchedAlert?.amount?.toLocaleString("en-IN")}`);

    assert(unmatchedAlert !== undefined, "Should detect unmatched bank feed");
    assert(unmatchedAlert.amount === 45000, "Unmatched amount should be ₹45,000");

    console.log("  ✔ Unmatched bank transaction quarantined and flagged for reconciliation.\n");
    results.push({ name: "4. Unmatched Bank Records", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 4 Error:", err.message);
    results.push({ name: "4. Unmatched Bank Records", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 5: Business with Declining Cash Balance & Deficit Shortage
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 5: Business with Declining Cash Balance (Cash Shortage Risk)");
    const decliningTxs = [
      // Outflows drastically exceed inflows: ₹20,000 daily burn vs ₹5,000 daily inflow
      { id: "dec-1", date: daysAgo(5), amount: 5000, type: "REVENUE", status: "COMPLETED", description: "Small Retail Inflow" },
      { id: "dec-2", date: daysAgo(10), amount: 6000, type: "REVENUE", status: "COMPLETED", description: "Small Payment" },
      { id: "dec-3", date: daysAgo(15), amount: 4000, type: "REVENUE", status: "COMPLETED", description: "Subscription Fee" },
      { id: "dec-4", date: daysAgo(3), amount: 50000, type: "EXPENSE", status: "COMPLETED", description: "Marketing Campaign" },
      { id: "dec-5", date: daysAgo(7), amount: 75000, type: "EXPENSE", status: "COMPLETED", description: "Server Infrastructure" },
      { id: "dec-6", date: daysAgo(12), amount: 60000, type: "EXPENSE", status: "COMPLETED", description: "Contractor Fees" },
    ];

    // Starting with only ₹60,000 cash balance and a minimum threshold of ₹50,000
    const forecast = calculateCashFlowForecast(decliningTxs, {
      period: "30_DAYS",
      currentCashBalance: 60000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    console.log(`    Current Cash: ₹${forecast.currentCashBalance.toLocaleString("en-IN")}`);
    console.log(`    Has Cash Shortage Risk: ${forecast.hasCashShortageRisk}`);
    console.log(`    First Shortage Date: ${forecast.firstShortageDate}`);
    console.log(`    Safe Runway: ${forecast.safeRunwayDays} days`);
    console.log(`    Max Estimated Deficit: ₹${forecast.maxDeficitAmount.toLocaleString("en-IN")}`);

    assert(forecast.hasCashShortageRisk === true, "Declining cash flow must trigger shortage risk");
    assert(forecast.firstShortageDate !== null, "Must identify first shortage date");
    assert(forecast.safeRunwayDays < 15, "Safe runway should be low under declining cash burn");
    assert(forecast.maxDeficitAmount > 0, "Max deficit amount should be positive");

    // Also verify risk engine generates CASH_FLOW risk alert
    const riskSummary = detectFinancialRisks(decliningTxs, {
      currentCashBalance: 60000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    const cashAlert = riskSummary.alerts.find((a) => a.category === "CASH_FLOW");
    assert(cashAlert !== undefined, "Risk engine must generate CASH_FLOW alert");
    console.log(`    Risk Alert Generated: ${cashAlert.title}`);

    console.log("  ✔ Declining cash balance triggered cash shortage alert with safe runway calculation.\n");
    results.push({ name: "5. Declining Cash Balance & Deficit Shortage", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 5 Error:", err.message);
    results.push({ name: "5. Declining Cash Balance & Deficit Shortage", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 6: Business with Insufficient Historical Data
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 6: Business with Insufficient Historical Data");
    // Only 2 transactions available (well below minimum 5 threshold)
    const sparseTxs = [
      { id: "sp-1", date: daysAgo(2), amount: 15000, type: "REVENUE", status: "COMPLETED", description: "First Inflow" },
      { id: "sp-2", date: daysAgo(1), amount: 8000, type: "EXPENSE", status: "COMPLETED", description: "First Outflow" },
    ];

    const forecast = calculateCashFlowForecast(sparseTxs, {
      period: "30_DAYS",
      currentCashBalance: 50000,
      minimumCashBalance: 20000,
      asOfDate: today,
    });

    console.log(`    Data Availability: ${forecast.transparency.dataAvailability}`);
    console.log(`    Reliability Indicator: ${forecast.transparency.reliabilityIndicator}`);
    console.log(`    Reliability Score: ${forecast.transparency.reliabilityScore}%`);
    console.log(`    Warning Message: ${forecast.transparency.warningMessage}`);

    assert(forecast.transparency.isInsufficientData === true, "Must flag isInsufficientData: true");
    assert(forecast.transparency.reliabilityIndicator === "INSUFFICIENT_DATA", "Reliability should be INSUFFICIENT_DATA");
    assert(forecast.transparency.reliabilityScore <= 30, "Reliability score must reflect sparse data");

    const riskSummary = detectFinancialRisks(sparseTxs, {
      currentCashBalance: 50000,
      minimumCashBalance: 20000,
      asOfDate: today,
    });

    assert(riskSummary.hasInsufficientData === true, "Risk engine must indicate insufficient data");
    assert(riskSummary.insufficientDataWarning !== null, "Must provide transparent warning message");

    console.log("  ✔ Insufficient data transparently warned without fabricating artificial forecasts.\n");
    results.push({ name: "6. Insufficient Historical Data Warning", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 6 Error:", err.message);
    results.push({ name: "6. Insufficient Historical Data Warning", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 7: Business with Overdue Receivables
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 7: Business with Overdue Receivables");
    const overdueTxs = [
      {
        id: "inv-overdue",
        date: daysAgo(40),
        dueDate: daysAgo(12), // Due 12 days ago!
        amount: 450000,
        type: "REVENUE",
        status: "PENDING",
        counterparty: "Mahindra Logistics Ltd",
        referenceNumber: "INV-MLOG-2024-08",
        description: "Enterprise Software Retainer Q2",
      },
      // Completed transactions for normal baseline
      { id: "ov-1", date: daysAgo(10), amount: 100000, type: "REVENUE", status: "COMPLETED", description: "Client Payout" },
      { id: "ov-2", date: daysAgo(8), amount: 50000, type: "EXPENSE", status: "COMPLETED", description: "Office Expenses" },
      { id: "ov-3", date: daysAgo(5), amount: 60000, type: "REVENUE", status: "COMPLETED", description: "Online Sales" },
      { id: "ov-4", date: daysAgo(3), amount: 30000, type: "EXPENSE", status: "COMPLETED", description: "Cloud bill" },
      { id: "ov-5", date: daysAgo(1), amount: 40000, type: "REVENUE", status: "COMPLETED", description: "Consulting" },
    ];

    const riskSummary = detectFinancialRisks(overdueTxs, {
      currentCashBalance: 200000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    const overdueAlert = riskSummary.alerts.find((a) => a.category === "OVERDUE_RECEIVABLE");
    console.log(`    Overdue Alert: ${overdueAlert?.title}`);
    console.log(`    Overdue Amount: ₹${overdueAlert?.amount?.toLocaleString("en-IN")}`);

    assert(overdueAlert !== undefined, "Should detect overdue customer receivable");
    assert(overdueAlert.amount === 450000, "Alert amount should match invoice amount ₹4,50,000");

    const evidence = JSON.parse(overdueAlert.evidence);
    console.log(`    Days Overdue: ${evidence.daysOverdue} days`);
    assert(evidence.daysOverdue >= 12, "Days overdue should be >= 12");

    console.log("  ✔ Overdue receivable detected with days aging and actionable escalation recommendation.\n");
    results.push({ name: "7. Overdue Receivables Aging Alert", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 7 Error:", err.message);
    results.push({ name: "7. Overdue Receivables Aging Alert", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 8: Business without Receivable or Payable Due Dates
  // -----------------------------------------------------------------
  try {
    console.log("▶ Scenario 8: Business without Receivable or Payable Due Dates");
    const undatedTxs = [
      // Pending receivable WITHOUT dueDate
      {
        id: "inv-undated",
        date: daysAgo(15),
        dueDate: null, // No verifiable due date!
        amount: 300000,
        type: "REVENUE",
        status: "PENDING",
        description: "Open Quotation / Informal Milestone",
      },
      // Completed baseline transactions
      { id: "un-1", date: daysAgo(10), amount: 80000, type: "REVENUE", status: "COMPLETED", description: "Verified Deposit" },
      { id: "un-2", date: daysAgo(8), amount: 40000, type: "EXPENSE", status: "COMPLETED", description: "Office Rent" },
      { id: "un-3", date: daysAgo(6), amount: 75000, type: "REVENUE", status: "COMPLETED", description: "Card Settlement" },
      { id: "un-4", date: daysAgo(4), amount: 35000, type: "EXPENSE", status: "COMPLETED", description: "Utilities" },
      { id: "un-5", date: daysAgo(2), amount: 90000, type: "REVENUE", status: "COMPLETED", description: "Contract Revenue" },
    ];

    const forecast = calculateCashFlowForecast(undatedTxs, {
      period: "30_DAYS",
      currentCashBalance: 150000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    console.log(`    Scheduled Receivables Included: ${forecast.scheduledReceivablesIncluded.length}`);
    assert(
      forecast.scheduledReceivablesIncluded.length === 0,
      "Invoices without due dates must NOT be included as scheduled items in forecast timeline"
    );

    const riskSummary = detectFinancialRisks(undatedTxs, {
      currentCashBalance: 150000,
      minimumCashBalance: 50000,
      asOfDate: today,
    });

    // Should NOT trigger false overdue alert when due date is null
    const overdueAlert = riskSummary.alerts.find((a) => a.category === "OVERDUE_RECEIVABLE");
    assert(overdueAlert === undefined, "Should not trigger overdue alert without reliable due date");

    console.log("  ✔ Undated pending items gracefully excluded to prevent speculative liquidity distortions.\n");
    results.push({ name: "8. Undated Invoices Handling", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 8 Error:", err.message);
    results.push({ name: "8. Undated Invoices Handling", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log("=================================================");
  console.log("📊 FINOS STAGE 4 TEST RESULTS SUMMARY");
  console.log("=================================================");
  results.forEach((r) => {
    console.log(`✔ ${r.name.padEnd(42)} [${r.status}]`);
  });

  const totalPassed = results.filter((r) => r.status === "PASSED").length;
  console.log(`\nScore: ${totalPassed} / ${results.length} tests passed.`);
  console.log("=================================================\n");

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

runStage4TestSuite().catch((e) => {
  console.error("Fatal test error:", e);
  process.exit(1);
});
