"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
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

export default function ProfitLossPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this_month");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPnlData = async (period: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?type=PROFIT_LOSS&period=${period}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json.report);
      }
    } catch (err) {
      console.error("Failed to fetch P&L report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnlData(selectedPeriod);
  }, [selectedPeriod]);

  const handleDownloadExcel = () => {
    const url = `/api/reports/export?type=PROFIT_LOSS&period=${selectedPeriod}`;
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
            <p className="text-xs text-slate-600 font-semibold tracking-wider uppercase">Schedule III Statement of Profit and Loss • Ind AS Compliant</p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold text-slate-900">{reportData?.businessName}</p>
            <p className="font-mono">GSTIN: {reportData?.gstin}</p>
            <p>Period: {reportData?.periodLabel}</p>
          </div>
        </div>
      </div>

      {/* Screen Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statement of Profit & Loss</h1>
            <Badge variant="sky">Schedule III (Ind AS)</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Standardized Indian corporate accounting P&L compliant with Companies Act 2013 and Ministry of Corporate Affairs (MCA).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-sky-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer font-medium"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="fy24_25">FY 2024-25</option>
            </select>
          </div>

          <Button
            variant="sky"
            size="sm"
            onClick={handleDownloadExcel}
            disabled={loading}
            className="text-xs shadow-md shadow-sky-500/20"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Excel (.xlsx)
          </Button>

          <Button
            variant="glass"
            size="sm"
            onClick={handlePrintPDF}
            disabled={loading}
            className="text-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 border border-white/10 rounded-2xl bg-navy-900/60 text-center space-y-3 backdrop-blur-xl">
          <RefreshCw className="h-8 w-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-white">Generating Schedule III Statement...</p>
          <p className="text-xs text-slate-400">Balancing ledgers, operating EBITDA, and statutory corporate taxes.</p>
        </div>
      ) : !reportData ? (
        <div className="p-12 border border-slate-800 rounded-2xl bg-navy-900/40 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">No data available</p>
          <p className="text-xs text-slate-400">No transactions recorded for the selected accounting period.</p>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {reportData.summaryMetrics?.map((m: any, idx: number) => (
              <Card
                key={idx}
                className="border-slate-800/80 bg-navy-900/60 p-4 print:border-slate-300 print:bg-slate-50"
              >
                <p className="text-[11px] text-slate-400 font-medium truncate">{m.label}</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-bold text-white print:text-slate-900 tracking-tight">
                    {m.value}
                  </span>
                  {m.trend === "up" && (
                    <ArrowUpRight className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  {m.trend === "down" && (
                    <ArrowDownRight className="h-4 w-4 text-red-400 shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Comparative Performance Visual */}
          {reportData.chartData && reportData.chartData.length > 0 && (
            <Card className="border-slate-800 bg-navy-900/60 print:hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white">
                  Period Comparison (Current vs Prior Period)
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Revenue, operating expenditure, EBITDA, and net earnings variance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60 w-full">
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
                        formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Amount"]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="value" fill="#0ea5e9" name="Current Period" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="secondaryValue" fill="#14b8a6" name="Previous Period" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule III Standard Format Table */}
          <Card className="border-slate-800 bg-navy-900/60 print:border-none print:bg-transparent">
            <CardHeader className="border-b border-slate-800 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-white print:text-slate-900">
                    {reportData.businessName} – Statement of Profit and Loss
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 print:text-slate-600">
                    For the period ended: {reportData.periodLabel} • Currency: INR (₹)
                  </CardDescription>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Schedule III • Part II Compliance
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                <table className="w-full text-xs text-left">
                  <thead className="bg-navy-950 text-slate-300 border-b border-slate-800 print:bg-slate-100 print:text-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Particulars</th>
                      <th className="px-4 py-3 font-semibold text-right">Current Period (₹)</th>
                      <th className="px-4 py-3 font-semibold text-right">Previous Period (₹)</th>
                      <th className="px-4 py-3 font-semibold text-right">Growth / Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                    {reportData.sections?.[0]?.rows?.map((row: any[], rIdx: number) => {
                      const isHeader =
                        row[0].startsWith("I.") ||
                        row[0].startsWith("II.") ||
                        row[0].startsWith("TOTAL") ||
                        row[0].startsWith("OPERATING") ||
                        row[0].startsWith("PROFIT");
                      const isMajorTotal =
                        row[0].startsWith("TOTAL") ||
                        row[0].startsWith("PROFIT AFTER TAX");

                      return (
                        <tr
                          key={rIdx}
                          className={`transition-colors ${
                            isMajorTotal
                              ? "bg-blue-950/40 font-bold border-t-2 border-b-2 border-blue-500/40 print:bg-slate-100"
                              : isHeader
                              ? "bg-navy-950/60 font-semibold"
                              : "hover:bg-slate-800/30"
                          }`}
                        >
                          <td
                            className={`px-4 py-2.5 ${
                              isMajorTotal
                                ? "text-finteal-300 font-bold print:text-slate-900"
                                : isHeader
                                ? "text-white font-semibold print:text-slate-800"
                                : "text-slate-300 pl-8 print:text-slate-700"
                            }`}
                          >
                            {row[0]}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-200 print:text-slate-900">
                            {row[1]}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-400 print:text-slate-600">
                            {row[2]}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                row[3].startsWith("+")
                                  ? "bg-emerald-950 text-emerald-300"
                                  : row[3].startsWith("-")
                                  ? "bg-red-950 text-red-300"
                                  : "text-slate-400"
                              }`}
                            >
                              {row[3]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Statutory Notes & Disclosures */}
              {reportData.observations && reportData.observations.length > 0 && (
                <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-navy-950/60 print:bg-slate-50 print:border-slate-300">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-finteal-300 print:text-slate-900 mb-2">
                    Statutory Disclosures & Accounting Policies
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 print:text-slate-700 list-disc list-inside">
                    {reportData.observations.map((obs: string, oIdx: number) => (
                      <li key={oIdx} className="leading-relaxed">
                        {obs}
                      </li>
                    ))}
                    <li className="leading-relaxed text-slate-400">
                      Standard corporate tax provision calculated at 25.0% under Section 115BAA of the Income Tax Act, 1961.
                    </li>
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
