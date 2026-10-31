"use client";

import React, { useState, useEffect } from "react";
import { FinOSLogo } from "@/components/ui/logo";
import { Sparkles, Shield, Cpu, ArrowRight } from "lucide-react";

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
          return prev + 12;
        });
      }, 90);

      // Fade out after 1.4s
      const timer = setTimeout(() => {
        setIsFading(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 500); // 500ms fade transition
      }, 1400);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50/98 backdrop-blur-3xl transition-opacity duration-500 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Ambient Sky Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-400/20 via-sky-300/15 to-transparent blur-[120px] rounded-full pointer-events-none" />

      {/* Main Glassmorphic Splash Widget */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-sm w-full mx-4 rounded-3xl border border-slate-200/90 bg-white/90 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300 before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-3xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600">
        {/* Bespoke Logo with Radiant Aura */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-sky-400/30 blur-xl rounded-2xl animate-pulse" />
          <div className="relative p-3.5 rounded-2xl bg-white shadow-md border border-slate-100">
            <FinOSLogo size="lg" />
          </div>
        </div>

        {/* Brand Typography */}
        <p className="text-xs font-bold text-sky-700 tracking-wider uppercase mb-1">
          Financial Operating System
        </p>
        <p className="text-xs text-slate-500 max-w-xs mb-6 font-medium leading-relaxed">
          Autonomous Double-Entry Ledger, Bank Reconciliation & Cash Flow Governance
        </p>

        {/* Loading Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-3 relative">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 rounded-full transition-all duration-150 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Live System Diagnostics */}
        <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1 text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Initializing Ledger...
          </span>
          <span className="font-bold text-sky-600">{Math.min(100, progress)}%</span>
        </div>

        {/* Skip button for rapid demo testing */}
        <button
          type="button"
          onClick={() => {
            setIsFading(true);
            setTimeout(() => setIsVisible(false), 300);
          }}
          className="mt-6 text-[11px] font-semibold text-slate-500 hover:text-sky-700 transition-colors"
        >
          Skip Intro →
        </button>
      </div>

      {/* Compliance Stamping */}
      <div className="absolute bottom-6 text-center text-[10px] text-slate-500 font-medium">
        <span>Ind AS & Schedule III Financial Platform • BharatTech Enterprise</span>
      </div>
    </div>
  );
}

