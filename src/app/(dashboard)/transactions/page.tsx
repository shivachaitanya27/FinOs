"use client";

import React, { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { QuickActions } from "@/components/dashboard/quick-actions";
import {
  Search,
  Receipt,
  Download,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Building2,
  Database,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  CreditCard,
  Hash,
  Tag,
  Clock,
} from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sorting
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected Transaction for Read-Only Details Modal
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const categories = [
    "ALL",
    "Sales & Services",
    "Payroll & Salaries",
    "Cloud & Software",
    "Office Rent",
    "Marketing & Growth",
    "Legal & Accounting",
    "Logistics",
    "Taxes & Duties",
    "Loans & Borrowings",
    "Internal Transfer",
    "Miscellaneous",
  ];

  useEffect(() => {
    fetchTransactions();
  }, [page, limit, typeFilter, categoryFilter, sourceFilter, statusFilter, sortBy, sortOrder, startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = `/api/transactions?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (typeFilter !== "ALL") url += `&type=${typeFilter}`;
      if (categoryFilter !== "ALL") url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (sourceFilter !== "ALL") url += `&source=${sourceFilter}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url);
      const data = await res.json();

      setTransactions(data.transactions || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleExportCSV = () => {
    let url = `/api/transactions?export=csv&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    if (typeFilter !== "ALL") url += `&type=${typeFilter}`;
    if (categoryFilter !== "ALL") url += `&category=${encodeURIComponent(categoryFilter)}`;
    if (sourceFilter !== "ALL") url += `&source=${sourceFilter}`;
    if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `FinOS_Transactions_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECONCILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            {status}
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
      case "UNMATCHED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Unmatched
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner: Glassmorphic Light */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Financial Transactions Ledger
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
              <Lock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              Immutable Ledger • Read-Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Complete synchronized records from Indian bank feeds, payment gateways, and accounting journals. In compliance with statutory audit standards, all recorded entries are cryptographically sealed.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="glass" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5 text-purple-600 dark:text-purple-400" />
            Export CSV
          </Button>
          <QuickActions onTransactionAdded={fetchTransactions} />
        </div>
      </div>

      {/* Compliance Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-sky-500 text-white shadow-xs">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sky-900">Audit Trail Integrity Enforced: </span>
            <span className="text-sky-800">
              Per Ind AS and Companies Act 2013, recorded ledger transactions cannot be edited or deleted. Adjustments are posted as separate contra entries.
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-sky-700 bg-white/80 px-2 py-0.5 rounded-lg border border-sky-200 whitespace-nowrap">
          Ind AS Compliant
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm space-y-3">
        {/* Row 1: Search & Core Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search narration, reference, counterparty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium"
            />
          </form>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium"
          >
            <option value="ALL">All Types</option>
            <option value="REVENUE">Revenue (Inflows)</option>
            <option value="EXPENSE">Expense (Outflows)</option>
            <option value="TRANSFER">Inter-Account Transfers</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "All Categories" : c}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium"
          >
            <option value="ALL">All Sources</option>
            <option value="BANK_STATEMENT">Bank Statement</option>
            <option value="TALLY">Tally Prime</option>
            <option value="ZOHO_BOOKS">Zoho Books</option>
            <option value="MANUAL">Manual Entry</option>
          </select>
        </div>

        {/* Row 2: Date Range Filter & Limit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-sky-600" /> Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
            />
            {(startDate || endDate || search || typeFilter !== "ALL" || categoryFilter !== "ALL" || sourceFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSearch("");
                  setTypeFilter("ALL");
                  setCategoryFilter("ALL");
                  setSourceFilter("ALL");
                  setPage(1);
                }}
                className="text-slate-600 hover:text-slate-900"
              >
                Reset Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="rounded-lg bg-white border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-sky-500"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-600" />
            <p className="text-xs font-medium">Fetching immutable ledger records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">
              Adjust your search filters or import statement records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider">
                    ID
                  </th>
                  <th
                    className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider cursor-pointer hover:text-sky-600"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-[10px] uppercase font-bold tracking-wider">
                    Description & Ref
                  </th>
                  <th className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider">
                    Category
                  </th>
                  <th className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider">
                    Type
                  </th>
                  <th className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider">
                    Account
                  </th>
                  <th className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider">
                    Source
                  </th>
                  <th className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider">
                    Status
                  </th>
                  <th
                    className="py-3 px-4 text-[10px] uppercase font-bold tracking-wider text-right cursor-pointer hover:text-sky-600"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-[10px] uppercase font-bold tracking-wider text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isRevenue = tx.type === "REVENUE";
                  const isTransfer = tx.type === "TRANSFER";
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-sky-50/40 transition-colors group cursor-pointer"
                    >
                      {/* Transaction ID */}
                      <td className="py-3 px-3 text-slate-400 text-[10px] font-mono whitespace-nowrap">
                        #{tx.id.slice(-6)}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-medium">
                        {formatDate(tx.date)}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 min-w-[220px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                            {tx.description}
                          </span>
                          {tx.isUnusual && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] border border-amber-200 font-semibold font-mono">
                              <AlertCircle className="h-2.5 w-2.5" /> Unusual
                            </span>
                          )}
                          {tx.isDuplicate && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] border border-rose-200 font-semibold font-mono">
                              <Copy className="h-2.5 w-2.5" /> Duplicate
                            </span>
                          )}
                        </div>
                        {tx.referenceNumber && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {tx.referenceNumber}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                          {tx.category}
                        </span>
                      </td>

                      {/* Transaction Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isRevenue
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isTransfer
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      {/* Account */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px] font-medium">
                        {tx.account?.name || "Operating A/c"}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {tx.source || "MANUAL"}
                        </span>
                      </td>

                      {/* Import Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(tx.importStatus || tx.status)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap font-mono">
                        <div className="flex items-center justify-end gap-1">
                          {isRevenue ? (
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                          ) : isTransfer ? (
                            <ArrowUpDown className="h-3 w-3 text-blue-600" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-rose-600" />
                          )}
                          <span
                            className={
                              isRevenue
                                ? "text-emerald-700 font-extrabold"
                                : isTransfer
                                ? "text-blue-700 font-extrabold"
                                : "text-slate-900 font-extrabold"
                            }
                          >
                            {formatINR(tx.amount)}
                          </span>
                        </div>
                      </td>

                      {/* View Only Action Button */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Button
                          variant="white"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="h-7 px-2.5 text-xs text-sky-700 border-sky-200 hover:bg-sky-50 shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-sky-600" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, totalCount)} of {totalCount} immutable records
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="white"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-slate-200"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="px-3 py-1 font-mono font-bold text-slate-800">
              {page} / {totalPages}
            </span>
            <Button
              variant="white"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border-slate-200"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* READ-ONLY TRANSACTION DETAILS PORTAL MODAL */}
      <Modal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title="Transaction Ledger Inspection"
        description="Statutory audit and verified record details. This transaction is permanently locked in the immutable database ledger."
      >
        {selectedTx && (
          <div className="space-y-4 text-xs">
            {/* Header Status Card */}
            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Total Ledger Impact
                </span>
                <p className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  {formatINR(selectedTx.amount)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedTx.type === "REVENUE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : selectedTx.type === "TRANSFER"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {selectedTx.type === "REVENUE"
                    ? "Revenue (Inflow)"
                    : selectedTx.type === "TRANSFER"
                    ? "Transfer (Inter-account)"
                    : "Expense (Outflow)"}
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Status: {selectedTx.status || "COMPLETED"}
                </p>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Transaction Date
                </p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {formatDate(selectedTx.date)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Accounting Category
                </p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedTx.category}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Reference / UTR
                </p>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">
                  {selectedTx.referenceNumber || "N/A (Cash/Internal)"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Payment Method
                </p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedTx.paymentMethod || "Direct Transfer"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Counterparty / Vendor
                </p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedTx.counterparty || "Unspecified Counterparty"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Ingestion Feed Source
                </p>
                <p className="font-semibold text-sky-700 mt-0.5">
                  {selectedTx.source || "Manual Entry Voucher"}
                </p>
              </div>
            </div>

            {/* Narration */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Description / Narration
              </p>
              <p className="text-slate-800 font-medium leading-relaxed">
                {selectedTx.description}
              </p>
            </div>

            {/* Regulatory Lock Seal */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-2">
              <Lock className="h-4 w-4 text-sky-600 shrink-0" />
              <span className="text-[11px] leading-tight">
                <strong>Immutable Financial Record:</strong> This entry is locked in compliance with statutory audit standards. Modifications and deletions are strictly disabled.
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="sky"
                size="sm"
                onClick={() => setSelectedTx(null)}
              >
                Close Inspection
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
