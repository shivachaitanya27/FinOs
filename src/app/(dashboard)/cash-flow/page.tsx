"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  FileText,
  Info,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatIndianDate } from "@/lib/formatters";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
} from "recharts";

type ForecastPeriod = "7_DAYS" | "30_DAYS" | "3_MONTHS" | "6_MONTHS";

interface ForecastData {
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
  timeline: {
    date: string;
    label: string;
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
  }[];
  historicalPoints: {
    date: string;
    label: string;
    actualInflow: number;
    actualOutflow: number;
    netCashFlow: number;
    closingBalance: number;
  }[];
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
  transparency: {
    historicalPeriodUsed: string;
    historicalDaysAnalyzed: number;
    historicalTransactionsAnalyzed: number;
    dailyInflowRunRate: number;
    dailyOutflowRunRate: number;
    dataAvailability: string;
    reliabilityIndicator: string;
    reliabilityScore: number;
    assumptions: string[];
    knownLimitations: string[];
    isInsufficientData: boolean;
    warningMessage: string | null;
  };
}

export default function CashFlowForecastDashboard() {
  const [period, setPeriod] = useState<ForecastPeriod>("30_DAYS");
  const [data, setData] = useState<{
    business?: { id: string; name: string; minimumCashBalance: number; accounts: any[] };
    forecast?: ForecastData;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Minimum threshold modal
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [newThresholdInput, setNewThresholdInput] = useState<string>("50000");
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [thresholdSavedSuccess, setThresholdSavedSuccess] = useState(false);

  // Tab view: Chart vs Table vs Transparency
  const [viewTab, setViewTab] = useState<"CHART" | "TIMELINE" | "SCHEDULED" | "TRANSPARENCY">("CHART");

  const fetchForecast = async (targetPeriod: ForecastPeriod = period) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cash-flow?period=${targetPeriod}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.business?.minimumCashBalance) {
          setNewThresholdInput(String(json.business.minimumCashBalance));
        }
      }
    } catch (err) {
      console.error("Failed to fetch cash flow forecast:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForecast(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: ForecastPeriod) => {
    setPeriod(newPeriod);
  };

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingThreshold(true);
      const res = await fetch("/api/cash-flow/threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: data?.business?.id,
          minimumCashBalance: Number(newThresholdInput),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setThresholdSavedSuccess(true);
        setTimeout(() => {
          setThresholdSavedSuccess(false);
          setShowThresholdModal(false);
        }, 1500);
        fetchForecast(period);
      }
    } catch (err) {
      console.error("Threshold save error:", err);
    } finally {
      setSavingThreshold(false);
    }
  };

  const forecast = data?.forecast;
  const transparency = forecast?.transparency;

  // Combine historical and projected data points for a continuous interactive chart
  const chartData: any[] = [];

  // Historical data points (Actuals)
  if (forecast?.historicalPoints) {
    for (const hp of forecast.historicalPoints) {
      chartData.push({
        date: hp.date,
        label: hp.label,
        actualBalance: hp.closingBalance,
        actualInflow: hp.actualInflow,
        actualOutflow: hp.actualOutflow,
        projectedBalance: null,
        projectedInflow: null,
        projectedOutflow: null,
        minimumThreshold: forecast.minimumCashBalance,
        isProjected: false,
      });
    }
  }

  // Anchor point at today connecting historical to projected
  if (forecast?.historicalPoints?.length && forecast?.timeline?.length) {
    const lastHistorical = forecast.historicalPoints[forecast.historicalPoints.length - 1];
    // Set anchor projected balance to match current cash balance
    if (chartData.length > 0) {
      chartData[chartData.length - 1].projectedBalance = forecast.currentCashBalance;
    }
  }

  // Projected data points
  if (forecast?.timeline) {
    for (const tp of forecast.timeline) {
      chartData.push({
        date: tp.date,
        label: tp.label,
        actualBalance: null,
        actualInflow: null,
        actualOutflow: null,
        projectedBalance: tp.closingBalance,
        projectedInflow: tp.totalInflow,
        projectedOutflow: tp.totalOutflow,
        minimumThreshold: forecast.minimumCashBalance,
        isBelowMinimum: tp.isBelowMinimum,
        isProjected: true,
      });
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Direct Cash Flow Forecasting Engine</h1>
                <Badge variant="purple" className="font-bold text-[10px]">Stage 4</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Deterministic liquidity modeling: historical run-rates, verified bank reserves, and scheduled receivables/payables.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Buttons */}
          <div className="flex items-center p-1 bg-navy-950/80 rounded-xl border border-white/10 text-xs backdrop-blur-md">
            <button
              onClick={() => handlePeriodChange("7_DAYS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === "7_DAYS"
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => handlePeriodChange("30_DAYS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === "30_DAYS"
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => handlePeriodChange("3_MONTHS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === "3_MONTHS"
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => handlePeriodChange("6_MONTHS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === "6_MONTHS"
                  ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              6 Months
            </button>
          </div>

          <Button
            variant="glass"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchForecast(period);
            }}
            disabled={loading || refreshing}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-sky-400 ${refreshing ? "animate-spin" : ""}`} />
            Recalculate
          </Button>

          <Button
            variant="glass-sky"
            size="sm"
            onClick={() => setShowThresholdModal(true)}
            className="text-xs"
          >
            <Sliders className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
            Min Cash: {formatINR(forecast?.minimumCashBalance || 50000)}
          </Button>
        </div>
      </div>

      {/* Insufficient Historical Data Alert */}
      {transparency?.isInsufficientData && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-xs text-amber-200 flex items-start gap-3">
          <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Data Availability Notice: </span>
            {transparency.warningMessage}
          </div>
        </div>
      )}

      {/* Cash Shortage Warning Banner */}
      {forecast?.hasCashShortageRisk && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300">Projected Cash Deficit Detected: </span>
              Projected balance drops below your safety threshold of {formatINR(forecast.minimumCashBalance)} on{" "}
              <span className="font-mono font-semibold underline text-white">{forecast.firstShortageDate}</span>. Safe liquidity runway:{" "}
              <span className="font-bold text-white">{forecast.safeRunwayDays} days</span>. Maximum estimated shortfall:{" "}
              <span className="font-bold text-rose-300">{formatINR(forecast.maxDeficitAmount)}</span>.
            </div>
          </div>
          <Badge variant="destructive" className="text-[11px] uppercase tracking-wider flex-shrink-0">
            Action Recommended
          </Badge>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider">Available Cash</span>
              <Banknote className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white truncate">
              {formatINR(forecast?.currentCashBalance || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Live bank balances</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">Expected Inflows</span>
              <ArrowDownRight className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 truncate">
              +{formatINR(forecast?.expectedCashInflows || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Run-rate + receivables</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">Expected Outflows</span>
              <ArrowUpRight className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400 truncate">
              -{formatINR(forecast?.expectedCashOutflows || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Run-rate + payables</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-teal-400">Projected Closing</span>
              <TrendingUp className="h-4 w-4 text-teal-400" />
            </div>
            <div className={`text-xl font-bold truncate ${
              (forecast?.projectedClosingBalance || 0) < (forecast?.minimumCashBalance || 50000)
                ? "text-amber-400"
                : "text-teal-300"
            }`}>
              {formatINR(forecast?.projectedClosingBalance || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">End of {period.replace("_", " ").toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-400">Safety Threshold</span>
              <Sliders className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white truncate">
              {formatINR(forecast?.minimumCashBalance || 50000)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Configured reserve</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">Liquidity Runway</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className={`text-xl font-bold ${
              forecast?.hasCashShortageRisk ? "text-rose-400" : "text-emerald-400"
            }`}>
              {forecast?.safeRunwayDays !== undefined
                ? `${forecast.safeRunwayDays} Days`
                : "Safe"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Before hitting threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Chart & Sub-views */}
      <Card className="bg-navy-900/90 border-slate-800">
        <CardHeader className="pb-2 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <span>Liquidity Trajectory: Actuals vs Deterministic Projection</span>
                <span className="text-xs font-normal text-slate-400">({forecast?.forecastDays || 30}-Day Horizon)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Solid line represents historical actual closing cash; dashed line indicates projected liquidity based on run-rates and scheduled invoices.
              </CardDescription>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewTab("CHART")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewTab === "CHART" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Chart View
              </button>
              <button
                onClick={() => setViewTab("TIMELINE")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewTab === "TIMELINE" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Daily Timeline ({forecast?.timeline?.length || 0})
              </button>
              <button
                onClick={() => setViewTab("SCHEDULED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewTab === "SCHEDULED" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Scheduled Invoices (
                {(forecast?.scheduledReceivablesIncluded?.length || 0) +
                  (forecast?.scheduledPayablesIncluded?.length || 0)}
                )
              </button>
              <button
                onClick={() => setViewTab("TRANSPARENCY")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewTab === "TRANSPARENCY" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Assumptions & Reliability
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="h-80 flex items-center justify-center text-xs text-slate-400 animate-pulse">
              Computing deterministic multi-period liquidity trajectories...
            </div>
          ) : viewTab === "CHART" ? (
            <div className="space-y-4">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      interval={period === "6_MONTHS" ? 14 : period === "3_MONTHS" ? 7 : period === "30_DAYS" ? 3 : 0}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <div className="font-semibold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                                <span>{label}</span>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {item.isProjected ? "Projected" : "Actual"}
                                </span>
                              </div>
                              <div className="text-slate-300 pt-1">
                                {item.isProjected ? (
                                  <>
                                    <div>Projected Cash: <span className="font-bold text-teal-400">{formatINR(item.projectedBalance)}</span></div>
                                    <div className="text-emerald-400">Inflow: +{formatINR(item.projectedInflow)}</div>
                                    <div className="text-rose-400">Outflow: -{formatINR(item.projectedOutflow)}</div>
                                    {item.isBelowMinimum && (
                                      <div className="text-rose-400 font-semibold pt-1">⚠ Below Minimum Reserve</div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div>Actual Closing Cash: <span className="font-bold text-finblue-400">{formatINR(item.actualBalance)}</span></div>
                                    <div className="text-emerald-400">Inflow: +{formatINR(item.actualInflow)}</div>
                                    <div className="text-rose-400">Outflow: -{formatINR(item.actualOutflow)}</div>
                                  </>
                                )}
                                <div className="text-indigo-400 text-[10px] pt-1">
                                  Min Reserve: {formatINR(item.minimumThreshold)}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />

                    {/* Minimum Cash Threshold Reference Line */}
                    <ReferenceLine
                      y={forecast?.minimumCashBalance || 50000}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: `Min Reserve: ₹${((forecast?.minimumCashBalance || 50000) / 1000).toFixed(0)}k`,
                        fill: "#f59e0b",
                        fontSize: 10,
                        position: "insideTopLeft",
                      }}
                    />

                    {/* Historical Actual Balance (Solid Line) */}
                    <Line
                      type="monotone"
                      dataKey="actualBalance"
                      name="Historical Actual Cash"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={false}
                    />

                    {/* Future Projected Balance (Dashed Line) */}
                    <Line
                      type="monotone"
                      dataKey="projectedBalance"
                      name="Projected Future Cash"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={{ r: 2, fill: "#14b8a6" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend Explanation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-5 bg-blue-500" />
                  <span>Verified Actual Liquidity (Pre-today)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-5 border-t-2 border-dashed border-teal-400" />
                  <span>Deterministic Forecast (Post-today)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-5 border-t-2 border-dotted border-amber-500" />
                  <span>Safety Threshold (Configurable Reserve)</span>
                </div>
              </div>
            </div>
          ) : viewTab === "TIMELINE" ? (
            /* Timeline Table */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Opening Cash</th>
                    <th className="py-2.5 px-3 text-right">Expected Inflow</th>
                    <th className="py-2.5 px-3 text-right">Expected Outflow</th>
                    <th className="py-2.5 px-3 text-right">Net Change</th>
                    <th className="py-2.5 px-3 text-right">Closing Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {forecast?.timeline?.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        row.isBelowMinimum ? "bg-rose-950/20" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-mono text-slate-200">
                        {row.label} ({row.date})
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">
                        {formatINR(row.openingBalance)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-400">
                        +{formatINR(row.totalInflow)}
                        {row.scheduledReceivable > 0 && (
                          <span className="text-[10px] text-emerald-300 block">
                            (incl. {formatINR(row.scheduledReceivable)} scheduled)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-400">
                        -{formatINR(row.totalOutflow)}
                        {row.scheduledPayable > 0 && (
                          <span className="text-[10px] text-rose-300 block">
                            (incl. {formatINR(row.scheduledPayable)} scheduled)
                          </span>
                        )}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-medium ${
                        row.netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {row.netCashFlow >= 0 ? "+" : ""}{formatINR(row.netCashFlow)}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-bold ${
                        row.isBelowMinimum ? "text-rose-400" : "text-white"
                      }`}>
                        {formatINR(row.closingBalance)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {row.isBelowMinimum ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Shortage (-{formatINR(row.deficitAmount)})
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Healthy
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewTab === "SCHEDULED" ? (
            /* Scheduled Receivables & Payables */
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-emerald-400" />
                  Scheduled Customer Receivables (Factored on Due Date)
                </h4>
                {forecast?.scheduledReceivablesIncluded?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
                    No pending customer invoices with future due dates detected in this horizon.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {forecast?.scheduledReceivablesIncluded?.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-900/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{item.counterparty || "Client"}</span>
                          <span className="font-mono font-bold text-emerald-400">+{formatINR(item.amount)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                          <Calendar className="h-3 w-3 text-emerald-400" />
                          <span>Expected Settlement: {item.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-rose-400" />
                  Scheduled Vendor Payables (Factored on Due Date)
                </h4>
                {forecast?.scheduledPayablesIncluded?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
                    No scheduled vendor disbursements or tax liabilities with due dates detected.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {forecast?.scheduledPayablesIncluded?.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-900/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{item.counterparty || "Vendor"}</span>
                          <span className="font-mono font-bold text-rose-400">-{formatINR(item.amount)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{item.description}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                          <Calendar className="h-3 w-3 text-rose-400" />
                          <span>Disbursement Date: {item.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Transparency, Assumptions, and Reliability */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Reliability Indicator</div>
                  <div className="text-base font-bold text-finteal-400 mt-1 flex items-center gap-2">
                    <span>{transparency?.reliabilityIndicator}</span>
                    <Badge variant="teal">{transparency?.reliabilityScore || 90}% Confidence</Badge>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Historical Lookback Window</div>
                  <div className="text-sm font-semibold text-white mt-1">
                    {transparency?.historicalPeriodUsed}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {transparency?.historicalTransactionsAnalyzed} transactions analyzed
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Daily Run-Rate Velocity</div>
                  <div className="text-sm font-semibold text-white mt-1">
                    <span className="text-emerald-400">+{formatINR(transparency?.dailyInflowRunRate || 0)}</span> /{" "}
                    <span className="text-rose-400">-{formatINR(transparency?.dailyOutflowRunRate || 0)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Operating inflow / outflow per day</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-finteal-400" />
                  Forecasting Assumptions & Methodology
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {transparency?.assumptions?.map((assump, i) => (
                    <li key={i}>{assump}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-400" />
                  Known Model Boundaries & Limitations
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  {transparency?.knownLimitations?.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threshold Modal */}
      {showThresholdModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-finteal-400" />
                Configure Minimum Cash Safety Reserve
              </h3>
              <button onClick={() => setShowThresholdModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {thresholdSavedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Minimum cash reserve updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveThreshold} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Minimum Cash Balance Threshold (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={newThresholdInput}
                    onChange={(e) => setNewThresholdInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-finteal-400"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  When projected cash falls below this safety buffer, FinOS will proactively trigger a Critical Cash Shortage alert.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThresholdModal(false)}
                  className="text-xs border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingThreshold}
                  className="bg-finteal-500 hover:bg-finteal-600 text-white text-xs"
                >
                  {savingThreshold ? "Saving..." : "Save Threshold"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
