"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Building2,
  Users,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export default function RevenueAnalysisPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
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
    fetchRevenueData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 animate-pulse">
        <RefreshCw className="h-4 w-4 animate-spin text-finteal-400" />
        Calculating revenue analytics from ledger...
      </div>
    );
  }

  const { kpis, charts, recentTransactions } = data || {
    kpis: { totalRevenue: 0, outstandingReceivables: 0 },
    charts: { monthlyTrends: [] },
    recentTransactions: [],
  };

  const revenueTxs = (recentTransactions || []).filter((t: any) => t.type === "REVENUE");

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
              <TrendingUp className="h-5 w-5 text-sky-600" />
              Revenue Analysis & Top-Line Performance
            </h1>
            <Badge variant="sky" className="text-[10px]">
              LIVE DATABASE
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Deterministic accounting revenue analysis derived strictly from recognized operating turnover.
          </p>
        </div>

        <Button variant="glass-sky" size="sm" onClick={fetchRevenueData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
          Refresh Analysis
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Operating Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatINR(kpis.totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            Recognized sales turnover (net of customer returns)
          </p>
        </Card>

        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Pending Receivables</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">
            {formatINR(kpis.outstandingReceivables)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Uncollected invoices awaiting bank settlement
          </p>
        </Card>

        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Gross Margin Buffer</p>
          <p className="text-2xl font-bold text-white mt-1">
            {data?.financialHealth?.grossMargin || 0}%
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">
            Operating turnover vs variable expenses
          </p>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Monthly Revenue Inflows Trajectory
          </CardTitle>
          <CardDescription>
            Multi-month revenue trends aggregated from completed bank deposits and sales journals
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
                  formatter={(val: any) => [formatINR(Number(val)), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Revenue Inflows Table */}
      <Card className="border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Revenue Inflows</CardTitle>
          <CardDescription>
            Chronological log of operating customer payments and invoice settlements
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Narration</th>
                  <th className="py-2.5 px-4 font-semibold">Party / Client</th>
                  <th className="py-2.5 px-4 font-semibold">Account</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {revenueTxs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans text-xs">
                      No revenue transactions recorded in this period.
                    </td>
                  </tr>
                ) : (
                  revenueTxs.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-300">{formatDate(t.date)}</td>
                      <td className="py-3 px-4 text-white font-sans">{t.description}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">{t.counterparty || "-"}</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">{t.account?.name || "Operating A/c"}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">
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
