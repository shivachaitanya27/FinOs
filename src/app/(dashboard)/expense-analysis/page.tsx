"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import {
  TrendingDown,
  PieChart,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Building2,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function ExpenseAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard?filter=3months");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 animate-pulse">
        <RefreshCw className="h-4 w-4 animate-spin text-finteal-400" />
        Auditing expenses and category distributions...
      </div>
    );
  }

  const { kpis, charts, recentTransactions } = data || {
    kpis: { totalExpenses: 0, outstandingPayables: 0 },
    charts: { monthlyTrends: [], expenseCategoryBreakdown: [] },
    recentTransactions: [],
  };

  const expenseTxs = (recentTransactions || []).filter((t: any) => t.type === "EXPENSE");

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <TrendingDown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Expense Analysis & Run-Rate Auditing
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Deterministic categorization and burn-rate analysis from bank debits, payroll, and vendor disbursements.
          </p>
        </div>

        <Button variant="glass-purple" size="sm" onClick={fetchExpenseData} className="font-semibold">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
          Refresh Audit
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Operating Expenses</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {formatINR(kpis.totalExpenses)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ArrowDownRight className="h-3 w-3 text-rose-400" />
            Excludes loan principal & internal account transfers
          </p>
        </Card>

        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Vendor Payables Due</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {formatINR(kpis.outstandingPayables)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Committed supplier obligations awaiting disbursement
          </p>
        </Card>

        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Runway Horizon</p>
          <p className="text-2xl font-bold text-white mt-1">
            {data?.financialHealth?.runwayMonths || "6.5"} Mo
          </p>
          <p className="text-[11px] text-finteal-400 mt-1">
            Cash buffer based on monthly expenditure burn rate
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-blue-400" />
              Category Allocation Breakdown
            </CardTitle>
            <CardDescription>
              Expenditure split across payroll, cloud infrastructure, office rent, and taxes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart data={charts.expenseCategoryBreakdown || []} />
          </CardContent>
        </Card>

        {/* Monthly Expense Run-rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rose-400" />
              Monthly Burn Run-Rate
            </CardTitle>
            <CardDescription>
              6-month historical expenditure velocity across all operating accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [formatINR(Number(val)), "Expenses"]}
                  />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expense Debits Table */}
      <Card className="border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Operating Debits</CardTitle>
          <CardDescription>
            Chronological audit log of vendor disbursements, payroll, and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Account</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {expenseTxs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans text-xs">
                      No expense transactions found.
                    </td>
                  </tr>
                ) : (
                  expenseTxs.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-300">{formatDate(t.date)}</td>
                      <td className="py-3 px-4 text-white font-sans">{t.description}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{t.category}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{t.account?.name || "Operating A/c"}</td>
                      <td className="py-3 px-4 text-right text-rose-400 font-bold">
                        {formatINR(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
