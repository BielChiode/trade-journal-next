export const queryKeys = {
  positions: {
    all: ["positions"] as const,
    list: () => [...queryKeys.positions.all, "list"] as const,
  },
  operations: {
    all: ["operations"] as const,
    byPosition: (positionId: number) =>
      [...queryKeys.operations.all, "byPosition", positionId] as const,
  },
  tickers: {
    all: ["tickers"] as const,
    search: (symbol: string) =>
      [...queryKeys.tickers.all, "search", symbol] as const,
  },
  positionPrice: {
    all: ["positionPrice"] as const,
    byPosition: (positionId: number) =>
      [...queryKeys.positionPrice.all, positionId] as const,
  },
  priceHistory: {
    all: ["priceHistory"] as const,
    byParams: (symbol: string, range: string, interval: string) =>
      [...queryKeys.priceHistory.all, symbol, range, interval] as const,
  },
} as const;
