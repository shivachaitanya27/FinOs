/**
 * FinOS Cash Flow Forecasting Engine
 * Deterministic cash flow forecasting based on historical run-rates,
 * verified bank liquidity, and scheduled receivables/payables with reliable due dates.
 * Strictly separates accounting figures from cash liquidity. No LLM used for financial calculations.
 */

import { classifyTransaction } from "./financial-engine.ts";

export type ForecastPeriod = "7_DAYS" | "30_DAYS" | "3_MONTHS" | "6_MONTHS";

export interface CashFlowTransactionInput {
  id?: string;
  date: Date | string;
  dueDate?: Date | string | null;
  description: string;
  amount: number;
  type: string; // "REVENUE", "EXPENSE", "TRANSFER"
  status?: string | null; // "COMPLETED", "PENDING", "RECONCILED", "UNMATCHED"
  category?: string | null;
  classification?: string | null;
  accountId?: string | null;
  counterparty?: string | null;
  referenceNumber?: string | null;
}

export interface ForecastDayPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g., "01 Nov"
  dayIndex: number;
  openingBalance: number;
  operatingInflow: number;
  scheduledReceivable: number;
  totalInflow: number;
  operatingOutflow: number;
  scheduledPayable: number;
  totalOutflow: number;
  netCashFlow: number;
  closingBalance: number;
  isBelowMinimum: boolean;
  deficitAmount: number;
}

export interface HistoricalCashPoint {
  date: string; // YYYY-MM-DD
  label: string;
  actualInflow: number;
  actualOutflow: number;
  netCashFlow: number;
  closingBalance: number;
}

export interface ForecastTransparency {
  historicalPeriodUsed: string;
  historicalDaysAnalyzed: number;
  historicalTransactionsAnalyzed: number;
  dailyInflowRunRate: number;
  dailyOutflowRunRate: number;
  dataAvailability: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  reliabilityIndicator: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  reliabilityScore: number; // 0 to 100
  assumptions: string[];
  knownLimitations: string[];
  isInsufficientData: boolean;
  warningMessage: string | null;
}

export interface CashFlowForecastResult {
  period: ForecastPeriod;
  forecastDays: number;
  currentCashBalance: number;
  minimumCashBalance: number;
  expectedCashInflows: number;
  expectedCashOutflows: number;
  projectedClosingBalance: number;
  netProjectedChange: number;
  safeRunwayDays: number;
  potentialCashShortageDates: string[];
  firstShortageDate: string | null;
  maxDeficitAmount: number;
  hasCashShortageRisk: boolean;
  timeline: ForecastDayPoint[];
  historicalPoints: HistoricalCashPoint[];
  scheduledReceivablesIncluded: {
    id?: string;
    description: string;
    amount: number;
    dueDate: string;
    counterparty?: string | null;
  }[];
  scheduledPayablesIncluded: {
    id?: string;
    description: string;
    amount: number;
    dueDate: string;
    counterparty?: string | null;
  }[];
  transparency: ForecastTransparency;
}

/**
 * Normalizes a date to YYYY-MM-DD (UTC-neutral midnight representation)
 */
export function toISODateString(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
  return date.toISOString().split("T")[0];
}

/**
 * Calculates deterministic cash flow forecast for a given period.
 */
