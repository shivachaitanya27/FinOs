/**
 * FinOS Data Importer & Validation Engine
 * Handles CSV, XLSX, XLS parsing, column auto-mapping, multi-format date/amount normalization,
 * financial integrity validation, and duplicate detection.
 */

import * as XLSX from "xlsx";
import crypto from "crypto";

export type FinancialSourceType =
  | "BANK_STATEMENT"
  | "TALLY"
  | "ZOHO_BOOKS"
  | "GENERIC";

export interface ColumnMapping {
  date: string;
  description: string;
  amount?: string;
  debit?: string;
  credit?: string;
  type?: string;
  referenceNumber?: string;
  accountName?: string;
  category?: string;
  counterparty?: string;
}

export interface RawParsedRow {
  rowIndex: number;
  data: Record<string, any>;
}

export interface ValidatedTransaction {
  rowIndex: number;
  date: Date;
  dateString: string;
  description: string;
  amount: number;
  type: "REVENUE" | "EXPENSE" | "TRANSFER";
  category: string;
  classification: string;
  referenceNumber?: string;
  accountName?: string;
  counterparty?: string;
  paymentMethod?: string;
  notes?: string;
  isDuplicateSuspect?: boolean;
}

export interface InvalidTransaction {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
}

export interface ParseResult {
  headers: string[];
  totalRows: number;
  sampleRows: Record<string, any>[];
  allRows: Record<string, any>[];
  fileHash: string;
  suggestedMapping: ColumnMapping;
}

export interface ValidationSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validRecords: ValidatedTransaction[];
  invalidRecords: InvalidTransaction[];
  duplicateCount: number;
  totalDebits: number;
  totalCredits: number;
}

/**
 * Standard column dictionary for smart automatic mapping
 */
const COLUMN_SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  date: [
    "date",
    "txn date",
    "txndate",
    "transaction date",
    "value date",
    "booking date",
    "posted date",
    "vch date",
  ],
  description: [
    "narration",
    "description",
    "particulars",
    "details",
    "transaction details",
    "memo",
    "remark",
    "remarks",
    "trans details",
    "payee",
  ],
  amount: [
    "amount",
    "net amount",
    "transaction amount",
    "total",
    "amt",
    "sum",
  ],
  debit: [
    "debit",
    "dr",
    "withdrawal",
    "withdrawals",
    "withdrawal amt",
    "debit amount",
    "dr amount",
    "paid out",
    "spent",
  ],
  credit: [
    "credit",
    "cr",
    "deposit",
    "deposits",
    "deposit amt",
    "credit amount",
    "cr amount",
    "paid in",
    "received",
  ],
  type: [
    "type",
    "transaction type",
    "txn type",
    "vch type",
    "dr/cr",
    "cr/dr",
    "entry type",
  ],
  referenceNumber: [
    "chq/ref no",
    "chq/ref.no.",
    "cheque no",
    "ref no",
    "reference no",
    "reference number",
    "utr",
    "vch no",
    "voucher no",
    "txn id",
    "transaction id",
    "reference",
    "invoice no",
  ],
  accountName: [
    "account",
    "account name",
    "bank account",
    "bank",
    "ledger",
    "account no",
  ],
  category: [
    "category",
    "expense category",
    "head of account",
    "ledger name",
    "account category",
    "cost center",
  ],
  counterparty: [
    "party name",
    "counterparty",
    "vendor",
    "customer",
    "client",
    "beneficiary",
    "entity",
  ],
};

/**
 * Compute SHA-256 hash of a buffer
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Parse an uploaded file buffer (CSV, XLSX, XLS) into header list and tabular rows.
 */
export function parseUploadedFile(
  buffer: Buffer,
  fileName: string,
  sourceHint?: FinancialSourceType
): ParseResult {
  const fileHash = computeFileHash(buffer);

  // Read workbook using SheetJS
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("The uploaded file does not contain any readable sheets.");
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with raw values
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error("The uploaded file is empty or contains no transaction rows.");
  }

  // Extract cleaned headers from first row keys
  const headers = Object.keys(rawRows[0]).map((h) => h.trim());

  // Auto-detect mapping
  const suggestedMapping = suggestColumnMapping(headers, sourceHint);

  return {
    headers,
    totalRows: rawRows.length,
    sampleRows: rawRows.slice(0, 10),
    allRows: rawRows,
    fileHash,
    suggestedMapping,
  };
}

