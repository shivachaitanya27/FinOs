"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  DollarSign,
  Layers,
  RefreshCw,
  Info,
  Calendar,
  MessageSquare,
  ChevronRight,
  HelpCircle,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatIndianDate } from "@/lib/formatters";

interface Recommendation {
  id?: string;
  title: string;
  description: string;
  category: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  estimatedSavings?: number | null;
  actionType: string;
  suggestedAction: string;
  evidence: string;
  relatedData?: any;
  status: "PENDING" | "APPLIED" | "DISMISSED";
  notes?: string | null;
  createdAt?: string;
}

interface RecommendationSummary {
  totalRecommendations: number;
  totalEstimatedSavings: number;
  highImpactCount: number;
  mediumImpactCount: number;
  lowImpactCount: number;
  appliedCount: number;
  pendingCount: number;
  recommendations: Recommendation[];
}

export default function AIRecommendationsPage() {
  const [data, setData] = useState<{
    business?: { id: string; name: string; currentCashBalance: number; minimumCashBalance: number };
    summary?: RecommendationSummary;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [impactFilter, setImpactFilter] = useState<string>("ALL");

  // Modals & User actions
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [notesModalRec, setNotesModalRec] = useState<Recommendation | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/recommendations");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleAction = async (recId: string, action: string, notes?: string) => {
    try {
      setActionInProgress(true);
      const res = await fetch("/api/ai/recommendations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: recId,
          action,
          notes,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccessBanner(`Recommendation marked as ${action} successfully`);
        setTimeout(() => setSuccessBanner(null), 3500);
        setSelectedRec(null);
        setNotesModalRec(null);
        setUserNotes("");
        fetchRecommendations();
      }
    } catch (err) {
      console.error("Recommendation action error:", err);
    } finally {
      setActionInProgress(false);
    }
  };

  const summary = data?.summary;
  const allRecs = summary?.recommendations || [];

  const filteredRecs = allRecs.filter((r) => {
    if (statusFilter === "PENDING" && r.status !== "PENDING") return false;
    if (statusFilter === "APPLIED" && r.status !== "APPLIED") return false;
    if (statusFilter === "DISMISSED" && r.status !== "DISMISSED") return false;
    if (impactFilter !== "ALL" && r.impact !== impactFilter) return false;
    return true;
  });

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "HIGH":
        return <Badge variant="destructive" className="bg-rose-500/20 text-rose-300 border-rose-500/40">HIGH IMPACT</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" className="bg-amber-500/20 text-amber-300 border-amber-500/40">MEDIUM IMPACT</Badge>;
      default:
        return <Badge variant="default" className="bg-blue-500/20 text-blue-300 border-blue-500/40">LOW IMPACT</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPLIED":
        return <Badge variant="success">IMPLEMENTED</Badge>;
      case "DISMISSED":
        return <Badge variant="secondary">DISMISSED</Badge>;
      default:
        return <Badge variant="teal">ACTIONABLE</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Autonomous AI Financial Copilot</h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Deterministic algorithmic recommendations trained on verified ledger velocity, cash runway, and risk alerts.
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
              fetchRecommendations();
            }}
            disabled={loading || refreshing}
            className="text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 text-purple-600 dark:text-purple-400 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Copilot
          </Button>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-emerald-200">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Opportunities</span>
              <Sparkles className="h-4 w-4 text-finteal-400" />
            </div>
            <div className="text-2xl font-bold text-white">{summary?.totalRecommendations || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">{summary?.pendingCount || 0} pending implementation</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">Potential Benefit</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300 truncate">
              {formatINR(summary?.totalEstimatedSavings || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Estimated annual value</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-rose-400">High Impact</span>
              <Zap className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{summary?.highImpactCount || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Priority cash savings</p>
          </CardContent>
        </Card>

        <Card className="bg-navy-900/90 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-teal-400">Implemented</span>
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-teal-300">{summary?.appliedCount || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Adopted actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="bg-navy-900/90 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "PENDING"
                    ? "bg-finteal-500/20 text-finteal-300 border border-finteal-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Actionable ({summary?.pendingCount || 0})
              </button>
              <button
                onClick={() => setStatusFilter("APPLIED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "APPLIED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Implemented ({summary?.appliedCount || 0})
              </button>
              <button
                onClick={() => setStatusFilter("DISMISSED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "DISMISSED"
                    ? "bg-slate-700 text-slate-200"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Dismissed
              </button>
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({allRecs.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Impact Tiers</option>
                <option value="HIGH">High Impact Only</option>
                <option value="MEDIUM">Medium Impact Only</option>
                <option value="LOW">Low Impact Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Recommendations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse bg-navy-900/60 rounded-2xl border border-slate-800">
            Evaluating historical burn velocities, cash runway, and statutory GST deductions...
          </div>
        ) : filteredRecs.length === 0 ? (
          <Card className="bg-navy-900/90 border-slate-800">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Recommendations in this Filter</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No active strategy recommendations match your current selection.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecs.map((rec, idx) => {
            let evidenceParsed: any = {};
            try {
              evidenceParsed = JSON.parse(rec.evidence);
            } catch {
              evidenceParsed = { raw: rec.evidence };
            }

            return (
              <Card
                key={rec.id || idx}
                className={`bg-navy-900/90 border transition-all ${
                  rec.impact === "HIGH"
                    ? "border-rose-500/30 hover:border-rose-500/60"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getImpactBadge(rec.impact)}
                        {getStatusBadge(rec.status)}
                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {rec.category.replace(/_/g, " ")}
                        </span>
                        {rec.estimatedSavings && (
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-900/50">
                            Est. Benefit: +{formatINR(rec.estimatedSavings)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {rec.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {rec.description}
                      </p>

                      {/* Suggested Action Callout */}
                      <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-800/40 text-xs text-teal-300 flex items-start gap-2">
                        <Zap className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-teal-200">Recommended Next Step: </span>
                          {rec.suggestedAction}
                        </div>
                      </div>

                      {/* Evidence Card */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="font-medium text-slate-300 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-finteal-400" />
                          <span>Supporting Ledger Evidence:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-slate-400">
                          {evidenceParsed.invoiceAmount && (
                            <div>Invoice: <span className="text-white font-mono">{formatINR(evidenceParsed.invoiceAmount)}</span></div>
                          )}
                          {evidenceParsed.daysOverdue && (
                            <div>Overdue: <span className="text-amber-400 font-mono">{evidenceParsed.daysOverdue} days</span></div>
                          )}
                          {evidenceParsed.counterparty && (
                            <div className="truncate">Client: <span className="text-slate-200">{evidenceParsed.counterparty}</span></div>
                          )}
                          {evidenceParsed.monthlyAverage && (
                            <div>Monthly Run-Rate: <span className="text-white font-mono">{formatINR(evidenceParsed.monthlyAverage)}</span></div>
                          )}
                          {evidenceParsed.savingsRate && (
                            <div>Savings Rate: <span className="text-emerald-400 font-mono">{evidenceParsed.savingsRate}</span></div>
                          )}
                          {evidenceParsed.statutorySection && (
                            <div>Statutory: <span className="text-indigo-300">{evidenceParsed.statutorySection}</span></div>
                          )}
                        </div>
                      </div>

                      {rec.notes && (
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-finblue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-200">Review Notes: </span>
                            {rec.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex lg:flex-col items-center gap-2 justify-end lg:justify-start lg:min-w-[150px]">
                      {rec.id && (
                        <>
                          {rec.status !== "APPLIED" && (
                            <Button
                              size="sm"
                              disabled={actionInProgress}
                              onClick={() => handleAction(rec.id!, "apply")}
                              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              Mark Applied
                            </Button>
                          )}

                          {rec.status !== "DISMISSED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionInProgress}
                              onClick={() => handleAction(rec.id!, "dismiss")}
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
                              setNotesModalRec(rec);
                              setUserNotes(rec.notes || "");
                            }}
                            className="w-full text-xs text-finteal-400 hover:text-finteal-300 hover:bg-slate-800"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                            {rec.notes ? "Edit Notes" : "Add Notes"}
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
      {notesModalRec && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-navy-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-finteal-400" />
                Recommendation Strategy Notes
              </h3>
              <button onClick={() => setNotesModalRec(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              <div className="font-semibold text-white mb-1">{notesModalRec.title}</div>
              <p className="text-slate-400 text-[11px]">{notesModalRec.description}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Internal Implementation Notes
              </label>
              <textarea
                rows={4}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Log vendor contract discussions, collection status, or approved cost changes..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-white focus:outline-none focus:border-finteal-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotesModalRec(null)}
                className="text-xs border-slate-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionInProgress}
                onClick={() => handleAction(notesModalRec.id!, "save_notes", userNotes)}
                className="bg-finteal-500 hover:bg-finteal-600 text-white text-xs"
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
