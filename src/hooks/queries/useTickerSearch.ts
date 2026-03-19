import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { searchTickers } from "@/services/tradeService";

export function useTickerSearch(
  debouncedSymbol: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.tickers.search(debouncedSymbol),
    queryFn: () => searchTickers(debouncedSymbol),
    staleTime: 10 * 60 * 1000,
    enabled: enabled && !!debouncedSymbol && debouncedSymbol.length >= 2,
  });
}