/**
 * Auto-suggest column mappings based on header text matching
 */
export function suggestColumnMapping(
  headers: string[],
  source?: FinancialSourceType
): ColumnMapping {
  const mapping: Partial<ColumnMapping> = {};

  const cleanHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

  const normalizedHeaders = headers.map((h) => ({
    original: h,
    cleaned: cleanHeader(h),
  }));

  for (const [key, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    const matched = normalizedHeaders.find((nh) =>
      synonyms.some((syn) => {
        const cleanSyn = cleanHeader(syn);
        return nh.cleaned === cleanSyn || nh.cleaned.includes(cleanSyn);
      })
    );

    if (matched) {
      (mapping as any)[key] = matched.original;
    }
  }

  // Source-specific defaults
  if (source === "TALLY") {
    if (!mapping.description && headers.find((h) => /particulars/i.test(h))) {
      mapping.description = headers.find((h) => /particulars/i.test(h));
    }
    if (!mapping.referenceNumber && headers.find((h) => /vch\s*no/i.test(h))) {
      mapping.referenceNumber = headers.find((h) => /vch\s*no/i.test(h));
    }
  }

  return {
    date: mapping.date || "",
    description: mapping.description || "",
    amount: mapping.amount || "",
    debit: mapping.debit || "",
    credit: mapping.credit || "",
    type: mapping.type || "",
    referenceNumber: mapping.referenceNumber || "",
    accountName: mapping.accountName || "",
    category: mapping.category || "",
    counterparty: mapping.counterparty || "",
  };
}

/**
 * Parse string or number into valid Date object.
 * Supports Indian DD/MM/YYYY, ISO YYYY-MM-DD, DD-MMM-YYYY, Excel serials.
 */
export function parseDate(val: any): { date: Date | null; error?: string } {
  if (val === undefined || val === null || String(val).trim() === "") {
    return { date: null, error: "Date value is empty" };
  }

  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return { date: val };
    }
    return { date: null, error: "Invalid Date object" };
  }

  const str = String(val).trim();

  // Excel serial number (e.g. 45212)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const utcDays = serial - 25569;
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return { date };
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY (Very common in India/Tally/HDFC)
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day, 12, 0, 0);
      if (d.getDate() === day) {
        return { date: d };
      }
    }
    return { date: null, error: `Invalid calendar date: "${str}"` };
  }

  // YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day, 12, 0, 0);
      if (d.getDate() === day) {
        return { date: d };
      }
    }
    return { date: null, error: `Invalid calendar date: "${str}"` };
  }

  // DD-MMM-YYYY (e.g. 15-Jan-2024, 01-Oct-2024)
  const ddmmmyyyy = str.match(/^(\d{1,2})[\/\-\s]([A-Za-z]{3})[\/\-\s](\d{4})$/);
  if (ddmmmyyyy) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return { date: parsed };
    }
  }

  // Fallback native Date parse
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return { date: fallback };
  }

  return { date: null, error: `Unrecognized or invalid date format: "${str}"` };
}

/**
 * Clean currency string, strip commas, currency symbols, and convert to numeric float.
 */
export function parseCurrencyAmount(val: any): { amount: number; isNegative: boolean } {
  if (val === undefined || val === null) {
    return { amount: 0, isNegative: false };
  }

  if (typeof val === "number") {
    return {
      amount: Math.abs(val),
      isNegative: val < 0,
    };
  }

  let str = String(val).trim();
  if (str === "" || str === "-" || str === "--") {
    return { amount: 0, isNegative: false };
  }

  let isNegative = false;
  // Parentheses check: (5000) = -5000
  if (str.startsWith("(") && str.endsWith(")")) {
    isNegative = true;
    str = str.slice(1, -1);
  } else if (str.startsWith("-")) {
    isNegative = true;
    str = str.slice(1);
  } else if (/cr$/i.test(str)) {
    // Credit flag
    str = str.replace(/cr$/i, "").trim();
  } else if (/dr$/i.test(str)) {
    // Debit flag
    isNegative = true;
    str = str.replace(/dr$/i, "").trim();
  }

  // Remove currency symbols (₹, $, INR), commas, and spaces
  const cleaned = str.replace(/[₹$€£\s,A-Za-z]/g, "");
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return { amount: 0, isNegative: false };
  }

  return { amount: num, isNegative };
}

