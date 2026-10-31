/**
 * FinOS Financial Risk Detection Engine
 * Deterministic detection of financial anomalies, liquidity shortages,
 * duplicate payments, unmatched bank feeds, category spikes, and overdue receivables.
 * Strictly uses statistical and business-rule heuristics without probabilistic LLMs.
 */

import { detectDuplicates, type ReconcileTransaction } from "./reconciliation-engine.ts";
import { calculateCashFlowForecast, type CashFlowTransactionInput, type ForecastPeriod } from "./cashflow-engine.ts";
import { classifyTransaction } from "./financial-engine.ts";

export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RiskCategory =
  | "UNUSUAL_EXPENSE"
  | "CATEGORY_SPIKE"
  | "DUPLICATE_PAYMENT"
  | "UNMATCHED_TRANSACTION"
  | "MISSING_ACCOUNTING_RECORD"
  | "FREQUENCY_ANOMALY"
  | "CASH_FLOW"
  | "OVERDUE_RECEIVABLE"
  | "TAX_COMPLIANCE";

export type RiskStatus = "ACTIVE" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export interface RiskAlertOutput {
  id?: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  status: RiskStatus;
  amount?: number | null;
  relatedCategory?: string | null;
  relatedTransactionId?: string | null;
  evidence: string; // JSON string or human-readable explanation
  recommendedAction: string;
  reviewNotes?: string | null;
  detectedAt?: Date | string;
}

export interface RiskDetectionSummary {
  totalActive: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  resolvedCount: number;
  dismissedCount: number;
  totalAtRiskAmount: number;
  categoryBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
  hasInsufficientData: boolean;
  insufficientDataWarning?: string | null;
  alerts: RiskAlertOutput[];
}

/**
 * Standard standard deviation calculation
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Runs the deterministic risk detection pipeline across business transactions,
 * accounts, and reconciliation records.
 */
