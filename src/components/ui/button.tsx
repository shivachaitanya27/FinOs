import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "sky"
    | "white"
    | "glass"
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
        "bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sm shadow-sky-500/25 border border-sky-400/40 focus-visible:ring-sky-400",
      sky:
        "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold shadow-sm shadow-sky-500/25 border border-sky-400/40 focus-visible:ring-sky-400",
      white:
        "bg-white hover:bg-slate-50 text-slate-800 font-semibold shadow-xs border border-slate-200/90 focus-visible:ring-slate-300",
      glass:
        "bg-white/85 hover:bg-white text-slate-800 backdrop-blur-xl border border-slate-200/90 hover:border-sky-400 shadow-2xs focus-visible:ring-sky-400",
      "glass-sky":
        "bg-sky-50/80 hover:bg-sky-100 text-sky-700 hover:text-sky-800 backdrop-blur-xl border border-sky-200 hover:border-sky-300 shadow-2xs focus-visible:ring-sky-400",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-2xs focus-visible:ring-slate-400",
      teal:
        "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-2xs border border-teal-500/40 focus-visible:ring-teal-400",
      outline:
        "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-slate-300 shadow-2xs",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-300",
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
