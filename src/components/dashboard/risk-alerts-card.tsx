"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, ChevronRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
}

interface RiskAlertsProps {
  alerts: RiskAlert[];
}

export function RiskAlertsCard({ alerts }: RiskAlertsProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-fin-card backdrop-blur-md">
        <div className="flex items-center gap-2 pb-3">
          <AlertTriangle className="h-4 w-4 text-emerald-400" />
          <h4 className="text-sm font-semibold text-white">Financial Risk Alerts</h4>
        </div>
        <p className="text-xs text-slate-400">
          No anomalous transactions or compliance flags detected. All accounts balanced.
        </p>
      </div>
    );
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "HIGH":
        return <Badge variant="destructive">HIGH RISK</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">MEDIUM</Badge>;
      case "LOW":
        return <Badge variant="secondary">MONITOR</Badge>;
      default:
        return <Badge variant="outline">{sev}</Badge>;
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev.toUpperCase()) {
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />;
      case "MEDIUM":
        return <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-slate-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-fin-card backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-950/80 border border-red-800/50 text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Financial Risk Alerts</h4>
            <p className="text-[11px] text-slate-400">
              Active ledger anomalies & compliance watches
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-red-400 bg-red-950/60 border border-red-800/50 px-2 py-0.5 rounded-full">
          {alerts.length} Detected
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all text-xs"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                {getSeverityIcon(alert.severity)}
                <span className="font-semibold text-white">{alert.title}</span>
              </div>
              {getSeverityBadge(alert.severity)}
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed pl-6">
              {alert.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
