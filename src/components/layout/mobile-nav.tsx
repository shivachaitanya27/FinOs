"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Building2 } from "lucide-react";
import { navigationItems } from "./sidebar";
import { cn } from "@/lib/utils";
import { FinOSLogo } from "@/components/ui/logo";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white/95 dark:bg-obsidian-900/95 border-r border-slate-200 dark:border-white/10 p-5 flex flex-col shadow-2xl backdrop-blur-2xl animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
          <Link href="/" onClick={onClose} className="block">
            <FinOSLogo size="sm" />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
          >
            <X className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 font-bold border-l-2 border-purple-600 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-slate-50 dark:hover:bg-obsidian-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 group-hover:text-purple-600"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                  {item.stage}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center gap-3 bg-purple-50/50 dark:bg-purple-950/20 -mx-5 -mb-5 p-5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-emerald-500 flex items-center justify-center text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
              BharatTech Solutions
            </p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-mono">₹ INR Enterprise Sandbox</p>
          </div>
        </div>
      </div>
    </div>
  );
}
