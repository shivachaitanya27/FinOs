"use client";

import React, { useState, useEffect } from "react";
import { FinOSLogo } from "@/components/ui/logo";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if splash was already shown in this tab session
    const hasShown = sessionStorage.getItem("finos_splash_shown");
    if (!hasShown) {
      setIsVisible(true);
      sessionStorage.setItem("finos_splash_shown", "true");

      // Progress animation
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 14;
        });
      }, 80);

      // Fade out after 1.3s
      const timer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 450);
      }, 1300);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50/98 dark:bg-obsidian-950/98 backdrop-blur-3xl transition-opacity duration-500 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Ambient Purple/Emerald Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-purple-500/20 via-purple-600/15 to-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Glassmorphic Splash Widget - NO top blue line */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-sm w-full mx-4 rounded-3xl border border-purple-200/60 dark:border-purple-800/40 bg-white/95 dark:bg-obsidian-900/90 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Logo with Radiant Aura */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-purple-500/25 blur-xl rounded-2xl animate-pulse" />
          <div className="relative p-3.5 rounded-2xl bg-white dark:bg-obsidian-800 shadow-md border border-purple-100 dark:border-purple-900/50">
            <FinOSLogo size="lg" />
          </div>
        </div>

        {/* Brand Typography */}
        <p className="text-xs font-bold text-purple-700 dark:text-purple-300 tracking-wider uppercase mb-1">
          Financial Operating System
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 font-medium leading-relaxed">
          Autonomous Double-Entry Ledger, Bank Reconciliation & Cash Flow Governance
        </p>

        {/* Loading Progress Bar - Purple & Green Gradient */}
        <div className="w-full bg-slate-100 dark:bg-obsidian-800 rounded-full h-1.5 overflow-hidden mb-3 relative">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-emerald-500 rounded-full transition-all duration-150 ease-out shadow-[0_0_10px_rgba(147,51,234,0.4)]"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Live System Diagnostics */}
        <div className="w-full flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Initializing Ledger...
          </span>
          <span className="font-bold text-purple-600 dark:text-purple-400">{Math.min(100, progress)}%</span>
        </div>

        {/* Skip button for rapid demo testing */}
        <button
          type="button"
          onClick={() => {
            setIsFading(true);
            setTimeout(() => setIsVisible(false), 250);
          }}
          className="mt-6 text-[11px] font-semibold text-slate-500 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          Skip Intro →
        </button>
      </div>
    </div>
  );
}
