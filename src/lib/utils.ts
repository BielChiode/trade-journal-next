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

export const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return "N/A";
  // Adiciona T00:00:00 para garantir que a data seja interpretada em UTC
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}; 