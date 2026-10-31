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
      iconBg: "bg-sky-50 border-sky-200 text-sky-700 shadow-xs",
      pillBg: "text-sky-700 bg-sky-50 border-sky-200",
      glow: "from-sky-400/15 via-sky-300/10 to-transparent",
      trendPositive: true,
    },
    expense: {
      icon: TrendingDown,
      iconBg: "bg-blue-50 border-blue-200 text-blue-700 shadow-xs",
      pillBg: "text-blue-700 bg-blue-50 border-blue-200",
      glow: "from-blue-400/15 to-transparent",
      trendPositive: false,
    },
    profit: {
      icon: amount >= 0 ? TrendingUp : TrendingDown,
      iconBg:
        amount >= 0
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs"
          : "bg-rose-50 border-rose-200 text-rose-700 shadow-xs",
      pillBg:
        amount >= 0
          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
          : "text-rose-700 bg-rose-50 border-rose-200",
      glow: amount >= 0 ? "from-emerald-400/15 to-transparent" : "from-rose-400/15 to-transparent",
      trendPositive: amount >= 0,
    },
    cash: {
      icon: Wallet,
      iconBg: "bg-sky-100/70 border-sky-200 text-sky-800 shadow-xs",
      pillBg: "text-sky-800 bg-sky-100/70 border-sky-200",
      glow: "from-sky-300/20 to-transparent",
      trendPositive: true,
    },
    receivable: {
      icon: ArrowUpRight,
      iconBg: "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs",
      pillBg: "text-indigo-700 bg-indigo-50 border-indigo-200",
      glow: "from-indigo-400/15 to-transparent",
      trendPositive: true,
    },
    payable: {
      icon: ArrowDownRight,
      iconBg: "bg-amber-50 border-amber-200 text-amber-700 shadow-xs",
      pillBg: "text-amber-700 bg-amber-50 border-amber-200",
      glow: "from-amber-400/15 to-transparent",
      trendPositive: false,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600">
      {/* Background Soft Ambient Light */}
      <div
        className={cn(
          "absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br blur-2xl opacity-40 transition-opacity duration-300 group-hover:opacity-75 pointer-events-none",
          config.glow
        )}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
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
        <div className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 font-mono">
          {formatINR(amount)}
        </div>
        {subtitle && (
          <p className="text-[11px] text-sky-700 font-semibold mt-1">{subtitle}</p>
        )}
      </div>

      {/* Trend or Status Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
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
        <span className="text-[11px] text-slate-500 truncate ml-2 font-medium">
          {trendLabel}
        </span>
      </div>
    </div>
  );
}
