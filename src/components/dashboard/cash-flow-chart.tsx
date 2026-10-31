"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { formatINR } from "@/lib/formatters";

interface CashFlowProps {
  data: Array<{
    name: string;
    Inflow: number;
    Outflow: number;
    Net: number;
  }>;
}

export function CashFlowChart({ data }: CashFlowProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No cash flow records found
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-700 bg-navy-950/95 p-3 shadow-xl backdrop-blur-md text-xs">
          <p className="font-semibold text-white mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-finteal-400 flex items-center justify-between gap-4">
              <span>Cash Inflow:</span>
              <span className="font-mono font-bold">
                {formatINR(payload[0].value)}
              </span>
            </p>
            <p className="text-rose-400 flex items-center justify-between gap-4">
              <span>Cash Outflow:</span>
              <span className="font-mono font-bold">
                {formatINR(payload[1].value)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => formatINR(val, { compact: true })}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke="#475569" />
          <Bar
            dataKey="Inflow"
            fill="#0D9488"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="Outflow"
            fill="#F43F5E"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
