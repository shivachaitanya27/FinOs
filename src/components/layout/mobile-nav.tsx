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
        className="fixed inset-0 bg-navy-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white/95 border-r border-slate-200 p-5 flex flex-col shadow-2xl backdrop-blur-2xl animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <Link href="/" onClick={onClose} className="block">
            <FinOSLogo size="sm" />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-sky-600" />
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
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-sky-50 text-sky-700 font-bold border-l-2 border-sky-500 shadow-2xs"
                    : "text-slate-600 hover:text-sky-700 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-sky-600" : "text-slate-400 group-hover:text-sky-600"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.stage === 6 ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-400/40">
                    S6
                  </span>
                ) : item.stage === 5 ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/40">
                    S5
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center gap-3 bg-navy-900/40 -mx-5 -mb-5 p-5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              BharatTech Solutions
            </p>
            <p className="text-[10px] text-sky-400/80 font-mono">₹ INR Enterprise Sandbox</p>
          </div>
        </div>
      </div>
    </div>
  );
}
