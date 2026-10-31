import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "glass-purple" | "glass-green" | "glass-sky" | "elevated";
  hoverEffect?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", hoverEffect = false, ...props }, ref) => {
    const variants = {
      default:
        "rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-obsidian-900/90 text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-md",
      glass:
        "relative rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-obsidian-900/85 text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500",
      "glass-purple":
        "relative rounded-2xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/40 dark:bg-purple-950/20 text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-purple-700",
      "glass-green":
        "relative rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-emerald-500 before:via-emerald-400 before:to-teal-600",
      "glass-sky":
        "relative rounded-2xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/40 dark:bg-purple-950/20 text-slate-900 dark:text-slate-100 shadow-sm backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-2xl before:bg-gradient-to-r before:from-purple-600 before:via-purple-500 before:to-emerald-500",
      elevated:
        "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-obsidian-900 text-slate-900 dark:text-slate-100 shadow-md backdrop-blur-2xl",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          hoverEffect &&
            "hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-none tracking-tight text-slate-900 dark:text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-slate-500 dark:text-slate-400 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
