import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
  | "default"
  | "secondary"
  | "purple"
  | "green"
  | "sky"
  | "glass"
  | "glass-purple"
  | "glass-green"
  | "success"
  | "warning"
  | "destructive"
  | "teal"
  | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/40 shadow-2xs",
    purple: "bg-purple-100/90 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700/50 backdrop-blur-md shadow-2xs",
    green: "bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/50 backdrop-blur-md shadow-2xs",
    sky: "bg-purple-100/80 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200/90 dark:border-purple-800/40 backdrop-blur-md shadow-2xs",
    glass: "bg-white/90 dark:bg-obsidian-900/90 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/10 backdrop-blur-md shadow-2xs",
    "glass-purple": "bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40 backdrop-blur-md shadow-2xs",
    "glass-green": "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 backdrop-blur-md shadow-2xs",
    secondary: "bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10",
    success: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 shadow-2xs",
    warning: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40 shadow-2xs",
    destructive: "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40 shadow-2xs",
    teal: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 shadow-2xs",
    outline: "text-slate-700 dark:text-slate-300 border-slate-300 dark:border-white/15 bg-white dark:bg-obsidian-900",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
