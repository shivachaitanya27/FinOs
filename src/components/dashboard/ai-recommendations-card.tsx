"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, TrendingUp, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  estimatedSavings: number | null;
  actionType: string;
}

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
}

export function AIRecommendationsCard({
  recommendations,
}: AIRecommendationsProps) {
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const handleApply = (id: string) => {
    setAppliedIds((prev) => [...prev, id]);
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-fin-card backdrop-blur-md">
        <div className="flex items-center gap-2 pb-3">
          <Sparkles className="h-4 w-4 text-finteal-400" />
          <h4 className="text-sm font-semibold text-white">AI Financial Recommendations</h4>
        </div>
        <p className="text-xs text-slate-400">
          AI is analyzing transaction histories. Actionable optimization opportunities will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-fin-card backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-finteal-950/80 border border-finteal-800/50 text-finteal-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">AI Financial Copilot</h4>
            <p className="text-[11px] text-slate-400">
              Autonomous optimization & working capital recommendations
            </p>
          </div>
        </div>
        <Badge variant="teal">AI Powered</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {recommendations.map((rec) => {
          const isApplied = appliedIds.includes(rec.id);
          return (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-finteal-800/50 transition-all text-xs group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white group-hover:text-finteal-300 transition-colors">
                      {rec.title}
                    </span>
                    <Badge
                      variant={rec.impact === "HIGH" ? "destructive" : "warning"}
                      className="text-[10px] py-0"
                    >
                      {rec.impact} IMPACT
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                {rec.estimatedSavings ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs">
                    <span>Est. Savings:</span>
                    <span>{formatINR(rec.estimatedSavings)}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Process Optimization
                  </span>
                )}

                <button
                  onClick={() => handleApply(rec.id)}
                  disabled={isApplied}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isApplied
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                      : "bg-finteal-600 hover:bg-finteal-500 text-white shadow-sm"
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Applied
                    </>
                  ) : (
                    <>
                      <span>Take Action</span>
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
