"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, ArrowRight, Lock, Mail, Building2, CheckCircle2, UserCheck } from "lucide-react";
import { FinOSLogo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("aarav.sharma@bharattech.in");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoRoles = [
    {
      role: "CFO & Founder",
      email: "aarav.sharma@bharattech.in",
      pass: "demo123",
      desc: "Full admin, forecasting & strategic governance",
    },
    {
      role: "Chief Accountant",
      email: "accountant@bharattech.in",
      pass: "demo123",
      desc: "Ledger posting, bank sync & Ind AS compliance",
    },
    {
      role: "Statutory Auditor",
      email: "auditor@bharattech.in",
      pass: "demo123",
      desc: "Immutable audit trail inspection & P&L review",
    },
  ];

  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    try {
      setDemoLoading(true);
      setError(null);
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load demo sandbox");

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  const selectRole = (r: typeof demoRoles[0]) => {
    setEmail(r.email);
    setPassword(r.pass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Brand Header with Handcrafted FinOS Logo */}
      <div className="text-center mb-8 relative z-10 flex flex-col items-center">
        <FinOSLogo size="lg" className="mb-2" />
        <p className="text-xs text-slate-500 mt-2 max-w-sm font-medium">
          AI-Powered Financial Intelligence & Automated Cash Flow Governance
        </p>
      </div>

      {/* Auth Card - Glassmorphic Light */}
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl relative z-10 before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-3xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600">
        {/* Instant Demo Sandbox Access Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-200 backdrop-blur-md shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-sky-600" />
              Hackathon Evaluation
            </span>
            <Badge variant="sky" className="text-[10px] py-0 px-2 font-bold">
              1-Click Demo
            </Badge>
          </div>
          <p className="text-[11px] text-slate-600 mb-3.5 leading-relaxed font-medium">
            Skip credential setup and immediately enter the preloaded BharatTech Indian SaaS financial sandbox.
          </p>
          <Button
            type="button"
            variant="sky"
            size="md"
            onClick={handleInstantDemoLogin}
            isLoading={demoLoading}
            className="w-full shadow-sm shadow-sky-500/25 font-bold"
          >
            Enter Demo Sandbox Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Quick Role Fill Chips */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Quick Fill Demo Roles:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {demoRoles.map((r) => {
              const isSelected = email === r.email;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => selectRole(r)}
                  className={`p-2 rounded-xl text-left border text-[11px] font-medium transition-all ${
                    isSelected
                      ? "bg-sky-50 border-sky-400 text-sky-800 font-bold shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                  title={r.desc}
                >
                  <p className="truncate font-semibold">{r.role}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold absolute">
            Or Sign In with Credentials
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegularLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="glass"
            size="md"
            isLoading={loading}
            className="w-full mt-2 font-bold hover:border-sky-400 text-slate-800"
          >
            Sign In to Workspace
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Need a workspace?{" "}
          <Link
            href="/register"
            className="text-sky-600 hover:text-sky-700 font-bold"
          >
            Register new business
          </Link>
        </div>
      </div>
    </div>
  );
}
