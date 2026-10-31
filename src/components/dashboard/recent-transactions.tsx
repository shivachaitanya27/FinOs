"use client";

import React from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, AlertCircle, Copy, ExternalLink } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  status: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  counterparty: string | null;
  isUnusual: boolean;
  isDuplicate: boolean;
  account?: { name: string } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        No recent transactions found. Click "Reload Demo Data" to load records.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECONCILED":
        return <Badge variant="success">Completed</Badge>;
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "UNMATCHED":
        return <Badge variant="destructive">Unmatched</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Description / Entity</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4 hidden md:table-cell">Account</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {transactions.map((tx) => {
            const isRevenue = tx.type === "REVENUE";
            return (
              <tr
                key={tx.id}
                className="hover:bg-slate-800/30 transition-colors group"
              >
                {/* Date */}
                <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                  {formatDate(tx.date)}
                </td>

                {/* Description & Flags */}
                <td className="py-3.5 px-4 min-w-[200px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-white group-hover:text-finteal-300 transition-colors">
                      {tx.description}
                    </span>
                    {tx.isUnusual && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 text-[10px] border border-amber-800 font-semibold">
                        <AlertCircle className="h-2.5 w-2.5" /> Unusual Spike
                      </span>
                    )}
                    {tx.isDuplicate && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-red-950/80 text-red-400 text-[10px] border border-red-800 font-semibold">
                        <Copy className="h-2.5 w-2.5" /> Duplicate Suspect
                      </span>
                    )}
                  </div>
                  {tx.counterparty && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {tx.counterparty} • {tx.paymentMethod || "Direct"}
                    </p>
                  )}
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="px-2 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                    {tx.category}
                  </span>
                </td>

                {/* Financial Account */}
                <td className="py-3.5 px-4 text-slate-400 hidden md:table-cell whitespace-nowrap">
                  {tx.account?.name || "Primary Bank"}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {getStatusBadge(tx.status)}
                </td>

                {/* Amount */}
                <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {isRevenue ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-slate-400" />
                    )}
                    <span
                      className={
                        isRevenue ? "text-emerald-400" : "text-slate-100"
                      }
                    >
                      {formatINR(tx.amount)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-4">
        <span>Showing latest 10 database records</span>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 text-finteal-400 hover:text-finteal-300 font-medium"
        >
          View All Transactions
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
