import { Position } from "@/types/trade";

export function getUnrealizedPnl(position: Position, currentPrice?: number): number {
  if (!currentPrice || !isFinite(currentPrice) || currentPrice <= 0) return 0;
  if (!position || position.current_quantity === 0) return 0;
  const qty = position.current_quantity;
  const base = position.average_entry_price;
  const diff = position.type === 'Buy' ? (currentPrice - base) : (base - currentPrice);
  return diff * qty;
}

export function getUnrealizedPnlPct(position: Position, currentPrice?: number): number {
  if (!currentPrice || !isFinite(currentPrice) || currentPrice <= 0) return 0;
  const base = position.average_entry_price;
  if (!base || base <= 0) return 0;
  const pnl = getUnrealizedPnl(position, currentPrice);
  return (pnl / (base * Math.max(position.current_quantity, 0))) * 100;
}


