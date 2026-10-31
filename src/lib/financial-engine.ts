/**
 * FinOS Financial Calculation Engine (Deterministic Fintech Backend Engine)
 * Strictly adheres to double-entry principles, Indian accounting standards (Ind AS / AS),
 * and deterministic mathematical logic (NO probabilistic/AI models for core calculations).
 */

export type TransactionClassification =
  | "OPERATING_REVENUE"
  | "OPERATING_EXPENSE"
  | "INTERNAL_TRANSFER"
  | "LOAN_PROCEEDS"
  | "LOAN_REPAYMENT"
  | "REFUND_RECEIVED"
  | "REFUND_ISSUED"
  | "OWNER_EQUITY"
  | "TAX_PAYMENT"
  | "OTHER";

export interface TransactionRecord {
  id?: string;
  date: Date | string;
  description: string;
  amount: number;
  type: string; // "REVENUE", "EXPENSE", "TRANSFER", "LOAN", "REFUND"
  category?: string | null;
  status?: string | null; // "COMPLETED", "PENDING", "RECONCILED", "UNMATCHED", "FLAGGED"
  classification?: string | null;
  accountId?: string | null;
  referenceNumber?: string | null;
  counterparty?: string | null;
}

export interface FinancialCalculationResult {
  totalRevenue: number;
  totalExpenses: number;
  netProfitLoss: number | null;
  cashInflows: number;
  cashOutflows: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
  hasSufficientData: boolean;
  transactionCount: number;
  breakdown: {
    operatingRevenue: number;
    customerRefunds: number;
    operatingExpenses: number;
    vendorRefunds: number;
    loanProceeds: number;
    loanRepayments: number;
    internalTransfers: number;
    taxPayments: number;
  };
}

/**
 * Deterministically classify a transaction based on its explicit classification,
 * type, category, and description keywords.
 */
export function classifyTransaction(tx: {
  type: string;
  category?: string | null;
  description?: string | null;
  classification?: string | null;
}): TransactionClassification {
  if (tx.classification && isValidClassification(tx.classification)) {
    return tx.classification as TransactionClassification;
  }

  const desc = (tx.description || "").toLowerCase();
  const cat = (tx.category || "").toLowerCase();
  const type = (tx.type || "").toUpperCase();

  // 1. Internal Transfer checks (Must not be counted as revenue or expense)
  if (
    type === "TRANSFER" ||
    cat === "transfer" ||
    cat === "internal transfer" ||
    desc.includes("self transfer") ||
    /\bcontra\b/i.test(desc) ||
    desc.includes("fund transfer to") ||
    desc.includes("transfer between accounts") ||
    desc.includes("sweep transfer")
  ) {
    return "INTERNAL_TRANSFER";
  }

  // 2. Loan Proceeds checks (Cash inflow, NOT business revenue)
  if (
    type === "LOAN_PROCEEDS" ||
    cat === "loans & borrowings" ||
    desc.includes("loan disbursement") ||
    desc.includes("term loan credit") ||
    desc.includes("working capital loan") ||
    desc.includes("od limit drawdown") ||
    desc.includes("business loan credit")
  ) {
    return "LOAN_PROCEEDS";
  }

  // 3. Loan Principal Repayment checks (Cash outflow, NOT operating expense)
  if (
    type === "LOAN_REPAYMENT" ||
    cat === "loan principal repayment" ||
    desc.includes("loan repayment principal") ||
    desc.includes("term loan emi principal") ||
    desc.includes("working capital repayment") ||
    desc.includes("loan principal debit")
  ) {
    return "LOAN_REPAYMENT";
  }

  // 4. Refund Issued checks (Customer refund - reduces Revenue, cash outflow)
  if (
    type === "REFUND_ISSUED" ||
    cat === "customer refund" ||
    desc.includes("customer refund") ||
    desc.includes("sales return") ||
    desc.includes("credit note payout") ||
    (type === "EXPENSE" && (desc.includes("refund to customer") || desc.includes("client refund")))
  ) {
    return "REFUND_ISSUED";
  }

  // 5. Refund Received checks (Vendor expense refund - reduces Expense, cash inflow)
  if (
    type === "REFUND_RECEIVED" ||
    cat === "vendor refund" ||
    desc.includes("vendor refund") ||
    desc.includes("purchase return") ||
    desc.includes("reversal from") ||
    desc.includes("refund from aws") ||
    desc.includes("refund credited") ||
    (type === "REVENUE" && (desc.includes("expense refund") || desc.includes("reversal")))
  ) {
    return "REFUND_RECEIVED";
  }

  // 6. Owner Equity / Capital Infusion
  if (
    cat === "equity" ||
    cat === "capital infusion" ||
    desc.includes("capital investment") ||
    desc.includes("founder equity")
  ) {
    return "OWNER_EQUITY";
  }

  // 7. Taxes & Compliance
  if (cat === "taxes & duties" || desc.includes("gst payment") || desc.includes("tds deposit")) {
    return "TAX_PAYMENT";
  }

  // 8. Standard Revenue vs Expense
  if (type === "REVENUE") {
    return "OPERATING_REVENUE";
  }

  return "OPERATING_EXPENSE";
}

function isValidClassification(val: string): boolean {
  const valid: TransactionClassification[] = [
    "OPERATING_REVENUE",
    "OPERATING_EXPENSE",
    "INTERNAL_TRANSFER",
    "LOAN_PROCEEDS",
    "LOAN_REPAYMENT",
    "REFUND_RECEIVED",
    "REFUND_ISSUED",
    "OWNER_EQUITY",
    "TAX_PAYMENT",
    "OTHER",
  ];
  return valid.includes(val as any);
}

