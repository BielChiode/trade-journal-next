import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { getOperationsByPositionId } from "@/services/tradeService";

export function useOperations(positionId: number) {
  return useQuery({
    queryKey: queryKeys.operations.byPosition(positionId),
    queryFn: () => getOperationsByPositionId(positionId),
    staleTime: 2 * 60 * 1000,
    enabled: !!positionId,
  });
}
