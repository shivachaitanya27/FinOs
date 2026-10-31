/**
 * FinOS Automated Bank Reconciliation & Duplicate Detection Engine
 * Algorithmic 2-way comparison between bank statement feeds and accounting records.
 * Strictly adheres to fintech audit rules, confidence scoring, and anti-ambiguity constraints.
 */

export interface ReconcileTransaction {
  id: string;
  date: Date | string;
  description: string;
  amount: number;
  type: string; // "REVENUE" (Credit) | "EXPENSE" (Debit) | "TRANSFER"
  category?: string | null;
  source: string; // "BANK_STATEMENT" | "TALLY" | "ZOHO_BOOKS" | "MANUAL" | "GENERIC"
  status?: string | null; // "COMPLETED" | "PENDING" | "RECONCILED" | "UNMATCHED" | "FLAGGED"
  referenceNumber?: string | null;
  counterparty?: string | null;
  accountId?: string | null;
  account?: { id: string; name: string } | null;
  isDuplicate?: boolean;
  notes?: string | null;
}

export interface MatchEvidence {
  amountScore: number; // max 30
  referenceScore: number; // max 40
  dateScore: number; // max 20
  descriptionScore: number; // max 10
  totalScore: number; // max 100
  confidence: "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "MANUAL_REVIEW";
  isDirectionMatch: boolean;
  isAmbiguous: boolean;
  reasons: string[];
  discrepancies: string[];
}

export interface MatchedPair {
  id: string; // reconciliation record ID or temporary key
  bankTransaction: ReconcileTransaction;
  accountingTransaction: ReconcileTransaction;
  evidence: MatchEvidence;
  matchScore: number;
  status: "APPROVED" | "SUGGESTED" | "MANUAL_MATCH" | "REJECTED";
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
}

export interface DuplicateGroup {
  id: string;
  primaryTransaction: ReconcileTransaction;
  duplicateTransactions: ReconcileTransaction[];
  classification: "HIGH_PROBABILITY" | "MEDIUM_PROBABILITY" | "NEEDS_MANUAL_REVIEW" | "LEGITIMATE_RECURRING";
  isLegitimateRecurring: boolean;
  confidenceScore: number; // 0 to 100
  evidence: string[];
  totalAmount: number;
}

export interface ReconciliationSummaryMetrics {
  totalReviewed: number;
  totalBankTransactions: number;
  totalAccountingTransactions: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedAccountingCount: number;
  potentialDuplicateCount: number;
  matchedBankValue: number;
  matchedAccountingValue: number;
  unmatchedBankValue: number;
  unmatchedAccountingValue: number;
  reconciliationPercentage: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  manualReviewCount: number;
}

/**
 * Standardize text for description similarity
 */
export function cleanNarration(text: string = ""): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(neft|rtgs|nach|ach|upi|cms|dr|cr|imps|transfer|inf|txn|ref|chq|inr|pvt|ltd|to|from|for|payment|receipt)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute Jaccard Word Token Similarity between two strings
 */
export function computeTokenSimilarity(str1: string, str2: string): number {
  const words1 = new Set(cleanNarration(str1).split(" ").filter((w) => w.length > 2));
  const words2 = new Set(cleanNarration(str2).split(" ").filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersectionCount = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersectionCount++;
  });

  const unionSize = words1.size + words2.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * Normalize reference number / UTR for exact alphanumeric comparison
 */
