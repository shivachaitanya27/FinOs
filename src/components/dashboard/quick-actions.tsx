"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  RefreshCw,
  Scale,
  Download,
  Check,
  Building2,
  Calendar,
  CreditCard,
  Tag,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface QuickActionsProps {
  onTransactionAdded?: () => void;
  onRefreshData?: () => void;
}

export function QuickActions({
  onTransactionAdded,
  onRefreshData,
}: QuickActionsProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "EXPENSE",
    category: "Cloud & Software",
    counterparty: "",
    paymentMethod: "UPI",
    referenceNumber: "",
    date: new Date().toISOString().split("T")[0],
  });

  const categories = [
    "Sales & Services",
    "Payroll & Salaries",
    "Cloud & Software",
    "Office Rent",
    "Marketing & Growth",
    "Legal & Accounting",
    "Logistics",
    "Taxes & Duties",
    "Miscellaneous",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      setErrorMsg("Please provide both a description and an amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsAddOpen(false);
        setFormData({
          description: "",
          amount: "",
          type: "EXPENSE",
          category: "Cloud & Software",
          counterparty: "",
          paymentMethod: "UPI",
          referenceNumber: "",
          date: new Date().toISOString().split("T")[0],
        });
        if (onTransactionAdded) onTransactionAdded();
        if (onRefreshData) onRefreshData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to record transaction.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    const downloadLink = document.createElement("a");
    downloadLink.href = "/api/transactions?export=csv";
    downloadLink.setAttribute("download", `FinOS_Ledger_${Date.now()}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      setIsExporting(false);
    }, 1500);
  };

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* SkyBlue High-Impact Primary Button */}
        <Button
          type="button"
          variant="sky"
          size="sm"
          onClick={() => {
            setErrorMsg(null);
            setIsAddOpen(true);
          }}
          className="shadow-sm shadow-sky-500/25 font-semibold"
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Add Transaction
        </Button>

        {/* Glass-Sky Reconcile Button */}
        <Link href="/reconciliation">
          <Button variant="glass-sky" size="sm" className="font-semibold">
            <Scale className="h-4 w-4 mr-1.5 text-sky-600" />
            Reconcile Statements
          </Button>
        </Link>

        {/* Working Instant Export Ledger Button */}
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="font-semibold"
        >
          <Download
            className={`h-4 w-4 mr-1.5 text-sky-600 ${
              isExporting ? "animate-bounce" : ""
            }`}
          />
          {isExporting ? "Downloading CSV..." : "Export Ledger"}
        </Button>
      </div>

      {/* Add Transaction Portal Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record New Transaction"
        description="Insert a real verified financial transaction directly into the immutable enterprise ledger."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Transaction Flow
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "REVENUE" })}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                  formData.type === "REVENUE"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-base leading-none text-emerald-600">+</span>
                <span>Revenue (Inflow)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                  formData.type === "EXPENSE"
                    ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-base leading-none text-rose-600">-</span>
                <span>Expense (Outflow)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Amount (INR ₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 45000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Description / Narration *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Cloud Infrastructure Hosting & EC2"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Accounting Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="NEFT">NEFT Bank Transfer</option>
                <option value="RTGS">RTGS High-Value Transfer</option>
                <option value="IMPS">IMPS Instant Payment</option>
                <option value="NETBANKING">Corporate NetBanking</option>
                <option value="CARD">Corporate Credit Card</option>
                <option value="CHEQUE">Cheque Clearance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Counterparty / Vendor
              </label>
              <input
                type="text"
                placeholder="e.g. Amazon Web Services Pvt Ltd"
                value={formData.counterparty}
                onChange={(e) =>
                  setFormData({ ...formData, counterparty: e.target.value })
                }
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                UTR / Reference No
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-9021849182"
                value={formData.referenceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, referenceNumber: e.target.value })
                }
                className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="white"
              size="sm"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="sky"
              size="sm"
              isLoading={isSubmitting}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Record to Immutable Ledger
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
