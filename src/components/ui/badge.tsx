import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
  | "default"
  | "secondary"
  | "sky"
  | "glass"
  | "success"
  | "warning"
  | "destructive"
  | "teal"
  | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-sky-50 text-sky-800 border-sky-200 shadow-2xs",
    sky: "bg-sky-100/80 text-sky-800 border-sky-200/90 backdrop-blur-md shadow-2xs",
    glass: "bg-white/90 text-slate-800 border-slate-200/90 backdrop-blur-md shadow-2xs",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs",
    warning: "bg-amber-50 text-amber-800 border-amber-200 shadow-2xs",
    destructive: "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs",
    teal: "bg-teal-50 text-teal-800 border-teal-200 shadow-2xs",
    outline: "text-slate-700 border-slate-300 bg-white",
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
