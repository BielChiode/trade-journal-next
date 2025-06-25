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

export function formatPercentage(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
} 

export const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "N/A";

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Verifica se a data é válida antes de formatar
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }
  
  return dateObj.toLocaleDateString("pt-BR", {
    timeZone: "UTC", // Manter em UTC para consistência
  });
}; 