"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Unlink,
  Eye,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Copy,
  PlusCircle,
} from "lucide-react";

export default function ReconciliationPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Active Tab: "matched" | "unmatched_bank" | "unmatched_acc" | "duplicates"
  const [activeTab, setActiveTab] = useState<
    "matched" | "unmatched_bank" | "unmatched_acc" | "duplicates"
  >("matched");

  // Filters
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Modals state
  const [approvingPair, setApprovingPair] = useState<any | null>(null);
  const [rejectingPair, setRejectingPair] = useState<any | null>(null);
  const [unmatchingPair, setUnmatchingPair] = useState<any | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [selectedManualBankId, setSelectedManualBankId] = useState<string>("");
  const [selectedManualAccId, setSelectedManualAccId] = useState<string>("");
  const [manualMatchNotes, setManualMatchNotes] = useState<string>("");

  // Duplicate decision modal
  const [duplicateDecision, setDuplicateDecision] = useState<{
    tx: any;
    primaryTx?: any;
    actionType: "confirm" | "dismiss";
  } | null>(null);

  // Auto-run state
  const [isRunningAuto, setIsRunningAuto] = useState<boolean>(false);
  const [autoRunSuccessMsg, setAutoRunSuccessMsg] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  // Expanded matched row IDs
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchReconciliationData();
  }, [selectedAccountId, statusFilter, sourceFilter, startDate, endDate]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/business");
      const json = await res.json();
      if (json.business?.accounts) {
        setAccounts(json.business.accounts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      let url = `/api/reconciliation?accountId=${selectedAccountId}&status=${statusFilter}&source=${sourceFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load reconciliation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReconciliationData();
  };

  const toggleRowExpanded = (id: string) => {
    const next = new Set(expandedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRowIds(next);
  };

  // Run Auto-Reconciliation
  const handleRunAutoReconciliation = async (autoApprove: boolean = false) => {
    try {
      setIsRunningAuto(true);
      setAutoRunSuccessMsg(null);

      const res = await fetch("/api/reconciliation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoApproveHighConfidence: autoApprove,
          accountId: selectedAccountId !== "ALL" ? selectedAccountId : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Auto-run failed");

      setAutoRunSuccessMsg(
        `Auto-Reconciliation complete! Evaluated records, found ${json.matchedCount} matches (${json.autoApprovedCount} auto-approved).`
      );
      fetchReconciliationData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRunningAuto(false);
    }
  };

  // Execute Workflow Action
  const handleExecuteAction = async (payload: any) => {
    try {
      setActionInProgress(true);
      const res = await fetch("/api/reconciliation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");

      // Reset modals
      setApprovingPair(null);
      setRejectingPair(null);
      setUnmatchingPair(null);
      setIsManualModalOpen(false);
      setDuplicateDecision(null);

      fetchReconciliationData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const summary = data?.summary || {
    totalReviewed: 0,
    totalBankTransactions: 0,
    totalAccountingTransactions: 0,
    matchedCount: 0,
    unmatchedBankCount: 0,
    unmatchedAccountingCount: 0,
    potentialDuplicateCount: 0,
    matchedBankValue: 0,
    reconciliationPercentage: 0,
    highConfidenceCount: 0,
    mediumConfidenceCount: 0,
    manualReviewCount: 0,
  };

  const matchedPairs = data?.matchedPairs || [];
  const unmatchedBank = data?.unmatchedBank || [];
  const unmatchedAccounting = data?.unmatchedAccounting || [];
  const duplicateGroups = data?.duplicateGroups || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Scale className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Automated Bank Reconciliation & Audit Engine
            </h1>
            <Badge variant="purple" className="text-[10px] font-bold">
              Stage 3
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            2-way algorithmic matching between bank statement feeds and accounting ledgers (Tally, Zoho Books) with duplicate protection and confidence scoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="glass-purple"
            size="sm"
            onClick={() => handleRunAutoReconciliation(false)}
            disabled={isRunningAuto}
            className="border-purple-400/30 font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRunningAuto ? "animate-spin text-purple-600 dark:text-purple-400" : "text-purple-600 dark:text-purple-400"}`} />
            Run Matching Engine
          </Button>

          <Button
            variant="purple"
            size="sm"
            onClick={() => setIsManualModalOpen(true)}
            className="shadow-md shadow-purple-500/20 font-semibold"
          >
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
            Manual Match Pair
          </Button>
        </div>
      </div>

      {/* Auto-Run Success Banner */}
      {autoRunSuccessMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-800/80 bg-emerald-950/40 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{autoRunSuccessMsg}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAutoRunSuccessMsg(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* KPI Cards (6 Metrics strictly from real SQLite database records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Bank Tx */}
        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Bank Feeds</p>
          <p className="text-xl font-bold text-white mt-1">
            {summary.totalBankTransactions}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Imported Statements</p>
        </Card>

        {/* 2. Total Accounting Tx */}
        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <p className="text-[10px] uppercase font-bold text-slate-400">Accounting Books</p>
          <p className="text-xl font-bold text-white mt-1">
            {summary.totalAccountingTransactions}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tally & Zoho Ledgers</p>
        </Card>

        {/* 3. Matched Transactions */}
        <Card className="p-4 border-emerald-900/50 bg-emerald-950/20">
          <p className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Matched Pairs
          </p>
          <p className="text-xl font-bold text-emerald-300 mt-1">
            {summary.matchedCount}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">
            {formatINR(summary.matchedBankValue)}
          </p>
        </Card>

        {/* 4. Unmatched Transactions */}
        <Card className="p-4 border-amber-900/50 bg-amber-950/20">
          <p className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Unmatched
          </p>
          <p className="text-xl font-bold text-amber-300 mt-1">
            {summary.unmatchedBankCount + summary.unmatchedAccountingCount}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-0.5">
            {summary.unmatchedBankCount} Bank • {summary.unmatchedAccountingCount} Books
          </p>
        </Card>

        {/* 5. Potential Duplicates */}
        <Card className="p-4 border-rose-900/50 bg-rose-950/20">
          <p className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
            <Copy className="h-3 w-3" />
            Duplicates
          </p>
          <p className="text-xl font-bold text-rose-300 mt-1">
            {summary.potentialDuplicateCount}
          </p>
          <p className="text-[11px] text-rose-400/80 mt-0.5">Suspected Payments</p>
        </Card>

        {/* 6. Reconciliation Percentage */}
        <Card className="p-4 border-slate-800 bg-navy-900/70">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-slate-400">Reconciled</p>
            <span className="text-[10px] font-mono font-bold text-finteal-400">
              {summary.reconciliationPercentage}%
            </span>
          </div>
          <p className="text-xl font-bold text-finteal-300 mt-1">
            {summary.reconciliationPercentage}%
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-finteal-400 h-full transition-all duration-300"
              style={{ width: `${summary.reconciliationPercentage}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-navy-900/90 shadow-fin-card space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by narration, UTR, invoice ref, or counterparty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-800/90 border border-slate-700 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-finteal-400"
            />
          </form>

          {/* Account Filter */}
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-finteal-400"
          >
            <option value="ALL">All Bank Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-finteal-400"
          >
            <option value="ALL">All Match Statuses</option>
            <option value="APPROVED">Approved / Reconciled</option>
            <option value="SUGGESTED">Suggested Matches</option>
            <option value="UNMATCHED">Unmatched Only</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-finteal-400"
          >
            <option value="ALL">All Sources</option>
            <option value="BANK_STATEMENT">Bank Statement</option>
            <option value="TALLY">Tally Prime</option>
            <option value="ZOHO_BOOKS">Zoho Books</option>
            <option value="MANUAL">Manual Entries</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-finteal-400" /> Filter Date Window:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-finteal-400 font-mono"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-finteal-400 font-mono"
          />
          {(startDate || endDate || search || selectedAccountId !== "ALL" || statusFilter !== "ALL" || sourceFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearch("");
                setSelectedAccountId("ALL");
                setStatusFilter("ALL");
                setSourceFilter("ALL");
              }}
              className="text-slate-400 hover:text-white"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* 4 Dedicated Tabs */}
      <div className="border-b border-slate-800 flex gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("matched")}
          className={`pb-3 px-1 transition-colors relative flex items-center gap-2 ${
            activeTab === "matched"
              ? "text-finteal-400 border-b-2 border-finteal-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Matched Transactions ({matchedPairs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unmatched_bank")}
          className={`pb-3 px-1 transition-colors relative flex items-center gap-2 ${
            activeTab === "unmatched_bank"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Unmatched Bank Feeds ({unmatchedBank.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unmatched_acc")}
          className={`pb-3 px-1 transition-colors relative flex items-center gap-2 ${
            activeTab === "unmatched_acc"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          Unmatched Accounting Books ({unmatchedAccounting.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("duplicates")}
          className={`pb-3 px-1 transition-colors relative flex items-center gap-2 ${
            activeTab === "duplicates"
              ? "text-rose-400 border-b-2 border-rose-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Copy className="h-4 w-4" />
          Potential Duplicates ({duplicateGroups.length})
        </button>
      </div>

      {/* TAB A: MATCHED TRANSACTIONS */}
      {activeTab === "matched" && (
        <Card className="border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Paired Bank & Accounting Records</CardTitle>
              <CardDescription>
                Algorithmic 2-way matches with confidence scoring, evidence breakdown, and approval status
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="teal" className="text-[10px]">
                {summary.highConfidenceCount} High Conf
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {summary.mediumConfidenceCount} Medium Conf
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin text-finteal-400" />
                Calculating 2-way algorithmic reconciliation matches...
              </div>
            ) : matchedPairs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <p>No matched transactions found for the current filters.</p>
                <Button variant="outline" size="sm" onClick={() => handleRunAutoReconciliation(false)}>
                  Run Matching Algorithm
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {matchedPairs.map((pair: any) => {
                  const isExpanded = expandedRowIds.has(pair.id);
                  const isApproved = pair.status === "APPROVED" || pair.status === "MANUAL_MATCH";
                  const score = pair.matchScore || pair.evidence.totalScore;
                  const confidence = pair.evidence.confidence;

                  return (
                    <div key={pair.id} className="p-4 hover:bg-slate-900/40 transition-colors">
                      {/* Main Comparison Row */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Side-by-Side Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                          {/* Bank Statement Card */}
                          <div className="p-3 rounded-xl border border-blue-900/40 bg-blue-950/20 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-blue-300 font-bold uppercase mb-1">
                              <span>Bank Statement Entry</span>
                              <Badge variant="outline" className="text-[9px]">
                                {pair.bankTransaction.source}
                              </Badge>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-white">
                                  {pair.bankTransaction.description}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                  Date: {formatDate(pair.bankTransaction.date)} • Ref:{" "}
                                  {pair.bankTransaction.referenceNumber || "-"}
                                </p>
                              </div>
                              <span
                                className={`font-mono font-bold whitespace-nowrap text-sm ${
                                  pair.bankTransaction.type === "REVENUE"
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {formatINR(pair.bankTransaction.amount)}
                              </span>
                            </div>
                          </div>

                          {/* Accounting Book Card */}
                          <div className="p-3 rounded-xl border border-finteal-900/40 bg-finteal-950/20 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-finteal-300 font-bold uppercase mb-1">
                              <span>Accounting Ledger Entry</span>
                              <Badge variant="outline" className="text-[9px]">
                                {pair.accountingTransaction.source || "Tally"}
                              </Badge>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-white">
                                  {pair.accountingTransaction.description}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                  Date: {formatDate(pair.accountingTransaction.date)} • Ref:{" "}
                                  {pair.accountingTransaction.referenceNumber || "-"}
                                </p>
                              </div>
                              <span
                                className={`font-mono font-bold whitespace-nowrap text-sm ${
                                  pair.accountingTransaction.type === "REVENUE"
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {formatINR(pair.accountingTransaction.amount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score & Actions */}
                        <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800">
                          {/* Score Pill */}
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Badge
                                variant={
                                  confidence === "HIGH_CONFIDENCE"
                                    ? "success"
                                    : confidence === "MEDIUM_CONFIDENCE"
                                    ? "warning"
                                    : "outline"
                                }
                                className="font-mono text-xs font-bold"
                              >
                                {score}% Match
                              </Badge>
                              {isApproved ? (
                                <Badge variant="teal" className="text-[10px]">
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  Suggested
                                </Badge>
                              )}
                            </div>
                            <button
                              onClick={() => toggleRowExpanded(pair.id)}
                              className="text-[11px] text-finteal-400 hover:text-finteal-300 flex items-center gap-1 mt-1 justify-end ml-auto"
                            >
                              <span>{isExpanded ? "Hide Evidence" : "View Evidence"}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            {!isApproved ? (
                              <>
                                <Button
                                  variant="teal"
                                  size="sm"
                                  onClick={() => setApprovingPair(pair)}
                                  disabled={actionInProgress}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRejectingPair(pair)}
                                  disabled={actionInProgress}
                                >
                                  <XCircle className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUnmatchingPair(pair)}
                                disabled={actionInProgress}
                                className="text-slate-400 hover:text-red-300"
                              >
                                <Unlink className="h-3.5 w-3.5 mr-1" />
                                Unmatch
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Evidence Details */}
                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                          <p className="font-bold text-white text-[11px]">Matching Scoring Breakdown:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
                              <span className="text-slate-400">Reference Match:</span>
                              <p className="font-mono font-bold text-finteal-400">
                                +{pair.evidence.referenceScore} / 40 pts
                              </p>
                            </div>
                            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
                              <span className="text-slate-400">Exact Amount:</span>
                              <p className="font-mono font-bold text-emerald-400">
                                +{pair.evidence.amountScore} / 30 pts
                              </p>
                            </div>
                            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
                              <span className="text-slate-400">Date Proximity:</span>
                              <p className="font-mono font-bold text-blue-400">
                                +{pair.evidence.dateScore} / 20 pts
                              </p>
                            </div>
                            <div className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
                              <span className="text-slate-400">Description Match:</span>
                              <p className="font-mono font-bold text-purple-400">
                                +{pair.evidence.descriptionScore} / 10 pts
                              </p>
                            </div>
                          </div>

                          {pair.evidence.reasons.length > 0 && (
                            <div className="pt-1">
                              <p className="text-[10px] uppercase font-bold text-slate-400">
                                Matching Justifications:
                              </p>
                              <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5 mt-0.5">
                                {pair.evidence.reasons.map((r: string, idx: number) => (
                                  <li key={idx}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pair.evidence.discrepancies.length > 0 && (
                            <div className="pt-1 text-amber-300 text-[11px]">
                              <p className="text-[10px] uppercase font-bold text-amber-400">
                                Identified Discrepancies / Float:
                              </p>
                              <ul className="list-disc list-inside space-y-0.5 mt-0.5">
                                {pair.evidence.discrepancies.map((d: string, idx: number) => (
                                  <li key={idx}>{d}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB B: UNMATCHED BANK FEEDS */}
      {activeTab === "unmatched_bank" && (
        <Card className="border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Unmatched Bank Transactions</CardTitle>
              <CardDescription>
                Transactions recorded in your bank statement that have no corresponding accounting voucher
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-amber-400 border-amber-800">
              {unmatchedBank.length} Items Unmatched
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {unmatchedBank.length === 0 ? (
              <div className="p-12 text-center text-xs text-emerald-400">
                Zero unmatched bank transactions. All statement lines are reconciled!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/70 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold">Bank Narration</th>
                      <th className="py-2.5 px-4 font-semibold">Account</th>
                      <th className="py-2.5 px-4 font-semibold">Reference / UTR</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Amount (₹)</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {unmatchedBank.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-300">{formatDate(tx.date)}</td>
                        <td className="py-3 px-4 text-white font-sans font-medium">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans">{tx.account?.name || "Operating A/c"}</td>
                        <td className="py-3 px-4 text-slate-400">{tx.referenceNumber || "-"}</td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            tx.type === "REVENUE" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatINR(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => {
                              setSelectedManualBankId(tx.id);
                              setIsManualModalOpen(true);
                            }}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Match
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB C: UNMATCHED ACCOUNTING BOOKS */}
      {activeTab === "unmatched_acc" && (
        <Card className="border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Unmatched Accounting Records</CardTitle>
              <CardDescription>
                Journals, bills, and sales invoices recorded in ERP books that have not yet cleared in the bank
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-blue-400 border-blue-800">
              {unmatchedAccounting.length} Items Unmatched
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {unmatchedAccounting.length === 0 ? (
              <div className="p-12 text-center text-xs text-emerald-400">
                Zero unmatched accounting transactions. All ledger entries are reconciled!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/70 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold">Ledger Narration</th>
                      <th className="py-2.5 px-4 font-semibold">Category</th>
                      <th className="py-2.5 px-4 font-semibold">Source</th>
                      <th className="py-2.5 px-4 font-semibold">Reference</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Amount (₹)</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {unmatchedAccounting.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-300">{formatDate(tx.date)}</td>
                        <td className="py-3 px-4 text-white font-sans font-medium">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans">{tx.category}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-[10px]">
                            {tx.source}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{tx.referenceNumber || "-"}</td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            tx.type === "REVENUE" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatINR(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => {
                              setSelectedManualAccId(tx.id);
                              setIsManualModalOpen(true);
                            }}
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Match
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB D: POTENTIAL DUPLICATES */}
      {activeTab === "duplicates" && (
        <Card className="border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="h-4 w-4 text-rose-400" />
                Duplicate Payment Detection & Auditing
              </CardTitle>
              <CardDescription>
                Identified suspect payments with identical reference numbers, amounts, or descriptions within 48 hours
              </CardDescription>
            </div>
            <span className="text-xs text-rose-400 font-mono font-semibold">
              {duplicateGroups.length} Suspect Clusters
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {duplicateGroups.length === 0 ? (
              <div className="p-12 text-center text-xs text-emerald-400 space-y-1">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-white">No Duplicate Anomalies Detected</p>
                <p className="text-slate-400">All payments and vouchers have distinct evidence and reference IDs.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 p-4 space-y-4">
                {duplicateGroups.map((group: any) => (
                  <div
                    key={group.id}
                    className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            group.classification === "HIGH_PROBABILITY"
                              ? "destructive"
                              : "warning"
                          }
                          className="font-mono text-xs font-bold"
                        >
                          {group.classification.replace(/_/g, " ")} ({group.confidenceScore}%)
                        </Badge>
                        <span className="text-xs font-bold text-white">
                          Potential Duplicate of: {formatINR(group.primaryTransaction.amount)}
                        </span>
                      </div>

                      <span className="text-xs font-mono text-slate-400">
                        Suspect Value: {formatINR(group.totalAmount)}
                      </span>
                    </div>

                    {/* Evidence List */}
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <p className="text-[10px] uppercase font-bold text-rose-300 mb-1">
                        Algorithmic Duplicate Evidence:
                      </p>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                        {group.evidence.map((ev: string, idx: number) => (
                          <li key={idx}>{ev}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Transactions in Cluster */}
                    <div className="space-y-2">
                      {/* Primary Tx */}
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 mr-2">
                            Original Record
                          </span>
                          <span className="font-semibold text-white">
                            {group.primaryTransaction.description}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            Date: {formatDate(group.primaryTransaction.date)} • Ref:{" "}
                            {group.primaryTransaction.referenceNumber || "-"}
                          </p>
                        </div>
                        <span className="font-bold text-white font-mono">
                          {formatINR(group.primaryTransaction.amount)}
                        </span>
                      </div>

                      {/* Duplicate Txs */}
                      {group.duplicateTransactions.map((dupTx: any) => (
                        <div
                          key={dupTx.id}
                          className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-300 mr-2">
                              Suspect Duplicate
                            </span>
                            <span className="font-semibold text-white">
                              {dupTx.description}
                            </span>
                            <p className="text-[11px] text-rose-200/80 mt-0.5 font-mono">
                              Date: {formatDate(dupTx.date)} • Ref: {dupTx.referenceNumber || "-"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-bold text-rose-300 font-mono">
                              {formatINR(dupTx.amount)}
                            </span>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                setDuplicateDecision({
                                  tx: dupTx,
                                  primaryTx: group.primaryTransaction,
                                  actionType: "confirm",
                                })
                              }
                            >
                              Flag Duplicate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setDuplicateDecision({
                                  tx: dupTx,
                                  actionType: "dismiss",
                                })
                              }
                            >
                              Confirm Legitimate
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* APPROVE MATCH CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(approvingPair)}
        onClose={() => setApprovingPair(null)}
        title="Authorize Reconciliation Match"
        description="Confirm and lock the paired transactions as reconciled in the official SQLite ledger."
      >
        {approvingPair && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3.5 rounded-xl border border-emerald-800/80 bg-emerald-950/30 text-emerald-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Algorithmic Confidence:</span>
                <Badge variant="success" className="font-mono">
                  {approvingPair.matchScore || approvingPair.evidence.totalScore}%
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-emerald-300">
                Both transactions will be marked as RECONCILED and cross-linked for audit tracking.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Bank Entry</span>
                <p className="text-white font-semibold mt-0.5">{approvingPair.bankTransaction.description}</p>
                <p className="font-mono text-slate-400 text-[11px] mt-0.5">
                  {formatDate(approvingPair.bankTransaction.date)} • {formatINR(approvingPair.bankTransaction.amount)}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Accounting Entry</span>
                <p className="text-white font-semibold mt-0.5">{approvingPair.accountingTransaction.description}</p>
                <p className="font-mono text-slate-400 text-[11px] mt-0.5">
                  {formatDate(approvingPair.accountingTransaction.date)} • {formatINR(approvingPair.accountingTransaction.amount)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setApprovingPair(null)}>
                Cancel
              </Button>
              <Button
                variant="teal"
                size="sm"
                onClick={() =>
                  handleExecuteAction({
                    action: "approve_match",
                    bankTransactionId: approvingPair.bankTransaction.id,
                    accountingTransactionId: approvingPair.accountingTransaction.id,
                    matchScore: approvingPair.matchScore || approvingPair.evidence.totalScore,
                    reasons: approvingPair.evidence.reasons,
                  })
                }
                disabled={actionInProgress}
              >
                {actionInProgress ? "Authorizing..." : "Confirm & Reconcile"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* REJECT MATCH CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(rejectingPair)}
        onClose={() => setRejectingPair(null)}
        title="Reject Match Suggestion"
        description="Dismiss this pairing suggestion and keep both transactions in the unmatched queue."
      >
        {rejectingPair && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Are you sure you want to reject the suggested match between{" "}
              <span className="text-white font-semibold">"{rejectingPair.bankTransaction.description}"</span>{" "}
              and{" "}
              <span className="text-white font-semibold">"{rejectingPair.accountingTransaction.description}"</span>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setRejectingPair(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  handleExecuteAction({
                    action: "reject_match",
                    bankTransactionId: rejectingPair.bankTransaction.id,
                    accountingTransactionId: rejectingPair.accountingTransaction.id,
                    reconciliationRecordId: rejectingPair.id.startsWith("REC-") ? undefined : rejectingPair.id,
                  })
                }
                disabled={actionInProgress}
              >
                {actionInProgress ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* UNMATCH CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(unmatchingPair)}
        onClose={() => setUnmatchingPair(null)}
        title="Unmatch Reconciled Pair"
        description="Break this reconciliation link and restore both records to the active ledger."
      >
        {unmatchingPair && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              This will remove the official reconciliation link between the bank feed and accounting record.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setUnmatchingPair(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  handleExecuteAction({
                    action: "unmatch",
                    reconciliationRecordId: unmatchingPair.id.startsWith("REC-") ? undefined : unmatchingPair.id,
                    transactionId: unmatchingPair.bankTransaction.id,
                  })
                }
                disabled={actionInProgress}
              >
                {actionInProgress ? "Unmatching..." : "Confirm Unmatch"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MANUAL MATCH MODAL */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Manual Transaction Reconciliation Match"
        description="Select one unmatched bank statement entry and one unmatched accounting ledger entry to pair."
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Unmatched Bank Entries */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-bold uppercase text-[10px]">
                1. Select Bank Statement Feed ({unmatchedBank.length})
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 border border-slate-800 rounded-xl bg-slate-900/70">
                {unmatchedBank.length === 0 ? (
                  <p className="p-4 text-slate-500 text-center">No unmatched bank feeds.</p>
                ) : (
                  unmatchedBank.map((b: any) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedManualBankId(b.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        selectedManualBankId === b.id
                          ? "bg-finteal-950/60 border-finteal-500 ring-1 ring-finteal-500/50"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span className="truncate max-w-[150px]">{b.description}</span>
                        <span className="font-mono text-emerald-400">{formatINR(b.amount)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {formatDate(b.date)} • Ref: {b.referenceNumber || "-"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Unmatched Accounting Entries */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-bold uppercase text-[10px]">
                2. Select Accounting Voucher ({unmatchedAccounting.length})
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 border border-slate-800 rounded-xl bg-slate-900/70">
                {unmatchedAccounting.length === 0 ? (
                  <p className="p-4 text-slate-500 text-center">No unmatched accounting books.</p>
                ) : (
                  unmatchedAccounting.map((a: any) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedManualAccId(a.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        selectedManualAccId === a.id
                          ? "bg-finteal-950/60 border-finteal-500 ring-1 ring-finteal-500/50"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span className="truncate max-w-[150px]">{a.description}</span>
                        <span className="font-mono text-emerald-400">{formatINR(a.amount)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {formatDate(a.date)} • {a.category}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Audit Justification / Reconciliation Memo
            </label>
            <input
              type="text"
              placeholder="e.g. Cleared via Cheque deposit with 3-day float tolerance"
              value={manualMatchNotes}
              onChange={(e) => setManualMatchNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-finteal-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              size="sm"
              disabled={!selectedManualBankId || !selectedManualAccId || actionInProgress}
              onClick={() =>
                handleExecuteAction({
                  action: "manual_match",
                  bankTransactionId: selectedManualBankId,
                  accountingTransactionId: selectedManualAccId,
                  notes: manualMatchNotes,
                })
              }
            >
              {actionInProgress ? "Authorizing..." : "Authorize Manual Match"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DUPLICATE DECISION MODAL */}
      <Modal
        isOpen={Boolean(duplicateDecision)}
        onClose={() => setDuplicateDecision(null)}
        title={
          duplicateDecision?.actionType === "confirm"
            ? "Confirm & Flag Duplicate Payment"
            : "Confirm Legitimate Transaction"
        }
        description="Update transaction audit flags and prevent false duplicate reporting."
      >
        {duplicateDecision && (
          <div className="space-y-4 text-xs font-sans">
            {duplicateDecision.actionType === "confirm" ? (
              <div className="p-3.5 rounded-xl border border-red-900/60 bg-red-950/20 text-red-200">
                <p className="font-semibold text-white mb-1">Warning: Flagging Duplicate</p>
                <p>
                  This record will be flagged as an anomalous duplicate payment of{" "}
                  <span className="font-bold text-white">
                    {formatINR(duplicateDecision.tx.amount)}
                  </span>
                  . It will remain in the database for financial recovery or vendor credit memo.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-900/60 bg-emerald-950/20 text-emerald-200">
                <p className="font-semibold text-white mb-1">Confirming as Legitimate</p>
                <p>
                  This transaction will be marked as a verified, legitimate distinct payment (e.g. recurring retainer or separate invoice).
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <p>
                <span className="text-slate-400">Description:</span> {duplicateDecision.tx.description}
              </p>
              <p>
                <span className="text-slate-400">Date:</span> {formatDate(duplicateDecision.tx.date)}
              </p>
              <p>
                <span className="text-slate-400">Amount:</span> {formatINR(duplicateDecision.tx.amount)}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDuplicateDecision(null)}>
                Cancel
              </Button>
              <Button
                variant={duplicateDecision.actionType === "confirm" ? "danger" : "teal"}
                size="sm"
                onClick={() =>
                  handleExecuteAction({
                    action:
                      duplicateDecision.actionType === "confirm"
                        ? "confirm_duplicate"
                        : "dismiss_duplicate",
                    transactionId: duplicateDecision.tx.id,
                    primaryTransactionId: duplicateDecision.primaryTx?.id,
                  })
                }
                disabled={actionInProgress}
              >
                {actionInProgress
                  ? "Saving..."
                  : duplicateDecision.actionType === "confirm"
                  ? "Flag as Duplicate"
                  : "Confirm Legitimate"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
