/**
 * FinOS Stage 3 - Comprehensive Automated Test Suite
 * Covers all 10 Stage 3 Test Scenarios & Reconciliation / Duplicate Engine Verification
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

async function runStage3TestSuite() {
  console.log("=================================================");
  console.log("🚀 STARTING FINOS STAGE 3 COMPREHENSIVE TEST SUITE");
  console.log("=================================================\n");

  const results = [];

  const {
    calculateMatchScore,
    runMatchingEngine,
    detectDuplicates,
    computeReconciliationSummary,
  } = await import("../src/lib/reconciliation-engine.ts");

  // -----------------------------------------------------------------
  // SCENARIO 1: Exact Matching Transactions
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 1: Exact Matching Transactions (Ref + Amount + Date)");
    const bankTx = {
      id: "b-01",
      date: new Date("2024-10-15"),
      description: "NEFT CR-ACME CORP CLIENT SALE",
      amount: 150000,
      type: "REVENUE",
      source: "BANK_STATEMENT",
      referenceNumber: "ACME-9021",
    };
    const accTx = {
      id: "a-01",
      date: new Date("2024-10-15"),
      description: "Acme Corp Enterprise Software Deployment",
      amount: 150000,
      type: "REVENUE",
      source: "TALLY",
      referenceNumber: "ACME-9021",
      counterparty: "Acme Corp",
    };

    const evidence = calculateMatchScore(bankTx, accTx);
    console.log(`    Total Score: ${evidence.totalScore}/100 [${evidence.confidence}]`);
    console.log(`    Reasons: ${evidence.reasons.join(", ")}`);

    assert(evidence.totalScore >= 90, `Score should be >= 90, got ${evidence.totalScore}`);
    assert(evidence.confidence === "HIGH_CONFIDENCE", "Confidence should be HIGH_CONFIDENCE");
    assert(evidence.amountScore === 30, "Amount score should be 30");
    assert(evidence.referenceScore === 40, "Reference score should be 40");
    assert(evidence.dateScore === 20, "Date score should be 20");

    console.log("  ✔ Exact matching transaction detected with High Confidence (>=90).");
    results.push({ test: "1. Exact Matching Transactions", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 1 failed:", err.message);
    results.push({ test: "1. Exact Matching Transactions", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 2: Same Amount but Different Dates
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 2: Same Amount but Distant Dates (>14 Days Apart)");
    const bankTx = {
      id: "b-02",
      date: new Date("2024-10-01"),
      description: "Vendor Payout AWS Cloud",
      amount: 75000,
      type: "EXPENSE",
      source: "BANK_STATEMENT",
      referenceNumber: "AWS-11",
    };
    const accTx = {
      id: "a-02",
      date: new Date("2024-10-25"), // 24 days apart
      description: "Hosting Infrastructure Payment",
      amount: 75000, // Identical amount
      type: "EXPENSE",
      source: "ZOHO_BOOKS",
      referenceNumber: "INV-DIFF-99", // Different ref
    };

    const evidence = calculateMatchScore(bankTx, accTx);
    console.log(`    Total Score: ${evidence.totalScore}/100 [${evidence.confidence}]`);

    // Strict Rule: Never match transactions solely because their amounts are identical!
    assert(
      evidence.totalScore < 70,
      `Score must be below auto-match threshold (70). Got: ${evidence.totalScore}`
    );
    assert(
      evidence.confidence === "MANUAL_REVIEW",
      "Confidence must be MANUAL_REVIEW when only amount matches"
    );
    assert(evidence.dateScore === 0, "Date score must be 0 for >14 days gap");

    console.log("  ✔ Transactions with same amount but distant dates correctly prevented from auto-matching.");
    results.push({ test: "2. Same Amount Different Dates", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 2 failed:", err.message);
    results.push({ test: "2. Same Amount Different Dates", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 3: Different Descriptions for the Same Payment
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 3: Different Descriptions for Same Payment (Matched by UTR & Amount)");
    const bankTx = {
      id: "b-03",
      date: new Date("2024-10-05"),
      description: "ACH DR-AMAZON WEB SERVICES CLOUD INFRA MUMBAI CMS0912",
      amount: 45000,
      type: "EXPENSE",
      source: "BANK_STATEMENT",
      referenceNumber: "CMS-0912",
    };
    const accTx = {
      id: "a-03",
      date: new Date("2024-10-05"),
      description: "Monthly Server Hosting Fee",
      amount: 45000,
      type: "EXPENSE",
      source: "TALLY",
      referenceNumber: "CMS-0912",
    };

    const evidence = calculateMatchScore(bankTx, accTx);
    console.log(`    Total Score: ${evidence.totalScore}/100 [${evidence.confidence}]`);

    // Amount (30) + Ref (40) + Date (20) = 90 pts!
    assert(evidence.totalScore >= 90, `Expected score >= 90, got ${evidence.totalScore}`);
    assert(evidence.referenceScore === 40, "Reference matched");

    console.log("  ✔ Successfully matched payment with disparate narrations via UTR and date alignment.");
    results.push({ test: "3. Disparate Descriptions Match", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 3 failed:", err.message);
    results.push({ test: "3. Disparate Descriptions Match", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 4: Missing Accounting Transactions
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 4: Missing Accounting Transactions (Unmatched Bank Feed)");
    const bankTxs = [
      {
        id: "b-fee",
        date: new Date("2024-10-18"),
        description: "HDFC BANK ANNUAL CARD CHARGES",
        amount: 1180,
        type: "EXPENSE",
        source: "BANK_STATEMENT",
        referenceNumber: "FEE-01",
      },
    ];
    const accTxs = []; // No records in ERP

    const res = runMatchingEngine(bankTxs, accTxs);
    assert(res.matchedPairs.length === 0, "No matches should be produced");
    assert(res.unmatchedBank.length === 1, "Bank transaction must be in unmatchedBank queue");
    assert(res.unmatchedBank[0].id === "b-fee", "Correct bank transaction identified as unmatched");

    console.log("  ✔ Unmatched bank fee identified without false matches.");
    results.push({ test: "4. Missing Accounting Records", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 4 failed:", err.message);
    results.push({ test: "4. Missing Accounting Records", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 5: Missing Bank Transactions
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 5: Missing Bank Transactions (Unmatched Accounting Book Entry)");
    const bankTxs = [];
    const accTxs = [
      {
        id: "a-cheque",
        date: new Date("2024-10-20"),
        description: "Customer Cheque Received from TechCorp",
        amount: 80000,
        type: "REVENUE",
        source: "TALLY",
        referenceNumber: "CHQ-88102",
      },
    ];

    const res = runMatchingEngine(bankTxs, accTxs);
    assert(res.matchedPairs.length === 0, "No matches should be produced");
    assert(res.unmatchedAccounting.length === 1, "Must be in unmatchedAccounting queue");
    assert(res.unmatchedAccounting[0].id === "a-cheque", "Uncleared cheque identified");

    console.log("  ✔ Uncleared accounting transaction properly quarantined in unmatched accounting queue.");
    results.push({ test: "5. Missing Bank Feeds", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 5 failed:", err.message);
    results.push({ test: "5. Missing Bank Feeds", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 6: Duplicate Payment Detection
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 6: Duplicate Payment Detection (Same UTR / Same Amount within 24h)");
    const txs = [
      {
        id: "tx-orig",
        date: new Date("2024-10-10T10:00:00Z"),
        description: "Zoho One Annual Enterprise Renewal",
        amount: 12400,
        type: "EXPENSE",
        source: "BANK_STATEMENT",
        referenceNumber: "UTR-ZH-9912",
      },
      {
        id: "tx-dup",
        date: new Date("2024-10-10T11:30:00Z"), // 1.5 hours later
        description: "Zoho One Annual Enterprise Renewal",
        amount: 12400, // Exact amount
        type: "EXPENSE",
        source: "BANK_STATEMENT",
        referenceNumber: "UTR-ZH-9912", // Exact same UTR
      },
    ];

    const duplicateGroups = detectDuplicates(txs);
    console.log(`    Detected ${duplicateGroups.length} duplicate group(s)`);

    assert(duplicateGroups.length === 1, "Must detect exactly 1 duplicate group");
    const group = duplicateGroups[0];
    assert(group.classification === "HIGH_PROBABILITY", "Must be HIGH_PROBABILITY");
    assert(group.confidenceScore >= 90, "Confidence score should be >= 90");
    console.log(`    Evidence: ${group.evidence.join("; ")}`);

    console.log("  ✔ Duplicate payment cluster detected with High Probability (>=90%).");
    results.push({ test: "6. Duplicate Payment Detection", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 6 failed:", err.message);
    results.push({ test: "6. Duplicate Payment Detection", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 7: Recurring Legitimate Payments Protection
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 7: Recurring Legitimate Payments (Rent on 1st of Sept vs 1st of Oct)");
    const recurringTxs = [
      {
        id: "rent-sep",
        date: new Date("2024-09-01"),
        description: "Office Rent Koramangala Bengaluru",
        amount: 85000,
        type: "EXPENSE",
        source: "BANK_STATEMENT",
        referenceNumber: "RENT-SEP-24",
      },
      {
        id: "rent-oct",
        date: new Date("2024-10-01"), // 30 days apart
        description: "Office Rent Koramangala Bengaluru",
        amount: 85000, // Exact same amount
        type: "EXPENSE",
        source: "BANK_STATEMENT",
        referenceNumber: "RENT-OCT-24", // Different ref
      },
    ];

    const duplicateGroups = detectDuplicates(recurringTxs);

    // Critical Rule: Do not automatically classify recurring transactions as duplicates!
    assert(
      duplicateGroups.length === 0,
      `Recurring monthly payments must NOT be flagged as duplicates. Got: ${duplicateGroups.length}`
    );

    console.log("  ✔ Legitimate monthly recurring payments protected from false duplicate alerts.");
    results.push({ test: "7. Recurring Payment Protection", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 7 failed:", err.message);
    results.push({ test: "7. Recurring Payment Protection", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 8: Transactions with Different Reference Numbers
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 8: Transactions with Conflicting Reference Numbers");
    const bankTx = {
      id: "b-08",
      date: new Date("2024-10-10"),
      description: "Payment to Vendor Beta",
      amount: 50000,
      type: "EXPENSE",
      source: "BANK_STATEMENT",
      referenceNumber: "HDFC-UTR-1111",
    };
    const accTx = {
      id: "a-08",
      date: new Date("2024-10-10"),
      description: "Payment to Vendor Gamma",
      amount: 50000,
      type: "EXPENSE",
      source: "TALLY",
      referenceNumber: "ICICI-VCH-9999", // Completely different ref
    };

    const evidence = calculateMatchScore(bankTx, accTx);
    console.log(`    Total Score: ${evidence.totalScore}/100 [${evidence.confidence}]`);

    assert(evidence.referenceScore === 0, "Reference score must be 0 for conflicting refs");
    assert(evidence.totalScore < 70, `Score must be < 70, got ${evidence.totalScore}`);
    assert(evidence.confidence === "MANUAL_REVIEW", "Must require manual review");

    console.log("  ✔ Conflicting reference numbers properly prevent automatic matching.");
    results.push({ test: "8. Conflicting Reference Numbers", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 8 failed:", err.message);
    results.push({ test: "8. Conflicting Reference Numbers", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 9: Debit and Credit Mismatches
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 9: Direction Mismatch (Debit vs Credit)");
    const bankTx = {
      id: "b-09",
      date: new Date("2024-10-14"),
      description: "Payment Outflow",
      amount: 25000,
      type: "EXPENSE", // Debit
      source: "BANK_STATEMENT",
      referenceNumber: "TXN-250",
    };
    const accTx = {
      id: "a-09",
      date: new Date("2024-10-14"),
      description: "Invoice Receipt Inflow",
      amount: 25000,
      type: "REVENUE", // Credit
      source: "ZOHO_BOOKS",
      referenceNumber: "TXN-250",
    };

    const evidence = calculateMatchScore(bankTx, accTx);

    // Hard Rule: Do not match debit transactions with credit transactions.
    assert(evidence.totalScore === 0, `Score must be 0 for direction mismatch. Got: ${evidence.totalScore}`);
    assert(evidence.isDirectionMatch === false, "isDirectionMatch must be false");
    console.log(`    Discrepancy: ${evidence.discrepancies[0]}`);

    console.log("  ✔ Direction mismatch strictly blocked from matching (Score = 0).");
    results.push({ test: "9. Debit/Credit Mismatch Prevention", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 9 failed:", err.message);
    results.push({ test: "9. Debit/Credit Mismatch Prevention", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 10: Ambiguous Matching Candidates
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 10: Ambiguous Candidate Detection (Equal Scores, No Disambiguating Ref)");
    const bankTxs = [
      {
        id: "b-ambig",
        date: new Date("2024-10-12"),
        description: "Consulting Receipt",
        amount: 15000,
        type: "REVENUE",
        source: "BANK_STATEMENT",
      },
    ];
    const accTxs = [
      {
        id: "a-cand1",
        date: new Date("2024-10-12"),
        description: "Consulting Fee Client Alpha",
        amount: 15000,
        type: "REVENUE",
        source: "TALLY",
      },
      {
        id: "a-cand2",
        date: new Date("2024-10-12"),
        description: "Consulting Fee Client Beta",
        amount: 15000,
        type: "REVENUE",
        source: "TALLY",
      },
    ];

    const res = runMatchingEngine(bankTxs, accTxs);

    // Rule: Avoid automatically matching ambiguous candidates.
    assert(
      res.matchedPairs.length === 0,
      `Ambiguous candidates must NOT be auto-assigned. Matched: ${res.matchedPairs.length}`
    );
    assert(res.unmatchedBank.length === 1, "Bank tx kept in unmatched queue for manual review");

    console.log("  ✔ Ambiguous candidate conflict detected; auto-matching aborted in favor of manual selection.");
    results.push({ test: "10. Ambiguity Detection & Prevention", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 10 failed:", err.message);
    results.push({ test: "10. Ambiguity Detection & Prevention", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log("\n=================================================");
  console.log("📊 FINOS STAGE 3 TEST RESULTS SUMMARY");
  console.log("=================================================");
  let passedCount = 0;
  for (const r of results) {
    const icon = r.status === "PASSED" ? "✔" : "❌";
    console.log(`${icon} ${r.test.padEnd(40)} [${r.status}]`);
    if (r.status === "PASSED") passedCount++;
  }
  console.log(`\nScore: ${passedCount} / ${results.length} tests passed.`);
  console.log("=================================================\n");

  await prisma.$disconnect();
  return passedCount === results.length;
}

runStage3TestSuite()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal test runner crash:", err);
    process.exit(1);
  });

