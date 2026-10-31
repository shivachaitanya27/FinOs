"use client";

import React from "react";
import { ShieldCheck, Zap, Activity, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HealthProps {
  score: number;
  runwayMonths: string;
  quickRatio: string;
  grossMargin: number;
  status: string;
}

export function FinancialHealthCard({
  score,
  runwayMonths,
  quickRatio,
  grossMargin,
  status,
}: HealthProps) {
  const getStatusColor = (s: number) => {
    if (s >= 80) return "text-emerald-400";
    if (s >= 60) return "text-finteal-400";
    return "text-amber-400";
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-fin-card backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-finteal-950/80 border border-finteal-800/60 text-finteal-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Financial Health Index</h4>
            <p className="text-[11px] text-slate-400">Real-time solvency & liquidity model</p>
          </div>
        </div>
        <Badge variant={score >= 75 ? "teal" : "warning"}>
          {status} Solvency
        </Badge>
      </div>

      {/* Main Score Radial Bar */}
      <div className="py-5 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-extrabold tracking-tight font-sans ${getStatusColor(score)}`}>
              {score}
            </span>
            <span className="text-sm text-slate-500 font-bold">/100</span>
          </div>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Capital Stability Rating
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Based on cash reserves, working capital & margins
          </p>
        </div>

        {/* Progress pill visual */}
        <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
          <div
            className="absolute inset-0 rounded-full border-4 border-finteal-400 border-t-transparent animate-spin-slow"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 85%)" }}
          />
          <Activity className="h-6 w-6 text-finteal-400" />
        </div>
      </div>

      {/* Core Ratio Grid */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/70 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-semibold">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>Cash Runway</span>
          </div>
          <p className="text-base font-bold text-white mt-1">{runwayMonths} mo</p>
          <p className="text-[10px] text-emerald-400">Healthy Buffer</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-semibold">
            <Layers className="h-3 w-3 text-blue-400" />
            <span>Quick Ratio</span>
          </div>
          <p className="text-base font-bold text-white mt-1">{quickRatio}x</p>
          <p className="text-[10px] text-slate-400">Target &gt; 1.5x</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase font-semibold">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Net Margin</span>
          </div>
          <p className="text-base font-bold text-white mt-1">{grossMargin}%</p>
          <p className="text-[10px] text-emerald-400">Profitable</p>
        </div>
      </div>
    </div>
  );
}