export function detectFinancialRisks(
  transactions: CashFlowTransactionInput[],
  options: {
    currentCashBalance: number;
    minimumCashBalance?: number;
    asOfDate?: Date | string;
    existingAlerts?: RiskAlertOutput[];
  }
): RiskDetectionSummary {
  const asOfDate = options.asOfDate ? new Date(options.asOfDate) : new Date();
  const currentCashBalance = options.currentCashBalance || 0;
  const minimumCashBalance = options.minimumCashBalance !== undefined ? options.minimumCashBalance : 50000;
  const todayStr = asOfDate.toISOString().split("T")[0];

  const alerts: RiskAlertOutput[] = [];
  const processedKeys = new Set<string>();

  // 0. Filter transactions into subsets
  const completedExpenses: CashFlowTransactionInput[] = [];
  const completedRevenues: CashFlowTransactionInput[] = [];
  const pendingReceivables: CashFlowTransactionInput[] = [];
  const unmatchedBankFeeds: CashFlowTransactionInput[] = [];
  const unmatchedAccountingEntries: CashFlowTransactionInput[] = [];

  for (const tx of transactions) {
    const classification = classifyTransaction({
      type: tx.type,
      category: tx.category,
      description: tx.description,
      classification: tx.classification,
    });

    if (classification === "INTERNAL_TRANSFER") continue;

    const isCompleted = tx.status === "COMPLETED" || tx.status === "RECONCILED";
    const isPending = tx.status === "PENDING";
    const isUnmatched = tx.status === "UNMATCHED";

    if (isCompleted) {
      if (tx.type === "EXPENSE" || classification === "OPERATING_EXPENSE" || classification === "TAX_PAYMENT") {
        completedExpenses.push(tx);
      } else if (tx.type === "REVENUE" || classification === "OPERATING_REVENUE") {
        completedRevenues.push(tx);
      }
    }

    if (isPending) {
      if (tx.type === "REVENUE" || classification === "OPERATING_REVENUE") {
        pendingReceivables.push(tx);
      }
    }

    if (isUnmatched) {
      // Determine if bank statement feed or accounting book
      const src = (tx as any).source || "BANK_STATEMENT";
      if (src === "BANK_STATEMENT") {
        unmatchedBankFeeds.push(tx);
      } else {
        unmatchedAccountingEntries.push(tx);
      }
    }
  }

  // Check insufficient data
  const totalCompletedCount = completedExpenses.length + completedRevenues.length;
  const hasInsufficientData = totalCompletedCount < 5;
  const insufficientDataWarning = hasInsufficientData
    ? `Insufficient historical data (${totalCompletedCount} completed transactions). At least 5 completed records are required for statistical expense baselines and frequency anomaly models.`
    : null;

  // -------------------------------------------------------------
  // 1. RISK 1: UNUSUALLY HIGH EXPENSES (Statistical Outliers)
  // -------------------------------------------------------------
  if (completedExpenses.length >= 3) {
    const expenseAmounts = completedExpenses.map((e) => Math.abs(Number(e.amount) || 0));
    const meanExpense = expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length;
    const stdDevExpense = calculateStdDev(expenseAmounts, meanExpense);

    for (const exp of completedExpenses) {
      const amt = Math.abs(Number(exp.amount) || 0);
      // Outlier criteria: > mean + 2.0*stdDev AND > ₹20,000, OR > 3.0*mean AND > ₹30,000
      const isStatisticalOutlier =
        (stdDevExpense > 0 && amt > meanExpense + 2.0 * stdDevExpense && amt > 20000) ||
        (amt > meanExpense * 3.0 && amt > 30000);

      if (isStatisticalOutlier || (exp as any).isUnusual) {
        const key = `EXPENSE_OUTLIER_${exp.id || exp.description}`;
        if (!processedKeys.has(key)) {
          processedKeys.add(key);

          const multiplier = meanExpense > 0 ? (amt / meanExpense).toFixed(1) : "3.0";
          const severity: RiskSeverity = amt >= 150000 ? "CRITICAL" : amt >= 50000 ? "HIGH" : "MEDIUM";

          alerts.push({
            title: `Unusually High Expense: ${exp.description.slice(0, 40)}`,
            description: `Expense of ₹${amt.toLocaleString("en-IN")} is ${multiplier}x higher than your historical average of ₹${Math.round(meanExpense).toLocaleString("en-IN")}.`,
            category: "UNUSUAL_EXPENSE",
            severity,
            status: "ACTIVE",
            amount: amt,
            relatedCategory: exp.category || "General Expense",
            relatedTransactionId: exp.id || null,
            evidence: JSON.stringify({
              transactionAmount: amt,
              historicalAverage: Math.round(meanExpense),
              standardDeviation: Math.round(stdDevExpense),
              multiplierOverAverage: Number(multiplier),
              transactionDate: exp.date,
              referenceNumber: exp.referenceNumber || "N/A",
              counterparty: exp.counterparty || "N/A",
            }),
            recommendedAction:
              "Inspect transaction receipt and verify whether this large disbursement was authorized by management.",
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 2. RISK 2: SUDDEN INCREASES IN EXPENSE CATEGORIES (Category Spikes)
  // -------------------------------------------------------------
  if (completedExpenses.length >= 5) {
    // Group expenses by category into recent (last 30 days) vs prior baseline (31-90 days)
    const thirtyDaysAgo = new Date(asOfDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentByCategory: Record<string, number> = {};
    const priorByCategory: Record<string, number> = {};

    for (const exp of completedExpenses) {
      const cat = exp.category || "Miscellaneous";
      const amt = Math.abs(Number(exp.amount) || 0);
      const expDate = new Date(exp.date);

      if (expDate >= thirtyDaysAgo) {
        recentByCategory[cat] = (recentByCategory[cat] || 0) + amt;
      } else {
        priorByCategory[cat] = (priorByCategory[cat] || 0) + amt;
      }
    }

    for (const [cat, recentAmt] of Object.entries(recentByCategory)) {
      const priorAmt = priorByCategory[cat] || 0;
      // If category jumped > 50% AND the absolute jump is at least ₹20,000
      if (priorAmt > 0 && recentAmt >= priorAmt * 1.5 && recentAmt - priorAmt >= 20000) {
        const pctIncrease = Math.round(((recentAmt - priorAmt) / priorAmt) * 100);
        const key = `CATEGORY_SPIKE_${cat}`;
        if (!processedKeys.has(key)) {
          processedKeys.add(key);

          alerts.push({
            title: `Expense Surge in "${cat}" (+${pctIncrease}%)`,
            description: `Recent 30-day spend of ₹${recentAmt.toLocaleString("en-IN")} surged by ${pctIncrease}% compared to prior baseline of ₹${priorAmt.toLocaleString("en-IN")}.`,
            category: "CATEGORY_SPIKE",
            severity: pctIncrease >= 150 ? "HIGH" : "MEDIUM",
            status: "ACTIVE",
            amount: recentAmt - priorAmt,
            relatedCategory: cat,
            relatedTransactionId: null,
            evidence: JSON.stringify({
              category: cat,
              recentAmount: recentAmt,
              priorBaselineAmount: priorAmt,
              absoluteIncrease: recentAmt - priorAmt,
              percentageIncrease: pctIncrease,
            }),
            recommendedAction: `Conduct category audit for "${cat}" to pinpoint unexpected rate escalations or recurring subscription drift.`,
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 3. RISK 3: POTENTIAL DUPLICATE TRANSACTIONS
  // -------------------------------------------------------------
  const reconcileInput: ReconcileTransaction[] = transactions.map((t) => ({
    id: t.id || `tx-${Math.random()}`,
    date: t.date,
    description: t.description,
    amount: Math.abs(Number(t.amount) || 0),
    type: t.type,
    category: t.category,
    source: (t as any).source || "MANUAL",
    status: t.status,
    referenceNumber: t.referenceNumber,
    counterparty: t.counterparty,
    accountId: t.accountId,
    isDuplicate: (t as any).isDuplicate,
  }));

  const duplicateGroups = detectDuplicates(reconcileInput);

  for (const group of duplicateGroups) {
    if (group.isLegitimateRecurring) continue; // Protect legitimate monthly recurring payments!

    const prim = group.primaryTransaction;
    const dups = group.duplicateTransactions;
    const key = `DUP_RISK_${prim.id}`;

    if (!processedKeys.has(key)) {
      processedKeys.add(key);

      const dupCount = dups.length + 1;
      const totalDupAmt = group.totalAmount;
      const isHighProb = group.classification === "HIGH_PROBABILITY";

      alerts.push({
        title: `Suspected Duplicate Payment (${dupCount} entries)`,
        description: `Potential duplicate of ₹${prim.amount.toLocaleString("en-IN")} detected for "${prim.description}". ${group.evidence[0] || ""}`,
        category: "DUPLICATE_PAYMENT",
        severity: isHighProb ? "HIGH" : "MEDIUM",
        status: "ACTIVE",
        amount: totalDupAmt,
        relatedCategory: prim.category || "Vendor Payouts",
        relatedTransactionId: prim.id,
        evidence: JSON.stringify({
          primaryId: prim.id,
          duplicateIds: dups.map((d) => d.id),
          classification: group.classification,
          confidenceScore: group.confidenceScore,
          reasons: group.evidence,
          referenceNumber: prim.referenceNumber || null,
        }),
        recommendedAction:
          "Verify with your vendor and banking records before proceeding. Do NOT delete automatically; reconcile or confirm legitimacy.",
      });
    }
  }

  // -------------------------------------------------------------
  // 4. RISK 4 & 5: UNMATCHED BANK FEEDS & MISSING ACCOUNTING RECORDS
  // -------------------------------------------------------------
  for (const ub of unmatchedBankFeeds) {
    const amt = Math.abs(Number(ub.amount) || 0);
    const key = `UNMATCHED_BANK_${ub.id || ub.referenceNumber}`;
    if (!processedKeys.has(key)) {
      processedKeys.add(key);

      alerts.push({
        title: `Unreconciled Bank Feed: ₹${amt.toLocaleString("en-IN")}`,
        description: `Bank statement entry "${ub.description.slice(0, 45)}" dated ${new Date(ub.date).toLocaleDateString("en-IN")} lacks matching accounting entry in ERP books.`,
        category: "UNMATCHED_TRANSACTION",
        severity: amt >= 50000 ? "HIGH" : "MEDIUM",
        status: "ACTIVE",
        amount: amt,
        relatedCategory: ub.category || "Bank Clearing",
        relatedTransactionId: ub.id || null,
        evidence: JSON.stringify({
          bankTransactionId: ub.id,
          amount: amt,
          date: ub.date,
          description: ub.description,
          referenceNumber: ub.referenceNumber,
          direction: ub.type,
        }),
        recommendedAction:
          "Create corresponding voucher in Tally/Zoho or attach vendor invoice to avoid audit non-compliance.",
      });
    }
  }

  for (const ua of unmatchedAccountingEntries) {
    const amt = Math.abs(Number(ua.amount) || 0);
    const key = `MISSING_BANK_${ua.id || ua.referenceNumber}`;
    if (!processedKeys.has(key)) {
      processedKeys.add(key);

      alerts.push({
        title: `Uncleared Accounting Entry: ₹${amt.toLocaleString("en-IN")}`,
        description: `Accounting book entry "${ua.description.slice(0, 45)}" has not cleared the bank statement feeds.`,
        category: "MISSING_ACCOUNTING_RECORD",
        severity: amt >= 50000 ? "HIGH" : "LOW",
        status: "ACTIVE",
        amount: amt,
        relatedCategory: ua.category || "General Ledger",
        relatedTransactionId: ua.id || null,
        evidence: JSON.stringify({
          accountingTransactionId: ua.id,
          amount: amt,
          date: ua.date,
          description: ua.description,
          referenceNumber: ua.referenceNumber,
          source: (ua as any).source,
        }),
        recommendedAction: "Check bank settlement timeline or confirm whether cheque/RTGS payment is still in transit.",
      });
    }
  }

  // -------------------------------------------------------------
  // 6. RISK 6: UNUSUAL TRANSACTION FREQUENCY (Clustering Spikes)
  // -------------------------------------------------------------
  if (completedExpenses.length >= 4) {
    // Check for > 2 payouts to same counterparty or category on same day
    const dayCounterpartyCount: Record<string, { count: number; totalAmt: number; txIds: string[] }> = {};

    for (const exp of completedExpenses) {
      const dayStr = toISODateString(exp.date);
      const cp = (exp.counterparty || exp.description.slice(0, 20)).toLowerCase().trim();
      const clusterKey = `${dayStr}::${cp}`;

      if (!dayCounterpartyCount[clusterKey]) {
        dayCounterpartyCount[clusterKey] = { count: 0, totalAmt: 0, txIds: [] };
      }
      dayCounterpartyCount[clusterKey].count++;
      dayCounterpartyCount[clusterKey].totalAmt += Math.abs(Number(exp.amount) || 0);
      if (exp.id) dayCounterpartyCount[clusterKey].txIds.push(exp.id);
    }

    for (const [keyStr, val] of Object.entries(dayCounterpartyCount)) {
      if (val.count >= 3) {
        const [day, cp] = keyStr.split("::");
        const alertKey = `FREQ_ANOMALY_${day}_${cp}`;
        if (!processedKeys.has(alertKey)) {
          processedKeys.add(alertKey);

          alerts.push({
            title: `High-Frequency Transaction Burst: "${cp}"`,
            description: `${val.count} successive transactions totaling ₹${Math.round(val.totalAmt).toLocaleString("en-IN")} recorded on ${day}.`,
            category: "FREQUENCY_ANOMALY",
            severity: "MEDIUM",
            status: "ACTIVE",
            amount: val.totalAmt,
            relatedCategory: "High Velocity Payouts",
            relatedTransactionId: val.txIds[0] || null,
            evidence: JSON.stringify({
              counterparty: cp,
              date: day,
              transactionCount: val.count,
              aggregateAmount: val.totalAmt,
              involvedTransactionIds: val.txIds,
            }),
            recommendedAction:
              "Review transaction cluster to ensure automated payout scripts or payment retries did not duplicate transfers.",
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 7. RISK 7: CASH SHORTAGE RISK (Projected Liquidity Deficit)
  // -------------------------------------------------------------
  const forecastResult = calculateCashFlowForecast(transactions, {
    period: "30_DAYS",
    currentCashBalance,
    minimumCashBalance,
    asOfDate,
  });

  if (forecastResult.hasCashShortageRisk) {
    const key = `CASH_SHORTAGE_${forecastResult.firstShortageDate}`;
    if (!processedKeys.has(key)) {
      processedKeys.add(key);

      const isCriticalDeficit = forecastResult.projectedClosingBalance <= 0;
      const severity: RiskSeverity = isCriticalDeficit ? "CRITICAL" : "HIGH";

      alerts.push({
        title: `Projected Cash Shortage Alert (Safe Runway: ${forecastResult.safeRunwayDays} Days)`,
        description: `Projected cash balance is estimated to dip below your safety threshold of ₹${minimumCashBalance.toLocaleString("en-IN")} on ${forecastResult.firstShortageDate}. Maximum estimated deficit: ₹${forecastResult.maxDeficitAmount.toLocaleString("en-IN")}.`,
        category: "CASH_FLOW",
        severity,
        status: "ACTIVE",
        amount: forecastResult.maxDeficitAmount,
        relatedCategory: "Treasury & Working Capital",
        relatedTransactionId: null,
        evidence: JSON.stringify({
          currentCashBalance,
          minimumThreshold: minimumCashBalance,
          projectedClosingBalance: forecastResult.projectedClosingBalance,
          firstShortageDate: forecastResult.firstShortageDate,
          shortageDatesCount: forecastResult.potentialCashShortageDates.length,
          safeRunwayDays: forecastResult.safeRunwayDays,
          maxDeficitAmount: forecastResult.maxDeficitAmount,
        }),
        recommendedAction:
          "Accelerate invoice collections from debtors, postpone discretionary capital outlays, or arrange a short-term bank overdraft.",
      });
    }
  }

  // -------------------------------------------------------------
  // 8. RISK 8: OVERDUE CUSTOMER PAYMENTS (Accounts Receivable Aging)
  // -------------------------------------------------------------
  for (const pr of pendingReceivables) {
    if (!pr.dueDate) continue; // Only evaluate when reliable due date exists!

    const dueDateObj = new Date(pr.dueDate);
    const dueStr = toISODateString(dueDateObj);

    if (dueStr < todayStr) {
      const daysOverdue = Math.max(1, Math.round((asOfDate.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)));
      const amt = Math.abs(Number(pr.amount) || 0);
      const key = `OVERDUE_RECEIVABLE_${pr.id || pr.referenceNumber}`;

      if (!processedKeys.has(key)) {
        processedKeys.add(key);

        const severity: RiskSeverity = daysOverdue > 30 || amt >= 100000 ? "HIGH" : "MEDIUM";

        alerts.push({
          title: `Overdue Customer Receivable: ${pr.counterparty || pr.description.slice(0, 30)}`,
          description: `Invoice of ₹${amt.toLocaleString("en-IN")} is overdue by ${daysOverdue} days (Due Date was ${dueDateObj.toLocaleDateString("en-IN")}).`,
          category: "OVERDUE_RECEIVABLE",
          severity,
          status: "ACTIVE",
          amount: amt,
          relatedCategory: "Receivables",
          relatedTransactionId: pr.id || null,
          evidence: JSON.stringify({
            invoiceId: pr.id,
            counterparty: pr.counterparty || "Client",
            referenceNumber: pr.referenceNumber || "INV-PENDING",
            dueDate: dueStr,
            daysOverdue,
            amount: amt,
          }),
          recommendedAction:
            "Trigger automated payment reminder with UPI QR or contact counterparty's finance desk for settlement timeline.",
        });
      }
    }
  }

  // Merge with existing alerts if provided (preserve reviewed/resolved statuses)
  if (options.existingAlerts && options.existingAlerts.length > 0) {
    const existingMap = new Map<string, RiskAlertOutput>();
    for (const ea of options.existingAlerts) {
      existingMap.set(ea.title, ea);
    }

    for (let i = 0; i < alerts.length; i++) {
      const match = existingMap.get(alerts[i].title);
      if (match) {
        alerts[i].id = match.id;
        alerts[i].status = match.status;
        alerts[i].reviewNotes = match.reviewNotes;
      }
    }
  }

  // Calculate Metrics Summary
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let resolvedCount = 0;
  let dismissedCount = 0;
  let totalActive = 0;
  let totalAtRiskAmount = 0;
  const categoryBreakdown: Record<string, number> = {};
  const severityBreakdown: Record<string, number> = {};

  for (const a of alerts) {
    if (a.status === "RESOLVED") {
      resolvedCount++;
    } else if (a.status === "DISMISSED") {
      dismissedCount++;
    } else {
      // ACTIVE or REVIEWED
      totalActive++;
      if (a.amount) totalAtRiskAmount += a.amount;

      if (a.severity === "CRITICAL") criticalCount++;
      else if (a.severity === "HIGH") highCount++;
      else if (a.severity === "MEDIUM") mediumCount++;
      else if (a.severity === "LOW") lowCount++;

      categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
      severityBreakdown[a.severity] = (severityBreakdown[a.severity] || 0) + 1;
    }
  }

  return {
    totalActive,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    resolvedCount,
    dismissedCount,
    totalAtRiskAmount: Math.round(totalAtRiskAmount * 100) / 100,
    categoryBreakdown,
    severityBreakdown,
    hasInsufficientData,
    insufficientDataWarning,
    alerts,
  };
}

function toISODateString(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
  return date.toISOString().split("T")[0];
}
