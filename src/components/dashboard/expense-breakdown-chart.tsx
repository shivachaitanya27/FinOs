"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatINR } from "@/lib/formatters";

interface CategoryItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ExpenseBreakdownProps {
  data: CategoryItem[];
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No expense data recorded in this period
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryItem;
      return (
        <div className="rounded-xl border border-slate-700 bg-navy-950/95 p-3 shadow-xl backdrop-blur-md text-xs">
          <p className="font-semibold text-white mb-1">{item.name}</p>
          <p className="text-finteal-400 font-mono font-bold">
            {formatINR(item.value)} ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-2">
      {/* Donut Chart */}
      <div className="w-full md:w-1/2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B132B" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Clean Legend with Percentages */}
      <div className="w-full md:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.map((cat, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/40 border border-slate-800/60"
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-slate-300 truncate">{cat.name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono flex-shrink-0">
              <span className="text-white font-medium">{formatINR(cat.value)}</span>
              <span className="text-slate-400 text-[10px]">({cat.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
