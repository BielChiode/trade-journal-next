import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (
  value: number | null | undefined,
  showSymbol = true
): string => {
  if (value === null || value === undefined) return "N/A";

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  if (showSymbol) {
    options.style = "currency";
    options.currency = "BRL";
  }

  return new Intl.NumberFormat("pt-BR", options).format(Number(value));
}; 