"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters";
import { useTheme } from "@/lib/theme-provider";
import {
  Building2,
  CheckCircle2,
  Landmark,
  Save,
  Sun,
  Moon,
  Sparkles,
  Check,
} from "lucide-react";

export default function SettingsBusinessPage() {
  const { theme, setTheme } = useTheme();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    taxId: "",
    panNumber: "",
    industry: "",
    fiscalYearStart: "APRIL",
    minimumCashBalance: 50000,
  });

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/business");
      const data = await res.json();
      if (data.business) {
        setBusiness(data.business);
        setFormData({
          name: data.business.name || "",
          legalName: data.business.legalName || "",
          taxId: data.business.taxId || "",
          panNumber: data.business.panNumber || "",
          industry: data.business.industry || "",
          fiscalYearStart: data.business.fiscalYearStart || "APRIL",
          minimumCashBalance: data.business.minimumCashBalance || 50000,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      setSaving(true);
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: business.id, ...formData }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
        Loading business profile settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="relative p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-obsidian-900/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Settings & Preferences
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Configure user interface themes, statutory tax identifiers, accounting conventions, and safety liquidity reserves.
            </p>
          </div>
          <Badge variant="glass-purple" className="shrink-0 self-start sm:self-auto font-bold">
            Active Workspace
          </Badge>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Business configuration updated successfully in database.</span>
        </div>
      )}

      {/* Theme Preference Selection Card */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-base">Interface Appearance & Theme Preference</CardTitle>
          </div>
          <CardDescription>
            Choose your preferred workspace visual theme. Persisted immediately in your browser cache.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Light Mode Option */}
            <div
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                theme === "light"
                  ? "bg-purple-50/70 border-purple-500 shadow-md ring-2 ring-purple-500/20"
                  : "bg-white dark:bg-obsidian-850 border-slate-200 dark:border-white/10 hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Light Theme</h4>
                    <p className="text-[11px] text-slate-500">System Default • Purple, White & Green</p>
                  </div>
                </div>
                {theme === "light" && (
                  <span className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="h-10 rounded-xl bg-slate-100 border border-slate-200 p-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700">Frosted Glass</span>
                <span className="font-bold text-emerald-600">₹ Active</span>
              </div>
            </div>

            {/* Dark Mode Option */}
            <div
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between relative ${
                theme === "dark"
                  ? "bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-500/20"
                  : "bg-white dark:bg-obsidian-850 border-slate-200 dark:border-white/10 hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-900/50 text-purple-300">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dark Theme</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Obsidian Dark • Purple Glow & Emerald</p>
                  </div>
                </div>
                {theme === "dark" && (
                  <span className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="h-10 rounded-xl bg-obsidian-950 border border-purple-900/40 p-2 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-purple-300">Obsidian Bevel</span>
                <span className="font-bold text-emerald-400">₹ Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Profile Form */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-base">Entity Information</CardTitle>
          <CardDescription>
            Official company credentials used for statutory compliance and invoicing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  Operating Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-obsidian-800 border border-slate-300 dark:border-white/15 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  Registered Legal Name
                </label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalName: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-obsidian-800 border border-slate-300 dark:border-white/15 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  GSTIN (Indian Tax Identifier)
                </label>
                <input
                  type="text"
                  placeholder="29AABCU9603R1ZM"
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-obsidian-800 border border-slate-300 dark:border-white/15 px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  placeholder="AABCU9603R"
                  value={formData.panNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, panNumber: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-obsidian-800 border border-slate-300 dark:border-white/15 px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  Industry Classification
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-obsidian-800 border border-slate-300 dark:border-white/15 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  Fiscal Year Standard
                </label>
                <select
                  value={formData.fiscalYearStart}
                  onChange={(e) =>
                    setFormData({ ...formData, fiscalYearStart: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-obsidian-800 border border-slate-300 dark:border-white/15 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                >
                  <option value="APRIL">April – March (Indian Standard)</option>
                  <option value="JANUARY">January – December (Calendar)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                  Minimum Cash Balance Threshold (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formData.minimumCashBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumCashBalance: Number(e.target.value) })
                    }
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-obsidian-800 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Alert triggers when projected liquidity falls below this safety reserve.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="purple" isLoading={saving}>
                <Save className="h-4 w-4 mr-1.5" />
                Save Business Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Linked Financial Accounts Section */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Configured Financial Accounts & Gateways
          </CardTitle>
          <CardDescription>
            Live bank feeds and merchant gateways contributing to the Current Cash Position.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {business?.accounts && business.accounts.length > 0 ? (
              business.accounts.map((acc: any) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-800/60 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{acc.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {acc.accountNumber || "Direct API"} • {acc.accountType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {formatINR(acc.currentBalance)}
                    </p>
                    <Badge variant={acc.isDefault ? "green" : "secondary"} className="text-[10px]">
                      {acc.isDefault ? "Default A/c" : "Active Feed"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4">No accounts linked.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
