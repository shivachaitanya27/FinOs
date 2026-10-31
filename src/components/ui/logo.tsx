import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "default" | "light" | "glass";
}

/**
 * FinOS Bespoke Identity Logo Mark & Wordmark
 * Precision handcrafted geometric monogram combining the letter "F"
 * with an ascending financial momentum node and glassmorphic depth.
 */
export function FinOSLogo({
  size = "md",
  showText = true,
  className = "",
  variant = "default",
}: LogoProps) {
  // Size dimensions for the icon mark
  const iconDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 44, height: 44 },
    xl: { width: 56, height: 56 },
  }[size];

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  }[size];

  const subtextSizeClasses = {
    sm: "text-[8px] tracking-[0.2em]",
    md: "text-[9px] tracking-[0.22em]",
    lg: "text-[10px] tracking-[0.25em]",
    xl: "text-[11px] tracking-[0.28em]",
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Handcrafted Geometric SVG Logo Mark */}
      <div
        className="relative shrink-0 group"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
      >
        {/* Soft Ambient SkyBlue Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/40 via-sky-400/20 to-blue-600/30 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Master SVG Vector */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-[0_4px_12px_rgba(14,165,233,0.3)] transition-transform duration-200 group-hover:scale-[1.03]"
        >
          <defs>
            {/* Primary SkyBlue Linear Gradient */}
            <linearGradient id="finSkyPrimary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Frosted White Glass Gradient */}
            <linearGradient id="finGlassSheen" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#E0F2FE" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
            </linearGradient>

            {/* Deep Glass Background Fill */}
            <linearGradient id="finBackdrop" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B1B36" />
              <stop offset="100%" stopColor="#050C1A" />
            </linearGradient>

            {/* Crisp 1px Outer Border Gradient */}
            <linearGradient id="finBorderSheen" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Squircle Base Container with Glass Bevel */}
          <rect
            x="1"
            y="1"
            width="46"
            height="46"
            rx="12"
            fill="url(#finBackdrop)"
            stroke="url(#finBorderSheen)"
            strokeWidth="1.5"
          />

          {/* Subtle Grid / Chart Texture Accent */}
          <path
            d="M8 38H40M8 30H40M8 22H40M8 14H40"
            stroke="#38BDF8"
            strokeOpacity="0.06"
            strokeWidth="1"
          />

          {/* Geometric "F" Structure */}
          {/* 1. Vertical Primary Pillar (Anchor) */}
          <rect
            x="12"
            y="11"
            width="6.5"
            height="26"
            rx="3.25"
            fill="url(#finSkyPrimary)"
          />

          {/* 2. Top Forward-Leaning Horizontal Bar (Vision & Horizon) */}
          <path
            d="M13.5 11H32C33.6569 11 35 12.3431 35 14C35 15.6569 33.6569 17 32 17H13.5V11Z"
            fill="url(#finGlassSheen)"
          />

          {/* 3. Middle Dynamic Crossbar + Ascending Financial Node */}
          <path
            d="M14 22.5H27C28.3807 22.5 29.5 23.6193 29.5 25C29.5 26.3807 28.3807 27.5 27 27.5H14V22.5Z"
            fill="url(#finSkyPrimary)"
          />

          {/* 4. Ascending Delta Accent (Growth Arrow Tip) */}
          <path
            d="M30 19.5L36.5 14L33 23L30 19.5Z"
            fill="#FFFFFF"
            opacity="0.9"
          />

          {/* Precision Light Reflection Spot */}
          <circle cx="36.5" cy="14" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Wordmark Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight text-white ${textSizeClasses}`}
              style={{ letterSpacing: "-0.03em" }}
            >
              Fin<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-white">OS</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/30">
              PROD
            </span>
          </div>
          <span
            className={`font-bold text-sky-400/80 uppercase mt-1 leading-none ${subtextSizeClasses}`}
          >
            Financial Intelligence
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Standalone Icon Mark Only
 */
export function FinOSIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_8px_rgba(14,165,233,0.35)]"
      >
        <defs>
          <linearGradient id="finIconSky" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="finIconGlass" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="finIconBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B1B36" />
            <stop offset="100%" stopColor="#050C1A" />
          </linearGradient>
          <linearGradient id="finIconBorder" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="12"
          fill="url(#finIconBg)"
          stroke="url(#finIconBorder)"
          strokeWidth="1.5"
        />

        <rect
          x="12"
          y="11"
          width="6.5"
          height="26"
          rx="3.25"
          fill="url(#finIconSky)"
        />

        <path
          d="M13.5 11H32C33.6569 11 35 12.3431 35 14C35 15.6569 33.6569 17 32 17H13.5V11Z"
          fill="url(#finIconGlass)"
        />

        <path
          d="M14 22.5H27C28.3807 22.5 29.5 23.6193 29.5 25C29.5 26.3807 28.3807 27.5 27 27.5H14V22.5Z"
          fill="url(#finIconSky)"
        />

        <path
          d="M30 19.5L36.5 14L33 23L30 19.5Z"
          fill="#FFFFFF"
          opacity="0.9"
        />
        <circle cx="36.5" cy="14" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

