import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { getPositions } from "@/services/tradeService";

export function usePositions() {
  return useQuery({
    queryKey: queryKeys.positions.list(),
    queryFn: getPositions,
    staleTime: 2 * 60 * 1000,
  });
}
