"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Scale,
  Banknote,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type ReportType =
  | "DAILY_SUMMARY"
  | "WEEKLY_SUMMARY"
  | "MONTHLY_SUMMARY"
  | "PROFIT_LOSS"
  | "CASH_FLOW"
  | "EXPENSE_ANALYSIS"
  | "REVENUE_ANALYSIS"
  | "BANK_RECONCILIATION"
  | "FINANCIAL_RISK";

interface ReportCatalogItem {
  type: ReportType;
  title: string;
  category: "Executive" | "Financial Statements" | "Operational" | "Risk & Compliance";
  description: string;
  icon: any;
}

const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    type: "MONTHLY_SUMMARY",
    title: "Monthly Financial Summary",
    category: "Executive",
    description: "Consolidated performance, operational burn rate, and profit margins.",
    icon: BarChart3,
  },
  {
    type: "DAILY_SUMMARY",
    title: "Daily Financial Summary",
    category: "Operational",
    description: "Daily inflows, disbursements, transaction volume, and closing liquidity.",
    icon: Clock,
  },
  {
    type: "WEEKLY_SUMMARY",
    title: "Weekly Financial Summary",
    category: "Operational",
    description: "7-day rolling cash velocity, weekday distribution, and expense drivers.",
    icon: Calendar,
  },
  {
    type: "PROFIT_LOSS",
    title: "Profit & Loss (Schedule III)",
    category: "Financial Statements",
    description: "Standard Indian Schedule III statement with EBITDA and tax provisions.",
    icon: FileSpreadsheet,
  },
  {
    type: "CASH_FLOW",
    title: "Cash Flow Report (Ind AS 7)",
    category: "Financial Statements",
    description: "Operating, investing, and financing cash activities with opening/closing balances.",
    icon: Banknote,
  },
  {
    type: "EXPENSE_ANALYSIS",
    title: "Expense Analysis Report",
    category: "Operational",
    description: "Departmental expenditure breakdown, average ticket size, and largest payouts.",
    icon: TrendingDown,
  },
  {
    type: "REVENUE_ANALYSIS",
    title: "Revenue Analysis Report",
    category: "Operational",
    description: "Customer realization, top paying clients, and billing streams.",
    icon: TrendingUp,
  },
  {
    type: "BANK_RECONCILIATION",
    title: "Bank Reconciliation (BRS)",
    category: "Risk & Compliance",
    description: "Bank statement vs general ledger comparison, timing differences, and matches.",
    icon: Scale,
  },
  {
    type: "FINANCIAL_RISK",
    title: "Financial Risk & Compliance",
    category: "Risk & Compliance",
    description: "Audit findings, duplicate payment hazards, liquidity runways, and risk scores.",
    icon: ShieldAlert,
  },
];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType>("MONTHLY_SUMMARY");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this_month");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchReport = async (type: ReportType, period: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?type=${type}&period=${period}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.report);
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedType, selectedPeriod);
  }, [selectedType, selectedPeriod]);

  const handleDownloadExcel = () => {
    const url = `/api/reports/export?type=${selectedType}&period=${selectedPeriod}`;
    window.open(url, "_blank");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Print-Only Header Banner */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">FinOS Financial Intelligence</h1>
            <p className="text-xs text-slate-600 font-semibold tracking-wider uppercase">Enterprise Financial Audit Pack • Ind AS Compliant</p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold text-slate-900">{reportData?.businessName}</p>
            <p className="font-mono">GSTIN: {reportData?.gstin}</p>
            <p>Generated: {reportData?.generatedAt}</p>
          </div>
        </div>
      </div>

      {/* Screen Page Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500 print:hidden">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Financial Reports & Audit Packs</h1>
            <Badge variant="green" className="font-bold text-[10px]">Audit Ready</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Deterministic, verified statutory audit reports and corporate statements with instant multi-sheet Excel & PDF export.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="purple"
            size="sm"
            onClick={handleDownloadExcel}
            disabled={loading}
            className="shadow-md shadow-purple-500/20 font-semibold"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download Excel (.xlsx)
          </Button>

          <Button
            variant="glass"
            size="sm"
            onClick={handlePrintPDF}
            disabled={loading}
            className="font-semibold"
          >
            <Printer className="h-4 w-4 mr-1.5 text-purple-600 dark:text-purple-400" />
            Print / Export PDF
          </Button>
        </div>
      </div>

      {/* Report Catalog Grid (Filter / Selection) */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-sky-400/80 uppercase tracking-[0.15em]">
            Select Report Type (9 Available)
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-navy-950/80 border border-white/15 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 cursor-pointer transition-colors backdrop-blur-md"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="fy24_25">FY 2024-25</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_CATALOG.map((item) => {
            const isSelected = selectedType === item.type;
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3 relative overflow-hidden backdrop-blur-xl ${
                  isSelected
                    ? "bg-sky-500/15 border-sky-400 text-white shadow-glass-sky ring-1 ring-sky-400/40 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-sky-400"
                    : "bg-navy-900/60 border-white/10 hover:bg-white/[0.04] hover:border-sky-400/30 text-slate-300"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? "bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30"
                      : "bg-white/[0.05] border border-white/10 text-sky-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-200"}`}>
                      {item.title}
                    </p>
                    <span className="text-[9px] text-sky-400/70 uppercase font-semibold">{item.category.split(" ")[0]}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Report Viewer */}
      {loading ? (
        <div className="p-16 border border-slate-800 rounded-2xl bg-navy-900/40 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-finteal-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Compiling Verified Financial Records...</p>
          <p className="text-xs text-slate-400">Strictly executing deterministic double-entry calculations.</p>
        </div>
      ) : !reportData ? (
        <div className="p-12 border border-slate-800 rounded-2xl bg-navy-900/40 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">Report unavailable</p>
          <p className="text-xs text-slate-400">Unable to generate financial report for this selection.</p>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {/* Executive Report Card */}
          <Card className="border-slate-800 bg-navy-900/60 print:border-none print:bg-transparent print:p-0">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                      OFFICIAL REPORT
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {reportData.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1.5 print:text-slate-900">
                    {reportData.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 print:text-slate-700">{reportData.subtitle}</p>
                </div>

                <div className="text-left md:text-right text-xs text-slate-400 space-y-0.5">
                  <p className="font-semibold text-white print:text-slate-900 flex md:justify-end items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-finteal-400" />
                    {reportData.businessName}
                  </p>
                  <p>GSTIN: <span className="font-mono text-slate-300 print:text-slate-800">{reportData.gstin}</span></p>
                  <p>Period: <span className="text-finteal-300 font-medium">{reportData.periodLabel}</span></p>
                  <p className="text-[11px] text-slate-500">Generated: {reportData.generatedAt}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-6">
              {/* Summary KPI Grid */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Key Performance Indicators
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {reportData.summaryMetrics?.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-800/80 bg-navy-950/60 print:bg-slate-50 print:border-slate-300"
                    >
                      <p className="text-[11px] text-slate-400 font-medium truncate">{m.label}</p>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <span className="text-base font-bold text-white print:text-slate-900 tracking-tight">
                          {m.value}
                        </span>
                        {m.trend === "up" && (
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        )}
                        {m.trend === "down" && (
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Visualization (if present) */}
              {reportData.chartData && reportData.chartData.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-800/80 bg-navy-950/40 print:hidden">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Visual Distribution & Trends
                  </p>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "0.75rem",
                            fontSize: "12px",
                          }}
                          formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
                        />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Primary Value" />
                        {reportData.chartData[0]?.secondaryValue !== undefined && (
                          <Bar dataKey="secondaryValue" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Comparative Value" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Data Tables */}
              {reportData.sections?.map((sec: any, sIdx: number) => (
                <div key={sIdx} className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white print:text-slate-900">{sec.title}</h3>
                    {sec.description && (
                      <p className="text-xs text-slate-400 print:text-slate-600">{sec.description}</p>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-950/80 text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-slate-700">
                        <tr>
                          {sec.headers.map((h: string, hIdx: number) => (
                            <th key={hIdx} className="px-3.5 py-2.5 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                        {sec.rows.map((row: any[], rIdx: number) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 0 ? "bg-navy-900/30" : "bg-transparent"}
                          >
                            {row.map((cell: any, cIdx: number) => {
                              const isAmount = typeof cell === "string" && (cell.startsWith("₹") || cell.startsWith("+₹") || cell.startsWith("-₹"));
                              return (
                                <td
                                  key={cIdx}
                                  className={`px-3.5 py-2.5 text-slate-300 print:text-slate-800 ${
                                    cIdx === 0 ? "font-medium text-white print:text-slate-900" : ""
                                  } ${isAmount ? "font-mono font-semibold" : ""}`}
                                >
                                  {cell}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                      {sec.totals && (
                        <tfoot className="bg-navy-950 border-t-2 border-slate-700 font-bold print:bg-slate-200">
                          <tr>
                            {sec.totals.map((tCell: any, tIdx: number) => (
                              <td key={tIdx} className="px-3.5 py-2.5 text-white print:text-slate-900 font-mono">
                                {tCell}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              ))}

              {/* Audit Observations & Heuristics */}
              {reportData.observations && reportData.observations.length > 0 && (
                <div className="p-4 rounded-xl border border-finteal-800/50 bg-finteal-950/20 print:border-slate-300 print:bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-finteal-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-finteal-300 print:text-slate-900">
                      Executive Observations & Statutory Notes
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 print:text-slate-700 list-disc list-inside">
                    {reportData.observations.map((obs: string, oIdx: number) => (
                      <li key={oIdx} className="leading-relaxed">
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
