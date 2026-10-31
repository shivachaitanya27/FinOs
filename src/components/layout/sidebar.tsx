"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Database,
  Scale,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Banknote,
  AlertTriangle,
  Sparkles,
  FileText,
  Settings,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FinOSLogo } from "@/components/ui/logo";

export const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard, stage: 1 },
  { name: "Transactions", href: "/transactions", icon: Receipt, stage: 2 },
  { name: "Data Management", href: "/data-management", icon: Database, stage: 2 },
  { name: "Reconciliation", href: "/reconciliation", icon: Scale, stage: 3 },
  { name: "Revenue Analysis", href: "/revenue-analysis", icon: TrendingUp, stage: 2 },
  { name: "Expense Analysis", href: "/expense-analysis", icon: TrendingDown, stage: 2 },
  { name: "Cash Flow", href: "/cash-flow", icon: Banknote, stage: 4 },
  { name: "Financial Risks", href: "/financial-risks", icon: AlertTriangle, stage: 4 },
  { name: "AI Recommendations", href: "/ai-recommendations", icon: Sparkles, stage: 5 },
  { name: "Profit & Loss", href: "/profit-loss", icon: FileSpreadsheet, stage: 6 },
  { name: "Reports", href: "/reports", icon: FileText, stage: 6 },
  { name: "Settings", href: "/settings", icon: Settings, stage: 1 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white/90 border-r border-slate-200/90 backdrop-blur-2xl z-30 select-none shadow-xs">
      {/* Brand Header with Handcrafted FinOS Logo */}
      <div className="p-5 border-b border-slate-100">
        <Link href="/" className="block">
          <FinOSLogo size="md" />
        </Link>
      </div>

      {/* Demo Sandbox Alert Pill - Glassmorphic */}
      <div className="mx-4 my-3 px-3.5 py-2.5 rounded-xl bg-sky-50 border border-sky-200 shadow-xs backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
          </span>
          <span className="text-[11px] font-bold text-sky-800 tracking-wide">ENTERPRISE SANDBOX</span>
        </div>
        <span className="text-[10px] text-sky-700 font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-sky-200 shadow-2xs">
          ₹ INR
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sky-700">
          Core Platform
        </div>
        {navigationItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-sky-50 text-sky-700 font-bold border-l-2 border-sky-500 shadow-xs"
                  : "text-slate-600 hover:text-sky-700 hover:bg-sky-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-sky-600 drop-shadow-xs"
                      : "text-slate-400 group-hover:text-sky-600"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full bg-sky-600" />
              )}
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sky-700">
          Intelligence & Reports
        </div>
        {navigationItems.slice(4, 11).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-sky-50 text-sky-700 font-bold border-l-2 border-sky-500 shadow-xs"
                  : "text-slate-600 hover:text-sky-700 hover:bg-sky-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-sky-600 drop-shadow-xs"
                      : "text-slate-400 group-hover:text-sky-600"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.stage === 6 ? (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Stage 6
                </span>
              ) : item.stage === 5 ? (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Stage 5
                </span>
              ) : item.stage === 4 ? (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Stage 4
                </span>
              ) : null}
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sky-700">
          Configuration
        </div>
        {navigationItems.slice(11).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-sky-50 text-sky-700 font-bold border-l-2 border-sky-500 shadow-xs"
                  : "text-slate-600 hover:text-sky-700 hover:bg-sky-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-sky-600 drop-shadow-xs"
                      : "text-slate-400 group-hover:text-sky-600"
                  )}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Business Workspace Profile Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              BharatTech Solutions
            </p>
            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 font-mono">
              <span className="text-emerald-500">●</span> 29AABCU9603R1ZM
            </p>
          </div>
          <Link
            href="/settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Business Setup"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
