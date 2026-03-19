import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { getPositionLastPrice } from "@/services/tradeService";

export function usePositionPrice(positionId: number) {
  return useQuery({
    queryKey: queryKeys.positionPrice.byPosition(positionId),
    queryFn: () => getPositionLastPrice(positionId),
    staleTime: 0,
    enabled: !!positionId,
  });
}