export function calculateCashFlowForecast(
  transactions: CashFlowTransactionInput[],
  options: {
    period: ForecastPeriod;
    currentCashBalance: number;
    minimumCashBalance?: number;
    asOfDate?: Date | string;
    historicalLookbackDays?: number; // default 90 days
  }
): CashFlowForecastResult {
  const period = options.period;
  const currentCashBalance = Math.round(options.currentCashBalance * 100) / 100;
  const minimumCashBalance = options.minimumCashBalance !== undefined ? options.minimumCashBalance : 50000;
  const asOfDate = options.asOfDate ? new Date(options.asOfDate) : new Date();
  const lookbackDays = options.historicalLookbackDays || 90;

  // Determine forecast duration in days
  let forecastDays = 30;
  if (period === "7_DAYS") forecastDays = 7;
  else if (period === "30_DAYS") forecastDays = 30;
  else if (period === "3_MONTHS") forecastDays = 90;
  else if (period === "6_MONTHS") forecastDays = 180;

  const todayStr = toISODateString(asOfDate);
  const lookbackStartDate = new Date(asOfDate);
  lookbackStartDate.setDate(lookbackStartDate.getDate() - lookbackDays);
  const lookbackStartStr = toISODateString(lookbackStartDate);

  // 1. Separate Historical Completed/Reconciled Cash Flow from Future Pending Items
  const historicalTxs: CashFlowTransactionInput[] = [];
  const scheduledReceivables: {
    id?: string;
    description: string;
    amount: number;
    dueDate: string;
    counterparty?: string | null;
  }[] = [];
  const scheduledPayables: {
    id?: string;
    description: string;
    amount: number;
    dueDate: string;
    counterparty?: string | null;
  }[] = [];

  for (const tx of transactions) {
    const txDateStr = toISODateString(tx.date);
    const amount = Math.abs(Number(tx.amount) || 0);
    if (amount === 0) continue;

    const classification = classifyTransaction({
      type: tx.type,
      category: tx.category,
      description: tx.description,
      classification: tx.classification,
    });

    // Skip internal transfers for run-rate calculation (they don't change net company liquidity)
    if (classification === "INTERNAL_TRANSFER") continue;

    const isCompleted = tx.status === "COMPLETED" || tx.status === "RECONCILED";
    const isPending = tx.status === "PENDING" || tx.status === "UNMATCHED";

    // Historical completed transactions within lookback window
    if (isCompleted && txDateStr <= todayStr && txDateStr >= lookbackStartStr) {
      historicalTxs.push(tx);
    }

    // Pending transactions with reliable due date in the forecast horizon
    if (isPending && tx.dueDate) {
      const dueStr = toISODateString(tx.dueDate);
      // Only include if due date is today or in the future
      if (dueStr >= todayStr) {
        if (tx.type === "REVENUE" || classification === "OPERATING_REVENUE") {
          scheduledReceivables.push({
            id: tx.id,
            description: tx.description,
            amount,
            dueDate: dueStr,
            counterparty: tx.counterparty,
          });
        } else if (tx.type === "EXPENSE" || classification === "OPERATING_EXPENSE" || classification === "TAX_PAYMENT") {
          scheduledPayables.push({
            id: tx.id,
            description: tx.description,
            amount,
            dueDate: dueStr,
            counterparty: tx.counterparty,
          });
        }
      }
    }
  }

  // 2. Assess Data Availability & Insufficient Data Conditions
  const historicalTxCount = historicalTxs.length;
  const uniqueHistoricalDates = new Set(historicalTxs.map((t) => toISODateString(t.date)));
  const historicalDaysCount = uniqueHistoricalDates.size;

  let isInsufficientData = false;
  let dataAvailability: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT" = "HIGH";
  let reliabilityIndicator: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA" = "HIGH";
  let reliabilityScore = 90;
  let warningMessage: string | null = null;

  if (historicalTxCount < 5 || historicalDaysCount < 3) {
    isInsufficientData = true;
    dataAvailability = "INSUFFICIENT";
    reliabilityIndicator = "INSUFFICIENT_DATA";
    reliabilityScore = 20;
    warningMessage =
      "Insufficient historical transaction records. Forecast has high uncertainty and relies solely on base averages. Minimum 10 completed transactions recommended.";
  } else if (historicalTxCount < 15 || historicalDaysCount < 10) {
    dataAvailability = "LOW";
    reliabilityIndicator = "LOW";
    reliabilityScore = 55;
    warningMessage =
      "Limited historical data period detected. Daily run-rate may experience volatility from irregular payment cycles.";
  } else if (historicalTxCount < 30 || historicalDaysCount < 25) {
    dataAvailability = "MEDIUM";
    reliabilityIndicator = "MEDIUM";
    reliabilityScore = 75;
  } else {
    dataAvailability = "HIGH";
    reliabilityIndicator = "HIGH";
    reliabilityScore = 92;
  }

  // 3. Compute Deterministic Historical Run-Rate
  let totalHistoricalCashInflows = 0;
  let totalHistoricalCashOutflows = 0;

  for (const h of historicalTxs) {
    const amount = Math.abs(Number(h.amount) || 0);
    const classification = classifyTransaction({
      type: h.type,
      category: h.category,
      description: h.description,
      classification: h.classification,
    });

    if (
      classification === "OPERATING_REVENUE" ||
      classification === "REFUND_RECEIVED" ||
      classification === "LOAN_PROCEEDS" ||
      classification === "OWNER_EQUITY"
    ) {
      totalHistoricalCashInflows += amount;
    } else if (
      classification === "OPERATING_EXPENSE" ||
      classification === "REFUND_ISSUED" ||
      classification === "LOAN_REPAYMENT" ||
      classification === "TAX_PAYMENT"
    ) {
      totalHistoricalCashOutflows += amount;
    } else {
      if (h.type === "REVENUE") totalHistoricalCashInflows += amount;
      else if (h.type === "EXPENSE") totalHistoricalCashOutflows += amount;
    }
  }

  // Calculate effective historical span in days (at least 7 days to avoid division by zero)
  const effectiveLookbackDays = Math.max(7, Math.min(lookbackDays, historicalDaysCount > 0 ? 60 : 7));
  const dailyInflowRunRate =
    historicalTxCount > 0 ? Math.round((totalHistoricalCashInflows / effectiveLookbackDays) * 100) / 100 : 0;
  const dailyOutflowRunRate =
    historicalTxCount > 0 ? Math.round((totalHistoricalCashOutflows / effectiveLookbackDays) * 100) / 100 : 0;

  // 4. Build Historical Points for Charting (Last 14 to 30 days)
  const historicalPoints: HistoricalCashPoint[] = [];
  const chartLookbackDays = Math.min(28, lookbackDays);
  let runningHistoricalBalance = Math.max(0, currentCashBalance - (totalHistoricalCashInflows - totalHistoricalCashOutflows));

  for (let d = chartLookbackDays; d >= 0; d--) {
    const pointDate = new Date(asOfDate);
    pointDate.setDate(pointDate.getDate() - d);
    const dateStr = toISODateString(pointDate);

    // Sum transactions on this date
    const dayTxs = historicalTxs.filter((t) => toISODateString(t.date) === dateStr);
    let dayInflow = 0;
    let dayOutflow = 0;

    for (const t of dayTxs) {
      const amount = Math.abs(Number(t.amount) || 0);
      if (t.type === "REVENUE") dayInflow += amount;
      else if (t.type === "EXPENSE") dayOutflow += amount;
    }

    runningHistoricalBalance = Math.max(0, runningHistoricalBalance + dayInflow - dayOutflow);

    historicalPoints.push({
      date: dateStr,
      label: pointDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      actualInflow: Math.round(dayInflow),
      actualOutflow: Math.round(dayOutflow),
      netCashFlow: Math.round(dayInflow - dayOutflow),
      closingBalance: Math.round(runningHistoricalBalance),
    });
  }

  // 5. Build Future Day-by-Day Forecast Timeline
  const timeline: ForecastDayPoint[] = [];
  let runningBalance = currentCashBalance;
  let totalProjectedInflows = 0;
  let totalProjectedOutflows = 0;
  const potentialCashShortageDates: string[] = [];
  let firstShortageDate: string | null = null;
  let maxDeficitAmount = 0;
  let safeRunwayDays = forecastDays;

  for (let dayIndex = 1; dayIndex <= forecastDays; dayIndex++) {
    const futureDate = new Date(asOfDate);
    futureDate.setDate(futureDate.getDate() + dayIndex);
    const dateStr = toISODateString(futureDate);

    const dayOpening = runningBalance;

    // Scheduled items on this exact date
    const dayScheduledReceivables = scheduledReceivables
      .filter((r) => r.dueDate === dateStr)
      .reduce((sum, r) => sum + r.amount, 0);

    const dayScheduledPayables = scheduledPayables
      .filter((p) => p.dueDate === dateStr)
      .reduce((sum, p) => sum + p.amount, 0);

    // Baseline daily velocity
    const opInflow = dailyInflowRunRate;
    const opOutflow = dailyOutflowRunRate;

    const totalDayInflow = Math.round((opInflow + dayScheduledReceivables) * 100) / 100;
    const totalDayOutflow = Math.round((opOutflow + dayScheduledPayables) * 100) / 100;
    const netDayChange = Math.round((totalDayInflow - totalDayOutflow) * 100) / 100;

    runningBalance = Math.round((dayOpening + netDayChange) * 100) / 100;

    totalProjectedInflows += totalDayInflow;
    totalProjectedOutflows += totalDayOutflow;

    const isBelowMinimum = runningBalance < minimumCashBalance;
    const deficitAmount = isBelowMinimum ? Math.round((minimumCashBalance - runningBalance) * 100) / 100 : 0;

    if (isBelowMinimum) {
      potentialCashShortageDates.push(dateStr);
      if (!firstShortageDate) {
        firstShortageDate = dateStr;
        safeRunwayDays = dayIndex - 1;
      }
      if (deficitAmount > maxDeficitAmount) {
        maxDeficitAmount = deficitAmount;
      }
    }

    timeline.push({
      date: dateStr,
      label: futureDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      dayIndex,
      openingBalance: dayOpening,
      operatingInflow: opInflow,
      scheduledReceivable: dayScheduledReceivables,
      totalInflow: totalDayInflow,
      operatingOutflow: opOutflow,
      scheduledPayable: dayScheduledPayables,
      totalOutflow: totalDayOutflow,
      netCashFlow: netDayChange,
      closingBalance: runningBalance,
      isBelowMinimum,
      deficitAmount,
    });
  }

  const projectedClosingBalance = runningBalance;
  const netProjectedChange = Math.round((totalProjectedInflows - totalProjectedOutflows) * 100) / 100;

  // 6. Build Comprehensive Transparency Model
  const transparency: ForecastTransparency = {
    historicalPeriodUsed: `${lookbackStartStr} to ${todayStr} (${effectiveLookbackDays} days)`,
    historicalDaysAnalyzed: effectiveLookbackDays,
    historicalTransactionsAnalyzed: historicalTxCount,
    dailyInflowRunRate,
    dailyOutflowRunRate,
    dataAvailability,
    reliabilityIndicator,
    reliabilityScore,
    assumptions: [
      `Daily operating inflow run-rate: ₹${dailyInflowRunRate.toLocaleString("en-IN")}/day based on ${historicalTxCount} historical transactions.`,
      `Daily operating outflow run-rate: ₹${dailyOutflowRunRate.toLocaleString("en-IN")}/day.`,
      `Scheduled receivables: ₹${scheduledReceivables.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN")} across ${scheduledReceivables.length} pending items with verified due dates.`,
      `Scheduled payables: ₹${scheduledPayables.reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")} across ${scheduledPayables.length} pending vouchers with verified due dates.`,
      `Minimum cash reserve safety threshold configured at ₹${minimumCashBalance.toLocaleString("en-IN")}.`,
    ],
    knownLimitations: [
      "Assumes operational revenue run-rates remain steady without major seasonal shocks.",
      "Unscheduled capital expenditures, discretionary owner dividends, or sudden vendor price renegotiations are not factored.",
      "Receivables and payables without explicit due dates are excluded to prevent speculative liquidity distortions.",
    ],
    isInsufficientData,
    warningMessage,
  };

  return {
    period,
    forecastDays,
    currentCashBalance,
    minimumCashBalance,
    expectedCashInflows: Math.round(totalProjectedInflows * 100) / 100,
    expectedCashOutflows: Math.round(totalProjectedOutflows * 100) / 100,
    projectedClosingBalance,
    netProjectedChange,
    safeRunwayDays,
    potentialCashShortageDates,
    firstShortageDate,
    maxDeficitAmount,
    hasCashShortageRisk: potentialCashShortageDates.length > 0,
    timeline,
    historicalPoints,
    scheduledReceivablesIncluded: scheduledReceivables,
    scheduledPayablesIncluded: scheduledPayables,
    transparency,
  };
}
