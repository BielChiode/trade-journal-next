import { Trade } from "../types/trade";

// Adicionar uma nova interface para o resumo da posição
export interface PositionSummary extends Trade {
  initialQuantity: number;
  openQuantity: number;
  totalRealizedProfit: number;
  status: "Open" | "Closed";
  tradesInPosition: Trade[];
}

// Function to group and summarize positions
export const summarizePositions = (trades: Trade[]): PositionSummary[] => {
  const positions = new Map<number, Trade[]>();

  // 1. Group trades by position_id
  trades.forEach((trade) => {
    const positionId = trade.position_id!;
    if (!positions.has(positionId)) {
      positions.set(positionId, []);
    }
    positions.get(positionId)!.push(trade);
  });

  const summaries: PositionSummary[] = [];

  // 2. Create summaries for each position
  positions.forEach((tradesInPosition, positionId) => {
    const initialTrade = tradesInPosition.sort(
      (a, b) =>
        new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    )[0];

    // Find all partial exit trades and sum their quantities.
    const exitTrades = tradesInPosition.filter((t) => !!t.exit_date);
    const totalExitQuantity = exitTrades.reduce(
      (acc, t) => acc + t.quantity,
      0
    );

    // Find the main trade record. Its quantity represents the current open quantity.
    const mainOpenTrade = tradesInPosition.find(
      (t) => !t.exit_date && !t.observations?.startsWith("Increment to trade")
    );
    const openQuantity = mainOpenTrade ? mainOpenTrade.quantity : 0;

    // The status is determined simply by whether there's an open quantity.
    const status: "Open" | "Closed" = openQuantity > 0 ? "Open" : "Closed";

    // Reconstruct the total entry quantity for display purposes.
    const totalEntryQuantity = openQuantity + totalExitQuantity;

    const totalRealizedProfit = exitTrades.reduce(
      (acc, t) => acc + (t.result || 0),
      0
    );

    summaries.push({
      ...initialTrade,
      id: positionId,
      initialQuantity: totalEntryQuantity,
      openQuantity: openQuantity,
      totalRealizedProfit,
      status: status,
      tradesInPosition,
    });
  });

  // Sort to show open positions first, then the newest
  return summaries.sort((a, b) => {
    if (a.status === "Open" && b.status !== "Open") return -1;
    if (a.status !== "Open" && b.status === "Open") return 1;
    return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
  });
}; 