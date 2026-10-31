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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FinOSLogo } from "@/components/ui/logo";

export const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard, stage: "Stage 1" },
  { name: "Transactions", href: "/transactions", icon: Receipt, stage: "Stage 2" },
  { name: "Data Management", href: "/data-management", icon: Database, stage: "Stage 2" },
  { name: "Reconciliation", href: "/reconciliation", icon: Scale, stage: "Stage 3" },
  { name: "Revenue Analysis", href: "/revenue-analysis", icon: TrendingUp, stage: "Stage 2" },
  { name: "Expense Analysis", href: "/expense-analysis", icon: TrendingDown, stage: "Stage 2" },
  { name: "Cash Flow", href: "/cash-flow", icon: Banknote, stage: "Stage 4" },
  { name: "Financial Risks", href: "/financial-risks", icon: AlertTriangle, stage: "Stage 4" },
  { name: "AI Recommendations", href: "/ai-recommendations", icon: Sparkles, stage: "Stage 5" },
  { name: "Profit & Loss", href: "/profit-loss", icon: FileSpreadsheet, stage: "Stage 6" },
  { name: "Reports", href: "/reports", icon: FileText, stage: "Stage 6" },
  { name: "Settings", href: "/settings", icon: Settings, stage: "Stage 1" },
];

export function Sidebar() {
  const pathname = usePathname();

  const getStageBadgeStyle = (stage: string, isActive: boolean) => {
    switch (stage) {
      case "Stage 1":
        return isActive
          ? "bg-purple-600 text-white font-bold"
          : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40";
      case "Stage 2":
        return isActive
          ? "bg-purple-600 text-white font-bold"
          : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40";
      case "Stage 3":
        return isActive
          ? "bg-emerald-600 text-white font-bold"
          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40";
      case "Stage 4":
        return isActive
          ? "bg-amber-600 text-white font-bold"
          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40";
      case "Stage 5":
        return isActive
          ? "bg-purple-600 text-white font-bold"
          : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/40";
      case "Stage 6":
        return isActive
          ? "bg-emerald-600 text-white font-bold"
          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/40";
      default:
        return "bg-slate-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white/90 dark:bg-obsidian-900/90 border-r border-slate-200/90 dark:border-white/10 backdrop-blur-2xl z-30 select-none shadow-xs">
      {/* Brand Header with Handcrafted FinOS Logo */}
      <div className="p-5 border-b border-slate-100 dark:border-white/10">
        <Link href="/" className="block">
          <FinOSLogo size="md" />
        </Link>
      </div>

      {/* Demo Sandbox Alert Pill - Purple & Emerald Glass */}
      <div className="mx-4 my-3 px-3.5 py-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 shadow-xs backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 tracking-wide">ENTERPRISE SANDBOX</span>
        </div>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-obsidian-800 border border-emerald-200 dark:border-emerald-800/40 shadow-2xs">
          ₹ INR
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-700 dark:text-purple-400">
          Core Ledger & Data
        </div>
        {navigationItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 font-bold border-l-2 border-purple-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/30"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-purple-600 dark:text-purple-400 drop-shadow-xs"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tracking-wide transition-colors",
                  getStageBadgeStyle(item.stage, isActive)
                )}
              >
                {item.stage}
              </span>
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-700 dark:text-purple-400">
          Intelligence & Analytics
        </div>
        {navigationItems.slice(4, 8).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 font-bold border-l-2 border-purple-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/30"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-purple-600 dark:text-purple-400 drop-shadow-xs"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tracking-wide transition-colors",
                  getStageBadgeStyle(item.stage, isActive)
                )}
              >
                {item.stage}
              </span>
            </Link>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-700 dark:text-purple-400">
          AI & Final Audit Reports
        </div>
        {navigationItems.slice(8, 12).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 font-bold border-l-2 border-purple-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/30"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-purple-600 dark:text-purple-400 drop-shadow-xs"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tracking-wide transition-colors",
                  getStageBadgeStyle(item.stage, isActive)
                )}
              >
                {item.stage}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer Profile Pill */}
      <div className="p-3.5 border-t border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
              BharatTech Solutions
            </p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium truncate">
              FinOS Autonomous OS
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
