import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

/**
 * Short Indian-numbering form for axis ticks, where space is tight:
 * 1,20,000 -> ₹1.2L, 2,50,00,000 -> ₹2.5Cr.
 */
export function formatInrShort(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const value = Math.abs(amount);

  if (value >= 1_00_00_000) return `${sign}₹${trim(value / 1_00_00_000)}Cr`;
  if (value >= 1_00_000) return `${sign}₹${trim(value / 1_00_000)}L`;
  if (value >= 1_000) return `${sign}₹${trim(value / 1_000)}K`;
  return `${sign}₹${Math.round(value)}`;
}

function trim(value: number): string {
  // One decimal, but never a trailing ".0".
  return value.toFixed(1).replace(/\.0$/, '');
}
