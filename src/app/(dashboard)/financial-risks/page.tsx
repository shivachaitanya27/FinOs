"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Info,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatIndianDate } from "@/lib/formatters";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface RiskAlert {
  id?: string;
  title: string;
  description: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  amount?: number | null;
  relatedCategory?: string | null;
  relatedTransactionId?: string | null;
  evidence: string;
  recommendedAction: string;
  reviewNotes?: string | null;
  detectedAt?: string;
}

interface RiskSummary {
  totalActive: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  resolvedCount: number;
  dismissedCount: number;
  totalAtRiskAmount: number;
  categoryBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
  hasInsufficientData: boolean;
  insufficientDataWarning?: string | null;
  alerts: RiskAlert[];
}

export default function FinancialRisksDashboard() {
  const [data, setData] = useState<{
    business?: { id: string; name: string; minimumCashBalance: number; currentCashBalance: number };
    summary?: RiskSummary;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Action States
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [notesModalAlert, setNotesModalAlert] = useState<RiskAlert | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/risks");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch risk alerts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const handleAction = async (alertId: string, action: string, notes?: string) => {
    try {
      setActionInProgress(true);
      const res = await fetch("/api/risks/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          action,
          notes,
        }),
      });
      const result = await res.json();

      if (result.success) {
        setActionSuccessMsg(`Alert marked as ${action.replace("_", " ")}`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
        setSelectedAlert(null);
        setNotesModalAlert(null);
        setUserNotes("");
        fetchRisks();
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionInProgress(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive" className="bg-rose-500/20 text-rose-300 border-rose-500/40">CRITICAL</Badge>;
      case "HIGH":
        return <Badge variant="warning" className="bg-amber-500/20 text-amber-300 border-amber-500/40">HIGH</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">MEDIUM</Badge>;
      default:
        return <Badge variant="default" className="bg-blue-500/20 text-blue-300 border-blue-500/40">LOW</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return <Badge variant="success">RESOLVED</Badge>;
      case "DISMISSED":
        return <Badge variant="secondary">DISMISSED</Badge>;
      case "REVIEWED":
        return <Badge variant="teal">REVIEWED</Badge>;
      default:
        return <Badge variant="destructive">ACTIVE</Badge>;
    }
  };

  const summary = data?.summary;
  const allAlerts = summary?.alerts || [];

  // Filtered alerts
  const filteredAlerts = allAlerts.filter((a) => {
    if (statusFilter === "ACTIVE" && a.status !== "ACTIVE" && a.status !== "REVIEWED") return false;
    if (statusFilter === "RESOLVED" && a.status !== "RESOLVED") return false;
    if (statusFilter === "DISMISSED" && a.status !== "DISMISSED") return false;
    if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
    if (categoryFilter !== "ALL" && a.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      const matchCat = a.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Chart data
  const severityChartData = [
    { name: "Critical", count: summary?.criticalCount || 0, color: "#f43f5e" },
    { name: "High", count: summary?.highCount || 0, color: "#f59e0b" },
    { name: "Medium", count: summary?.mediumCount || 0, color: "#eab308" },
    { name: "Low", count: summary?.lowCount || 0, color: "#3b82f6" },
  ];

  const categoryChartData = Object.entries(summary?.categoryBreakdown || {}).map(([key, count]) => ({
    name: key.replace(/_/g, " "),
    count,
  }));

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Financial Risk Intelligence & Anomaly Guard</h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Deterministic detection of liquidity deficits, expense surges, duplicate disbursements, and overdue receivables.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="glass-purple"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchRisks();
            }}
            disabled={loading || refreshing}
            className="text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 text-purple-600 dark:text-purple-400 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Intelligence
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Insufficient Data Warning Banner */}
      {summary?.hasInsufficientData && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-xs text-amber-200 flex items-start gap-3">
          <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Statistical Baseline Notice: </span>
            {summary.insufficientDataWarning}
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider">Active Risks</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">{summary?.totalActive || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Requiring action</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">Critical</span>
              <ShieldAlert className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{summary?.criticalCount || 0}</div>
            <p className="text-[11px] text-rose-300/70 mt-1">Immediate intervention</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">High Risk</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{summary?.highCount || 0}</div>
            <p className="text-[11px] text-amber-300/70 mt-1">Review within 48h</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-yellow-400">Medium / Low</span>
              <Layers className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-300">
              {(summary?.mediumCount || 0) + (summary?.lowCount || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Monitored anomalies</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">Resolved</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{summary?.resolvedCount || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Audited & closed</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-400">Capital At Risk</span>
              <DollarSign className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-white truncate">
              {formatINR(summary?.totalAtRiskAmount || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Exposed liquidity</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Severity Distribution */}
        <Card className="bg-navy-900/90 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Risk Severity Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityChartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-navy-900/90 border-slate-800 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Risk Incidents by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500">
                No active category incidents recorded.
              </div>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical">
                    <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={140} stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className="bg-navy-900/90 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "ACTIVE"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Active & Under Review ({summary?.totalActive || 0})
              </button>
              <button
                onClick={() => setStatusFilter("RESOLVED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "RESOLVED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Resolved ({summary?.resolvedCount || 0})
              </button>
              <button
                onClick={() => setStatusFilter("DISMISSED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "DISMISSED"
                    ? "bg-slate-700 text-slate-200"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Dismissed ({summary?.dismissedCount || 0})
              </button>
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({allAlerts.length})
              </button>
            </div>

            {/* Severity and Category Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search alert narrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-finteal-400 w-52"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Only</option>
                <option value="MEDIUM">Medium Only</option>
                <option value="LOW">Low Only</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="UNUSUAL_EXPENSE">Unusual Expenses</option>
                <option value="CATEGORY_SPIKE">Category Spikes</option>
                <option value="DUPLICATE_PAYMENT">Duplicate Payments</option>
                <option value="UNMATCHED_TRANSACTION">Unmatched Bank Feeds</option>
                <option value="CASH_FLOW">Cash Shortage Risk</option>
                <option value="OVERDUE_RECEIVABLE">Overdue Receivables</option>
                <option value="FREQUENCY_ANOMALY">Frequency Anomaly</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Alert List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse bg-navy-900/60 rounded-2xl border border-slate-800">
            Running deterministic risk evaluation across ledger and bank statements...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card className="bg-navy-900/90 border-slate-800">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Risk Alerts Matching Selection</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No active financial risks or compliance alerts match your current filter criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert, idx) => {
            let evidenceParsed: any = {};
            try {
              evidenceParsed = JSON.parse(alert.evidence);
            } catch {
              evidenceParsed = { raw: alert.evidence };
            }

            return (
              <Card
                key={alert.id || idx}
                className={`bg-navy-900/90 border transition-all ${
                  alert.severity === "CRITICAL"
                    ? "border-rose-500/40 hover:border-rose-500/70"
                    : alert.severity === "HIGH"
                    ? "border-amber-500/40 hover:border-amber-500/70"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(alert.severity)}
                        {getStatusBadge(alert.status)}
                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {alert.category.replace(/_/g, " ")}
                        </span>
                        {alert.amount && (
                          <span className="text-xs font-semibold text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                            At Risk: {formatINR(alert.amount)}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatIndianDate(alert.detectedAt || new Date())}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {alert.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {alert.description}
                      </p>

                      {/* Evidence Pill Preview */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div className="font-medium text-slate-300 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-finteal-400" />
                          <span>Supporting Evidence & Calculations:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-slate-400">
                          {evidenceParsed.multiplierOverAverage && (
                            <div>Multiplier: <span className="text-white font-mono">{evidenceParsed.multiplierOverAverage}x baseline</span></div>
                          )}
                          {evidenceParsed.historicalAverage && (
                            <div>Hist. Baseline: <span className="text-white font-mono">{formatINR(evidenceParsed.historicalAverage)}</span></div>
                          )}
                          {evidenceParsed.percentageIncrease && (
                            <div>Surge: <span className="text-rose-400 font-mono">+{evidenceParsed.percentageIncrease}%</span></div>
                          )}
                          {evidenceParsed.daysOverdue && (
                            <div>Days Overdue: <span className="text-amber-400 font-mono">{evidenceParsed.daysOverdue} days</span></div>
                          )}
                          {evidenceParsed.firstShortageDate && (
                            <div>Shortage Date: <span className="text-rose-400 font-mono">{evidenceParsed.firstShortageDate}</span></div>
                          )}
                          {evidenceParsed.counterparty && (
                            <div className="truncate">Counterparty: <span className="text-slate-200">{evidenceParsed.counterparty}</span></div>
                          )}
                        </div>
                      </div>

                      {/* Actionable Recommendation Callout */}
                      <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-800/40 text-[11px] text-teal-300 flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-teal-200">Recommended Action: </span>
                          {alert.recommendedAction}
                        </div>
                      </div>

                      {alert.reviewNotes && (
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-finblue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-200">Review Notes: </span>
                            {alert.reviewNotes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex lg:flex-col items-center gap-2 justify-end lg:justify-start lg:min-w-[150px]">
                      {alert.id && (
                        <>
                          {alert.status === "ACTIVE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionInProgress}
                              onClick={() => handleAction(alert.id!, "mark_reviewed")}
                              className="w-full text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5 text-finteal-400" />
                              Mark Reviewed
                            </Button>
                          )}

                          {alert.status !== "RESOLVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionInProgress}
                              onClick={() => handleAction(alert.id!, "resolve")}
                              className="w-full text-xs border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                              Resolve Alert
                            </Button>
                          )}

                          {alert.status !== "DISMISSED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionInProgress}
                              onClick={() => handleAction(alert.id!, "dismiss")}
                              className="w-full text-xs text-slate-400 hover:text-slate-200"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              Dismiss
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNotesModalAlert(alert);
                              setUserNotes(alert.reviewNotes || "");
                            }}
                            className="w-full text-xs text-finteal-400 hover:text-finteal-300 hover:bg-slate-800"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            {alert.reviewNotes ? "Edit Notes" : "Add Notes"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Review Notes Modal */}
      {notesModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-finteal-400" />
                Add Audit Review Notes
              </h3>
              <button onClick={() => setNotesModalAlert(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              <div className="font-semibold text-white mb-1">{notesModalAlert.title}</div>
              <p className="text-slate-400 text-[11px]">{notesModalAlert.description}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Reviewer Comments & Justification
              </label>
              <textarea
                rows={4}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Explain the audit investigation outcome, approved variance, or follow-up status..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-finteal-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotesModalAlert(null)}
                className="text-xs border-slate-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionInProgress}
                onClick={() => handleAction(notesModalAlert.id!, "add_notes", userNotes)}
                className="bg-finteal-500 hover:bg-finteal-600 text-white text-xs"
              >
                Save Review Notes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
