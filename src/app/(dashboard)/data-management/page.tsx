"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  PlusCircle,
  Trash2,
  Building2,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  ShieldAlert,
  Info,
} from "lucide-react";

type SourceType = "BANK_STATEMENT" | "TALLY" | "ZOHO_BOOKS" | "GENERIC";

interface AccountOption {
  id: string;
  name: string;
  bankName?: string;
  currentBalance: number;
}

interface ColumnMappingState {
  date: string;
  description: string;
  amount: string;
  debit: string;
  credit: string;
  type: string;
  referenceNumber: string;
  accountName: string;
  category: string;
  counterparty: string;
}

export default function DataManagementPage() {
  // Step workflow state: 1 to 9
  // Step 1: Select source & account
  // Step 2: Upload file
  // Step 3: Preview uploaded transactions
  // Step 4: Map columns
  // Step 5: Validate records
  // Step 6: Display valid & invalid records
  // Step 7: Confirm import
  // Step 8: Saving... (state)
  // Step 9: Import summary & completion
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Business and accounts
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [sourceType, setSourceType] = useState<SourceType>("BANK_STATEMENT");

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Parsed file data
  const [parsedData, setParsedData] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
    fileHash: string;
    headers: string[];
    totalRows: number;
    sampleRows: Record<string, any>[];
    allRows: Record<string, any>[];
    isDuplicateFile: boolean;
    existingFileDetails: any;
  } | null>(null);

  // Column mapping state
  const [columnMapping, setColumnMapping] = useState<ColumnMappingState>({
    date: "",
    description: "",
    amount: "",
    debit: "",
    credit: "",
    type: "",
    referenceNumber: "",
    accountName: "",
    category: "",
    counterparty: "",
  });

  // Validation state
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationSummary, setValidationSummary] = useState<any>(null);
  const [activeValidationTab, setActiveValidationTab] = useState<"valid" | "invalid">("valid");

  // Import execution state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Import History
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Manual Transaction Entry Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "EXPENSE",
    category: "Cloud & Software",
    paymentMethod: "UPI",
    referenceNumber: "",
    accountId: "",
    counterparty: "",
    notes: "",
  });
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // Fetch accounts & history on mount
  useEffect(() => {
    fetchBusinessAccounts();
    fetchImportHistory();
  }, []);

  const fetchBusinessAccounts = async () => {
    try {
      const res = await fetch("/api/business");
      const json = await res.json();
      if (json.business?.accounts) {
        setAccounts(json.business.accounts);
        if (json.business.accounts.length > 0) {
          setSelectedAccountId(json.business.accounts[0].id);
          setManualForm((prev) => ({ ...prev, accountId: json.business.accounts[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  };

  const fetchImportHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/data-management/history");
      const json = await res.json();
      setHistory(json.history || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 1. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  // 2. Upload and Parse File (Step 2 -> Step 3)
  const handleUploadFile = async () => {
    if (!selectedFile) {
      setUploadError("Please select a CSV or Excel file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("source", sourceType);

      setUploadProgress(50);
      const res = await fetch("/api/data-management/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setUploadProgress(100);
      setParsedData(data);

      // Pre-fill suggested column mappings
      if (data.suggestedMapping) {
        setColumnMapping({
          date: data.suggestedMapping.date || "",
          description: data.suggestedMapping.description || "",
          amount: data.suggestedMapping.amount || "",
          debit: data.suggestedMapping.debit || "",
          credit: data.suggestedMapping.credit || "",
          type: data.suggestedMapping.type || "",
          referenceNumber: data.suggestedMapping.referenceNumber || "",
          accountName: data.suggestedMapping.accountName || "",
          category: data.suggestedMapping.category || "",
          counterparty: data.suggestedMapping.counterparty || "",
        });
      }

      setCurrentStep(3); // Advance to preview
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Run Record Validation (Step 4 -> Step 5 & 6)
  const handleValidateRecords = async () => {
    if (!parsedData) return;

    if (!columnMapping.date || !columnMapping.description) {
      setUploadError("Please map Date and Description before continuing.");
      return;
    }

    const hasAmt = Boolean(columnMapping.amount);
    const hasDrCr = Boolean(columnMapping.debit || columnMapping.credit);
    if (!hasAmt && !hasDrCr) {
      setUploadError("Please map either Amount OR Debit and Credit columns.");
      return;
    }

    try {
      setIsValidating(true);
      setUploadError(null);

      const res = await fetch("/api/data-management/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: parsedData.allRows,
          mapping: columnMapping,
          accountId: selectedAccountId,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Validation failed");
      }

      setValidationSummary(json.summary);
      setCurrentStep(6); // Show valid and invalid records
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // 4. Confirm and Save Valid Transactions (Step 7 -> Step 8 -> Step 9)
  const handleConfirmImport = async () => {
    if (!parsedData || !validationSummary || validationSummary.validCount === 0) {
      setUploadError("No valid records found to import.");
      return;
    }

    try {
      setIsImporting(true);
      setCurrentStep(8); // Saving...

      const res = await fetch("/api/data-management/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validRecords: validationSummary.validRecords,
          fileName: parsedData.fileName,
          fileType: parsedData.fileType,
          fileSize: parsedData.fileSize,
          fileHash: parsedData.fileHash,
          source: sourceType,
          accountId: selectedAccountId || null,
          invalidCount: validationSummary.invalidCount,
          totalRows: parsedData.totalRows,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to commit import to database");
      }

      setImportResult(json);
      setCurrentStep(9); // Done!
      fetchImportHistory();
    } catch (err: any) {
      setUploadError(err.message);
      setCurrentStep(6);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset workflow
  const handleResetWorkflow = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setParsedData(null);
    setValidationSummary(null);
    setImportResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete import batch
  const handleDeleteHistory = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this import batch and its imported transactions?")) {
      return;
    }

    try {
      const res = await fetch(`/api/data-management/history?id=${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchImportHistory();
      }
    } catch (err) {
      console.error("Failed to delete history:", err);
    }
  };

  // Manual Transaction Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.description || !manualForm.amount) return;

    try {
      setIsSubmittingManual(true);
      setUploadError(null);

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          source: "MANUAL",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save transaction");
      }

      setManualSuccessMsg("Transaction recorded successfully!");
      setTimeout(() => {
        setManualSuccessMsg(null);
        setIsManualModalOpen(false);
        setManualForm({
          date: new Date().toISOString().split("T")[0],
          description: "",
          amount: "",
          type: "EXPENSE",
          category: "Cloud & Software",
          paymentMethod: "UPI",
          referenceNumber: "",
          accountId: accounts[0]?.id || "",
          counterparty: "",
          notes: "",
        });
      }, 1200);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
              <Database className="h-5 w-5 text-sky-600" />
              Financial Data Management & Ingestion
            </h1>
            <Badge variant="sky" className="font-bold text-[10px]">
              STAGE 2 ENGINE
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Import statements from Indian banks, Tally Prime, and Zoho Books with automated mapping, validation, and deterministic metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="sky" size="sm" onClick={() => setIsManualModalOpen(true)} className="shadow-sm shadow-sky-500/20 font-semibold">
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Manual Entry
          </Button>

          <Link href="/transactions">
            <Button variant="glass" size="sm" className="font-semibold">
              <Layers className="h-4 w-4 mr-1.5 text-sky-600" />
              View Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* Downloadable CSV Templates Card */}
      <Card className="border-slate-200/90 bg-white/90 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Sample Ingestion Templates</h4>
              <p className="text-[11px] text-slate-500">
                Pre-formatted CSV templates ready to test with HDFC bank statements, Tally Prime vouchers, or Zoho Books.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a href="/api/data-management/templates?type=bank" download>
              <Button variant="glass-sky" size="sm" className="text-xs">
                HDFC Statement CSV
              </Button>
            </a>
            <a href="/api/data-management/templates?type=tally" download>
              <Button variant="glass-sky" size="sm" className="text-xs">
                Tally Prime CSV
              </Button>
            </a>
            <a href="/api/data-management/templates?type=zoho" download>
              <Button variant="glass-sky" size="sm" className="text-xs">
                Zoho Books CSV
              </Button>
            </a>
            <a href="/api/data-management/templates?type=generic" download>
              <Button variant="glass-sky" size="sm" className="text-xs">
                FinOS Standard CSV
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Global Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-xl border border-red-800/80 bg-red-950/40 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-red-300">Validation / Upload Error</h4>
            <p className="text-xs text-red-200/90 mt-0.5">{uploadError}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setUploadError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Step Progress Indicator */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-navy-900/80 shadow-fin-card">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
          <span>Workflow Progress</span>
          <span className="text-finteal-400 font-mono">
            {currentStep === 9
              ? "Completed"
              : `Step ${currentStep} of 7: ${
                  [
                    "Select Source",
                    "Upload File",
                    "Preview File",
                    "Map Columns",
                    "Validating...",
                    "Verify Records",
                    "Confirm Import",
                    "Saving to Ledger",
                    "Import Complete",
                  ][currentStep - 1]
                }`}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-finteal-400 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, (currentStep / 7) * 100)}%` }}
          />
        </div>
      </div>

      {/* WORKFLOW STEPS CONTAINER */}
      <Card className="border-slate-800">
        <CardContent className="p-6">
          {/* STEP 1: Select Financial Data Source & Target Bank Account */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Step 1: Select Financial Data Source
                </h3>
                <p className="text-xs text-slate-400">
                  Choose the source system for your financial data. FinOS adapts header auto-detection and data normalization according to the source platform.
                </p>
              </div>

              {/* Source Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    id: "BANK_STATEMENT",
                    title: "Bank Statement",
                    desc: "HDFC, ICICI, SBI, Axis CSV or Excel statement exports",
                    badge: "Direct Feeds",
                  },
                  {
                    id: "TALLY",
                    title: "Tally Prime ERP",
                    desc: "Voucher register and ledger journal CSV/Excel exports",
                    badge: "ERP Ingestion",
                  },
                  {
                    id: "ZOHO_BOOKS",
                    title: "Zoho Books",
                    desc: "Account transactions, sales & purchase journal reports",
                    badge: "Cloud Accounting",
                  },
                  {
                    id: "GENERIC",
                    title: "Standard CSV/Excel",
                    desc: "Custom spreadsheet with Date, Amount, Narration fields",
                    badge: "Universal",
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSourceType(s.id as SourceType)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      sourceType === s.id
                        ? "bg-finteal-950/40 border-finteal-500 ring-1 ring-finteal-500/50 shadow-fin-glow"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-finteal-400">
                        {s.badge}
                      </span>
                      {sourceType === s.id && (
                        <CheckCircle2 className="h-4 w-4 text-finteal-400" />
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{s.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* Target Financial Account Selection */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Financial Account in FinOS
                </label>
                <p className="text-[11px] text-slate-400">
                  Select which bank account or ledger in FinOS will be updated with these imported transactions.
                </p>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-finteal-400"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Balance: {formatINR(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="teal" onClick={() => setCurrentStep(2)}>
                  Proceed to Upload
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Upload CSV / Excel File */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Step 2: Upload Financial File
                  </h3>
                  <p className="text-xs text-slate-400">
                    Supports .CSV, .XLSX, and .XLS files up to 15 MB.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-finteal-400/70 bg-navy-950/60 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-slate-900/40"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="h-14 w-14 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-finteal-400" />
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">
                  {selectedFile ? selectedFile.name : "Click to select or drag & drop file"}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                    : "CSV or Microsoft Excel (.xlsx, .xls)"}
                </p>
              </div>

              {/* Uploading progress indicator */}
              {isUploading && (
                <div className="space-y-2 p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-finteal-400" />
                      Parsing statement headers and transactions...
                    </span>
                    <span className="font-mono text-finteal-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-finteal-400 h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Source
                </Button>
                <Button
                  variant="teal"
                  onClick={handleUploadFile}
                  disabled={!selectedFile || isUploading}
                >
                  Upload & Preview File
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview Uploaded Transactions */}
          {currentStep === 3 && parsedData && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Step 3: Preview Uploaded File
                  </h3>
                  <p className="text-xs text-slate-400">
                    File: <span className="text-white font-mono">{parsedData.fileName}</span> (
                    {(parsedData.fileSize / 1024).toFixed(1)} KB, {parsedData.totalRows} rows
                    detected)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Re-upload
                  </Button>
                  <Button variant="teal" size="sm" onClick={() => setCurrentStep(4)}>
                    Map Columns
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Duplicate File Alert Warning */}
              {parsedData.isDuplicateFile && (
                <div className="p-4 rounded-xl border border-amber-800/80 bg-amber-950/40 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">
                      Duplicate File Check Warning
                    </h4>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      A file with the identical cryptographic SHA-256 checksum (
                      <span className="font-mono text-[10px]">
                        {parsedData.fileHash.slice(0, 16)}...
                      </span>
                      ) was previously imported on{" "}
                      {parsedData.existingFileDetails?.uploadedAt
                        ? formatDate(parsedData.existingFileDetails.uploadedAt)
                        : "an earlier date"}
                      . You may still proceed if this is a recurring statement or intentional re-import.
                    </p>
                  </div>
                </div>
              )}

              {/* Sample Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40 max-h-80">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      {parsedData.headers.map((h, i) => (
                        <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
                    {parsedData.sampleRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        {parsedData.headers.map((h, hi) => (
                          <td key={hi} className="py-2 px-3 whitespace-nowrap text-slate-200">
                            {row[h] !== undefined && row[h] !== null ? String(row[h]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Showing first {parsedData.sampleRows.length} of {parsedData.totalRows} records.
              </p>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button variant="teal" onClick={() => setCurrentStep(4)}>
                  Continue to Column Mapping
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Column Mapping */}
          {currentStep === 4 && parsedData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Step 4: Map Columns</h3>
                <p className="text-xs text-slate-400">
                  FinOS automatically suggested column associations below. Review and adjust any mappings to match your file structure.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Date */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Transaction Date *</span>
                    <Badge variant="teal" className="text-[9px]">
                      Required
                    </Badge>
                  </label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Description */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Narration / Description *</span>
                    <Badge variant="teal" className="text-[9px]">
                      Required
                    </Badge>
                  </label>
                  <select
                    value={columnMapping.description}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Debit */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Debit / Withdrawal</span>
                    <span className="text-[10px] text-slate-400">Dr Column</span>
                  </label>
                  <select
                    value={columnMapping.debit}
                    onChange={(e) => setColumnMapping({ ...columnMapping, debit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- None / Use Amount --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Credit */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Credit / Deposit</span>
                    <span className="text-[10px] text-slate-400">Cr Column</span>
                  </label>
                  <select
                    value={columnMapping.credit}
                    onChange={(e) => setColumnMapping({ ...columnMapping, credit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- None / Use Amount --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Amount */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Single Amount Column</span>
                    <span className="text-[10px] text-slate-400">If no Dr/Cr</span>
                  </label>
                  <select
                    value={columnMapping.amount}
                    onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- None / Use Dr & Cr --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Transaction Type */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Transaction Type</span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <select
                    value={columnMapping.type}
                    onChange={(e) => setColumnMapping({ ...columnMapping, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- Auto-detect from amounts --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Reference Number */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>UTR / Cheque / Ref No</span>
                    <span className="text-[10px] text-slate-400">Duplicate Check</span>
                  </label>
                  <select
                    value={columnMapping.referenceNumber}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, referenceNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- Optional --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. Category */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Category / Ledger</span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <select
                    value={columnMapping.category}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- Smart Auto-categorization --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 9. Counterparty */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Party / Beneficiary</span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </label>
                  <select
                    value={columnMapping.counterparty}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, counterparty: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-finteal-400"
                  >
                    <option value="">-- Optional --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Preview
                </Button>
                <Button variant="teal" onClick={handleValidateRecords} disabled={isValidating}>
                  {isValidating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                      Validating Records...
                    </>
                  ) : (
                    <>
                      Validate Records
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 6: Display Valid and Invalid Records */}
          {currentStep === 6 && validationSummary && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Step 6: Data Validation Summary
                </h3>
                <p className="text-xs text-slate-400">
                  Review verified records and examine validation errors before confirming import.
                </p>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Rows</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {validationSummary.totalRows}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-900/50 bg-emerald-950/20">
                  <p className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Valid Records
                  </p>
                  <p className="text-lg font-bold text-emerald-300 mt-1">
                    {validationSummary.validCount}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-red-900/50 bg-red-950/20">
                  <p className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Invalid / Rejected
                  </p>
                  <p className="text-lg font-bold text-red-300 mt-1">
                    {validationSummary.invalidCount}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-900/50 bg-amber-950/20">
                  <p className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Suspected Duplicates
                  </p>
                  <p className="text-lg font-bold text-amber-300 mt-1">
                    {validationSummary.duplicateCount}
                  </p>
                </div>
              </div>

              {/* Total Inflow vs Outflow to be imported */}
              <div className="p-4 rounded-xl border border-slate-800 bg-navy-950/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">
                      Total Inflows (Credits)
                    </span>
                    <p className="text-sm font-bold text-emerald-400">
                      {formatINR(validationSummary.totalCredits)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">
                      Total Outflows (Debits)
                    </span>
                    <p className="text-sm font-bold text-rose-400">
                      {formatINR(validationSummary.totalDebits)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold">
                    Target FinOS Account
                  </span>
                  <p className="text-xs font-bold text-white">
                    {accounts.find((a) => a.id === selectedAccountId)?.name || "Default Account"}
                  </p>
                </div>
              </div>

              {/* Tabs: Valid Records vs Invalid Records */}
              <div className="space-y-3">
                <div className="flex border-b border-slate-800 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveValidationTab("valid")}
                    className={`pb-2 text-xs font-semibold transition-colors relative ${
                      activeValidationTab === "valid"
                        ? "text-emerald-400 border-b-2 border-emerald-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Valid Records ({validationSummary.validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveValidationTab("invalid")}
                    className={`pb-2 text-xs font-semibold transition-colors relative ${
                      activeValidationTab === "invalid"
                        ? "text-red-400 border-b-2 border-red-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Invalid / Rejected Records ({validationSummary.invalidCount})
                  </button>
                </div>

                {/* Valid Records Table */}
                {activeValidationTab === "valid" && (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40 max-h-72">
                    {validationSummary.validRecords.length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-400">
                        No valid records found in this file. Please check mapping and file format.
                      </p>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/90 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Row</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3">Ref No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
                          {validationSummary.validRecords.slice(0, 25).map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-800/20">
                              <td className="py-2 px-3 text-slate-500">{r.rowIndex}</td>
                              <td className="py-2 px-3 text-slate-300">{r.dateString}</td>
                              <td className="py-2 px-3 text-slate-200 max-w-xs truncate">
                                {r.description}
                              </td>
                              <td className="py-2 px-3">
                                <Badge
                                  variant={r.type === "REVENUE" ? "success" : "destructive"}
                                  className="text-[9px]"
                                >
                                  {r.type}
                                </Badge>
                              </td>
                              <td
                                className={`py-2 px-3 font-semibold ${
                                  r.type === "REVENUE" ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {formatINR(r.amount)}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{r.category}</td>
                              <td className="py-2 px-3 text-slate-400">{r.referenceNumber || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Invalid Records Table with Errors */}
                {activeValidationTab === "invalid" && (
                  <div className="overflow-x-auto rounded-xl border border-red-900/50 bg-red-950/10 max-h-72">
                    {validationSummary.invalidRecords.length === 0 ? (
                      <p className="p-6 text-center text-xs text-emerald-400">
                        Zero invalid records! All records in this file passed validation.
                      </p>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-red-950/50 text-red-300 font-semibold sticky top-0 border-b border-red-900/50">
                          <tr>
                            <th className="py-2 px-3">Row</th>
                            <th className="py-2 px-3">Validation Errors</th>
                            <th className="py-2 px-3">Raw Row Content</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-950/40 font-mono text-[11px]">
                          {validationSummary.invalidRecords.map((ir: any, i: number) => (
                            <tr key={i} className="hover:bg-red-950/20">
                              <td className="py-2 px-3 text-red-400 font-bold">{ir.rowIndex}</td>
                              <td className="py-2 px-3 text-red-200">
                                <ul className="list-disc list-inside space-y-0.5">
                                  {ir.errors.map((e: string, ei: number) => (
                                    <li key={ei}>{e}</li>
                                  ))}
                                </ul>
                              </td>
                              <td className="py-2 px-3 text-slate-400 max-w-sm truncate text-[10px]">
                                {JSON.stringify(ir.data)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation & Confirmation Buttons */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Adjust Mapping
                </Button>

                <Button
                  variant="teal"
                  onClick={handleConfirmImport}
                  disabled={validationSummary.validCount === 0 || isImporting}
                >
                  Confirm & Import ({validationSummary.validCount} Records)
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 8: Saving In Progress */}
          {currentStep === 8 && (
            <div className="p-12 text-center space-y-4">
              <RefreshCw className="h-10 w-10 text-finteal-400 animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-white">Saving Transactions to SQLite</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Persisting records to the database ledger, updating account balances, and recording audit logs...
              </p>
            </div>
          )}

          {/* STEP 9: Import Complete Summary */}
          {currentStep === 9 && importResult && (
            <div className="p-8 text-center space-y-6 max-w-xl mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Financial Import Successful!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Transactions have been saved to your ledger and all financial metrics and dashboard charts have refreshed automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Imported Count</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">
                    {importResult.importedCount} transactions
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Credits</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {formatINR(importResult.totalCredits)}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Debits</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {formatINR(importResult.totalDebits)}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Skipped Invalid</span>
                  <p className="text-base font-bold text-amber-400 mt-0.5">
                    {importResult.invalidCount || 0} rows
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" onClick={handleResetWorkflow}>
                  Import Another File
                </Button>
                <Link href="/">
                  <Button variant="teal">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/transactions">
                  <Button variant="secondary">
                    View in Ledger
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IMPORT HISTORY TABLE */}
      <Card className="border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              File Ingestion History
            </CardTitle>
            <CardDescription>
              Audit record of uploaded bank feeds, Tally imports, and file metadata
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchImportHistory} disabled={loadingHistory}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingHistory ? "animate-spin" : ""}`} />
            Refresh History
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">File Name</th>
                  <th className="py-2.5 px-4 font-semibold">Source</th>
                  <th className="py-2.5 px-4 font-semibold">Target Account</th>
                  <th className="py-2.5 px-4 font-semibold">Imported / Total</th>
                  <th className="py-2.5 px-4 font-semibold">File Size</th>
                  <th className="py-2.5 px-4 font-semibold">Uploaded Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                      No files imported yet. Use the upload workflow above to import bank statements or accounting CSVs.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-finteal-400" />
                        {item.fileName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <Badge variant="outline" className="text-[10px]">
                          {item.source}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{item.accountName}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="text-emerald-400 font-semibold">{item.validCount}</span> /{" "}
                        {item.rowCount}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {(item.fileSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {formatDate(item.uploadedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHistory(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MANUAL TRANSACTION ENTRY MODAL */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Manual Financial Transaction Entry"
        description="Add a verified accounting transaction with strict double-entry classification into SQLite."
      >
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          {manualSuccessMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {manualSuccessMsg}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Transaction Type *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setManualForm({ ...manualForm, type: "REVENUE" })}
                className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                  manualForm.type === "REVENUE"
                    ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                + Revenue (Inflow)
              </button>
              <button
                type="button"
                onClick={() => setManualForm({ ...manualForm, type: "EXPENSE" })}
                className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                  manualForm.type === "EXPENSE"
                    ? "bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                - Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setManualForm({ ...manualForm, type: "TRANSFER" })}
                className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                  manualForm.type === "TRANSFER"
                    ? "bg-blue-950/80 border-blue-500 text-blue-300 shadow-sm"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                ↔ Inter-Account Transfer
              </button>
            </div>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Date *</label>
              <input
                type="date"
                required
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Amount (₹ INR) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 50000.00"
                value={manualForm.amount}
                onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono text-xs font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Narration / Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Consulting Revenue from Acme Corp or Server Hosting Bill"
              value={manualForm.description}
              onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={manualForm.category}
                onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
              >
                <option value="Sales & Services">Sales & Services</option>
                <option value="Payroll & Salaries">Payroll & Salaries</option>
                <option value="Cloud & Software">Cloud & Software</option>
                <option value="Office Rent">Office Rent</option>
                <option value="Marketing & Growth">Marketing & Growth</option>
                <option value="Legal & Accounting">Legal & Accounting</option>
                <option value="Logistics">Logistics</option>
                <option value="Taxes & Duties">Taxes & Duties</option>
                <option value="Loans & Borrowings">Loans & Borrowings</option>
                <option value="Internal Transfer">Internal Transfer</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
              <select
                value={manualForm.paymentMethod}
                onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
              >
                <option value="UPI">UPI (Instant)</option>
                <option value="NEFT">NEFT Batch</option>
                <option value="RTGS">RTGS Real-Time</option>
                <option value="IMPS">IMPS Immediate</option>
                <option value="CREDIT_CARD">Corporate Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NETBANKING">Corporate Net Banking</option>
                <option value="CASH">Petty Cash</option>
              </select>
            </div>
          </div>

          {/* Account & Counterparty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank / Cash Account</label>
              <select
                value={manualForm.accountId}
                onChange={(e) => setManualForm({ ...manualForm, accountId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Counterparty / Party</label>
              <input
                type="text"
                placeholder="e.g. AWS EMEA SARL or Infosys Ltd"
                value={manualForm.counterparty}
                onChange={(e) => setManualForm({ ...manualForm, counterparty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
              />
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Reference Number / UTR</label>
              <input
                type="text"
                placeholder="e.g. UTR-89410283 or INV-2024-001"
                value={manualForm.referenceNumber}
                onChange={(e) => setManualForm({ ...manualForm, referenceNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-mono font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Internal Notes</label>
              <input
                type="text"
                placeholder="Optional audit memo"
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="white"
              size="sm"
              onClick={() => setIsManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="sky" size="sm" disabled={isSubmittingManual}>
              {isSubmittingManual ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Transaction"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
