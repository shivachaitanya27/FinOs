"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/formatters";
import {
  Building2,
  CheckCircle2,
  Landmark,
  Shield,
  Save,
  RefreshCw,
} from "lucide-react";

export default function SettingsBusinessPage() {
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
      <div className="relative p-5 rounded-2xl border border-slate-200/90 bg-white/85 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-sky-400 before:via-sky-500 before:to-blue-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
              <Building2 className="h-5 w-5 text-sky-600" />
              Business Profile & Fiscal Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Configure statutory tax identifiers, accounting conventions, and primary bank details.
            </p>
          </div>
          <Badge variant="sky">Active Workspace</Badge>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Business configuration updated successfully in database.</span>
        </div>
      )}

      {/* Main Profile Form */}
      <Card>
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
                <label className="block text-slate-300 font-medium mb-1.5">
                  Operating Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-finteal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Registered Legal Name
                </label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalName: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-finteal-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  GSTIN (Indian Tax Identifier)
                </label>
                <input
                  type="text"
                  placeholder="29AABCU9603R1ZM"
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:border-finteal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Permanent Account Number (PAN)
                </label>
                <input
                  type="text"
                  placeholder="AABCU9603R"
                  value={formData.panNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, panNumber: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:border-finteal-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Industry Classification
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-finteal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Fiscal Year Standard
                </label>
                <select
                  value={formData.fiscalYearStart}
                  onChange={(e) =>
                    setFormData({ ...formData, fiscalYearStart: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-finteal-400"
                >
                  <option value="APRIL">April – March (Indian Standard)</option>
                  <option value="JANUARY">January – December (Calendar)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
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
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-finteal-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Alert triggers when projected liquidity falls below this safety reserve.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="teal" isLoading={saving}>
                <Save className="h-4 w-4 mr-1.5" />
                Save Business Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Linked Financial Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-cyan-400" />
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
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                      <Landmark className="h-4 w-4 text-finteal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{acc.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {acc.accountNumber || "Direct API"} • {acc.accountType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-white text-sm">
                      {formatINR(acc.currentBalance)}
                    </p>
                    <Badge variant={acc.isDefault ? "teal" : "secondary"} className="text-[10px]">
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
