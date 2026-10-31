import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "purple"
    | "green"
    | "sky"
    | "white"
    | "glass"
    | "glass-purple"
    | "glass-green"
    | "glass-sky"
    | "teal"
    | "outline"
    | "ghost"
    | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";

    const variants = {
      primary:
        "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white shadow-sm shadow-purple-600/25 border border-purple-500/40 focus-visible:ring-purple-400",
      purple:
        "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-sm shadow-purple-600/25 border border-purple-500/40 focus-visible:ring-purple-400",
      green:
        "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/25 border border-emerald-500/40 focus-visible:ring-emerald-400",
      sky:
        "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold shadow-sm shadow-purple-600/25 border border-purple-500/40 focus-visible:ring-purple-400",
      white:
        "bg-white dark:bg-obsidian-900 hover:bg-slate-50 dark:hover:bg-obsidian-800 text-slate-800 dark:text-white font-semibold shadow-xs border border-slate-200/90 dark:border-white/10 focus-visible:ring-purple-400",
      glass:
        "bg-white/85 dark:bg-obsidian-900/80 hover:bg-white dark:hover:bg-obsidian-850 text-slate-800 dark:text-white backdrop-blur-xl border border-slate-200/90 dark:border-white/10 hover:border-purple-400 shadow-2xs focus-visible:ring-purple-400",
      "glass-purple":
        "bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 backdrop-blur-xl border border-purple-200 dark:border-purple-800/50 shadow-2xs focus-visible:ring-purple-400",
      "glass-green":
        "bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 backdrop-blur-xl border border-emerald-200 dark:border-emerald-800/50 shadow-2xs focus-visible:ring-emerald-400",
      "glass-sky":
        "bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 backdrop-blur-xl border border-purple-200 dark:border-purple-800/50 shadow-2xs focus-visible:ring-purple-400",
      secondary:
        "bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-2xs focus-visible:ring-slate-400",
      teal:
        "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-2xs border border-emerald-500/40 focus-visible:ring-emerald-400",
      outline:
        "border border-slate-300 dark:border-white/15 bg-white dark:bg-obsidian-900 hover:bg-slate-50 dark:hover:bg-obsidian-800 text-slate-700 dark:text-slate-200 focus-visible:ring-purple-400 shadow-2xs",
      ghost:
        "bg-transparent hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus-visible:ring-purple-400",
      danger:
        "bg-red-600 hover:bg-red-700 text-white shadow-2xs border border-red-500/40 focus-visible:ring-red-400",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
