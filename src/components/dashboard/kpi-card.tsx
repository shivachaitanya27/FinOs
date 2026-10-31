"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  amount: number | null;
  type: "revenue" | "expense" | "profit" | "cash" | "receivable" | "payable";
  trendPercentage?: number;
  trendLabel?: string;
  subtitle?: string;
  hasSufficientData?: boolean;
}

export function KPICard({
  title,
  amount,
  type,
  trendPercentage = 12.4,
  trendLabel = "vs prior period",
  subtitle,
  hasSufficientData = true,
}: KPICardProps) {
  // If net profit/loss or accounting data is insufficient
  if (amount === null || !hasSufficientData) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-400">
            <HelpCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="my-2">
          <p className="text-sm font-bold text-slate-900">
            Insufficient Accounting Data
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Reconcile statement entries to calculate accurate Net P&L.
          </p>
        </div>
      </div>
    );
  }

  // Icons and accent gradients based on KPI type
  const configs = {
    revenue: {
      icon: TrendingUp,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 shadow-xs",
      pillBg: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
      glow: "from-emerald-400/15 via-emerald-300/10 to-transparent",
      trendPositive: true,
    },
    expense: {
      icon: TrendingDown,
      iconBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 shadow-xs",
      pillBg: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40",
      glow: "from-purple-400/15 to-transparent",
      trendPositive: false,
    },
    profit: {
      icon: amount >= 0 ? TrendingUp : TrendingDown,
      iconBg:
        amount >= 0
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 shadow-xs"
          : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 shadow-xs",
      pillBg:
        amount >= 0
          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40"
          : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40",
      glow: amount >= 0 ? "from-emerald-400/15 to-transparent" : "from-rose-400/15 to-transparent",
      trendPositive: amount >= 0,
    },
    cash: {
      icon: Wallet,
      iconBg: "bg-purple-100/70 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/40 text-purple-800 dark:text-purple-200 shadow-xs",
      pillBg: "text-purple-800 dark:text-purple-200 bg-purple-100/70 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/40",
      glow: "from-purple-400/20 to-transparent",
      trendPositive: true,
    },
    receivable: {
      icon: ArrowUpRight,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 shadow-xs",
      pillBg: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
      glow: "from-emerald-400/15 to-transparent",
      trendPositive: true,
    },
    payable: {
      icon: ArrowDownRight,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 shadow-xs",
      pillBg: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
      glow: "from-amber-400/15 to-transparent",
      trendPositive: false,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-obsidian-900/90 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md hover:-translate-y-0.5 before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
      {/* Background Soft Ambient Light */}
      <div
        className={cn(
          "absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br blur-2xl opacity-40 transition-opacity duration-300 group-hover:opacity-75 pointer-events-none",
          config.glow
        )}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div
          className={cn(
            "p-2.5 rounded-xl border backdrop-blur-md transition-transform duration-200 group-hover:scale-105",
            config.iconBg
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="mt-3.5">
        <div className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
          {formatINR(amount)}
        </div>
        {subtitle && (
          <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold mt-1">{subtitle}</p>
        )}
      </div>

      {/* Trend or Status Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
        <div
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
            config.pillBg
          )}
        >
          {config.trendPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          <span>{trendPercentage}%</span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate ml-2 font-medium">
          {trendLabel}
        </span>
      </div>
    </div>
  );
}
