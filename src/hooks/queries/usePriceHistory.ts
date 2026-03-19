import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { getPriceHistory } from "@/services/tradeService";

export function usePriceHistory(
  symbol: string,
  range: string,
  interval: string
) {
  return useQuery({
    queryKey: queryKeys.priceHistory.byParams(symbol, range, interval),
    queryFn: () => getPriceHistory(symbol, range, interval),
    staleTime: 15 * 60 * 1000,
    enabled: !!symbol,
  });
}
