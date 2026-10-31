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
} from "recharts";
import { formatINR } from "@/lib/formatters";

interface ChartProps {
  data: Array<{ name: string; Revenue: number; Expenses: number }>;
}

export function RevenueExpenseChart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No comparative data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-700 bg-navy-950/95 p-3 shadow-xl backdrop-blur-md text-xs">
          <p className="font-semibold text-white mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 flex items-center justify-between gap-4">
              <span>Revenue:</span>
              <span className="font-mono font-bold">
                {formatINR(payload[0].value)}
              </span>
            </p>
            <p className="text-blue-400 flex items-center justify-between gap-4">
              <span>Expenses:</span>
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
          <Bar
            dataKey="Revenue"
            fill="#10B981"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            dataKey="Expenses"
            fill="#3B82F6"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