export function cleanRef(ref?: string | null): string {
  if (!ref) return "";
  return ref.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Days difference between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Core Algorithm: Compute match score between a Bank Transaction and an Accounting Transaction.
 * Suggested Scoring:
 * 1. Reference number match: 40 pts
 * 2. Exact amount match: 30 pts
 * 3. Date proximity: 20 pts
 * 4. Description similarity: 10 pts
 * Total: 100 pts.
 */
export function calculateMatchScore(
  bankTx: ReconcileTransaction,
  accountingTx: ReconcileTransaction
): MatchEvidence {
  const reasons: string[] = [];
  const discrepancies: string[] = [];

  // 1. Transaction Direction Check (Hard Rule)
  // Both must be credit/revenue or debit/expense
  const bankIsCredit = bankTx.type === "REVENUE";
  const accIsCredit = accountingTx.type === "REVENUE";

  if (bankIsCredit !== accIsCredit) {
    return {
      amountScore: 0,
      referenceScore: 0,
      dateScore: 0,
      descriptionScore: 0,
      totalScore: 0,
      confidence: "MANUAL_REVIEW",
      isDirectionMatch: false,
      isAmbiguous: false,
      reasons: [],
      discrepancies: [
        `Direction Mismatch: Bank entry is ${bankTx.type} while accounting entry is ${accountingTx.type}. Debits cannot match Credits.`,
      ],
    };
  }

  // 2. Exact Amount Matching (30 points max)
  let amountScore = 0;
  const amountDiff = Math.abs(bankTx.amount - accountingTx.amount);

  if (amountDiff < 0.01) {
    amountScore = 30;
    reasons.push(`Exact amount match: ₹${bankTx.amount.toLocaleString("en-IN")}`);
  } else if (amountDiff <= 1.0) {
    amountScore = 15;
    reasons.push(`Near amount match: difference of ₹${amountDiff.toFixed(2)} (within rounding tolerance)`);
    discrepancies.push(`Amount variance of ₹${amountDiff.toFixed(2)}`);
  } else {
    amountScore = 0;
    discrepancies.push(
      `Amount mismatch: Bank has ₹${bankTx.amount.toLocaleString("en-IN")} vs Accounting ₹${accountingTx.amount.toLocaleString("en-IN")}`
    );
  }

  // 3. Reference Number Matching (40 points max)
  let referenceScore = 0;
  const bankRefClean = cleanRef(bankTx.referenceNumber);
  const accRefClean = cleanRef(accountingTx.referenceNumber);
  const bankDescUpper = (bankTx.description || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const accDescUpper = (accountingTx.description || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (bankRefClean && accRefClean) {
    if (bankRefClean === accRefClean) {
      referenceScore = 40;
      reasons.push(`Exact reference/UTR number match: "${bankTx.referenceNumber}"`);
    } else if (
      (bankRefClean.length > 4 && accRefClean.includes(bankRefClean)) ||
      (accRefClean.length > 4 && bankRefClean.includes(accRefClean))
    ) {
      referenceScore = 30;
      reasons.push(`Partial reference number match: "${bankTx.referenceNumber}" & "${accountingTx.referenceNumber}"`);
    } else {
      referenceScore = 0;
      discrepancies.push(
        `Conflicting reference numbers: "${bankTx.referenceNumber}" vs "${accountingTx.referenceNumber}"`
      );
    }
  } else if (bankRefClean && accDescUpper.includes(bankRefClean)) {
    referenceScore = 30;
    reasons.push(`Bank reference "${bankTx.referenceNumber}" found in accounting narration`);
  } else if (accRefClean && bankDescUpper.includes(accRefClean)) {
    referenceScore = 30;
    reasons.push(`Accounting reference "${accountingTx.referenceNumber}" found in bank narration`);
  } else {
    referenceScore = 0;
  }

  // 4. Date Proximity (20 points max)
  let dateScore = 0;
  const diffDays = daysBetween(bankTx.date, accountingTx.date);

  if (diffDays === 0) {
    dateScore = 20;
    reasons.push("Exact calendar date match");
  } else if (diffDays === 1) {
    dateScore = 18;
    reasons.push("Date within 1 day (T+1 clearing settlement window)");
  } else if (diffDays <= 3) {
    dateScore = 14;
    reasons.push(`Date within ${diffDays} days (weekend/clearing float)`);
  } else if (diffDays <= 7) {
    dateScore = 8;
    reasons.push(`Date within ${diffDays} days`);
    discrepancies.push(`Timing variance of ${diffDays} days`);
  } else if (diffDays <= 14) {
    dateScore = 4;
    discrepancies.push(`Significant timing delay of ${diffDays} days`);
  } else {
    dateScore = 0;
    discrepancies.push(`Date gap exceeds 14 days (${diffDays} days)`);
  }

  // 5. Description & Counterparty Similarity (10 points max)
  let descriptionScore = 0;
  const tokenSim = computeTokenSimilarity(bankTx.description, accountingTx.description);

  // Check counterparty match
  const bankCp = cleanNarration(bankTx.counterparty || "");
  const accCp = cleanNarration(accountingTx.counterparty || "");
  const cpMatch = bankCp && accCp && (bankCp.includes(accCp) || accCp.includes(bankCp));

  if (cpMatch || tokenSim >= 0.7) {
    descriptionScore = 10;
    reasons.push(
      cpMatch
        ? `Identified matching counterparty: "${bankTx.counterparty || accountingTx.counterparty}"`
        : `Strong narration similarity (${Math.round(tokenSim * 100)}%)`
    );
  } else if (tokenSim >= 0.4) {
    descriptionScore = 6;
    reasons.push(`Moderate narration similarity (${Math.round(tokenSim * 100)}%)`);
  } else if (tokenSim >= 0.15) {
    descriptionScore = 3;
    reasons.push("Partial narration keyword match");
  } else {
    descriptionScore = 0;
  }

  // Total Score (0 to 100)
  const totalScore = amountScore + referenceScore + dateScore + descriptionScore;

  // IMPORTANT RULE:
  // "Never match transactions solely because their amounts are identical."
  // If only amount matched (amountScore 30) and nothing else matched, totalScore <= 30.
  // Confidence categories:
  // 90–100: High-confidence suggestion
  // 70–89: Medium-confidence suggestion
  // Below 70: Manual review
  let confidence: "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "MANUAL_REVIEW";
  if (totalScore >= 90) {
    confidence = "HIGH_CONFIDENCE";
  } else if (totalScore >= 70) {
    confidence = "MEDIUM_CONFIDENCE";
  } else {
    confidence = "MANUAL_REVIEW";
  }

  return {
    amountScore,
    referenceScore,
    dateScore,
    descriptionScore,
    totalScore,
    confidence,
    isDirectionMatch: true,
    isAmbiguous: false,
    reasons,
    discrepancies,
  };
}

/**
 * Execute full matching engine across a set of bank transactions and accounting transactions.
 * Strict Constraints:
 * - 1-to-1 matching: No transaction is assigned to multiple records.
 * - Ambiguity detection: If two candidates have near-identical top scores, flag as AMBIGUOUS / MANUAL REVIEW.
 */
export function runMatchingEngine(
  bankTransactions: ReconcileTransaction[],
  accountingTransactions: ReconcileTransaction[]
): {
  matchedPairs: MatchedPair[];
  unmatchedBank: ReconcileTransaction[];
  unmatchedAccounting: ReconcileTransaction[];
} {
  // Pre-calculate all candidate pairs
  interface CandidatePair {
    bankTx: ReconcileTransaction;
    accTx: ReconcileTransaction;
    evidence: MatchEvidence;
  }

  const allCandidates: CandidatePair[] = [];

  for (const bTx of bankTransactions) {
    // If already reconciled
    if (bTx.status === "RECONCILED") continue;

    const bTxCandidates: CandidatePair[] = [];

    for (const aTx of accountingTransactions) {
      if (aTx.status === "RECONCILED") continue;

      const evidence = calculateMatchScore(bTx, aTx);
      // Consider pairs with score >= 50 or direction match with exact amount
      if (evidence.isDirectionMatch && (evidence.totalScore >= 50 || evidence.amountScore === 30)) {
        bTxCandidates.push({ bankTx: bTx, accTx: aTx, evidence });
      }
    }

    // Check for Ambiguity among top candidates
    bTxCandidates.sort((a, b) => b.evidence.totalScore - a.evidence.totalScore);

    if (bTxCandidates.length > 1) {
      const topScore = bTxCandidates[0].evidence.totalScore;
      const secondScore = bTxCandidates[1].evidence.totalScore;

      // If top two are within 5 points of each other (and not 100% exact ref matches)
      if (Math.abs(topScore - secondScore) <= 5 && topScore < 95) {
        bTxCandidates[0].evidence.isAmbiguous = true;
        bTxCandidates[0].evidence.confidence = "MANUAL_REVIEW";
        bTxCandidates[0].evidence.discrepancies.push(
          `Ambiguous candidate: multiple accounting records scored near-identical (${topScore} pts vs ${secondScore} pts)`
        );
      }
    }

    for (const c of bTxCandidates) {
      allCandidates.push(c);
    }
  }

  // Sort candidate pairs globally by total score descending
  allCandidates.sort((a, b) => b.evidence.totalScore - a.evidence.totalScore);

  const matchedPairs: MatchedPair[] = [];
  const assignedBankIds = new Set<string>();
  const assignedAccIds = new Set<string>();

  // Allocate 1-to-1 matches greedily for top confident pairs
  for (const candidate of allCandidates) {
    if (assignedBankIds.has(candidate.bankTx.id) || assignedAccIds.has(candidate.accTx.id)) {
      continue;
    }

    // Only auto-suggest if totalScore >= 70 and not explicitly ambiguous
    if (candidate.evidence.totalScore >= 70 && !candidate.evidence.isAmbiguous) {
      assignedBankIds.add(candidate.bankTx.id);
      assignedAccIds.add(candidate.accTx.id);

      matchedPairs.push({
        id: `REC-${candidate.bankTx.id}-${candidate.accTx.id}`,
        bankTransaction: candidate.bankTx,
        accountingTransaction: candidate.accTx,
        evidence: candidate.evidence,
        matchScore: candidate.evidence.totalScore,
        status: "SUGGESTED",
      });
    }
  }

  // Identify unmatched records
  const unmatchedBank = bankTransactions.filter(
    (b) => !assignedBankIds.has(b.id) && b.status !== "RECONCILED"
  );
  const unmatchedAccounting = accountingTransactions.filter(
    (a) => !assignedAccIds.has(a.id) && a.status !== "RECONCILED"
  );

  return {
    matchedPairs,
    unmatchedBank,
    unmatchedAccounting,
  };
}

/**
 * Duplicate Detection Engine
 * Detects potential duplicates using:
 * - Same reference number
 * - Same amount
 * - Similar description
 * - Same or nearby transaction dates (within 48 hrs)
 * - Same transaction source / account
 *
 * CRITICAL RULE:
 * - Recurring payments can legitimately have identical amounts.
 * - Protect legitimate recurring transactions (e.g., monthly rent, payroll, quarterly subscription).
 * - Never delete transactions automatically.
 */
export function detectDuplicates(transactions: ReconcileTransaction[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    const txA = transactions[i];
    if (processedIds.has(txA.id)) continue;

    const duplicates: ReconcileTransaction[] = [];
    const evidenceList: string[] = [];
    let isHighProbability = false;
    let isMediumProbability = false;
    let isLegitimateRecurring = false;
    let maxConfidence = 0;

    for (let j = i + 1; j < transactions.length; j++) {
      const txB = transactions[j];
      if (processedIds.has(txB.id)) continue;

      // Must be same direction (REVENUE vs EXPENSE)
      if (txA.type !== txB.type) continue;

      const amountDiff = Math.abs(txA.amount - txB.amount);
      const daysDiff = daysBetween(txA.date, txB.date);
      const cleanRefA = cleanRef(txA.referenceNumber);
      const cleanRefB = cleanRef(txB.referenceNumber);
      const tokenSim = computeTokenSimilarity(txA.description, txB.description);

      // Check for LEGITIMATE RECURRING PAYMENT:
      // Same amount, but dates are 25-35 days apart (monthly cycle) or >20 days apart
      // and reference numbers are different or dates are in different months.
      const isMonthlyCycle = daysDiff >= 25 && daysDiff <= 35;
      const descLower = (txA.description || "").toLowerCase();
      const isKnownRecurringDesc =
        descLower.includes("rent") ||
        descLower.includes("salary") ||
        descLower.includes("payroll") ||
        descLower.includes("subscription") ||
        descLower.includes("monthly") ||
        descLower.includes("internet") ||
        descLower.includes("retainer");

      if ((isMonthlyCycle || daysDiff > 20) && (cleanRefA !== cleanRefB || isKnownRecurringDesc)) {
        // This is a legitimate recurring payment, NOT a duplicate
        continue;
      }

      // Check 1: Same exact Reference Number on same or nearby dates
      if (cleanRefA && cleanRefB && cleanRefA === cleanRefB && cleanRefA.length >= 4) {
        duplicates.push(txB);
        isHighProbability = true;
        maxConfidence = Math.max(maxConfidence, 95);
        evidenceList.push(
          `Identical reference number "${txA.referenceNumber}" submitted multiple times (Days apart: ${daysDiff})`
        );
      }
      // Check 2: Exact Amount + High Narration Similarity within 48 Hours
      else if (amountDiff < 0.01 && tokenSim >= 0.6 && daysDiff <= 2) {
        duplicates.push(txB);
        if (daysDiff === 0) {
          isHighProbability = true;
          maxConfidence = Math.max(maxConfidence, 90);
          evidenceList.push(
            `Exact same amount ₹${txA.amount.toLocaleString("en-IN")} on same day with matching description`
          );
        } else {
          isMediumProbability = true;
          maxConfidence = Math.max(maxConfidence, 78);
          evidenceList.push(
            `Same amount ₹${txA.amount.toLocaleString("en-IN")} and similar description within ${daysDiff} day(s)`
          );
        }
      }
      // Check 3: Exact Amount + Same Counterparty within 3 days
      else if (
        amountDiff < 0.01 &&
        txA.counterparty &&
        txB.counterparty &&
        cleanNarration(txA.counterparty) === cleanNarration(txB.counterparty) &&
        daysDiff <= 3
      ) {
        duplicates.push(txB);
        isMediumProbability = true;
        maxConfidence = Math.max(maxConfidence, 72);
        evidenceList.push(
          `Identical amount to counterparty "${txA.counterparty}" within ${daysDiff} days without separate invoice numbers`
        );
      }
    }

    if (duplicates.length > 0) {
      processedIds.add(txA.id);
      duplicates.forEach((d) => processedIds.add(d.id));

      let classification: DuplicateGroup["classification"] = "NEEDS_MANUAL_REVIEW";
      if (isHighProbability) classification = "HIGH_PROBABILITY";
      else if (isMediumProbability) classification = "MEDIUM_PROBABILITY";

      groups.push({
        id: `DUP-${txA.id}`,
        primaryTransaction: txA,
        duplicateTransactions: duplicates,
        classification,
        isLegitimateRecurring: false,
        confidenceScore: maxConfidence,
        evidence: evidenceList,
        totalAmount: txA.amount * (duplicates.length + 1),
      });
    }
  }

  return groups;
}

/**
 * Compute overall reconciliation summary KPI metrics
 */
export function computeReconciliationSummary(
  bankTransactions: ReconcileTransaction[],
  accountingTransactions: ReconcileTransaction[],
  matchedPairs: MatchedPair[],
  duplicateGroups: DuplicateGroup[]
): ReconciliationSummaryMetrics {
  const totalBankTransactions = bankTransactions.length;
  const totalAccountingTransactions = accountingTransactions.length;
  const totalReviewed = totalBankTransactions + totalAccountingTransactions;

  let matchedBankValue = 0;
  let matchedAccountingValue = 0;
  let highConfidenceCount = 0;
  let mediumConfidenceCount = 0;
  let manualReviewCount = 0;

  for (const m of matchedPairs) {
    matchedBankValue += m.bankTransaction.amount;
    matchedAccountingValue += m.accountingTransaction.amount;

    if (m.evidence.confidence === "HIGH_CONFIDENCE") highConfidenceCount++;
    else if (m.evidence.confidence === "MEDIUM_CONFIDENCE") mediumConfidenceCount++;
    else manualReviewCount++;
  }

  const matchedIds = new Set([
    ...matchedPairs.map((p) => p.bankTransaction.id),
    ...matchedPairs.map((p) => p.accountingTransaction.id),
  ]);

  let unmatchedBankCount = 0;
  let unmatchedBankValue = 0;
  for (const b of bankTransactions) {
    if (!matchedIds.has(b.id) && b.status !== "RECONCILED") {
      unmatchedBankCount++;
      unmatchedBankValue += b.amount;
    }
  }

  let unmatchedAccountingCount = 0;
  let unmatchedAccountingValue = 0;
  for (const a of accountingTransactions) {
    if (!matchedIds.has(a.id) && a.status !== "RECONCILED") {
      unmatchedAccountingCount++;
      unmatchedAccountingValue += a.amount;
    }
  }

  const matchedCount = matchedPairs.length * 2; // both sides matched
  const reconciliationPercentage =
    totalReviewed > 0 ? Math.round((matchedCount / totalReviewed) * 100) : 0;

  const potentialDuplicateCount = duplicateGroups.reduce(
    (sum, g) => sum + g.duplicateTransactions.length,
    0
  );

  return {
    totalReviewed,
    totalBankTransactions,
    totalAccountingTransactions,
    matchedCount: matchedPairs.length,
    unmatchedBankCount,
    unmatchedAccountingCount,
    potentialDuplicateCount,
    matchedBankValue: Math.round(matchedBankValue * 100) / 100,
    matchedAccountingValue: Math.round(matchedAccountingValue * 100) / 100,
    unmatchedBankValue: Math.round(unmatchedBankValue * 100) / 100,
    unmatchedAccountingValue: Math.round(unmatchedAccountingValue * 100) / 100,
    reconciliationPercentage,
    highConfidenceCount,
    mediumConfidenceCount,
    manualReviewCount,
  };
}