/**
 * Validate every row against mapping and business accounting rules.
 */
export function validateRecords(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  existingReferenceNumbers: Set<string> = new Set()
): ValidationSummary {
  const validRecords: ValidatedTransaction[] = [];
  const invalidRecords: InvalidTransaction[] = [];

  let duplicateCount = 0;
  let totalDebits = 0;
  let totalCredits = 0;

  rows.forEach((row, idx) => {
    const rowIndex = idx + 1;
    const errors: string[] = [];

    // 1. Date validation
    if (!mapping.date || !row[mapping.date]) {
      errors.push(`Missing Date column value at row ${rowIndex}`);
    }

    const { date, error: dateError } = parseDate(row[mapping.date]);
    if (!date) {
      errors.push(dateError || `Invalid date format at row ${rowIndex}`);
    }

    // 2. Description validation
    const description = mapping.description ? String(row[mapping.description] || "").trim() : "";
    if (!description) {
      errors.push(`Missing transaction description/narration at row ${rowIndex}`);
    }

    // 3. Amount, Debit, and Credit extraction
    let finalAmount = 0;
    let finalType: "REVENUE" | "EXPENSE" | "TRANSFER" = "EXPENSE";

    const hasDebitCol = Boolean(mapping.debit && mapping.debit in row);
    const hasCreditCol = Boolean(mapping.credit && mapping.credit in row);
    const hasAmountCol = Boolean(mapping.amount && mapping.amount in row);

    if (hasDebitCol || hasCreditCol) {
      const debitParsed = hasDebitCol ? parseCurrencyAmount(row[mapping.debit!]) : { amount: 0, isNegative: false };
      const creditParsed = hasCreditCol ? parseCurrencyAmount(row[mapping.credit!]) : { amount: 0, isNegative: false };

      if (debitParsed.amount > 0 && creditParsed.amount === 0) {
        finalAmount = debitParsed.amount;
        finalType = "EXPENSE";
        totalDebits += finalAmount;
      } else if (creditParsed.amount > 0 && debitParsed.amount === 0) {
        finalAmount = creditParsed.amount;
        finalType = "REVENUE";
        totalCredits += finalAmount;
      } else if (debitParsed.amount > 0 && creditParsed.amount > 0) {
        errors.push(`Row ${rowIndex} has both Debit (${debitParsed.amount}) and Credit (${creditParsed.amount}) populated.`);
      } else {
        // Both 0 or empty
        errors.push(`Row ${rowIndex} has neither Debit nor Credit amount.`);
      }
    } else if (hasAmountCol) {
      const amountParsed = parseCurrencyAmount(row[mapping.amount!]);
      if (amountParsed.amount <= 0) {
        errors.push(`Row ${rowIndex} has zero or non-numeric amount value "${row[mapping.amount!]}".`);
      } else {
        finalAmount = amountParsed.amount;

        // Determine type
        if (mapping.type && row[mapping.type]) {
          const typeStr = String(row[mapping.type]).toUpperCase();
          if (typeStr.includes("CR") || typeStr.includes("REV") || typeStr.includes("INFLOW") || typeStr.includes("DEP")) {
            finalType = "REVENUE";
            totalCredits += finalAmount;
          } else if (typeStr.includes("TRANS") || typeStr.includes("CONTRA")) {
            finalType = "TRANSFER";
          } else {
            finalType = "EXPENSE";
            totalDebits += finalAmount;
          }
        } else if (amountParsed.isNegative) {
          finalType = "EXPENSE";
          totalDebits += finalAmount;
        } else {
          finalType = "REVENUE";
          totalCredits += finalAmount;
        }
      }
    } else {
      errors.push("No Amount or Debit/Credit columns mapped.");
    }

    // 4. Reference Number & Duplicate check
    const refNum = mapping.referenceNumber && row[mapping.referenceNumber]
      ? String(row[mapping.referenceNumber]).trim()
      : undefined;

    let isDuplicateSuspect = false;
    if (refNum && existingReferenceNumbers.has(refNum)) {
      isDuplicateSuspect = true;
      duplicateCount++;
    }

    // 5. Category auto-assignment
    let category = "Miscellaneous";
    if (mapping.category && row[mapping.category]) {
      category = String(row[mapping.category]).trim();
    } else {
      category = deduceCategoryFromDescription(description, finalType);
    }

    // 6. Classification deduction
    const classification = deduceClassification(description, finalType, category);

    if (errors.length > 0) {
      invalidRecords.push({
        rowIndex,
        data: row,
        errors,
      });
    } else if (date) {
      validRecords.push({
        rowIndex,
        date,
        dateString: date.toISOString().split("T")[0],
        description,
        amount: finalAmount,
        type: finalType,
        category,
        classification,
        referenceNumber: refNum,
        accountName: mapping.accountName ? String(row[mapping.accountName] || "").trim() : undefined,
        counterparty: mapping.counterparty ? String(row[mapping.counterparty] || "").trim() : undefined,
        notes: `Imported record from row ${rowIndex}`,
        isDuplicateSuspect,
      });
    }
  });

  return {
    totalRows: rows.length,
    validCount: validRecords.length,
    invalidCount: invalidRecords.length,
    validRecords,
    invalidRecords,
    duplicateCount,
    totalDebits: Math.round(totalDebits * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
  };
}

/**
 * Smart Category inferrer for un-categorized bank narration strings
 */
function deduceCategoryFromDescription(
  desc: string,
  type: "REVENUE" | "EXPENSE" | "TRANSFER"
): string {
  const d = desc.toLowerCase();

  if (type === "REVENUE") {
    if (d.includes("interest") || d.includes("int.pd")) return "Interest Income";
    if (d.includes("dividend")) return "Dividend Income";
    if (d.includes("refund")) return "Vendor Refund";
    return "Sales & Services";
  }

  if (type === "TRANSFER") {
    return "Internal Transfer";
  }

  if (d.includes("salary") || d.includes("payroll") || d.includes("wages") || d.includes("bonus")) {
    return "Payroll & Salaries";
  }
  if (d.includes("aws") || d.includes("google cloud") || d.includes("microsoft") || d.includes("github") || d.includes("software")) {
    return "Cloud & Software";
  }
  if (d.includes("rent") || d.includes("lease") || d.includes("maintenance")) {
    return "Office Rent";
  }
  if (d.includes("google ads") || d.includes("facebook") || d.includes("meta") || d.includes("marketing") || d.includes("campaign")) {
    return "Marketing & Growth";
  }
  if (d.includes("audit") || d.includes("legal") || d.includes("ca ") || d.includes("advocate")) {
    return "Legal & Accounting";
  }
  if (d.includes("bluedart") || d.includes("delhivery") || d.includes("logistics") || d.includes("courier")) {
    return "Logistics";
  }
  if (d.includes("gst") || d.includes("tax") || d.includes("tds") || d.includes("challan")) {
    return "Taxes & Duties";
  }

  return "Miscellaneous";
}

/**
 * Smart classification deduction helper
 */
function deduceClassification(
  desc: string,
  type: "REVENUE" | "EXPENSE" | "TRANSFER",
  category: string
): string {
  const d = desc.toLowerCase();
  const c = category.toLowerCase();

  if (type === "TRANSFER" || c.includes("transfer") || d.includes("self transfer") || /\bcontra\b/i.test(d)) {
    return "INTERNAL_TRANSFER";
  }
  if (d.includes("loan disbursement") || d.includes("term loan credit")) {
    return "LOAN_PROCEEDS";
  }
  if (d.includes("loan repayment") || d.includes("loan emi principal")) {
    return "LOAN_REPAYMENT";
  }
  if (d.includes("customer refund") || d.includes("sales return")) {
    return "REFUND_ISSUED";
  }
  if (d.includes("vendor refund") || d.includes("purchase return") || d.includes("reversal from")) {
    return "REFUND_RECEIVED";
  }
  if (type === "REVENUE") {
    return "OPERATING_REVENUE";
  }
  return "OPERATING_EXPENSE";
}
