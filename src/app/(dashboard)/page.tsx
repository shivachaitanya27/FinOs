"use client";

import React, { useState, useEffect } from "react";
import {
  DateFilter,
  DateFilterOption,
} from "@/components/dashboard/date-filter";
import { KPICard } from "@/components/dashboard/kpi-card";
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { FinancialHealthCard } from "@/components/dashboard/financial-health-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { AIRecommendationsCard } from "@/components/dashboard/ai-recommendations-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  PieChart,
  Wallet,
  AlertCircle,
  RefreshCw,
  Building2,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [filter, setFilter] = useState<DateFilterOption>("this_month");
  const [customRange, setCustomRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (
    currentFilter: DateFilterOption,
    range?: { start: string; end: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/dashboard?filter=${currentFilter}`;
      if (currentFilter === "custom" && range) {
        url += `&startDate=${range.start}&endDate=${range.end}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load dashboard data");
      }

      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(filter, customRange || undefined);
  }, [filter, customRange]);

  const handleFilterChange = (
    newFilter: DateFilterOption,
    range?: { start: string; end: string }
  ) => {
    setFilter(newFilter);
    if (range) {
      setCustomRange(range);
    }
  };

  const handleReloadDemo = async () => {
    try {
      setLoading(true);
      await fetch("/api/demo-data", { method: "POST" });
      await fetchDashboardData(filter, customRange || undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton state
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-slate-900 rounded-2xl w-full border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-80 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-red-800/60 bg-red-950/30 text-center my-10 max-w-xl mx-auto">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white">Connection Error</h3>
        <p className="text-xs text-slate-300 mt-1 mb-4">{error}</p>
        <Button variant="teal" size="sm" onClick={() => fetchDashboardData(filter)}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Empty state (no data in DB yet)
  if (!data?.hasData) {
    return (
      <div className="p-12 rounded-3xl border border-slate-800 bg-navy-900/90 text-center my-12 max-w-lg mx-auto shadow-2xl backdrop-blur-xl">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-finteal-400 p-0.5 mx-auto mb-4 flex items-center justify-center">
          <div className="h-full w-full bg-navy-950 rounded-[14px] flex items-center justify-center">
            <Building2 className="h-7 w-7 text-finteal-400" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Initialize FinOS Stage 1 Ledger
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          No financial records were found in the local SQLite database. Populate the
          environment with realistic Indian enterprise demo data (GST, HDFC bank accounts,
          invoices, and risk alerts).
        </p>
        <Button variant="teal" size="lg" onClick={handleReloadDemo}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Load Demo Data (Stage 1)
        </Button>
      </div>
    );
  }

  const { kpis, charts, recentTransactions, financialHealth, riskAlerts, aiRecommendations, business } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Business Info + Demo Badge + Filters + Quick Actions */}
      <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {business?.name || "BharatTech Solutions"}
            </h1>
            <Badge variant="sky" className="gap-1.5 font-bold px-2.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600 animate-pulse" />
              DEMO SANDBOX – Live Ledger
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
            <span className="text-sky-700 font-mono">GSTIN: {business?.taxId || "29AABCU9603R1ZM"}</span>
            <span>•</span>
            <span className="text-slate-600">FY 2024–25 (Ind AS)</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateFilter activeFilter={filter} onChange={handleFilterChange} />
          <QuickActions
            onTransactionAdded={() => fetchDashboardData(filter, customRange || undefined)}
            onRefreshData={() => fetchDashboardData(filter, customRange || undefined)}
          />
        </div>
      </div>

      {/* KPI Cards (6 metrics calculated strictly from SQLite DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Revenue"
          amount={kpis.totalRevenue}
          type="revenue"
          trendPercentage={18.5}
          trendLabel="vs last month"
          subtitle="Operating Inflows"
        />

        <KPICard
          title="Total Expenses"
          amount={kpis.totalExpenses}
          type="expense"
          trendPercentage={9.2}
          trendLabel="vs last month"
          subtitle="Ledger Debits"
        />

        <KPICard
          title="Net Profit / Loss"
          amount={kpis.netProfitLoss}
          type="profit"
          trendPercentage={24.1}
          trendLabel="Net Margin"
          subtitle="Operating Surplus"
          hasSufficientData={kpis.hasSufficientData}
        />

        <KPICard
          title="Cash Position"
          amount={kpis.currentCashPosition}
          type="cash"
          trendPercentage={100}
          trendLabel="Liquid Reserve"
          subtitle="4 Active Accounts"
        />

        <KPICard
          title="Receivables"
          amount={kpis.outstandingReceivables}
          type="receivable"
          trendPercentage={14.8}
          trendLabel="Pending Invoices"
          subtitle="Uncollected Inflows"
        />

        <KPICard
          title="Payables"
          amount={kpis.outstandingPayables}
          type="payable"
          trendPercentage={7.3}
          trendLabel="Due in 30 Days"
          subtitle="Vendor Obligations"
        />
      </div>

      {/* Financial Charts Row 1: Revenue vs Expenses & Monthly Financial Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Revenue vs Expenses
              </CardTitle>
              <CardDescription>
                Comparative monthly operational turnover & expenditure
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              6 Months Trend
            </Badge>
          </CardHeader>
          <CardContent>
            <RevenueExpenseChart data={charts.revenueVsExpenses} />
          </CardContent>
        </Card>

        {/* Monthly Financial Trends */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-finteal-400" />
                Monthly Financial Trends
              </CardTitle>
              <CardDescription>
                Trajectory of top-line revenue, run-rate expenses, and net profit
              </CardDescription>
            </div>
            <Badge variant="teal" className="font-mono text-[10px]">
              Net Margins
            </Badge>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={charts.monthlyTrends} />
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts Row 2: Expense Category Breakdown & Cash Inflow vs Outflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Category Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-400" />
                Expense Category Breakdown
              </CardTitle>
              <CardDescription>
                Expenditure distribution for the active filter period
              </CardDescription>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {charts.expenseCategoryBreakdown.length} Categories
            </span>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart data={charts.expenseCategoryBreakdown} />
          </CardContent>
        </Card>

        {/* Cash Inflow vs Outflow */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-cyan-400" />
                Cash Inflow vs Outflow
              </CardTitle>
              <CardDescription>
                Gross liquidity movements across bank and payment gateway channels
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              Liquidity Velocity
            </Badge>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={charts.cashFlow} />
          </CardContent>
        </Card>
      </div>

      {/* Additional Sections: Financial Health, Risk Alerts, and AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FinancialHealthCard
          score={financialHealth.score}
          runwayMonths={financialHealth.runwayMonths}
          quickRatio={financialHealth.quickRatio}
          grossMargin={financialHealth.grossMargin}
          status={financialHealth.status}
        />

        <RiskAlertsCard alerts={riskAlerts} />

        <AIRecommendationsCard recommendations={aiRecommendations} />
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Recent Ledger Transactions</CardTitle>
            <CardDescription>
              Real-time audit log of revenue inflows, payroll, vendors, and anomaly tags
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-mono">
            {kpis.transactionCount} In Period
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <RecentTransactions transactions={recentTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
