"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export type DateFilterOption =
  | "today"
  | "7days"
  | "this_month"
  | "last_month"
  | "3months"
  | "custom";

interface DateFilterProps {
  activeFilter: DateFilterOption;
  onChange: (filter: DateFilterOption, customRange?: { start: string; end: string }) => void;
}

export function DateFilter({ activeFilter, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filterLabels: Record<DateFilterOption, string> = {
    today: "Today",
    "7days": "Last 7 Days",
    this_month: "This Month",
    last_month: "Last Month",
    "3months": "Last 3 Months",
    custom: "Custom Date Range",
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: DateFilterOption) => {
    if (option === "custom") {
      setShowCustomModal(true);
      setIsOpen(false);
    } else {
      onChange(option);
      setIsOpen(false);
    }
  };

  const applyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      onChange("custom", { start: customStart, end: customEnd });
      setShowCustomModal(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Filter trigger button - Glassmorphic */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-obsidian-900/90 border border-slate-200/90 dark:border-white/10 hover:border-purple-400 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 transition-all shadow-sm hover:shadow backdrop-blur-xl active:scale-[0.98]"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        <span>{filterLabels[activeFilter]}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 ml-1 transition-transform", isOpen && "rotate-180 text-purple-600 dark:text-purple-400")} />
      </button>

      {/* Dropdown Menu - Frosted Glass */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/98 dark:bg-obsidian-900/98 p-1.5 shadow-2xl backdrop-blur-2xl z-[100] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-700 dark:text-purple-400 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span>Select Time Horizon</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-mono">Live</span>
          </div>
          <div className="pt-1 space-y-0.5">
            {(
              [
                "today",
                "7days",
                "this_month",
                "last_month",
                "3months",
                "custom",
              ] as DateFilterOption[]
            ).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-colors text-left",
                  activeFilter === opt
                    ? "bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 font-bold border-l-2 border-purple-600 shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-obsidian-800 hover:text-purple-700 dark:hover:text-purple-300"
                )}
              >
                <span>{filterLabels[opt]}</span>
                {activeFilter === opt && (
                  <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Date Range Modal using Portal */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Custom Date Range"
        description="Filter accounting transactions and financial metrics by a specific calendar window."
      >
        <form onSubmit={applyCustomRange} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              required
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              End Date
            </label>
            <input
              type="date"
              required
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <Button
              type="button"
              variant="white"
              size="sm"
              onClick={() => setShowCustomModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="purple" size="sm">
              Apply Date Filter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
