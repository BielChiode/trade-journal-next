import { Trade } from "@prisma/client";

// Adicionar uma nova interface para o resumo da posição
export interface PositionSummary {
  id: number;
  positionId: number;
  ticker: string;
  type: string;
  entryDate: Date;
  entryPrice: number; // Represents the current average entry price
  exitDate: Date | null;
  exitPrice: number | null;
  quantity: number; // Represents the current open quantity
  setup: string | null;
  observations: string | null;
  result: number | null;
  userId: number;
  initialQuantity: number; // Total quantity of all entry trades
  openQuantity: number;
  totalRealizedProfit: number;
  status: "Open" | "Closed";
  tradesInPosition: Trade[];
}

// Function to group and summarize positions
export const summarizePositions = (trades: Trade[]): PositionSummary[] => {
  // Ensure all date fields are proper Date objects, as they can be strings after JSON serialization.
  const parsedTrades = trades.map(trade => ({
    ...trade,
    entryDate: new Date(trade.entryDate),
    exitDate: trade.exitDate ? new Date(trade.exitDate) : null
  }));

  const positions = new Map<number, Trade[]>();

  parsedTrades.forEach((trade) => {
    const positionId = trade.positionId;
    if (!positions.has(positionId)) {
      positions.set(positionId, []);
    }
    positions.get(positionId)!.push(trade);
  });

  const summaries: PositionSummary[] = [];

  positions.forEach((tradesInPosition, positionId) => {
    // Determine the actual transaction date for sorting
    const getTransactionDate = (trade: Trade): Date => {
      // An exit log's true date is its exitDate. An entry's date is its entryDate.
      return trade.result !== null && trade.exitDate
        ? trade.exitDate
        : trade.entryDate;
    };

    const sortedTrades = tradesInPosition.sort(
      (a, b) =>
        getTransactionDate(a).getTime() - getTransactionDate(b).getTime()
    );

    let totalCost = 0;
    let openQuantity = 0;
    let totalEntryQuantity = 0;
    let totalRealizedProfit = 0;
    let lastExitDate: Date | null = null;
    
    // Find the first entry to get some static data like ticker, type, etc.
    const firstEntry = sortedTrades.find(t => t.result === null || t.result === undefined);
    if (!firstEntry) return; // A position must have at least one entry.

    // Chronologically process each transaction to calculate the final state
    for (const trade of sortedTrades) {
      const isEntry = trade.result === null || trade.result === undefined;

      if (isEntry) {
        totalCost += trade.quantity * trade.entryPrice;
        openQuantity += trade.quantity;
        totalEntryQuantity += trade.quantity;
      } else { // It's an exit
        if (openQuantity > 0) {
          // Calculate the cost of the shares being sold based on the avg price at that moment
          const averagePriceAtExit = totalCost / openQuantity;
          const costOfGoodsSold = averagePriceAtExit * trade.quantity;
          totalCost -= costOfGoodsSold;
        }
        openQuantity -= trade.quantity;
        totalRealizedProfit += trade.result || 0;
        lastExitDate = trade.exitDate;
      }
    }

    const averageEntryPrice = openQuantity > 0 ? totalCost / openQuantity : 0;
    const status: "Open" | "Closed" = openQuantity > 0 ? "Open" : "Closed";

    summaries.push({
      id: positionId,
      positionId: positionId,
      ticker: firstEntry.ticker,
      type: firstEntry.type,
      entryDate: firstEntry.entryDate,
      entryPrice: averageEntryPrice,
      exitDate: status === "Closed" ? lastExitDate : null,
      exitPrice: null, // Not applicable for summary
      quantity: openQuantity,
      setup: firstEntry.setup,
      observations: firstEntry.observations,
      result: null, // Not applicable for summary
      userId: firstEntry.userId,
      initialQuantity: totalEntryQuantity,
      openQuantity: openQuantity,
      totalRealizedProfit: totalRealizedProfit,
      status: status,
      tradesInPosition: sortedTrades,
    });
  });

  return summaries.sort((a, b) => {
    if (a.status === "Open" && b.status !== "Open") return -1;
    if (a.status !== "Open" && b.status === "Open") return 1;
    return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
  });
}; 