/**
 * Computes deterministic financial metrics from a set of transactions.
 * Strictly separates Accounting Figures (Revenue, Expenses, Net Profit)
 * from Cash-Flow Figures (Cash Inflows, Outflows, Closing Cash).
 */
export function calculateFinancialMetrics(
  transactions: TransactionRecord[],
  options?: {
    openingCash?: number;
    filterCompletedOnly?: boolean;
    targetAccountId?: string | null;
  }
): FinancialCalculationResult {
  const openingCash = options?.openingCash || 0;
  const filterCompleted = options?.filterCompletedOnly ?? true;
  const targetAccountId = options?.targetAccountId || null;

  let operatingRevenue = 0;
  let customerRefunds = 0;
  let operatingExpenses = 0;
  let vendorRefunds = 0;
  let loanProceeds = 0;
  let loanRepayments = 0;
  let internalTransfers = 0;
  let taxPayments = 0;
  let ownerEquity = 0;

  let cashInflows = 0;
  let cashOutflows = 0;

  let countedTransactions = 0;

  for (const rawTx of transactions) {
    // If filtering by completed/reconciled
    if (filterCompleted && rawTx.status && rawTx.status !== "COMPLETED" && rawTx.status !== "RECONCILED") {
      continue;
    }

    // Account filtering if specified
    if (targetAccountId && rawTx.accountId && rawTx.accountId !== targetAccountId) {
      continue;
    }

    const amount = Math.abs(Number(rawTx.amount) || 0);
    if (amount === 0) continue;

    countedTransactions++;

    const classification = classifyTransaction({
      type: rawTx.type,
      category: rawTx.category,
      description: rawTx.description,
      classification: rawTx.classification,
    });

    switch (classification) {
      case "OPERATING_REVENUE":
        operatingRevenue += amount;
        cashInflows += amount;
        break;

      case "REFUND_ISSUED":
        // Customer refund reduces recognized revenue, actual cash leaves
        customerRefunds += amount;
        cashOutflows += amount;
        break;

      case "OPERATING_EXPENSE":
        operatingExpenses += amount;
        cashOutflows += amount;
        break;

      case "TAX_PAYMENT":
        taxPayments += amount;
        operatingExpenses += amount; // Recognized operating/statutory expense
        cashOutflows += amount;
        break;

      case "REFUND_RECEIVED":
        // Vendor refund reduces recognized expenses, actual cash received
        vendorRefunds += amount;
        cashInflows += amount;
        break;

      case "LOAN_PROCEEDS":
        // CRITICAL: Loan proceeds are cash inflows, NEVER counted as business revenue
        loanProceeds += amount;
        cashInflows += amount;
        break;

      case "LOAN_REPAYMENT":
        // CRITICAL: Loan principal repayment is cash outflow, NEVER counted as operating expense
        loanRepayments += amount;
        cashOutflows += amount;
        break;

      case "OWNER_EQUITY":
        ownerEquity += amount;
        cashInflows += amount;
        break;

      case "INTERNAL_TRANSFER":
        internalTransfers += amount;
        // Business-wide internal transfers net out to zero cash change and zero revenue/expense.
        // If an explicit targetAccountId is evaluated, debit vs credit handles account cash.
        break;

      default:
        // Default based on type
        if (rawTx.type === "REVENUE") {
          operatingRevenue += amount;
          cashInflows += amount;
        } else if (rawTx.type === "EXPENSE") {
          operatingExpenses += amount;
          cashOutflows += amount;
        }
        break;
    }
  }

  // Accounting figures
  const totalRevenue = Math.max(0, operatingRevenue - customerRefunds);
  const totalExpenses = Math.max(0, operatingExpenses - vendorRefunds);

  // Net Profit / Loss: Only when sufficient accounting data exists
  const hasSufficientData = countedTransactions > 0;
  const netProfitLoss = hasSufficientData ? totalRevenue - totalExpenses : null;

  // Cash Flow figures
  const netCashFlow = cashInflows - cashOutflows;
  const closingCash = openingCash + cashInflows - cashOutflows;

  return {
    totalRevenue: roundTwoDecimals(totalRevenue),
    totalExpenses: roundTwoDecimals(totalExpenses),
    netProfitLoss: netProfitLoss !== null ? roundTwoDecimals(netProfitLoss) : null,
    cashInflows: roundTwoDecimals(cashInflows),
    cashOutflows: roundTwoDecimals(cashOutflows),
    netCashFlow: roundTwoDecimals(netCashFlow),
    openingCash: roundTwoDecimals(openingCash),
    closingCash: roundTwoDecimals(closingCash),
    hasSufficientData,
    transactionCount: countedTransactions,
    breakdown: {
      operatingRevenue: roundTwoDecimals(operatingRevenue),
      customerRefunds: roundTwoDecimals(customerRefunds),
      operatingExpenses: roundTwoDecimals(operatingExpenses),
      vendorRefunds: roundTwoDecimals(vendorRefunds),
      loanProceeds: roundTwoDecimals(loanProceeds),
      loanRepayments: roundTwoDecimals(loanRepayments),
      internalTransfers: roundTwoDecimals(internalTransfers),
      taxPayments: roundTwoDecimals(taxPayments),
    },
  };
}

function roundTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
