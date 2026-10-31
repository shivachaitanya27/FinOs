/**
 * Format a number into Indian Rupee currency format (e.g., ₹12,45,000 or ₹1.24 L)
 */
export function formatINR(
  amount: number,
  options?: { compact?: boolean; hideDecimals?: boolean }
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0";
  }

  const { compact = false, hideDecimals = true } = options || {};

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (abs >= 10000000) {
      // Crores
      return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      // Lakhs
      return `${sign}₹${(abs / 100000).toFixed(2)} L`;
    }
    if (abs >= 1000) {
      return `${sign}₹${(abs / 1000).toFixed(1)} K`;
    }
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: hideDecimals ? 0 : 2,
    minimumFractionDigits: hideDecimals ? 0 : 2,
  });

  return formatter.format(amount);
}

/**
 * Format date in Indian business standard (e.g. 24 Oct 2024 or 24/10/2024)
 */
export function formatDate(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return "-";
  const date = new Date(dateStringOrDate);
  if (isNaN(date.getTime())) return "-";
  
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export const formatIndianDate = formatDate;

export function formatDateTime(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return "-";
  const date = new Date(dateStringOrDate);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
