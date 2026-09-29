import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export const flowLog = (...args: any[]) => console.log("[Flowroll] ", ...args);
export const flowLog = (...args: any[]) => {}; // Disable logging for now, can be re-enabled for debugging);
export const focLog = (...args: any[]) => console.log("[FOC] ", ...args);

export const formatDuration = (seconds: number | bigint): string => {
  const totalSeconds = Number(seconds);
  if (totalSeconds <= 0) return "0s";

  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 && d === 0) parts.push(`${s}s`);

  return parts.join(" ") || "0s";
};

export const formatTimeLeft = (
  targetTimeInSeconds: number | bigint,
): string => {
  const now = Math.floor(Date.now() / 1000);
  const target = Number(targetTimeInSeconds);
  const diff = target - now;

  return diff > 0 ? formatDuration(diff) : "0s";
};

export const formatTimestamp = (
  timestampInSeconds: number | bigint,
  isCompact = false,
): string => {
  const timestamp = Number(timestampInSeconds);
  if (timestamp <= 0) return "-";

  // Convert Web3 seconds to JavaScript milliseconds
  const date = new Date(timestamp * 1000);

  // If compact is true: "Apr 13, 09:49 AM"
  // If compact is false: "Apr 13, 2026, 09:49 AM"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: isCompact ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatMoney = (amount: bigint, decimal: number): string =>
  Number(formatUnits(amount, decimal)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
